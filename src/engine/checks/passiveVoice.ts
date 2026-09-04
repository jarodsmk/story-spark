import { Suggestion } from '../../types/index.ts';

// Common irregular past participles + regular "-ed" forms
const IRREGULAR_PAST_PARTICIPLES = new Set([
  'been', 'done', 'seen', 'made', 'taken', 'known', 'given', 'found', 'told',
  'become', 'shown', 'left', 'felt', 'brought', 'begun', 'kept', 'held', 'written',
  'stood', 'heard', 'let', 'meant', 'set', 'met', 'run', 'paid', 'sat', 'spoken',
  'lost', 'sent', 'built', 'understood', 'drawn', 'broken', 'spent', 'fallen',
  'caught', 'grown', 'driven', 'chosen', 'worn', 'eaten', 'forgotten', 'thrown',
  'hung', 'struck', 'slain', 'hidden', 'ridden', 'stolen', 'shaken', 'bitten'
]);

// Passive auxiliaries: was, were, is, are, been, being, am, be
const PASSIVE_AUXILIARIES = '\\b(am|is|are|was|were|being|been|be)\\b';

/**
 * Detects passive voice constructions: [to be verb] + [optional adverb] + [past participle]
 * e.g., "was examined", "were quietly observed", "been hidden by"
 */
export function checkPassiveVoice(text: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // Regex pattern: auxiliary + (optional adverb ending in ly) + candidate participle
  const pattern = /\b(am|is|are|was|were|being|been|be)\s+(?:([a-zA-Z]+ly)\s+)?([a-zA-Z]+)\b/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const fullMatch = match[0];
    const aux = match[1];
    const adverb = match[2];
    const participleRaw = match[3];
    if (!participleRaw) continue;

    const participle = participleRaw.toLowerCase();

    // Check if participle ends with "ed" or is in the irregular list
    const isPassiveParticiple = participle.endsWith('ed') || IRREGULAR_PAST_PARTICIPLES.has(participle);

    // Filter out common false positives
    const falsePositives = new Set(['red', 'bed', 'feed', 'need', 'seed', 'weed', 'speed']);
    if (falsePositives.has(participle)) {
      continue;
    }

    if (isPassiveParticiple) {
      const startIndex = match.index;
      const endIndex = startIndex + fullMatch.length;

      suggestions.push({
        id: `pas-${startIndex}-${endIndex}`,
        type: 'passive-voice',
        title: `Passive construction: "${fullMatch}"`,
        description: `Using passive voice ("${aux} ${adverb ? adverb + ' ' : ''}${participle}") can weaken narrative momentum. Consider using an active verb.`,
        originalText: fullMatch,
        replacementText: fullMatch,
        startIndex,
        endIndex,
        ruleCategory: 'style',
        severity: 'info',
      });
    }
  }

  return suggestions;
}
