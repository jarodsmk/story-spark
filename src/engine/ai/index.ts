import {
  LLMSettings,
  Suggestion,
  StorySuggestion,
  GenerateStorySuggestionsRequest,
} from '../../types/index.ts';

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
  sceneSummaries?: Array<{ title: string; summary: string }>;
  temperature?: number;
}

export interface GenerateContentResult {
  generatedText: string;
  prompt: string;
  wordCount: number;
}

export interface SummarizeSceneOptions {
  sceneContent: string;
  sceneTitle?: string;
  instructions?: string;
}

export interface SummarizeSceneResult {
  summary: string;
  wordCount: number;
  sceneTitle: string;
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
        sceneSummaries: options.sceneSummaries,
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

  if (Array.isArray(options.sceneSummaries) && options.sceneSummaries.length > 0) {
    const formatted = options.sceneSummaries
      .filter(s => s && s.summary && s.summary.trim())
      .map((s, idx) => `[Scene ${idx + 1}: ${s.title || 'Untitled'}]\n${s.summary.trim()}`)
      .join('\n\n');
    if (formatted) {
      userMessage += `\n\nNovel Scene Summaries (Chronological Story Context):\n"""\n${formatted}\n"""`;
    }
  }

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

/**
 * Generates a concise narrative summary of a scene using the connected LLM.
 * Defaults to the server-side Gemini endpoint (`/api/ai/summarize-scene`).
 */
export async function summarizeSceneContent(
  options: SummarizeSceneOptions,
  settings?: LLMSettings
): Promise<SummarizeSceneResult> {
  if (!options.sceneContent || !options.sceneContent.trim()) {
    throw new Error('Scene has no text to summarize.');
  }

  const isCustomEndpoint =
    settings &&
    settings.baseUrl &&
    settings.baseUrl.trim() !== '' &&
    !settings.baseUrl.includes('openrouter.ai');

  if (!isCustomEndpoint) {
    const response = await fetch('/api/ai/summarize-scene', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sceneContent: options.sceneContent,
        sceneTitle: options.sceneTitle,
        instructions: options.instructions,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Scene summarization failed (${response.status})`);
    }

    return await response.json();
  }

  // Custom BYOM path
  const baseUrl = (settings.baseUrl || '').replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;

  const systemInstruction =
    'You are an expert fiction novelist, story editor, and manuscript analyst. ' +
    'Generate a concise, information-dense summary of the provided fiction scene (approximately 60 to 120 words). ' +
    'Focus strictly on: ' +
    '1. Key plot developments and revelations that occurred in this scene. ' +
    '2. Main characters present, their core motivations, interactions, and emotional shifts. ' +
    '3. The immediate ending state, unresolved conflicts, or narrative hook setting up subsequent scenes. ' +
    'Do NOT include any meta-commentary, introductory remarks ("In this scene..."), bullet formatting, or conversational tone. ' +
    'Output ONLY the single, cohesive narrative summary paragraph, crafted specifically to serve as background context for AI story continuation and plotting.';

  let promptText = `Scene Title: ${options.sceneTitle || 'Untitled Scene'}\n\n`;
  if (options.instructions) {
    promptText += `Specific Instructions: ${options.instructions}\n\n`;
  }
  promptText += `Scene Content to Summarize:\n"""\n${options.sceneContent.trim()}\n"""`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (settings.apiKey) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: settings.model || 'microsoft/wizardlm-2-8x22b',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: promptText },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Custom LLM returned error (${response.status}): ${errBody || response.statusText}`);
  }

  const data = await response.json();
  let summary = data.choices?.[0]?.message?.content?.trim() || '';

  if (summary.startsWith('"""') && summary.endsWith('"""')) {
    summary = summary.slice(3, -3).trim();
  } else if (summary.startsWith('```markdown') && summary.endsWith('```')) {
    summary = summary.slice(11, -3).trim();
  } else if (summary.startsWith('```') && summary.endsWith('```')) {
    summary = summary.slice(3, -3).trim();
  }

  const wordCount = summary.split(/\s+/).filter(w => w.length > 0).length;

  return {
    summary,
    wordCount,
    sceneTitle: options.sceneTitle || 'Untitled Scene',
  };
}

/**
 * Generate brainstormed story suggestions using characters, lore, and selectable scene summaries
 */
export async function generateStorySuggestions(
  options: GenerateStorySuggestionsRequest,
  settings?: LLMSettings
): Promise<{ suggestions: StorySuggestion[] }> {
  const isCustomEndpoint =
    settings &&
    settings.baseUrl &&
    settings.baseUrl.trim() !== '' &&
    !settings.baseUrl.includes('openrouter.ai');

  if (!isCustomEndpoint) {
    const response = await fetch('/api/ai/story-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Story suggestions generation failed with status ${response.status}`);
    }

    return await response.json();
  }

  // Custom BYOM endpoint fallback
  const baseUrl = (settings.baseUrl || '').replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;

  const systemInstruction =
    'You are a world-class fiction story consultant and narrative architect. ' +
    'Provide creative story suggestions grounded in the provided scene summaries, characters, and lore. ' +
    'Output MUST be valid JSON with a "suggestions" array.';

  let prompt = `Current Working Scene: ${options.currentSceneTitle || 'Untitled Scene'}\n`;
  if (options.focusType && options.focusType !== 'all') {
    prompt += `Brainstorm Category Focus: ${options.focusType}\n`;
  }
  if (options.customGuidance?.trim()) {
    prompt += `Author's Guidance: ${options.customGuidance.trim()}\n`;
  }

  if (options.characters && options.characters.length > 0) {
    prompt += `\nExisting Characters:\n`;
    options.characters.forEach((c) => {
      prompt += `- ${c.name}${c.role ? ` (${c.role})` : ''}: ${c.summary || ''}\n`;
    });
  }

  if (options.lore && options.lore.length > 0) {
    prompt += `\nExisting Lore / World Elements:\n`;
    options.lore.forEach((l) => {
      prompt += `- ${l.name}${l.category ? ` [${l.category}]` : ''}: ${l.summary || ''}\n`;
    });
  }

  if (options.selectedSceneSummaries && options.selectedSceneSummaries.length > 0) {
    prompt += `\nTimeline Scene Summaries:\n"""\n`;
    options.selectedSceneSummaries.forEach((s, idx) => {
      prompt += `[Scene ${idx + 1}: ${s.title}]\n${s.summary}\n\n`;
    });
    prompt += `"""\n`;
  }

  prompt += `\nGenerate exactly ${options.count || 4} distinct story suggestions as JSON:\n` +
    `{\n` +
    `  "suggestions": [\n` +
    `    {\n` +
    `      "id": "sug_1",\n` +
    `      "title": "Title",\n` +
    `      "type": "plot_twist" | "character_conflict" | "lore_revelation" | "subplot" | "scene_beat",\n` +
    `      "involvedCharacters": ["Name"],\n` +
    `      "involvedLore": ["Lore item"],\n` +
    `      "premise": "Vivid description",\n` +
    `      "dramaticConflict": "Conflict and stakes",\n` +
    `      "suggestedSceneHook": "Actionable hook to write"\n` +
    `    }\n` +
    `  ]\n` +
    `}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (settings.apiKey) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: settings.model || 'microsoft/wizardlm-2-8x22b',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Custom LLM returned error (${response.status}): ${errBody || response.statusText}`);
  }

  const data = await response.json();
  let rawContent = data.choices?.[0]?.message?.content?.trim() || '';
  if (rawContent.startsWith('```json')) {
    rawContent = rawContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  } else if (rawContent.startsWith('```')) {
    rawContent = rawContent.replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawContent);
  } catch (err) {
    const firstBrace = rawContent.indexOf('{');
    const lastBrace = rawContent.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      parsed = JSON.parse(rawContent.slice(firstBrace, lastBrace + 1));
    } else {
      throw new Error('Could not parse story suggestions from LLM.');
    }
  }

  const suggestionsList = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
  return {
    suggestions: suggestionsList.map((s: any, idx: number) => ({
      id: s.id || `sug_${Date.now()}_${idx}`,
      title: String(s.title || `Story Idea ${idx + 1}`).trim(),
      type: s.type || 'general',
      involvedCharacters: Array.isArray(s.involvedCharacters) ? s.involvedCharacters : [],
      involvedLore: Array.isArray(s.involvedLore) ? s.involvedLore : [],
      premise: String(s.premise || ''),
      dramaticConflict: String(s.dramaticConflict || ''),
      suggestedSceneHook: String(s.suggestedSceneHook || ''),
    })),
  };
}
