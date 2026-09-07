import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateManuscriptContent, estimateWordCountRange } from '../src/engine/ai/index.ts';

describe('AI Content Generation Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects empty prompts with a descriptive error', async () => {
    await expect(
      generateManuscriptContent({ prompt: '   ' })
    ).rejects.toThrow('Please describe the content you want to generate.');
  });

  it('accurately estimates rough word count range for different paragraph counts', () => {
    const p1 = estimateWordCountRange(1);
    expect(p1.minWords).toBe(65);
    expect(p1.maxWords).toBe(100);
    expect(p1.label).toBe('~65–100 words');

    const p2 = estimateWordCountRange(2);
    expect(p2.minWords).toBe(130);
    expect(p2.maxWords).toBe(200);
    expect(p2.label).toBe('~130–200 words');

    const p3 = estimateWordCountRange(3);
    expect(p3.minWords).toBe(195);
    expect(p3.maxWords).toBe(300);
    expect(p3.label).toBe('~195–300 words');

    const p5 = estimateWordCountRange(5);
    expect(p5.minWords).toBe(325);
    expect(p5.maxWords).toBe(500);
    expect(p5.label).toBe('~325–500 words');
  });

  it('supports specifying target number of paragraphs with rough word count indication and calculates paragraph count in result', async () => {
    const mockResponse = {
      generatedText:
        'The rain lashed against the cracked windowpanes of the tavern.\n\n' +
        'Jax slipped his hand into his leather coat, fingering the cold edge of the cipher key.\n\n' +
        'Across the room, the shadowy informant signaled with a slight nod of his head.',
      prompt: 'Tense tavern meetup',
      wordCount: 36,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await generateManuscriptContent({
      prompt: 'Tense tavern meetup',
      paragraphs: 3,
      style: 'dark-gritty',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/ai/generate',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Tense tavern meetup',
          length: 'standard',
          style: 'dark-gritty',
          temperature: 0.75,
          paragraphs: 3,
        }),
      })
    );

    expect(result.generatedText).toContain('Jax slipped his hand');
    expect(result.wordCount).toBe(36);
    expect(result.paragraphCount).toBe(3);
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
