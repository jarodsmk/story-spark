import { describe, it, expect } from 'vitest';
import { computeWordDiff, computeLineDiff, applySuggestion, replacePassage, applyMultipleSuggestions } from '../src/engine/diff/index.ts';

describe('Diff and Patching Engine', () => {
  it('computes word diff accurately', () => {
    const original = 'The fast brown fox jumps.';
    const modified = 'The quick brown fox leaps.';
    const diff = computeWordDiff(original, modified);

    const removed = diff.filter(d => d.removed).map(d => d.value.trim());
    const added = diff.filter(d => d.added).map(d => d.value.trim());

    expect(removed).toContain('fast');
    expect(removed).toContain('jumps');
    expect(added).toContain('quick');
    expect(added).toContain('leaps');
  });

  it('applies suggestion replace at exact slice', () => {
    const original = 'It had been raining for three days, and the the piers were slick.';
    // "the the" is at index 40..47
    const start = original.indexOf('the the');
    const end = start + 'the the'.length;

    const result = applySuggestion(original, start, end, 'the');
    expect(result).toBe('It had been raining for three days, and the piers were slick.');
  });

  it('replaces isolated passage accurately without altering rest of manuscript', () => {
    const fullText = 'Paragraph one.\n\nHe walked slowly through the dark fog.\n\nParagraph three.';
    const passage = 'He walked slowly through the dark fog.';
    const start = fullText.indexOf(passage);
    const end = start + passage.length;

    const rewrittenPassage = 'He strode deliberately into the choking mist.';
    const result = replacePassage(fullText, start, end, rewrittenPassage);

    expect(result).toBe('Paragraph one.\n\nHe strode deliberately into the choking mist.\n\nParagraph three.');
    expect(result.startsWith('Paragraph one.')).toBe(true);
    expect(result.endsWith('Paragraph three.')).toBe(true);
  });

  it('applies multiple suggestions in descending order without index shifting', () => {
    const text = 'The boy felt sad because the night was very cold and dark.';
    // Suggestion 1: "felt sad" -> "hung his head" (index 8..16)
    // Suggestion 2: "very cold" -> "frigid" (index 39..48)
    const s1 = {
      startIndex: text.indexOf('felt sad'),
      endIndex: text.indexOf('felt sad') + 'felt sad'.length,
      replacementText: 'hung his head',
    };
    const s2 = {
      startIndex: text.indexOf('very cold'),
      endIndex: text.indexOf('very cold') + 'very cold'.length,
      replacementText: 'frigid',
    };

    const patched = applyMultipleSuggestions(text, [s1, s2]);
    expect(patched).toBe('The boy hung his head because the night was frigid and dark.');
  });
});
