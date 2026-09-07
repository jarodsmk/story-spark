import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[Gemini] GEMINI_API_KEY is not set in environment.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Generate with primary model and automatic fallback on 503 high demand
async function generateWithGemini(options: {
  contents: string;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
}): Promise<string> {
  const ai = getGenAI();
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          responseMimeType: options.responseMimeType,
          temperature: options.temperature ?? 0.7,
        },
      });
      const text = response.text || '';
      if (text) return text;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini] Model ${model} generation failed:`, err.message || err);
      // If 503 or 404, try next model
    }
  }

  throw lastError || new Error('Failed to generate response from Gemini API.');
}

/**
 * Status check endpoint
 */
router.get('/status', (_req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: hasKey ? 'ready' : 'missing_key',
    model: 'gemini-3.8-flash',
    fallbackModel: 'gemini-3.1-flash-lite',
  });
});

/**
 * Rewrite isolated passage
 */
router.post('/rewrite', async (req: Request, res: Response) => {
  try {
    const { selectedPassage, instruction, systemPrompt } = req.body;

    if (!selectedPassage || typeof selectedPassage !== 'string') {
      return res.status(400).json({ error: 'Missing selectedPassage in request body' });
    }

    const defaultSystem =
      systemPrompt ||
      'You are a master fiction editor and novelist prose stylist. ' +
      'Rewrite ONLY the provided passage according to the instructions. ' +
      'Maintain the scene perspective, character voice, and narrative tone. ' +
      'Do not include preamble, explanations, or quotes—return ONLY the revised prose text.';

    const prompt = `Instruction: ${instruction || 'Tighten and polish prose'}\n\nPassage to revise:\n"""\n${selectedPassage}\n"""`;

    let rewritten = await generateWithGemini({
      contents: prompt,
      systemInstruction: defaultSystem,
      temperature: 0.7,
    });

    rewritten = rewritten.trim();
    if (rewritten.startsWith('"""') && rewritten.endsWith('"""')) {
      rewritten = rewritten.slice(3, -3).trim();
    } else if (rewritten.startsWith('"') && rewritten.endsWith('"') && !rewritten.slice(1, -1).includes('"')) {
      rewritten = rewritten.slice(1, -1).trim();
    }

    res.json({
      rewrittenText: rewritten,
      originalText: selectedPassage,
    });
  } catch (err: any) {
    console.error('[Gemini /rewrite error]', err);
    res.status(500).json({ error: err.message || 'AI rewrite failed' });
  }
});

interface RawAISuggestion {
  title: string;
  description: string;
  originalText: string;
  replacementText: string;
  severity?: 'suggestion' | 'warning' | 'info';
}

/**
 * Editorial critique pass on a scene or selection
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { text, passType = 'all', instruction, contextTitle } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing text to analyze' });
    }

    // Determine focus description based on passType
    let passFocus = '';
    switch (passType) {
      case 'show-dont-tell':
        passFocus =
          'Focus strictly on "Show, Don\'t Tell". Detect places where internal emotions or physical states are told (e.g. "he felt angry", "she was terrified") instead of shown through sensory reactions, involuntary micro-expressions, or environment interactions.';
        break;
      case 'sensory':
        passFocus =
          'Focus on sensory depth and visceral atmosphere. Identify abstract descriptions and enhance them with grounded lighting, tactile textures, acoustic reflections, and olfactory details without bloating the prose.';
        break;
      case 'prose-flow':
        passFocus =
          'Focus on prose cadence, syntax variety, sentence rhythm, and eliminating clunky phrasings, throat-clearing, and unintended repetition.';
        break;
      case 'dialogue':
        passFocus =
          'Focus on dialogue sharpness, natural subtext, speech rhythm, trimming on-the-nose exposition, and refining dialogue beats.';
        break;
      case 'pacing':
        passFocus =
          'Focus on pacing, tension, passive deadweight, filter words (noticed, saw, felt, heard), and sentence drag.';
        break;
      default:
        passFocus =
          'Perform a high-level fiction editorial pass: identify clunky sentences, telling instead of showing, filter words, weak verbs, and dialogue beats that can be sharpened.';
        break;
    }

    if (instruction) {
      passFocus += ` Additional user guidance: ${instruction}`;
    }

    const systemInstruction =
      'You are an award-winning fiction editor and manuscript consultant. ' +
      'Analyze the provided novel manuscript excerpt and provide 3 to 6 high-value, actionable prose improvements. ' +
      'CRITICAL REQUIREMENT: For each suggestion, "originalText" MUST be an EXACT, VERBATIM substring copied directly from the manuscript text so it can be located in the editor. ' +
      'Do not invent or paraphrase the originalText. ' +
      'Return a valid JSON array of suggestions adhering to this exact schema:\n' +
      '[{\n' +
      '  "title": "Short descriptive label (e.g., Show Visceral Reaction)",\n' +
      '  "description": "Clear 1-2 sentence editorial rationale explaining why this improves the passage.",\n' +
      '  "originalText": "Exact substring from the text to be replaced",\n' +
      '  "replacementText": "The improved prose replacement",\n' +
      '  "severity": "suggestion" | "warning" | "info"\n' +
      '}]';

    const prompt = `${passFocus}\n${contextTitle ? `Scene Context: ${contextTitle}\n` : ''}\nManuscript text to evaluate:\n"""\n${text}\n"""`;

    const rawResponse = await generateWithGemini({
      contents: prompt,
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.6,
    });

    let parsedList: RawAISuggestion[] = [];
    try {
      const cleanJson = rawResponse.trim();
      parsedList = JSON.parse(cleanJson);
      if (!Array.isArray(parsedList) && typeof parsedList === 'object' && parsedList !== null) {
        // Handle potential wrapping object like { "suggestions": [...] }
        const key = Object.keys(parsedList).find(k => Array.isArray((parsedList as any)[k]));
        if (key) {
          parsedList = (parsedList as any)[key];
        }
      }
    } catch (e) {
      console.warn('[Gemini /analyze] JSON parse failed on response, attempting regex recovery:', rawResponse);
      const matches = rawResponse.match(/\[[\s\S]*\]/);
      if (matches) {
        try {
          parsedList = JSON.parse(matches[0]);
        } catch {}
      }
    }

    // Match suggestions against the source text to calculate exact startIndex and endIndex
    const matchedSuggestions = [];
    let idCounter = 1;

    for (const item of parsedList) {
      if (!item.originalText || !item.replacementText) continue;

      let startIndex = text.indexOf(item.originalText);

      // If exact match fails, try case-insensitive or trimmed match
      if (startIndex === -1) {
        const trimmed = item.originalText.trim();
        startIndex = text.indexOf(trimmed);
        if (startIndex !== -1) {
          item.originalText = trimmed;
        }
      }

      if (startIndex === -1) {
        // Try normalized whitespace match
        const normOriginal = item.originalText.replace(/\s+/g, ' ').trim();
        const normText = text.replace(/\s+/g, ' ');
        const normIndex = normText.indexOf(normOriginal);
        if (normIndex !== -1) {
          // Approximate position in original text
          const prefix = normText.slice(0, normIndex);
          const estimatedChar = prefix.length;
          // Search around estimated char
          const searchWindowStart = Math.max(0, estimatedChar - 50);
          const searchWindow = text.slice(searchWindowStart, searchWindowStart + item.originalText.length + 100);
          const localIdx = searchWindow.toLowerCase().indexOf(normOriginal.slice(0, 20).toLowerCase());
          if (localIdx !== -1) {
            startIndex = searchWindowStart + localIdx;
            item.originalText = text.slice(startIndex, startIndex + item.originalText.length);
          }
        }
      }

      // If still not found, skip to avoid corrupted text replacement
      if (startIndex === -1) {
        continue;
      }

      const endIndex = startIndex + item.originalText.length;

      matchedSuggestions.push({
        id: `ai-${Date.now()}-${idCounter++}`,
        type: 'ai-rewrite' as const,
        title: item.title || 'AI Style Polish',
        description: item.description || 'AI-recommended prose refinement.',
        originalText: item.originalText,
        replacementText: item.replacementText,
        startIndex,
        endIndex,
        ruleCategory: 'ai' as const,
        severity: item.severity || 'suggestion',
      });
    }

    res.json({
      passType,
      suggestions: matchedSuggestions,
      totalFound: matchedSuggestions.length,
    });
  } catch (err: any) {
    console.error('[Gemini /analyze error]', err);
    res.status(500).json({ error: err.message || 'AI analysis failed' });
  }
});

export { router as geminiRouter };
