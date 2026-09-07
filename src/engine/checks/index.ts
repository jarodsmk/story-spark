import { Suggestion, UserRule } from '../../types/index.ts';
import { getNlpDoc } from './compromise.ts';
import { checkRepeatedWords } from './repeatedWords.ts';
import { checkSentenceLength } from './sentenceLength.ts';
import { checkPassiveVoice } from './passiveVoice.ts';
import { checkTypography } from './typography.ts';
import { checkGrammarConfusions } from './grammarConfusions.ts';
import { checkArticleAgreement } from './articleAgreement.ts';
import { checkFilterWords } from './filterWords.ts';
import { checkWeakWords, checkRedundantAdverbs, checkCliches } from './styleCraft.ts';

export * from './compromise.ts';
export * from './repeatedWords.ts';
export * from './sentenceLength.ts';
export * from './passiveVoice.ts';
export * from './typography.ts';
export * from './grammarConfusions.ts';
export * from './articleAgreement.ts';
export * from './filterWords.ts';
export * from './styleCraft.ts';

/**
 * Runs all enabled deterministic suggestions and editorial passes
 * powered by the spencermountain/compromise NLP engine.
 * Initializes a single Compromise document per run for optimal performance.
 */
export function runAllChecks(
  text: string,
  rules: UserRule[],
  ignoredTerms: Set<string>
): Suggestion[] {
  let suggestions: Suggestion[] = [];

  // Parse text once with Compromise NLP
  const doc = getNlpDoc(text);

  for (const rule of rules) {
    if (!rule.enabled) continue;

    switch (rule.category) {
      case 'repeated-word':
        suggestions.push(...checkRepeatedWords(doc, ignoredTerms, text));
        break;
      case 'sentence-length':
        suggestions.push(...checkSentenceLength(doc, rule.threshold || 30, text));
        break;
      case 'passive-voice':
        suggestions.push(...checkPassiveVoice(doc, text));
        break;
      case 'typography':
        suggestions.push(...checkTypography(doc, text));
        break;
      case 'grammar-confusions':
        suggestions.push(...checkGrammarConfusions(doc, ignoredTerms, text));
        break;
      case 'article-agreement':
        suggestions.push(...checkArticleAgreement(doc, text));
        break;
      case 'filter-words':
        suggestions.push(...checkFilterWords(doc, text));
        break;
      case 'weak-words':
        suggestions.push(...checkWeakWords(doc, text));
        break;
      case 'redundant-adverbs':
        suggestions.push(...checkRedundantAdverbs(doc, text));
        break;
      case 'cliches':
        suggestions.push(...checkCliches(doc, text));
        break;
    }
  }

  // Sort by start index ascending, and prioritize larger spans on tie
  return suggestions.sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex;
    }
    return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
  });
}

export const DEFAULT_USER_RULES: UserRule[] = [
  {
    id: 'rule-rep-words',
    name: 'Repeated Words',
    category: 'repeated-word',
    enabled: true,
    description: 'Flags accidental consecutive duplicate words.',
  },
  {
    id: 'rule-sent-len',
    name: 'Sentence Length',
    category: 'sentence-length',
    enabled: true,
    threshold: 30,
    description: 'Warns when fiction sentences exceed target word count.',
  },
  {
    id: 'rule-passive',
    name: 'Passive Voice',
    category: 'passive-voice',
    enabled: true,
    description: 'Highlights passive verbs that may reduce dramatic tension.',
  },
  {
    id: 'rule-grammar-confusions',
    name: 'Grammar & Homophone Confusions',
    category: 'grammar-confusions',
    enabled: true,
    description: 'Flags confused pairs (could of/have, then/than, loose/lose, its/it\'s, their/there).',
  },
  {
    id: 'rule-article-agreement',
    name: 'Indefinite Article Agreement',
    category: 'article-agreement',
    enabled: true,
    description: 'Ensures correct usage of "a" vs "an" before vowel/consonant sounds.',
  },
  {
    id: 'rule-filter-words',
    name: 'Sensory Filter Words',
    category: 'filter-words',
    enabled: true,
    description: 'Detects perception filter verbs (saw, heard, noticed, felt) that distance readers from deep POV.',
  },
  {
    id: 'rule-weak-words',
    name: 'Pacing & Weak Intensifiers',
    category: 'weak-words',
    enabled: true,
    description: 'Highlights "suddenly", "began to", and crutch adverbs like "very" or "really".',
  },
  {
    id: 'rule-redundant-adverbs',
    name: 'Redundant Modifiers & Tautologies',
    category: 'redundant-adverbs',
    enabled: true,
    description: 'Cuts redundant dialogue and action modifiers (whispered softly, nodded his head).',
  },
  {
    id: 'rule-cliches',
    name: 'Fiction Clichés',
    category: 'cliches',
    enabled: true,
    description: 'Catches worn narrative expressions (cold as ice, dark and stormy, heart in throat).',
  },
  {
    id: 'rule-typography',
    name: 'Typography Standards',
    category: 'typography',
    enabled: true,
    description: 'Standardizes curly quotes, em-dashes, contraction apostrophes, spacing, and dialogue punctuation.',
  },
];
