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

/**
 * Generate creative fiction prose with connected LLM
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      systemPrompt,
      length = 'standard',
      style = 'default',
      customStyle,
      selectedText,
      surroundingContext,
      sceneSummaries,
      temperature = 0.75,
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Please describe the content to generate.' });
    }

    // Determine target word count / length description
    let lengthGuidance = '';
    if (typeof length === 'number') {
      lengthGuidance = `Target length: approximately ${length} words.`;
    } else {
      switch (length) {
        case 'brief':
          lengthGuidance = 'Target length: brief (approximately 50-100 words / a quick scene beat or short paragraph).';
          break;
        case 'standard':
          lengthGuidance = 'Target length: standard (approximately 150-250 words / a solid narrative paragraph or dialogue exchange).';
          break;
        case 'extended':
          lengthGuidance = 'Target length: extended (approximately 350-500 words / a detailed sequence or chapter section).';
          break;
        default:
          lengthGuidance = 'Target length: approximately 200 words.';
          break;
      }
    }

    // Determine writing style description
    let styleGuidance = '';
    switch (style) {
      case 'vivid-sensory':
        styleGuidance = 'Writing style: Vivid & Sensory. Ground the prose in visceral tactile textures, ambient acoustics, lighting, and evocative physical descriptions.';
        break;
      case 'fast-paced':
        styleGuidance = 'Writing style: Fast-Paced & Tense. Use crisp, punchy sentences, active verbs, urgent cadence, and heightened tension.';
        break;
      case 'lyrical':
        styleGuidance = 'Writing style: Atmospheric & Lyrical. Use rich cadence, evocative subtext, poetic depth, and emotional resonance.';
        break;
      case 'snappy-dialogue':
        styleGuidance = 'Writing style: Sharp & Dialogue-Driven. Focus on natural character voice, witty subtext, dynamic banter, and minimal dialogue tags.';
        break;
      case 'dark-gritty':
        styleGuidance = 'Writing style: Dark & Gritty. Uncompromising realism, atmospheric weight, raw tension, and grounded sensory detail.';
        break;
      case 'custom':
        styleGuidance = customStyle ? `Writing style: ${customStyle}` : '';
        break;
      default:
        styleGuidance = 'Writing style: Natural & Immersive. Match standard contemporary fiction publishing standards.';
        break;
    }

    const defaultSystem =
      systemPrompt ||
      'You are a master fiction novelist and creative writing assistant. ' +
      'Generate immersive, high-craft story prose matching the author\'s instructions and story context. ' +
      'Maintain narrative consistency, show-don\'t-tell depth, and authentic character voice. ' +
      'Do NOT include any preamble, introductory greeting, concluding commentary, or quotation wrappers. ' +
      'Return ONLY the raw narrative prose to be inserted directly into the manuscript.';

    let userMessage = `Content Description / Instructions:\n${prompt.trim()}\n\n${lengthGuidance}\n${styleGuidance}`;

    // Include scene summaries for narrative context
    if (Array.isArray(sceneSummaries) && sceneSummaries.length > 0) {
      const formattedSummaries = sceneSummaries
        .filter(s => s && s.summary && s.summary.trim())
        .map((s, idx) => `[Scene ${idx + 1}: ${s.title || 'Untitled'}]\n${s.summary.trim()}`)
        .join('\n\n');
      if (formattedSummaries) {
        userMessage += `\n\nNovel Scene Summaries (Chronological Story Context):\n"""\n${formattedSummaries}\n"""`;
      }
    }

    if (selectedText && selectedText.trim()) {
      userMessage += `\n\nReference / Selected Passage in Scene:\n"""\n${selectedText.trim()}\n"""`;
    }

    if (surroundingContext && surroundingContext.trim()) {
      // Provide surrounding context up to ~1500 chars to keep prompt focused
      const trimmedContext = surroundingContext.trim().slice(-2000);
      userMessage += `\n\nSurrounding Scene Context:\n"""\n${trimmedContext}\n"""`;
    }

    let generated = await generateWithGemini({
      contents: userMessage,
      systemInstruction: defaultSystem,
      temperature,
    });

    generated = generated.trim();
    if (generated.startsWith('"""') && generated.endsWith('"""')) {
      generated = generated.slice(3, -3).trim();
    } else if (generated.startsWith('```markdown') && generated.endsWith('```')) {
      generated = generated.slice(11, -3).trim();
    } else if (generated.startsWith('```') && generated.endsWith('```')) {
      generated = generated.slice(3, -3).trim();
    }

    const wordCount = generated.split(/\s+/).filter(w => w.length > 0).length;

    res.json({
      generatedText: generated,
      prompt,
      wordCount,
    });
  } catch (err: any) {
    console.error('[Gemini /generate error]', err);
    res.status(500).json({ error: err.message || 'AI content generation failed' });
  }
});

/**
 * Generate concise, narrative-rich summary of a scene for story context
 */
