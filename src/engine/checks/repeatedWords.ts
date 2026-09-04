import { Suggestion } from '../../types/index.ts';

/**
 * Detects immediate repeated words (e.g. "the the", "had had", "in in")
 * and nearby frequency anomalies.
 */
export function checkRepeatedWords(
  text: string,
  ignoredTerms: Set<string> = new Set()
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // Regex for word boundary + duplicate word with optional punctuation/whitespace
  // Matches "word word" or "word, word"
  const regex = /\b([a-zA-Z0-9'-]+)(\s+)(?:[,\s]+)?\1\b/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0];
    const word = match[1];
    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;

    // Skip if ignored or common valid doublets like "had had" if whitelisted
    if (ignoredTerms.has(word.toLowerCase())) {
      continue;
    }

    suggestions.push({
      id: `rep-${startIndex}-${endIndex}`,
      type: 'repeated-word',
      title: `Repeated word: "${word}"`,
      description: `The word "${word}" appears consecutively. Consider removing one instance.`,
      originalText: fullMatch,
      replacementText: word,
      startIndex,
      endIndex,
      ruleCategory: 'grammar',
      severity: 'warning',
    });
  }

  return suggestions;
}
