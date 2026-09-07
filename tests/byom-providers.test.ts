import { describe, it, expect } from 'vitest';
import {
  PROVIDERS,
  getProviderById,
  inferProvider,
} from '../src/engine/ai/providers.ts';
import { isCustomEndpointConfigured } from '../src/engine/ai/index.ts';

describe('BYOM Providers & Model Registry', () => {
  it('registers expected AI providers including OpenRouter, OpenAI, Anthropic, Ollama, and LM Studio', () => {
    const providerIds = PROVIDERS.map((p) => p.id);
    expect(providerIds).toContain('openrouter');
    expect(providerIds).toContain('openai');
    expect(providerIds).toContain('anthropic');
    expect(providerIds).toContain('gemini');
    expect(providerIds).toContain('groq');
    expect(providerIds).toContain('ollama');
    expect(providerIds).toContain('lmstudio');
    expect(providerIds).toContain('mistral');
    expect(providerIds).toContain('together');
    expect(providerIds).toContain('custom');
  });

  it('provides a curated list of supported models for OpenRouter', () => {
    const openrouter = getProviderById('openrouter');
    expect(openrouter.name).toBe('OpenRouter');
    expect(openrouter.models.length).toBeGreaterThan(5);

    const modelIds = openrouter.models.map((m) => m.id);
    expect(modelIds).toContain('anthropic/claude-3.7-sonnet');
    expect(modelIds).toContain('anthropic/claude-3.5-sonnet');
    expect(modelIds).toContain('openai/gpt-4o');
    expect(modelIds).toContain('deepseek/deepseek-chat');
  });

  it('provides local models for Ollama and LM Studio', () => {
    const ollama = getProviderById('ollama');
    expect(ollama.apiKeyRequired).toBe(false);
    expect(ollama.defaultBaseUrl).toContain('11434');
    const ollamaModels = ollama.models.map((m) => m.id);
    expect(ollamaModels).toContain('llama3.3');
    expect(ollamaModels).toContain('llama3.1');

    const lmstudio = getProviderById('lmstudio');
    expect(lmstudio.defaultBaseUrl).toContain('1234');
    expect(lmstudio.models.map((m) => m.id)).toContain('loaded-model');
  });

  it('infers provider from base URL and explicit provider ID', () => {
    expect(inferProvider('https://openrouter.ai/api/v1').id).toBe('openrouter');
    expect(inferProvider('https://api.openai.com/v1').id).toBe('openai');
    expect(inferProvider('http://localhost:11434/v1').id).toBe('ollama');
    expect(inferProvider('http://127.0.0.1:1234/v1').id).toBe('lmstudio');
    expect(inferProvider('https://api.groq.com/openai/v1').id).toBe('groq');
    expect(inferProvider('https://custom-proxy.internal.corp/v1').id).toBe('custom');
    expect(inferProvider('https://custom-proxy.internal.corp/v1', 'mistral').id).toBe('mistral');
  });

  it('correctly handles endpoint routing logic with isCustomEndpointConfigured', () => {
    // Unconfigured OpenRouter without API key falls back to built-in Gemini proxy
    expect(
      isCustomEndpointConfigured({
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: '',
        model: 'anthropic/claude-3.7-sonnet',
        systemPrompt: '',
      })
    ).toBe(false);

    // OpenRouter with API key uses custom endpoint
    expect(
      isCustomEndpointConfigured({
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: 'sk-or-v1-testkey',
        model: 'anthropic/claude-3.7-sonnet',
        systemPrompt: '',
      })
    ).toBe(true);

    // Local Ollama without API key uses custom endpoint directly
    expect(
      isCustomEndpointConfigured({
        baseUrl: 'http://localhost:11434/v1',
        apiKey: '',
        model: 'llama3.3',
        systemPrompt: '',
      })
    ).toBe(true);
  });
});