router.post('/summarize-scene', async (req: Request, res: Response) => {
  try {
    const { sceneContent, sceneTitle, instructions, systemPrompt } = req.body;

    if (!sceneContent || typeof sceneContent !== 'string' || !sceneContent.trim()) {
      return res.status(400).json({ error: 'Missing sceneContent to summarize.' });
    }

    const systemInstruction =
      systemPrompt ||
      'You are an expert fiction novelist, story editor, and manuscript analyst. ' +
      'Generate a concise, information-dense summary of the provided fiction scene (approximately 60 to 120 words). ' +
      'Focus strictly on: ' +
      '1. Key plot developments and revelations that occurred in this scene. ' +
      '2. Main characters present, their core motivations, interactions, and emotional shifts. ' +
      '3. The immediate ending state, unresolved conflicts, or narrative hook setting up subsequent scenes. ' +
      'Do NOT include any meta-commentary, introductory remarks ("In this scene..."), bullet formatting, or conversational tone. ' +
      'Output ONLY the single, cohesive narrative summary paragraph, crafted specifically to serve as background context for AI story continuation and plotting.';

    let promptText = `Scene Title: ${sceneTitle || 'Untitled Scene'}\n\n`;
    if (instructions) {
      promptText += `Specific Instructions: ${instructions}\n\n`;
    }
    promptText += `Scene Content to Summarize:\n"""\n${sceneContent.trim()}\n"""`;

    let summary = await generateWithGemini({
      contents: promptText,
      systemInstruction,
      temperature: 0.4,
    });

    summary = summary.trim();
    if (summary.startsWith('"""') && summary.endsWith('"""')) {
      summary = summary.slice(3, -3).trim();
    } else if (summary.startsWith('```markdown') && summary.endsWith('```')) {
      summary = summary.slice(11, -3).trim();
    } else if (summary.startsWith('```') && summary.endsWith('```')) {
      summary = summary.slice(3, -3).trim();
    }

    const wordCount = summary.split(/\s+/).filter(w => w.length > 0).length;

    res.json({
      summary,
      wordCount,
      sceneTitle: sceneTitle || 'Untitled Scene',
    });
  } catch (err: any) {
    console.error('[Gemini /summarize-scene error]', err);
    res.status(500).json({ error: err.message || 'Scene summarization failed' });
  }
});

/**
 * Generate brainstormed story suggestions & narrative ideas involving characters, lore, and scene summaries
 */
