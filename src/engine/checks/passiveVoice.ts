import { Suggestion } from '../../types/index.ts';
import { getNlpDoc, CompromiseDoc, getMatchOffsets } from './compromise.ts';

const FALSE_POSITIVES = new Set([
  'red', 'bed', 'feed', 'need', 'seed', 'weed', 'speed',
  'wet', 'glad', 'alive', 'awake', 'well', 'fine', 'ready'
]);

/**
 * Detects passive voice constructions powered by spencermountain/compromise
 * POS tagging and auxiliary-verb structure matching:
 * e.g., "was examined", "were quietly observed", "has been hidden"
 */
export function checkPassiveVoice(
  input: string | CompromiseDoc,
  rawText?: string
): Suggestion[] {
  const doc = getNlpDoc(input);
  const text = typeof input === 'string' ? input : (rawText ?? doc.text());
  const suggestions: Suggestion[] = [];

  // Match auxiliary verb sequence followed by optional adverb and past participle / passive verb
  const matches = doc.match('#Auxiliary+ #Adverb? (#PastTense|#Participle|#Passive)');
  const jsonMatches = matches.json({ offset: true }) as any[];

  for (const m of jsonMatches) {
    if (!m.terms || m.terms.length < 2) continue;

    const lastTerm = m.terms[m.terms.length - 1];
    const normalVerb = (lastTerm.normal || lastTerm.text || '').toLowerCase();

    // Guard against predicate adjectives / non-participles
    if (FALSE_POSITIVES.has(normalVerb)) {
      continue;
    }

    const offsets = getMatchOffsets(m, text);
    if (!offsets) continue;

    const { startIndex, endIndex, matchedText } = offsets;

    suggestions.push({
      id: `pas-${startIndex}-${endIndex}`,
      type: 'passive-voice',
      title: `Passive construction: "${matchedText}"`,
      description: `Using passive voice ("${matchedText}") can weaken narrative momentum. Consider using an active verb.`,
      originalText: matchedText,
      replacementText: matchedText,
      startIndex,
      endIndex,
      ruleCategory: 'style',
      severity: 'info',
    });
  }

  return suggestions;
}
