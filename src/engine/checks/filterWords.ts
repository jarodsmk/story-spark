import { Suggestion } from '../../types/index.ts';
import { getNlpDoc, CompromiseDoc, getMatchOffsets } from './compromise.ts';

interface FilterPattern {
  query: string;
  label: string;
  advice: string;
}

const COMPROMISE_FILTER_PATTERNS: FilterPattern[] = [
  {
    query: '#Pronoun? (could hear|could see|could feel|could smell|could sense)',
    label: 'Sensory filter verb',
    advice: 'Filter phrases like "could hear/see/feel" create psychological distance. Describe the sensory event directly.',
  },
  {
    query: '#Pronoun? (heard|listened as|listened to)',
    label: 'Auditory filter word',
    advice: 'Instead of stating that the character heard the sound, describe the acoustic detail directly in the prose.',
  },
  {
    query: '#Pronoun? (saw|watched as|watched|gazed at)',
    label: 'Visual filter word',
    advice: 'Describing what the character "saw" or "watched" distances the reader. State the visual action directly.',
  },
  {
    query: '#Pronoun? (noticed that|noticed|observed that|observed)',
    label: 'Perception filter word',
    advice: 'Instead of reporting that the character "noticed" something, reveal the detail directly to the reader.',
  },
  {
    query: '#Pronoun? (felt a sudden|felt a wave of|felt the|felt that)',
    label: 'Sensory feeling filter',
    advice: 'Showing visceral physical reactions directly is punchier than telling the reader the character "felt" it.',
  },
  {
    query: '#Pronoun? (realized that|realized|wondered if|wondered whether)',
    label: 'Cognitive filter word',
    advice: 'Internal cognitive markers ("realized", "wondered") can pull readers out of deep immersion.',
  },
  {
    query: '#Pronoun? (decided to)',
    label: 'Decision filter verb',
    advice: 'Instead of "decided to run", have the character directly perform the action ("ran").',
  },
];

/**
 * Detects sensory and cognitive filter words powered by spencermountain/compromise
 * POS and pronoun-verb structure matching.
 */
export function checkFilterWords(
  input: string | CompromiseDoc,
  rawText?: string
): Suggestion[] {
  const doc = getNlpDoc(input);
  const text = typeof input === 'string' ? input : (rawText ?? doc.text());
  const suggestions: Suggestion[] = [];
  const seenSpans = new Set<string>();

  for (const filter of COMPROMISE_FILTER_PATTERNS) {
    const matches = doc.match(filter.query).json({ offset: true }) as any[];

    for (const m of matches) {
      if (!m.terms || m.terms.length === 0) continue;

      const offsets = getMatchOffsets(m, text);
      if (!offsets) continue;

      const { startIndex, endIndex, matchedText } = offsets;
      const spanKey = `${startIndex}-${endIndex}`;

      if (seenSpans.has(spanKey)) continue;
      seenSpans.add(spanKey);

      suggestions.push({
        id: `filter-${startIndex}-${endIndex}`,
        type: 'filter-word',
        title: `Filter verb: "${matchedText}"`,
        description: filter.advice,
        originalText: matchedText,
        replacementText: matchedText,
        startIndex,
        endIndex,
        severity: 'info',
      });
    }
  }

  return suggestions;
}
