import { describe, it, expect, vi } from 'vitest';
import { runAllChecks, DEFAULT_USER_RULES } from '../src/engine/checks/index.ts';
import { applySuggestion, replacePassage, computeWordDiff } from '../src/engine/diff/index.ts';
import { compileNovelManuscript, parseImportedDocument } from '../src/engine/markdown/index.ts';
import { rewritePassage } from '../src/engine/ai/index.ts';
import { SceneDocument } from '../src/types/index.ts';

describe('StorySpark End-to-End Happy Path', () => {
  it('executes full core workflow: author drafting -> checks -> isolated rewrite pass -> accept diff -> compile', async () => {
    // 1. Initial Scene Draft
    let sceneText = 
      `# Chapter 1: The Broken Spire\n\n` +
      `The sky above the port was dark. It was raining for days, and the the old stone piers were slick.\n\n` +
      `Kaelen walked slowly towards the tavern.`;

    // 2. Deterministic Checks
    const suggestions = runAllChecks(sceneText, DEFAULT_USER_RULES, new Set());
    const repeatWord = suggestions.find(s => s.type === 'repeated-word');
    expect(repeatWord).toBeDefined();
    expect(repeatWord?.originalText).toBe('the the');

    // 3. Accept Repeated Word Fix
    sceneText = applySuggestion(sceneText, repeatWord!.startIndex, repeatWord!.endIndex, repeatWord!.replacementText);
    expect(sceneText).not.toContain('the the');
    expect(sceneText).toContain('the old stone piers');

    // 4. Isolated Passage Rewrite (Mocking LLM fetch response)
    const targetPassage = 'Kaelen walked slowly towards the tavern.';
    const startIdx = sceneText.indexOf(targetPassage);
    const endIdx = startIdx + targetPassage.length;

    // Verify mock rewrite
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: { content: 'Kaelen crept through the shadows toward the dimly lit tavern.' }
        }]
      })
    });
    global.fetch = mockFetch;

    const rewriteResult = await rewritePassage(
      targetPassage,
      'Make it more atmospheric and active',
      { apiKey: 'test-key', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', systemPrompt: '' }
    );

    expect(rewriteResult.rewrittenText).toBe('Kaelen crept through the shadows toward the dimly lit tavern.');
    // Verify only the selected passage was sent in prompt payload
    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.messages[1].content).toContain(targetPassage);
    expect(sentBody.messages[1].content).not.toContain('The sky above the port'); // Privacy guarantee: context isolated

    // 5. Diff Computation before Accepting
    const diff = computeWordDiff(targetPassage, rewriteResult.rewrittenText);
    expect(diff.some(d => d.removed && d.value.includes('walked'))).toBe(true);
    expect(diff.some(d => d.added && d.value.includes('crept'))).toBe(true);

    // 6. Accept Rewrite into Scene
    sceneText = replacePassage(sceneText, startIdx, endIdx, rewriteResult.rewrittenText);
    expect(sceneText).toContain('Kaelen crept through the shadows');

    // 7. Compile Final Manuscript
    const sceneDoc: SceneDocument = {
      id: 'scene-01',
      title: 'Chapter 1: The Broken Spire',
      filename: '01-broken-spire.md',
      content: sceneText,
      order: 1,
    };

    const compiled = compileNovelManuscript([sceneDoc], [], false);
    expect(compiled).toContain('# Chapter 1: The Broken Spire');
    expect(compiled).toContain('Kaelen crept through the shadows toward the dimly lit tavern.');
  });
});
