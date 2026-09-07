import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateManuscriptContent } from '../src/engine/ai/index.ts';

describe('AI Content Generation Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects empty prompts with a descriptive error', async () => {
    await expect(
      generateManuscriptContent({ prompt: '   ' })
    ).rejects.toThrow('Please describe the content you want to generate.');
  });

  it('calls server-side /api/ai/generate with automatically included system prompt, length, and style', async () => {
    const mockResponse = {
      generatedText: 'The lantern light flickered across the damp cobblestones as Mara drew her blade.',
      prompt: 'Mara draws her blade in the dark alley',
      wordCount: 14,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await generateManuscriptContent({
      prompt: 'Mara draws her blade in the dark alley',
      length: 'brief',
      style: 'vivid-sensory',
      systemPrompt: 'You are an expert novelist.',
      selectedText: 'Mara paused by the rain barrel.',
      surroundingContext: 'Chapter 1: The Alleyway.',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/ai/generate',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Mara draws her blade in the dark alley',
          length: 'brief',
          style: 'vivid-sensory',
          systemPrompt: 'You are an expert novelist.',
          selectedText: 'Mara paused by the rain barrel.',
          surroundingContext: 'Chapter 1: The Alleyway.',
          temperature: 0.75,
        }),
      })
    );

    expect(result.generatedText).toContain('Mara drew her blade');
    expect(result.wordCount).toBe(14);
  });

  it('supports custom word count lengths and custom styles', async () => {
    const mockResponse = {
      generatedText: 'A sparse, declarative sentence. The room was cold. No words were spoken.',
      prompt: 'Minimalist quiet scene',
      wordCount: 12,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await generateManuscriptContent({
      prompt: 'Minimalist quiet scene',
      length: 250,
      style: 'custom',
      customStyle: 'Sparse Hemingway cadence, declarative short sentences',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/ai/generate',
      expect.objectContaining({
        body: JSON.stringify({
          prompt: 'Minimalist quiet scene',
          length: 250,
          style: 'custom',
          customStyle: 'Sparse Hemingway cadence, declarative short sentences',
          temperature: 0.75,
        }),
      })
    );

    expect(result.generatedText).toBe(mockResponse.generatedText);
  });

  it('correctly routes to custom BYOM endpoint when baseUrl is configured in LLMSettings', async () => {
    const mockOpenAIResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'The stars pulsed through the broken observatory dome.',
          },
        },
      ],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockOpenAIResponse,
    } as unknown as Response);

    const result = await generateManuscriptContent(
      {
        prompt: 'Describe the observatory',
        length: 'standard',
        style: 'lyrical',
      },
      {
        apiKey: 'sk-test-secret',
        baseUrl: 'http://localhost:11434/v1',
        model: 'llama3:latest',
        systemPrompt: 'Custom author system directive',
      }
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:11434/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sk-test-secret',
        },
      })
    );

    expect(result.generatedText).toBe('The stars pulsed through the broken observatory dome.');
    expect(result.wordCount).toBe(8);
  });
});
