import { LLMSettings } from '../../types/index.ts';

export interface RewriteResult {
  rewrittenText: string;
  originalText: string;
}

/**
 * Sends ONLY the selected passage to the configured LLM endpoint.
 * Manuscript context outside the selection is strictly isolated.
 */
export async function rewritePassage(
  selectedPassage: string,
  instruction: string,
  settings: LLMSettings
): Promise<RewriteResult> {
  if (!selectedPassage.trim()) {
    throw new Error('Please select text to rewrite.');
  }

  const baseUrl = (settings.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;

  const systemMessage = settings.systemPrompt || 
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

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: settings.model || 'gpt-4o-mini',
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
      if (response.status === 401) {
        throw new Error('API key invalid or unauthorized. Please check your settings.');
      }
      if (response.status === 404) {
        throw new Error(`Model '${settings.model}' or endpoint not found at ${baseUrl}.`);
      }
      throw new Error(`LLM API returned error (${response.status}): ${errBody || response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim() || '';

    // Strip wrapping quotes if LLM added them around the entire response
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
    if (error.message.includes('Failed to fetch')) {
      throw new Error(`Could not connect to LLM at ${baseUrl}. Is your local model or internet active?`);
    }
    throw error;
  }
}
