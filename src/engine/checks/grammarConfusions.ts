import { Suggestion } from '../../types/index.ts';
import { getNlpDoc, CompromiseDoc, getMatchOffsets } from './compromise.ts';

interface CompromiseGrammarRule {
  query: string;
  title: string;
  description: string;
  replace: (matchedText: string, terms: any[]) => string;
}

const COMPROMISE_GRAMMAR_RULES: CompromiseGrammarRule[] = [
  // 1. "could of", "should of", "would of", etc.
  {
    query: '(could|should|would|might|must) of',
    title: 'Grammar: Misused preposition "of"',
    description: 'Use the auxiliary verb "have" instead of "of".',
    replace: (_full, terms) => `${terms[0].text} have`,
  },
  // 2. then vs than in comparatives
  {
    query: '(#Comparative|more|better|rather|less|worse|longer|shorter|faster|slower|other|greater|easier|harder|sooner|taller|stronger|further|farther) then',
    title: 'Misused "then" in comparison',
    description: 'Use "than" for comparisons. "Then" refers to time or consequence.',
    replace: (_full, terms) => `${terms[0].text} than`,
  },
  // 3. loose vs lose
  {
    query: 'loose (his|her|my|your|their|our|its|control|track|sight|face|patience|hope|touch|temper|faith|interest)',
    title: 'Confused word: "loose" vs "lose"',
    description: '"Lose" is a verb meaning to misplace or suffer defeat. "Loose" is an adjective meaning not tight.',
    replace: (full) => full.replace(/^loose/i, (w) => (w[0] === 'L' ? 'Lose' : 'lose')),
  },
  {
    query: 'to loose',
    title: 'Confused word: "to loose" vs "to lose"',
    description: 'Did you mean the infinitive verb "to lose"?',
    replace: () => 'to lose',
  },
  // 4. its vs it's (contraction vs possessive)
  {
    query: 'its (a|an|the|not|been|too|just|very|hard|easy|clear|likely|unlikely|impossible|obvious|dangerous)',
    title: 'Missing apostrophe in contraction "it\'s"',
    description: 'Use "it\'s" (with an apostrophe) as a contraction for "it is" or "it has".',
    replace: (full) => full.replace(/^its/i, (w) => (w[0] === 'I' ? "It's" : "it's")),
  },
  {
    query: "it's (own|door|eyes|tail|face|edge|weight|sound|surface|name|color|scent|blade|hilt|length|width|height|depth|contents|meaning)",
    title: 'Errant apostrophe in possessive "its"',
    description: 'The possessive form of it has no apostrophe ("its"). "It\'s" means "it is".',
    replace: (full) => full.replace(/^it's/i, (w) => (w[0] === 'I' ? 'Its' : 'its')),
  },
  // 5. their vs there vs they're
  {
    query: 'their (is|are|was|were|has been|have been|will be|would be|could be|can be)',
    title: 'Confused word: "their" vs "there"',
    description: 'Use "there" as an expletive pronoun ("there is/are"). "Their" is possessive.',
    replace: (full) => full.replace(/^their/i, (w) => (w[0] === 'T' ? 'There' : 'there')),
  },
  {
    query: "(there|they're) (own|eyes|hands|minds|faces|voices|clothes|weapons|steeds|hearts|thoughts|lives|souls)",
    title: 'Confused word: "there/they\'re" vs possessive "their"',
    description: 'Use the possessive pronoun "their" before nouns.',
    replace: (full) => full.replace(/^(there|they're)/i, (w) => (w[0] === 'T' ? 'Their' : 'their')),
  },
  // 6. suppose to / use to
  {
    query: '(was|were|am|is|are|been) suppose to',
    title: 'Grammar: "supposed to"',
    description: 'The standard idiom requires the past participle: "supposed to".',
    replace: (_full, terms) => `${terms[0].text} supposed to`,
  },
  {
    query: '(he|she|they|we|I|you) use to #Verb',
    title: 'Grammar: "used to"',
    description: 'When describing past habit or condition, write "used to".',
    replace: (_full, terms) => `${terms[0].text} used to ${terms.slice(2).map((t) => t.text).join(' ')}`,
  },
  // 7. Idiomatic homophone slips
  {
    query: 'baited breath',
    title: 'Idiom: "bated breath"',
    description: 'The correct phrase is "bated breath" (from "abated", meaning held or shortened breath).',
    replace: (full) => (full[0] === 'B' ? 'Bated breath' : 'bated breath'),
  },
  {
    query: '(peaked|peeked) (his|her|my|their|your|our|the) (curiosity|interest)',
    title: 'Confused idiom: "piqued interest"',
    description: '"Pique" means to stimulate or arouse. Write "piqued interest".',
    replace: (_full, terms) => `piqued ${terms[1].text} ${terms[2].text}`,
  },
  {
    query: "(didn't|doesn't|wouldn't|never) phase",
    title: 'Confused homophone: "faze"',
    description: '"Faze" means to disturb or disconcert. "Phase" is a stage of development.',
    replace: (_full, terms) => `${terms[0].text} faze`,
  },
  {
    query: 'unphased',
    title: 'Confused spelling: "unfazed"',
    description: 'The adjective meaning calm or undisturbed is spelled "unfazed".',
    replace: (full) => (full[0] === 'U' ? 'Unfazed' : 'unfazed'),
  },
  {
    query: 'free reign',
    title: 'Idiom: "free rein"',
    description: 'The expression comes from giving slack on horse reins ("free rein"), not royal reign.',
    replace: (full) => (full[0] === 'F' ? 'Free rein' : 'free rein'),
  },
  {
    query: 'pour(ed|ing)? over (the|a|his|her|their|old) (map|tome|book|pages|notes|scroll|parchment|letters)',
    title: 'Confused idiom: "pore over"',
    description: 'To study or read closely is to "pore over", not "pour over".',
    replace: (full) =>
      full.replace(/^pour/i, (w) => {
        const lower = w.toLowerCase();
        if (lower === 'poured') return 'pored';
        if (lower === 'pouring') return 'poring';
        return 'pore';
      }),
  },
  {
    query: '(he|she|they) lead (the way|them|the group|us|the charge)',
    title: 'Tense confusion: "led" vs "lead"',
    description: 'In past narrative tense, the past form of the verb to lead is "led".',
    replace: (_full, terms) => `${terms[0].text} led ${terms.slice(2).map((t) => t.text).join(' ')}`,
  },
];

/**
 * Flags grammar and homophone confusions powered by spencermountain/compromise pattern queries.
 */
export function checkGrammarConfusions(
  input: string | CompromiseDoc,
  ignoredTerms: Set<string> = new Set(),
  rawText?: string
): Suggestion[] {
  const doc = getNlpDoc(input);
  const text = typeof input === 'string' ? input : (rawText ?? doc.text());
  const suggestions: Suggestion[] = [];
  const seenSpans = new Set<string>();

  for (const rule of COMPROMISE_GRAMMAR_RULES) {
    const matches = doc.match(rule.query).json({ offset: true }) as any[];

    for (const m of matches) {
      if (!m.terms || m.terms.length === 0) continue;

      const offsets = getMatchOffsets(m, text);
      if (!offsets) continue;

      const { startIndex, endIndex, matchedText } = offsets;
      const spanKey = `${startIndex}-${endIndex}`;

      if (seenSpans.has(spanKey)) continue;

      if (ignoredTerms.has(matchedText.toLowerCase())) {
        continue;
      }

      seenSpans.add(spanKey);
      const replacementText = rule.replace(matchedText, m.terms);

      suggestions.push({
        id: `gram-${startIndex}-${endIndex}`,
        type: 'grammar',
        title: rule.title,
        description: rule.description,
        originalText: matchedText,
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
