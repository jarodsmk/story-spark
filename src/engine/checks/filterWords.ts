import { Suggestion } from '../../types/index.ts';

interface FilterPattern {
  pattern: RegExp;
  label: string;
  advice: string;
}

const FILTER_PATTERNS: FilterPattern[] = [
  {
    pattern: /\b(he|she|they|I|we)\s+(could\s+hear|could\s+see|could\s+feel|could\s+smell|could\s+sense)\b/gi,
    label: 'Sensory filter verb',
    advice: 'Filter phrases like "could hear/see/feel" create psychological distance. Describe the sensory event directly.',
  },
  {
    pattern: /\b(he|she|they|I|we)\s+(heard|listened\s+as|listened\s+to)\b/gi,
    label: 'Auditory filter word',
    advice: 'Instead of stating that the character heard the sound, describe the acoustic detail directly in the prose.',
  },
  {
    pattern: /\b(he|she|they|I|we)\s+(saw|watched\s+as|watched|gazed\s+at)\b/gi,
    label: 'Visual filter word',
    advice: 'Describing what the character "saw" or "watched" distances the reader. State the visual action directly.',
  },
  {
    pattern: /\b(he|she|they|I|we)\s+(noticed\s+that|noticed|observed\s+that|observed)\b/gi,
    label: 'Perception filter word',
    advice: 'Instead of reporting that the character "noticed" something, reveal the detail directly to the reader.',
  },
  {
    pattern: /\b(he|she|they|I|we)\s+(felt\s+a\s+sudden|felt\s+a\s+wave\s+of|felt\s+the|felt\s+that)\b/gi,
    label: 'Sensory feeling filter',
    advice: 'Showing visceral physical reactions directly is punchier than telling the reader the character "felt" it.',
  },
  {
    pattern: /\b(he|she|they|I|we)\s+(realized\s+that|realized|wondered\s+if|wondered\s+whether)\b/gi,
    label: 'Cognitive filter word',
    advice: 'Internal cognitive markers ("realized", "wondered") can pull readers out of deep immersion.',
  },
  {
    pattern: /\b(he|she|they|I|we)\s+(decided\s+to)\b/gi,
    label: 'Decision filter verb',
    advice: 'Instead of "decided to run", have the character directly perform the action ("ran").',
  },
];

export function checkFilterWords(text: string): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const filter of FILTER_PATTERNS) {
    const regex = new RegExp(filter.pattern.source, filter.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + fullMatch.length;

      suggestions.push({
        id: `filter-${startIndex}-${endIndex}`,
        type: 'filter-word',
        title: `Filter verb: "${fullMatch}"`,
        description: filter.advice,
        originalText: fullMatch,
        replacementText: fullMatch, // Educational suggestion (requires narrative restructuring)
        startIndex,
        endIndex,
        ruleCategory: 'style',
        severity: 'info',
      });
    }
  }

  return suggestions;
}
