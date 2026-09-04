import { Suggestion, UserRule } from '../../types/index.ts';
import { checkRepeatedWords } from './repeatedWords.ts';
import { checkSentenceLength } from './sentenceLength.ts';
import { checkPassiveVoice } from './passiveVoice.ts';
import { checkTypography } from './typography.ts';

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
    }
  }

  // Sort by start index
  return suggestions.sort((a, b) => a.startIndex - b.startIndex);
}

export const DEFAULT_USER_RULES: UserRule[] = [
  {
    id: 'rule-rep-words',
    name: 'Repeated Words',
    category: 'repeated-word',
    enabled: true,
    description: 'Flags accidental consecutive duplicated words.',
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
    id: 'rule-typography',
    name: 'Typography Rules',
    category: 'typography',
    enabled: true,
    description: 'Standardizes straight quotes, dashes, ellipses, and spacing.',
  },
];
