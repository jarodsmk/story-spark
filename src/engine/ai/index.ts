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
