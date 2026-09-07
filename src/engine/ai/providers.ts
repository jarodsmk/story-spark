export interface ModelOption {
  id: string;
  name: string;
  category?: 'Fiction & Prose' | 'Balanced & Fast' | 'Reasoning & Plotting' | 'Flagship' | 'Local / Private' | 'Specialized';
  description?: string;
  badge?: string;
}

export interface ProviderOption {
  id: string;
  name: string;
  badge?: string;
  description: string;
  defaultBaseUrl: string;
  placeholderApiKey: string;
  apiKeyRequired: boolean;
  helpText: string;
  docsUrl?: string;
  models: ModelOption[];
}

export const PROVIDERS: ProviderOption[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Recommended',
    description: 'Universal gateway to 200+ frontier & open-source language models with a single unified API key.',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    placeholderApiKey: 'sk-or-v1-...',
    apiKeyRequired: true,
    helpText: 'Get your API key at openrouter.ai/keys to access Claude, GPT-4o, DeepSeek, and Llama with zero subscriptions.',
    docsUrl: 'https://openrouter.ai/keys',
    models: [
      {
        id: 'anthropic/claude-3.7-sonnet',
        name: 'Claude 3.7 Sonnet',
        category: 'Fiction & Prose',
        badge: 'Recommended',
        description: 'Premier hybrid reasoning & nuanced prose craft for serious fiction writers.',
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        category: 'Fiction & Prose',
        badge: 'Popular',
        description: 'Gold standard for natural dialogue, distinct character voice, and narrative rhythm.',
      },
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        category: 'Flagship',
        badge: 'Fast',
        description: 'Dynamic character dialogue, visceral action beats, and fluid descriptive prose.',
      },
      {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini',
        category: 'Balanced & Fast',
        description: 'Ultra-fast, economical drafts, scene beat expansion, and rapid editorial suggestions.',
      },
      {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek V3',
        category: 'Fiction & Prose',
        badge: 'Great Value',
        description: 'High craft prose, rich vocabulary, and subtle sensory descriptions at low cost.',
      },
      {
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek R1',
        category: 'Reasoning & Plotting',
        badge: 'Reasoning',
        description: 'Deep chain-of-thought analysis for complex mysteries, plot twists, and high-stakes conflict.',
      },
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        name: 'Llama 3.3 70B Instruct',
        category: 'Fiction & Prose',
        description: 'Frontier open-weights performance with sharp prose and consistent tone matching.',
      },
      {
        id: 'mistralai/mistral-large-2411',
        name: 'Mistral Large 2',
        category: 'Fiction & Prose',
        description: 'Sophisticated literary flair, multilingual sensitivity, and evocative worldbuilding.',
      },
      {
        id: 'gryphe/mythomax-l2-13b',
        name: 'MythoMax L2 13B',
        category: 'Specialized',
        badge: 'Classic',
        description: 'Fiction community favorite fine-tune crafted specifically for narrative immersion and romance/fantasy.',
      },
      {
        id: 'microsoft/wizardlm-2-8x22b',
        name: 'WizardLM-2 8x22B',
        category: 'Specialized',
        description: 'Specialized for complex fiction prose, multi-character banter, and detailed world scenes.',
      },
      {
        id: 'nousresearch/hermes-3-llama-3.1-405b',
        name: 'Hermes 3 405B',
        category: 'Flagship',
        description: 'Massive unconstrained open weights model with expansive narrative freedom.',
      },
      {
        id: 'google/gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        category: 'Reasoning & Plotting',
        description: 'Expansive context retention across complex multi-chapter novel timelines.',
      },
      {
        id: 'google/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        category: 'Balanced & Fast',
        description: 'Rapid prose generation and instantaneous scene beat revisions.',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    badge: 'Direct',
    description: 'Direct OpenAI API access for GPT-4o, GPT-4-turbo, and o-series reasoning models.',
    defaultBaseUrl: 'https://api.openai.com/v1',
    placeholderApiKey: 'sk-proj-...',
    apiKeyRequired: true,
    helpText: 'Enter your OpenAI platform API key from platform.openai.com/api-keys.',
    docsUrl: 'https://platform.openai.com/api-keys',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        category: 'Flagship',
        badge: 'Recommended',
        description: 'Flagship model for creative prose, sharp dialogue, and scene continuation.',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        category: 'Balanced & Fast',
        badge: 'Fast',
        description: 'Lightweight and low-cost for rapid editorial critiques and brainstormed ideas.',
      },
      {
        id: 'o3-mini',
        name: 'o3-mini',
        category: 'Reasoning & Plotting',
        badge: 'Reasoning',
        description: 'High-speed reasoning model for intricate plotting, clue setups, and logic checks.',
      },
      {
        id: 'o1',
        name: 'o1',
        category: 'Reasoning & Plotting',
        description: 'Full reasoning powerhouse for deep world rules and multi-threaded character motives.',
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        category: 'Fiction & Prose',
        description: 'High capability model with 128k context for long chapter evaluation.',
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        category: 'Balanced & Fast',
        description: 'Legacy model for rapid, simple prose substitutions.',
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    badge: 'Prose Leader',
    description: 'Claude family models celebrated for novelist-quality prose, voice consistency, and dialogue.',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    placeholderApiKey: 'sk-ant-...',
    apiKeyRequired: true,
    helpText: 'Requires an Anthropic API key or an OpenAI-compatible proxy to Anthropic.',
    docsUrl: 'https://console.anthropic.com/',
    models: [
      {
        id: 'claude-3-7-sonnet-20250219',
        name: 'Claude 3.7 Sonnet',
        category: 'Fiction & Prose',
        badge: 'Recommended',
        description: 'State of the art fiction prose and hybrid thinking for literary craftsmanship.',
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        category: 'Fiction & Prose',
        badge: 'Popular',
        description: 'The standard for authorial voice, lyrical description, and natural pacing.',
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        category: 'Balanced & Fast',
        description: 'Fast scene summaries, quick dialogue polishes, and prompt brainstorming.',
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        category: 'Fiction & Prose',
        description: 'Rich, atmospheric long-form fiction with deep character interiority.',
      },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Direct',
    description: 'Direct Google AI Studio API access via the OpenAI-compatible endpoint.',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    placeholderApiKey: 'AIzaSy...',
    apiKeyRequired: true,
    helpText: 'Get a Gemini API key at aistudio.google.com/apikey.',
    docsUrl: 'https://aistudio.google.com/apikey',
    models: [
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        category: 'Flagship',
        badge: 'Recommended',
        description: 'Advanced reasoning, deep story synthesis, and high narrative immersion.',
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        category: 'Balanced & Fast',
        badge: 'Fast',
        description: 'Fast, responsive storytelling and crisp prose editing.',
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        category: 'Balanced & Fast',
        description: 'Low-latency draft generation and real-time suggestion checks.',
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        category: 'Reasoning & Plotting',
        description: 'Massive 2M token context memory for keeping entire novel continuity in mind.',
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        category: 'Balanced & Fast',
        description: 'Lightweight utility model for swift revisions.',
      },
    ],
  },
  {
    id: 'groq',
    name: 'Groq (Ultra-Fast)',
    badge: 'Instant',
    description: 'Ultra-fast LPU inference engine for near-instant scene generation and critiques.',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    placeholderApiKey: 'gsk_...',
    apiKeyRequired: true,
    helpText: 'Obtain an API key from console.groq.com/keys.',
    docsUrl: 'https://console.groq.com/keys',
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B Versatile',
        category: 'Fiction & Prose',
        badge: 'Recommended',
        description: 'High-capability fiction prose delivered at over 300 tokens per second.',
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B Instant',
        category: 'Balanced & Fast',
        badge: 'Fastest',
        description: 'Instantaneous style checks, grammar tweaks, and quick sentence alternatives.',
      },
      {
        id: 'deepseek-r1-distill-llama-70b',
        name: 'DeepSeek R1 Distill 70B',
        category: 'Reasoning & Plotting',
        description: 'Lightning-fast reasoning for story twists, narrative beats, and character conflicts.',
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        category: 'Fiction & Prose',
        description: 'Proven open-weight mixture-of-experts model for descriptive prose.',
      },
      {
        id: 'gemma2-9b-it',
        name: 'Gemma 2 9B',
        category: 'Balanced & Fast',
        description: 'Compact Google architecture with strong creative writing capabilities.',
      },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local / Offline)',
    badge: 'Private & Free',
    description: 'Run open-weight AI models locally on your computer with complete privacy and zero cost.',
    defaultBaseUrl: 'http://localhost:11434/v1',
    placeholderApiKey: 'Optional (leave blank for local)',
    apiKeyRequired: false,
    helpText: 'Start Ollama locally with `ollama serve`. Make sure your chosen model is pulled (e.g., `ollama pull llama3.3`).',
    docsUrl: 'https://ollama.com/',
    models: [
      {
        id: 'llama3.3',
        name: 'Llama 3.3 (70B)',
        category: 'Local / Private',
        badge: 'Recommended',
        description: 'Premier local model for novel chapters and evocative narrative descriptions.',
      },
      {
        id: 'llama3.1',
        name: 'Llama 3.1 (8B)',
        category: 'Local / Private',
        badge: 'Fast',
        description: 'Runs fast on standard laptops and consumer GPUs with great narrative flow.',
      },
      {
        id: 'qwen2.5:14b',
        name: 'Qwen 2.5 (14B)',
        category: 'Local / Private',
        description: 'Excellent creative prose, natural sentence rhythm, and expressive dialogue.',
      },
      {
        id: 'qwen2.5:32b',
        name: 'Qwen 2.5 (32B)',
        category: 'Local / Private',
        description: 'High-craft prose with rich vocabulary for 16GB+ VRAM setups.',
      },
      {
        id: 'deepseek-r1:8b',
        name: 'DeepSeek R1 (8B)',
        category: 'Local / Private',
        description: 'Local reasoning model for brainstorming plot complications and stakes.',
      },
      {
        id: 'deepseek-r1:14b',
        name: 'DeepSeek R1 (14B)',
        category: 'Local / Private',
        description: 'Well-balanced local reasoning and narrative output.',
      },
      {
        id: 'mistral',
        name: 'Mistral (7B)',
        category: 'Local / Private',
        description: 'Lightweight local fiction champion with solid storytelling cadence.',
      },
      {
        id: 'phi4',
        name: 'Phi-4 (14B)',
        category: 'Local / Private',
        description: 'Concise, intellectually sharp prose from Microsoft.',
      },
    ],
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (Local Server)',
    badge: 'Private & Free',
    description: 'Connect directly to your running LM Studio desktop application via its local server.',
    defaultBaseUrl: 'http://localhost:1234/v1',
    placeholderApiKey: 'Optional (leave blank for local)',
    apiKeyRequired: false,
    helpText: 'Start the Local Inference Server in LM Studio (default port 1234).',
    docsUrl: 'https://lmstudio.ai/',
    models: [
      {
        id: 'loaded-model',
        name: 'Currently Loaded Model',
        category: 'Local / Private',
        badge: 'Default',
        description: 'Automatically uses whichever model is active in your LM Studio session.',
      },
      {
        id: 'mistral-7b-instruct',
        name: 'Mistral 7B Instruct',
        category: 'Local / Private',
        description: 'Fast local instruct model in LM Studio.',
      },
      {
        id: 'llama-3-8b-instruct',
        name: 'Llama 3 8B Instruct',
        category: 'Local / Private',
        description: 'Llama 3 8B fine-tune loaded in LM Studio.',
      },
      {
        id: 'hermes-3-llama-3.1-8b',
        name: 'Hermes 3 8B',
        category: 'Local / Private',
        description: 'Creative storytelling fine-tune loaded in LM Studio.',
      },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    badge: 'European AI',
    description: 'European frontier models with exceptional prose styling and multilingual depth.',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    placeholderApiKey: 'Bearer key...',
    apiKeyRequired: true,
    helpText: 'Create an API key at console.mistral.ai.',
    docsUrl: 'https://console.mistral.ai/',
    models: [
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large',
        category: 'Fiction & Prose',
        badge: 'Recommended',
        description: 'Flagship model with elegant narrative cadence and high literary fidelity.',
      },
      {
        id: 'mistral-small-latest',
        name: 'Mistral Small',
        category: 'Balanced & Fast',
        description: 'Cost-effective and rapid prose generation for day-to-day writing.',
      },
      {
        id: 'open-mistral-nemo',
        name: 'Mistral NeMo (12B)',
        category: 'Fiction & Prose',
        description: 'Co-developed with NVIDIA; tuned for narrative consistency.',
      },
      {
        id: 'codestral-latest',
        name: 'Codestral',
        category: 'Balanced & Fast',
        description: 'Dense formatting and structured manuscript output.',
      },
    ],
  },
  {
    id: 'together',
    name: 'Together AI',
    badge: 'Fast Cloud',
    description: 'Fast cloud hosting for open-weights models with low latency and pay-per-token pricing.',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    placeholderApiKey: 'Bearer key...',
    apiKeyRequired: true,
    helpText: 'Get your API key at api.together.ai.',
    docsUrl: 'https://api.together.ai/',
    models: [
      {
        id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        name: 'Llama 3.3 70B Turbo',
        category: 'Fiction & Prose',
        badge: 'Recommended',
        description: 'High-speed open-weights prose generation with full 128k context.',
      },
      {
        id: 'deepseek-ai/DeepSeek-V3',
        name: 'DeepSeek V3',
        category: 'Fiction & Prose',
        description: 'Rich sensory prose and natural dialogue interaction.',
      },
      {
        id: 'deepseek-ai/DeepSeek-R1',
        name: 'DeepSeek R1',
        category: 'Reasoning & Plotting',
        description: 'Reasoning engine for complicated story architectures.',
      },
      {
        id: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
        name: 'Qwen 2.5 72B Turbo',
        category: 'Fiction & Prose',
        description: 'Expansive vocabulary and expressive literary descriptions.',
      },
    ],
  },
  {
    id: 'custom',
    name: 'Custom (OpenAI-Compatible)',
    badge: 'Custom',
    description: 'Connect to any OpenAI-compatible server, self-hosted vLLM, Text Generation WebUI, or corporate proxy.',
    defaultBaseUrl: 'https://api.example.com/v1',
    placeholderApiKey: 'API Key (or blank if unauthenticated)',
    apiKeyRequired: false,
    helpText: 'Specify your custom endpoint Base URL and Model name.',
    models: [
      {
        id: 'custom',
        name: 'Custom Model Name...',
        category: 'Specialized',
        description: 'Specify any custom model name supported by your endpoint.',
      },
    ],
  },
];

