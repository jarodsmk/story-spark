import { Suggestion } from '../../types/index.ts';

interface ConfusionRule {
  pattern: RegExp;
  title: string;
  description: string;
  replace: (match: RegExpExecArray, text: string) => string;
}

const CONFUSION_RULES: ConfusionRule[] = [
  // 1. "could of", "should of", "would of", etc.
  {
    pattern: /\b(could|should|would|might|must)\s+of\b/gi,
    title: 'Grammar: Misused preposition "of"',
    description: 'Use the auxiliary verb "have" instead of "of".',
    replace: (m) => `${m[1]} have`,
  },
  // 2. then vs than in comparatives
  {
    pattern: /\b(more|better|rather|less|worse|longer|shorter|faster|slower|other|greater|easier|harder|sooner|taller|stronger|further|farther)\s+then\b/gi,
    title: 'Misused "then" in comparison',
    description: 'Use "than" for comparisons. "Then" refers to time or consequence.',
    replace: (m) => `${m[1]} than`,
  },
  // 3. loose vs lose
  {
    pattern: /\b(loose)\s+(his|her|my|your|their|our|its|control|track|sight|face|patience|hope|touch|temper|faith|interest)\b/gi,
    title: 'Confused word: "loose" vs "lose"',
    description: '"Lose" is a verb meaning to misplace or suffer defeat. "Loose" is an adjective meaning not tight.',
    replace: (_m, full) => full.replace(/^loose/i, (w) => w[0] === 'L' ? 'Lose' : 'lose'),
  },
  {
    pattern: /\bto\s+(loose)\b/gi,
    title: 'Confused word: "to loose" vs "to lose"',
    description: 'Did you mean the infinitive verb "to lose"?',
    replace: () => 'to lose',
  },
  // 4. its vs it's (contraction vs possessive)
  {
    pattern: /\b(its)\s+(a|an|the|not|been|too|just|very|hard|easy|clear|likely|unlikely|impossible|obvious)\b/gi,
    title: 'Missing apostrophe in contraction "it\'s"',
    description: 'Use "it\'s" (with an apostrophe) as a contraction for "it is" or "it has".',
    replace: (m) => `${m[1][0] === 'I' ? "It's" : "it's"} ${m[2]}`,
  },
  {
    pattern: /\b(it's)\s+(own|door|eyes|tail|face|edge|weight|sound|surface|name|color|scent|blade|hilt|length|width|height|depth|contents|meaning)\b/gi,
    title: 'Errant apostrophe in possessive "its"',
    description: 'The possessive form of it has no apostrophe ("its"). "It\'s" means "it is".',
    replace: (m) => `${m[1][0] === 'I' ? "Its" : "its"} ${m[2]}`,
  },
  // 5. their vs there vs they're
  {
    pattern: /\b(their)\s+(is|are|was|were|has\s+been|have\s+been|will\s+be|would\s+be|could\s+be|can\s+be)\b/gi,
    title: 'Confused word: "their" vs "there"',
    description: 'Use "there" as an expletive pronoun ("there is/are"). "Their" is possessive.',
    replace: (m, full) => full.replace(/^their/i, (w) => w[0] === 'T' ? 'There' : 'there'),
  },
  {
    pattern: /\b(there|they're)\s+(own|eyes|hands|minds|faces|voices|clothes|weapons|steeds|hearts|thoughts|lives|souls)\b/gi,
    title: 'Confused word: "there/they\'re" vs possessive "their"',
    description: 'Use the possessive pronoun "their" before nouns.',
    replace: (_m, full) => full.replace(/^(there|they're)/i, (w) => w[0] === 'T' ? 'Their' : 'their'),
  },
  // 6. suppose to / use to
  {
    pattern: /\b(was|were|am|is|are|been)\s+suppose\s+to\b/gi,
    title: 'Grammar: "supposed to"',
    description: 'The standard idiom requires the past participle: "supposed to".',
    replace: (m) => `${m[1]} supposed to`,
  },
  {
    pattern: /\b(he|she|they|we|I|you)\s+use\s+to\s+([a-zA-Z]+)\b/gi,
    title: 'Grammar: "used to"',
    description: 'When describing past habit or condition, write "used to".',
    replace: (m) => `${m[1]} used to ${m[2]}`,
  },
  // 7. Idiomatic homophone slips
  {
    pattern: /\bbaited\s+breath\b/gi,
    title: 'Idiom: "bated breath"',
    description: 'The correct phrase is "bated breath" (from "abated", meaning held or shortened breath).',
    replace: (m) => m[0][0] === 'B' ? 'Bated breath' : 'bated breath',
  },
  {
    pattern: /\b(peaked|peeked)\s+(his|her|my|their|your|our|the)\s+(curiosity|interest)\b/gi,
    title: 'Confused idiom: "piqued interest"',
    description: '"Pique" means to stimulate or arouse. Write "piqued interest".',
    replace: (m) => `piqued ${m[2]} ${m[3]}`,
  },
  {
    pattern: /\b(didn't|doesn't|wouldn't|never)\s+phase\b/gi,
    title: 'Confused homophone: "faze"',
    description: '"Faze" means to disturb or disconcert. "Phase" is a stage of development.',
    replace: (m) => `${m[1]} faze`,
  },
  {
    pattern: /\bunphased\b/gi,
    title: 'Confused spelling: "unfazed"',
    description: 'The adjective meaning calm or undisturbed is spelled "unfazed".',
    replace: (m) => m[0][0] === 'U' ? 'Unfazed' : 'unfazed',
  },
  {
    pattern: /\bfree\s+reign\b/gi,
    title: 'Idiom: "free rein"',
    description: 'The expression comes from riding horses and giving slack on the reins ("free rein"), not royal reign.',
    replace: (m) => m[0][0] === 'F' ? 'Free rein' : 'free rein',
  },
  {
    pattern: /\bpour(?:ed|ing)?\s+over\s+(the|a|his|her|their|old)\s+(map|tome|book|pages|notes|scroll|parchment|letters)\b/gi,
    title: 'Confused idiom: "pore over"',
    description: 'To study or read closely is to "pore over", not "pour over".',
    replace: (m) => m[0].replace(/^pour/i, (w) => w.toLowerCase() === 'poured' ? 'pored' : w.toLowerCase() === 'pouring' ? 'poring' : 'pore'),
  },
  {
    pattern: /\b(he|she|they)\s+lead\s+(the\s+way|them|the\s+group|us|the\s+charge)\b/gi,
    title: 'Tense confusion: "led" vs "lead"',
    description: 'In past narrative tense, the past form of the verb to lead is "led".',
    replace: (m) => `${m[1]} led ${m[2]}`,
  },
];

export function checkGrammarConfusions(
  text: string,
  ignoredTerms: Set<string> = new Set()
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const rule of CONFUSION_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + fullMatch.length;

      if (ignoredTerms.has(fullMatch.toLowerCase())) {
        continue;
      }

      const replacementText = rule.replace(match, fullMatch);

      suggestions.push({
        id: `gram-${startIndex}-${endIndex}`,
        type: 'grammar',
        title: rule.title,
        description: rule.description,
        originalText: fullMatch,
        replacementText,
        startIndex,
        endIndex,
        ruleCategory: 'grammar',
        severity: 'warning',
      });
    }
  }

  return suggestions;
}
