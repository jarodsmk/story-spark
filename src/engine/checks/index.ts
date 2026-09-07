import { Suggestion, UserRule } from '../../types/index.ts';
import { checkRepeatedWords } from './repeatedWords.ts';
import { checkSentenceLength } from './sentenceLength.ts';
import { checkPassiveVoice } from './passiveVoice.ts';
import { checkTypography } from './typography.ts';
import { checkGrammarConfusions } from './grammarConfusions.ts';
import { checkArticleAgreement } from './articleAgreement.ts';
import { checkFilterWords } from './filterWords.ts';
import { checkWeakWords, checkRedundantAdverbs, checkCliches } from './styleCraft.ts';

export function runAllChecks(
  text: string,
  rules: UserRule[],
  ignoredTerms: Set<string>
): Suggestion[] {
  let suggestions: Suggestion[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    switch (rule.category) {
      case 'repeated-word':
        suggestions.push(...checkRepeatedWords(text, ignoredTerms));
        break;
      case 'sentence-length':
        suggestions.push(...checkSentenceLength(text, rule.threshold || 30));
        break;
      case 'passive-voice':
        suggestions.push(...checkPassiveVoice(text));
        break;
      case 'typography':
        suggestions.push(...checkTypography(text));
        break;
      case 'grammar-confusions':
        suggestions.push(...checkGrammarConfusions(text, ignoredTerms));
        break;
      case 'article-agreement':
        suggestions.push(...checkArticleAgreement(text));
        break;
      case 'filter-words':
        suggestions.push(...checkFilterWords(text));
        break;
      case 'weak-words':
        suggestions.push(...checkWeakWords(text));
        break;
      case 'redundant-adverbs':
        suggestions.push(...checkRedundantAdverbs(text));
        break;
      case 'cliches':
        suggestions.push(...checkCliches(text));
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