export const DEFAULT_PROVIDER_ID = 'openrouter';

export function getProviderById(id?: string): ProviderOption {
  if (!id) return PROVIDERS[0];
  const found = PROVIDERS.find((p) => p.id === id.toLowerCase());
  return found || PROVIDERS[0];
}

export function inferProvider(baseUrl?: string, explicitProvider?: string): ProviderOption {
  if (explicitProvider) {
    const p = PROVIDERS.find((item) => item.id === explicitProvider.toLowerCase());
    if (p) return p;
  }

  if (!baseUrl || !baseUrl.trim()) {
    return PROVIDERS[0]; // OpenRouter
  }

  const url = baseUrl.toLowerCase();
  if (url.includes('openrouter.ai')) return getProviderById('openrouter');
  if (url.includes('api.openai.com')) return getProviderById('openai');
  if (url.includes('anthropic.com')) return getProviderById('anthropic');
  if (url.includes('googleapis.com') || url.includes('generativelanguage')) return getProviderById('gemini');
  if (url.includes('groq.com')) return getProviderById('groq');
  if (url.includes('localhost:11434') || url.includes('127.0.0.1:11434') || url.includes('ollama')) return getProviderById('ollama');
  if (url.includes('localhost:1234') || url.includes('127.0.0.1:1234') || url.includes('lmstudio')) return getProviderById('lmstudio');
  if (url.includes('mistral.ai')) return getProviderById('mistral');
  if (url.includes('together.xyz') || url.includes('together.ai')) return getProviderById('together');

  return getProviderById('custom');
}

export async function fetchLiveProviderModels(baseUrl: string, apiKey?: string): Promise<ModelOption[]> {
  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const url = `${cleanUrl}/models`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey && apiKey.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      throw new Error(`Endpoint returned status ${resp.status} (${resp.statusText})`);
    }

    const json = await resp.json();
    const dataList = Array.isArray(json.data) ? json.data : Array.isArray(json.models) ? json.models : [];

    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }

    const models: ModelOption[] = [];
    for (const item of dataList) {
      const id = item?.id || item?.name;
      if (!id) continue;
      models.push({
        id: String(id),
        name: String(item.name || id),
        description: item.description ? String(item.description) : `Model ${id}`,
        category: 'Specialized',
      });
    }

    return models;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Timeout while fetching models from provider (8s limit).');
    }
    throw err;
  }
}