router.post('/story-suggestions', async (req: Request, res: Response) => {
  try {
    const {
      focusType = 'all',
      customGuidance = '',
      characters = [],
      lore = [],
      selectedSceneSummaries = [],
      currentSceneTitle = '',
      surroundingContext = '',
      count = 4,
      systemPrompt,
    } = req.body;

    const systemInstruction =
      systemPrompt ||
      'You are a world-class fiction story consultant, narrative architect, and creative brainstorming partner for authors. ' +
      'Your goal is to provide deeply engaging, unexpected, high-stakes narrative suggestions that advance the story logically and dramatically. ' +
      'MANDATORY RULES:\n' +
      '1. Ground your ideas in the user’s selected scene summaries, respecting established continuity and consequences.\n' +
      '2. Actively incorporate the provided characters, their personalities, secrets, and relational conflicts.\n' +
      '3. Actively weave in the specified world lore, factions, magic/technology rules, or key locations.\n' +
      '4. Avoid generic tropes; push for compelling ethical dilemmas, dramatic irony, unexpected revelations, and visceral scene hooks.\n' +
      '5. You must output strictly valid JSON matching the required schema with a "suggestions" array.';

    let prompt = `Current Working Scene: ${currentSceneTitle || 'Untitled Scene'}\n`;

    if (focusType && focusType !== 'all') {
      prompt += `Brainstorm Category Focus: ${focusType}\n`;
    }

    if (customGuidance && typeof customGuidance === 'string' && customGuidance.trim()) {
      prompt += `Author's Creative Goal / Guidance: ${customGuidance.trim()}\n`;
    }

    if (Array.isArray(characters) && characters.length > 0) {
      prompt += `\nExisting Characters to Involve:\n`;
      characters.forEach((c: any) => {
        const charName = c.name || 'Unnamed';
        const role = c.role ? ` (${c.role})` : '';
        const summary = c.summary ? `: ${c.summary}` : '';
        prompt += `- ${charName}${role}${summary}\n`;
      });
    }

    if (Array.isArray(lore) && lore.length > 0) {
      prompt += `\nExisting World Lore / Settings to Weave in:\n`;
      lore.forEach((l: any) => {
        const loreName = l.name || 'Unnamed Lore';
        const cat = l.category ? ` [${l.category}]` : '';
        const summary = l.summary ? `: ${l.summary}` : '';
        prompt += `- ${loreName}${cat}${summary}\n`;
      });
    }

    if (Array.isArray(selectedSceneSummaries) && selectedSceneSummaries.length > 0) {
      prompt += `\nTimeline Scene Summaries (Chronological Story Context):\n"""\n`;
      selectedSceneSummaries.forEach((s: any, idx: number) => {
        prompt += `[Scene ${idx + 1}: ${s.title || 'Scene'}]\n${s.summary}\n\n`;
      });
      prompt += `"""\n`;
    }

    if (surroundingContext && typeof surroundingContext === 'string' && surroundingContext.trim()) {
      const excerpt = surroundingContext.trim().slice(-1000);
      prompt += `\nRecent Scene Manuscript Excerpt:\n"""\n${excerpt}\n"""\n`;
    }

    prompt += `\nGenerate exactly ${Math.min(Math.max(count || 4, 1), 6)} distinct story suggestions.\n` +
      `Format your output as a JSON object with this exact structure:\n` +
      `{\n` +
      `  "suggestions": [\n` +
      `    {\n` +
      `      "id": "sug_1",\n` +
      `      "title": "Evocative, compelling title for the idea",\n` +
      `      "type": "plot_twist" | "character_conflict" | "lore_revelation" | "subplot" | "scene_beat",\n` +
      `      "involvedCharacters": ["Character Name 1", "Character Name 2"],\n` +
      `      "involvedLore": ["Location or Lore Item 1"],\n` +
      `      "premise": "2-3 vivid sentences describing what happens, what is discovered, or how events unfold.",\n` +
      `      "dramaticConflict": "The core stakes, emotional tension, or moral dilemma confronting the characters.",\n` +
      `      "suggestedSceneHook": "Specific actionable beat or opening sentence/dialogue to write next in the scene."\n` +
      `    }\n` +
      `  ]\n` +
      `}`;

    const rawResponse = await generateWithGemini({
      contents: prompt,
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.8,
    });

    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      // Fallback: search for JSON object within text
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } else {
        throw new Error('Failed to parse story suggestions JSON from Gemini response.');
      }
    }

    const suggestionsList = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
    const sanitizedSuggestions = suggestionsList.map((s: any, idx: number) => ({
      id: s.id || `sug_${Date.now()}_${idx}`,
      title: String(s.title || `Story Idea ${idx + 1}`).trim(),
      type: ['plot_twist', 'character_conflict', 'lore_revelation', 'subplot', 'scene_beat'].includes(s.type)
        ? s.type
        : 'general',
      involvedCharacters: Array.isArray(s.involvedCharacters) ? s.involvedCharacters.map(String) : [],
      involvedLore: Array.isArray(s.involvedLore) ? s.involvedLore.map(String) : [],
      premise: String(s.premise || '').trim(),
      dramaticConflict: String(s.dramaticConflict || '').trim(),
      suggestedSceneHook: String(s.suggestedSceneHook || '').trim(),
    }));

    res.json({
      suggestions: sanitizedSuggestions,
    });
  } catch (err: any) {
    console.error('[Gemini /story-suggestions error]', err);
    res.status(500).json({ error: err.message || 'Failed to generate story suggestions' });
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
    const { text, passType = 'all', instruction, contextTitle, systemPrompt } = req.body;

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

    const defaultInstruction =
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

    const systemInstruction = systemPrompt || defaultInstruction;

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
