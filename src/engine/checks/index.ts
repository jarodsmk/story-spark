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
 * Check runner definition mapping rule IDs to their Compromise check executions.
 */
interface CheckDefinition {
  id: string;
  legacyCategory?: string;
  run: (doc: ReturnType<typeof getNlpDoc>, text: string, rule: UserRule, ignoredTerms: Set<string>) => Suggestion[];
}

const CHECK_DEFINITIONS: CheckDefinition[] = [
  {
    id: 'rule-rep-words',
    legacyCategory: 'repeated-word',
    run: (doc, text, _rule, ignoredTerms) => checkRepeatedWords(doc, ignoredTerms, text),
  },
  {
    id: 'rule-sent-len',
    legacyCategory: 'sentence-length',
    run: (doc, text, rule) => checkSentenceLength(doc, rule.threshold || 30, text),
  },
  {
    id: 'rule-passive',
    legacyCategory: 'passive-voice',
    run: (doc, text) => checkPassiveVoice(doc, text),
  },
  {
    id: 'rule-typography',
    legacyCategory: 'typography',
    run: (doc, text) => checkTypography(doc, text),
  },
  {
    id: 'rule-grammar-confusions',
    legacyCategory: 'grammar-confusions',
    run: (doc, text, _rule, ignoredTerms) => checkGrammarConfusions(doc, ignoredTerms, text),
  },
  {
    id: 'rule-article-agreement',
    legacyCategory: 'article-agreement',
    run: (doc, text) => checkArticleAgreement(doc, text),
  },
  {
    id: 'rule-filter-words',
    legacyCategory: 'filter-words',
    run: (doc, text) => checkFilterWords(doc, text),
  },
  {
    id: 'rule-weak-words',
    legacyCategory: 'weak-words',
    run: (doc, text) => checkWeakWords(doc, text),
  },
  {
    id: 'rule-redundant-adverbs',
    legacyCategory: 'redundant-adverbs',
    run: (doc, text) => checkRedundantAdverbs(doc, text),
  },
  {
    id: 'rule-cliches',
    legacyCategory: 'cliches',
    run: (doc, text) => checkCliches(doc, text),
  },
];

/**
 * Runs all enabled deterministic suggestions and editorial passes
 * powered by the spencermountain/compromise NLP engine.
 * Initializes a single Compromise document per run for fluid, high-performance validation.
 */
export function runAllChecks(
  text: string,
  rules: UserRule[] = DEFAULT_USER_RULES,
  ignoredTerms: Set<string> = new Set()
): Suggestion[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Parse text once into a single Compromise NLP document for fluid validation across all checks
  const doc = getNlpDoc(text);
  const suggestions: Suggestion[] = [];

  // Build lookup maps for fast rule matching
  const rulesById = new Map<string, UserRule>();
  const rulesByLegacyCategory = new Map<string, UserRule>();

  for (const r of rules) {
    if (r.id) rulesById.set(r.id, r);
    if (r.category) rulesByLegacyCategory.set(r.category, r);
  }

  for (const def of CHECK_DEFINITIONS) {
    // Find active rule configuration
    const activeRule = rulesById.get(def.id) || (def.legacyCategory ? rulesByLegacyCategory.get(def.legacyCategory) : undefined);

    // If rules are provided and this rule is explicitly disabled, skip it
    if (activeRule && !activeRule.enabled) {
      continue;
    }

    try {
      const results = def.run(doc, text, activeRule || { id: def.id, name: def.id, enabled: true, description: '' }, ignoredTerms);
      if (results && results.length > 0) {
        suggestions.push(...results);
      }
    } catch (err) {
      console.error(`Validation check failed for [${def.id}]:`, err);
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
    enabled: true,
    description: 'Flags accidental consecutive duplicate words.',
  },
  {
    id: 'rule-sent-len',
    name: 'Sentence Length',
    enabled: true,
    threshold: 30,
    description: 'Warns when fiction sentences exceed target word count.',
  },
  {
    id: 'rule-passive',
    name: 'Passive Voice',
    enabled: true,
    description: 'Highlights passive verbs that may reduce dramatic tension.',
  },
  {
    id: 'rule-grammar-confusions',
    name: 'Grammar & Homophone Confusions',
    enabled: true,
    description: 'Flags confused pairs (could of/have, then/than, loose/lose, its/it\'s, their/there).',
  },
  {
    id: 'rule-article-agreement',
    name: 'Indefinite Article Agreement',
    enabled: true,
    description: 'Ensures correct usage of "a" vs "an" before vowel/consonant sounds.',
  },
  {
    id: 'rule-filter-words',
    name: 'Sensory Filter Words',
    enabled: true,
    description: 'Detects perception filter verbs (saw, heard, noticed, felt) that distance readers from deep POV.',
  },
  {
    id: 'rule-weak-words',
    name: 'Pacing & Weak Intensifiers',
    enabled: true,
    description: 'Highlights "suddenly", "began to", and crutch adverbs like "very" or "really".',
  },
  {
    id: 'rule-redundant-adverbs',
    name: 'Redundant Modifiers & Tautologies',
    enabled: true,
    description: 'Cuts redundant dialogue and action modifiers (whispered softly, nodded his head).',
  },
  {
    id: 'rule-cliches',
    name: 'Fiction Clichés',
    enabled: true,
    description: 'Catches worn narrative expressions (cold as ice, dark and stormy, heart in throat).',
  },
  {
    id: 'rule-typography',
    name: 'Typography Standards',
    enabled: true,
    description: 'Standardizes curly quotes, em-dashes, contraction apostrophes, spacing, and dialogue punctuation.',
  },
];
