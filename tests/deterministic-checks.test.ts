import { describe, it, expect } from 'vitest';
import { checkRepeatedWords } from '../src/engine/checks/repeatedWords.ts';
import { checkSentenceLength } from '../src/engine/checks/sentenceLength.ts';
import { checkPassiveVoice } from '../src/engine/checks/passiveVoice.ts';
import { checkTypography } from '../src/engine/checks/typography.ts';
import { runAllChecks, DEFAULT_USER_RULES } from '../src/engine/checks/index.ts';

describe('Deterministic Writing Checks', () => {
  describe('checkRepeatedWords', () => {
    it('detects consecutive duplicated words', () => {
      const text = 'The the old stone piers were slick as slate.';
      const res = checkRepeatedWords(text);
      expect(res.length).toBe(1);
      expect(res[0].type).toBe('repeated-word');
      expect(res[0].originalText).toBe('The the');
      expect(res[0].replacementText).toBe('The');
    });

    it('respects ignored terms whitelist', () => {
      const text = 'He had had enough of cold harbors.';
      const ignored = new Set(['had']);
      const res = checkRepeatedWords(text, ignored);
      expect(res.length).toBe(0);
    });
  });

  describe('checkSentenceLength', () => {
    it('flags sentences that exceed threshold', () => {
      const longSentence = 'The rain poured down in relentless sheets over the ancient rooftops of the forgotten port town, and every wooden shutter groaned beneath the fierce northern gale as midnight approached with deliberate dread.';
      const res = checkSentenceLength(longSentence, 20);
      expect(res.length).toBe(1);
      expect(res[0].type).toBe('sentence-length');
      expect(res[0].title).toContain('Long sentence');
    });

    it('ignores markdown headers and list items', () => {
      const markdown = '# This is a very long heading that has more than ten words and should never be flagged as a run-on fiction sentence';
      const res = checkSentenceLength(markdown, 10);
      expect(res.length).toBe(0);
    });
  });

  describe('checkPassiveVoice', () => {
    it('flags passive voice constructions', () => {
      const text = 'The ancient letter was crumpled in his damp pocket, and he was quietly observed by the spy.';
      const res = checkPassiveVoice(text);
      expect(res.length).toBe(2);
      expect(res[0].type).toBe('passive-voice');
      expect(res[0].originalText.toLowerCase()).toContain('was crumpled');
      expect(res[1].originalText.toLowerCase()).toContain('was quietly observed');
    });

    it('avoids false positives on predicate adjectives', () => {
      const text = 'His face was red and his jacket was wet.';
      const res = checkPassiveVoice(text);
      expect(res.length).toBe(0);
    });
  });

  describe('checkTypography', () => {
    it('detects straight quotes and proposes curly quotes', () => {
      const text = '"Are you waiting for the cutter?"';
      const res = checkTypography(text);
      const quoteIssue = res.find(r => r.id.includes('quotes'));
      expect(quoteIssue).toBeDefined();
      expect(quoteIssue?.replacementText).toBe('“Are you waiting for the cutter?”');
    });

    it('detects triple dots and double hyphens', () => {
      const text = 'He hesitated... then said--nothing.';
      const res = checkTypography(text);
      const ellipsisIssue = res.find(r => r.id.includes('ellipsis'));
      const emDashIssue = res.find(r => r.id.includes('emdash'));

      expect(ellipsisIssue?.replacementText).toBe('…');
      expect(emDashIssue?.replacementText).toBe('—');
    });
  });

  describe('runAllChecks integration', () => {
    it('runs all active rules together and sorts by position', () => {
      const sample = 'The the door was opened...';
      const results = runAllChecks(sample, DEFAULT_USER_RULES, new Set());
      expect(results.length).toBeGreaterThanOrEqual(3);
      expect(results[0].startIndex).toBeLessThanOrEqual(results[1].startIndex);
    });
  });
});
