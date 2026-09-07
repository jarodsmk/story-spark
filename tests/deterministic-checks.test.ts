import { describe, it, expect } from 'vitest';
import { checkRepeatedWords } from '../src/engine/checks/repeatedWords.ts';
import { checkSentenceLength } from '../src/engine/checks/sentenceLength.ts';
import { checkPassiveVoice } from '../src/engine/checks/passiveVoice.ts';
import { checkTypography } from '../src/engine/checks/typography.ts';
import { checkGrammarConfusions } from '../src/engine/checks/grammarConfusions.ts';
import { checkArticleAgreement } from '../src/engine/checks/articleAgreement.ts';
import { checkFilterWords } from '../src/engine/checks/filterWords.ts';
import { checkWeakWords, checkRedundantAdverbs, checkCliches } from '../src/engine/checks/styleCraft.ts';
import { runAllChecks, DEFAULT_USER_RULES } from '../src/engine/checks/index.ts';
import { nlp } from '../src/engine/checks/compromise.ts';

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

  describe('checkGrammarConfusions', () => {
    it('detects could of / should of / would of', () => {
      const text = 'He could of spoken up sooner.';
      const res = checkGrammarConfusions(text);
      expect(res.some((r) => r.originalText === 'could of' && r.replacementText === 'could have')).toBe(true);
    });

    it('detects comparative then vs than', () => {
      const text = 'She was faster then the hound.';
      const res = checkGrammarConfusions(text);
      expect(res.some((r) => r.originalText === 'faster then' && r.replacementText === 'faster than')).toBe(true);
    });

    it('detects loose vs lose', () => {
      const text = 'He did not want to loose his temper.';
      const res = checkGrammarConfusions(text);
      expect(res.some((r) => r.originalText.includes('loose his') || r.originalText.includes('to loose'))).toBe(true);
    });

    it('detects its vs it\'s errors', () => {
      const text = 'Its a dangerous journey, but the hound wagged it\'s tail.';
      const res = checkGrammarConfusions(text);
      expect(res.some((r) => r.originalText === 'Its a' && r.replacementText === "It's a")).toBe(true);
      expect(res.some((r) => r.originalText === "it's tail" && r.replacementText === 'its tail')).toBe(true);
    });

    it('detects idioms: bated breath and piqued interest', () => {
      const text = 'They waited with baited breath until the strange artifact peaked his curiosity.';
      const res = checkGrammarConfusions(text);
      expect(res.some((r) => r.originalText === 'baited breath')).toBe(true);
      expect(res.some((r) => r.originalText.includes('peaked his curiosity'))).toBe(true);
    });
  });

  describe('checkArticleAgreement', () => {
    it('detects "a" before vowel sound and "an" before consonant sound', () => {
      const text = 'He found a apple and an sword, and waited a hour at a university.';
      const res = checkArticleAgreement(text);
      expect(res.some((r) => r.originalText === 'a apple' && r.replacementText === 'an apple')).toBe(true);
      expect(res.some((r) => r.originalText === 'an sword' && r.replacementText === 'a sword')).toBe(true);
      expect(res.some((r) => r.originalText === 'a hour' && r.replacementText === 'an hour')).toBe(true);
      // "a university" starts with 'yu' consonant sound - should not flag as error
      expect(res.some((r) => r.originalText === 'a university')).toBe(false);
    });
  });

  describe('checkFilterWords', () => {
    it('detects sensory filtering verbs in narrative prose', () => {
      const text = 'She heard the church bell chime, and he watched as the ship departed.';
      const res = checkFilterWords(text);
      expect(res.length).toBeGreaterThanOrEqual(2);
      expect(res.some((r) => r.type === 'filter-word' && r.originalText.includes('heard'))).toBe(true);
      expect(res.some((r) => r.type === 'filter-word' && r.originalText.includes('watched as'))).toBe(true);
    });
  });

  describe('checkWeakWords, checkRedundantAdverbs, and checkCliches', () => {
    it('detects suddenly and inceptive crutches', () => {
      const text = 'Suddenly the door burst open and he started to run.';
      const res = checkWeakWords(text);
      expect(res.some((r) => r.originalText === 'Suddenly')).toBe(true);
      expect(res.some((r) => r.originalText.includes('started to run'))).toBe(true);
    });

    it('detects redundant body language and adverbs', () => {
      const text = 'She whispered quietly and nodded her head in silence.';
      const res = checkRedundantAdverbs(text);
      expect(res.some((r) => r.originalText === 'whispered quietly' && r.replacementText === 'whispered')).toBe(true);
      expect(res.some((r) => r.originalText === 'nodded her head' && r.replacementText === 'nodded')).toBe(true);
    });

    it('detects overused fiction clichés', () => {
      const text = 'His heart skipped a beat on that dark and stormy night.';
      const res = checkCliches(text);
      expect(res.some((r) => r.originalText === 'heart skipped a beat')).toBe(true);
      expect(res.some((r) => r.originalText === 'dark and stormy')).toBe(true);
    });
  });

  describe('checkTypography', () => {
    it('detects straight quotes and proposes curly quotes', () => {
      const text = '"Are you waiting for the cutter?"';
      const res = checkTypography(text);
      const quoteIssue = res.find((r) => r.id.includes('quotes'));
      expect(quoteIssue).toBeDefined();
      expect(quoteIssue?.replacementText).toBe('“Are you waiting for the cutter?”');
    });

    it('detects triple dots and double hyphens', () => {
      const text = 'He hesitated... then said--nothing.';
      const res = checkTypography(text);
      const ellipsisIssue = res.find((r) => r.id.includes('ellipsis'));
      const emDashIssue = res.find((r) => r.id.includes('emdash'));

      expect(ellipsisIssue?.replacementText).toBe('…');
      expect(emDashIssue?.replacementText).toBe('—');
    });

    it('standardizes contraction apostrophes, spacing, and dialogue punctuation', () => {
      const text = "He don't know .She said \"Stop\".";
      const res = checkTypography(text);
      expect(res.some((r) => r.originalText === "don't" && r.replacementText === 'don’t')).toBe(true);
      expect(res.some((r) => r.originalText === 'know .' && r.replacementText === 'know.')).toBe(true);
      expect(res.some((r) => r.originalText === '"Stop".' && r.replacementText === '"Stop."')).toBe(true);
    });
  });

  describe('runAllChecks integration', () => {
    it('runs all active rules together and sorts by position', () => {
      const sample = 'The the door was opened... Suddenly she heard a apple fall.';
      const results = runAllChecks(sample, DEFAULT_USER_RULES, new Set());
      expect(results.length).toBeGreaterThanOrEqual(4);
      expect(results[0].startIndex).toBeLessThanOrEqual(results[1].startIndex);
    });
  });

  describe('spencermountain/compromise Integration', () => {
    it('accepts both string text and pre-parsed Compromise document', () => {
      const sample = 'The letter was crumpled in his damp pocket.';
      const doc = nlp(sample);
      
      const resFromString = checkPassiveVoice(sample);
      const resFromDoc = checkPassiveVoice(doc, sample);

      expect(resFromString.length).toBe(1);
      expect(resFromDoc.length).toBe(1);
      expect(resFromString[0].originalText).toBe(resFromDoc[0].originalText);
      expect(resFromString[0].startIndex).toBe(resFromDoc[0].startIndex);
    });

    it('correctly maps NLP tag offsets to character coordinates', () => {
      const sample = 'She whispered softly to the night.';
      const res = checkRedundantAdverbs(sample);
      expect(res.length).toBe(1);
      expect(res[0].originalText).toBe('whispered softly');
      expect(sample.slice(res[0].startIndex, res[0].endIndex)).toBe('whispered softly');
    });
  });
});
