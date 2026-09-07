import { LLMSettings, Suggestion } from '../../types/index.ts';

export interface RewriteResult {
  rewrittenText: string;
  originalText: string;
}

export interface AIPassOptions {
  passType?: 'prose-flow' | 'show-dont-tell' | 'sensory' | 'dialogue' | 'pacing' | 'all';
  instruction?: string;
  contextTitle?: string;
}

export interface AIPassResult {
  suggestions: Suggestion[];
  totalFound: number;
  passType: string;
}

/**
 * Rewrites the selected passage.
 * Defaults to the server-side Gemini endpoint (`/api/ai/rewrite`).
 * If the user configured a custom third-party BYOM URL (e.g. local Ollama / LMStudio),
 * it calls that custom URL.
 */
export async function rewritePassage(
  selectedPassage: string,
  instruction: string,
  settings?: LLMSettings
): Promise<RewriteResult> {
  if (!selectedPassage.trim()) {
    throw new Error('Please select text to rewrite.');
  }

  const isCustomEndpoint =
    settings &&
    settings.baseUrl &&
    settings.baseUrl.trim() !== '' &&
    !settings.baseUrl.includes('openrouter.ai');

  if (!isCustomEndpoint) {
    // Standard path: Call server-side Gemini proxy
    const response = await fetch('/api/ai/rewrite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedPassage,
        instruction,
        systemPrompt: settings?.systemPrompt,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `AI rewrite failed with status ${response.status}`);
    }

    return await response.json();
  }

  // Custom BYOM endpoint (e.g. local Ollama)
  const baseUrl = (settings.baseUrl || '').replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;

  const systemMessage =
    settings.systemPrompt ||
    'You are an expert novelist editor and writing assistant. ' +
    'Rewrite ONLY the provided passage according to the instructions. ' +
    'Maintain the voice, character perspective, and genre tone. ' +
    'Do not include preamble, quotes, explanations, or commentary—return ONLY the revised passage text.';

  const prompt = `Instruction: ${instruction}\n\nPassage to revise:\n"""\n${selectedPassage}\n"""`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (settings.apiKey) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: settings.model || 'microsoft/wizardlm-2-8x22b',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Custom LLM returned error (${response.status}): ${errBody || response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim() || '';

    if (content.startsWith('"""') && content.endsWith('"""')) {
      content = content.slice(3, -3).trim();
    } else if (content.startsWith('"') && content.endsWith('"') && !content.slice(1, -1).includes('"')) {
      content = content.slice(1, -1);
    }

    return {
      rewrittenText: content,
      originalText: selectedPassage,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('The rewrite request timed out. Check your network or local LLM status.');
    }
    throw error;
  }
}

/**
 * Runs an AI editorial pass on the provided text (entire scene or highlighted excerpt).
 * Returns structured suggestions ready to be reviewed or applied in the editor.
 */
export async function runAIEditorialPass(
  text: string,
  options: AIPassOptions = {}
): Promise<AIPassResult> {
  if (!text.trim()) {
    throw new Error('No manuscript text to evaluate.');
  }

  const response = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      passType: options.passType || 'all',
      instruction: options.instruction,
      contextTitle: options.contextTitle,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `AI analysis failed (${response.status})`);
  }

  const data = await response.json();
  return {
    suggestions: data.suggestions || [],
    totalFound: data.totalFound || 0,
    passType: data.passType || options.passType || 'all',
  };
}

export interface GenerateContentOptions {
  prompt: string;
  length?: 'brief' | 'standard' | 'extended' | number;
  style?: string;
  customStyle?: string;
  systemPrompt?: string;
  selectedText?: string;
  surroundingContext?: string;
  temperature?: number;
}

export interface GenerateContentResult {
  generatedText: string;
  prompt: string;
  wordCount: number;
}

/**
 * Generates creative manuscript content using the connected LLM.
 * Defaults to the server-side Gemini endpoint (`/api/ai/generate`).
 * If custom BYOM settings are configured, calls the custom OpenAI-compatible endpoint.
 */
export async function generateManuscriptContent(
  options: GenerateContentOptions,
  settings?: LLMSettings
): Promise<GenerateContentResult> {
  if (!options.prompt || !options.prompt.trim()) {
    throw new Error('Please describe the content you want to generate.');
  }

  const isCustomEndpoint =
    settings &&
    settings.baseUrl &&
    settings.baseUrl.trim() !== '' &&
    !settings.baseUrl.includes('openrouter.ai');

  if (!isCustomEndpoint) {
    // Standard path: Call server-side Gemini route
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: options.prompt,
        length: options.length || 'standard',
        style: options.style || 'default',
        customStyle: options.customStyle,
        systemPrompt: options.systemPrompt || settings?.systemPrompt,
        selectedText: options.selectedText,
        surroundingContext: options.surroundingContext,
        temperature: options.temperature ?? 0.75,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `AI content generation failed (${response.status})`);
    }

    return await response.json();
  }

  // Custom BYOM endpoint (e.g. local Ollama / LMStudio)
  const baseUrl = (settings.baseUrl || '').replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;

  const defaultSystem =
    options.systemPrompt ||
    settings.systemPrompt ||
    'You are a master fiction novelist and creative writing assistant. ' +
    'Generate immersive, high-craft story prose matching the author\'s instructions and story context. ' +
    'Maintain narrative consistency, show-don\'t-tell depth, and authentic character voice. ' +
    'Do NOT include any preamble, introductory greeting, concluding commentary, or quotation wrappers. ' +
    'Return ONLY the raw narrative prose to be inserted directly into the manuscript.';

  let lengthGuidance = '';
  if (typeof options.length === 'number') {
    lengthGuidance = `Target length: approximately ${options.length} words.`;
  } else {
    switch (options.length) {
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

  let styleGuidance = '';
  switch (options.style) {
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
      styleGuidance = options.customStyle ? `Writing style: ${options.customStyle}` : '';
      break;
    default:
      styleGuidance = 'Writing style: Natural & Immersive. Match standard contemporary fiction publishing standards.';
      break;
  }

  let userMessage = `Content Description / Instructions:\n${options.prompt.trim()}\n\n${lengthGuidance}\n${styleGuidance}`;

  if (options.selectedText && options.selectedText.trim()) {
    userMessage += `\n\nReference / Selected Passage in Scene:\n"""\n${options.selectedText.trim()}\n"""`;
  }

  if (options.surroundingContext && options.surroundingContext.trim()) {
    const trimmedContext = options.surroundingContext.trim().slice(-2000);
    userMessage += `\n\nSurrounding Scene Context:\n"""\n${trimmedContext}\n"""`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (settings.apiKey) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: settings.model || 'microsoft/wizardlm-2-8x22b',
        messages: [
          { role: 'system', content: defaultSystem },
          { role: 'user', content: userMessage },
        ],
        temperature: options.temperature ?? 0.75,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Custom LLM returned error (${response.status}): ${errBody || response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim() || '';

    if (content.startsWith('"""') && content.endsWith('"""')) {
      content = content.slice(3, -3).trim();
    } else if (content.startsWith('```markdown') && content.endsWith('```')) {
      content = content.slice(11, -3).trim();
    } else if (content.startsWith('```') && content.endsWith('```')) {
      content = content.slice(3, -3).trim();
    }

    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

    return {
      generatedText: content,
      prompt: options.prompt,
      wordCount,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('The generation request timed out. Check your network or local LLM connection.');
    }
    throw error;
  }
}
