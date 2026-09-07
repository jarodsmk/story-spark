import { Suggestion } from '../../types/index.ts';
import { getNlpDoc, CompromiseDoc } from './compromise.ts';

/**
 * Detects immediate repeated words (e.g. "the the", "had had", "in in")
 * powered by spencermountain/compromise tokenization and normalized terms.
 */
export function checkRepeatedWords(
  input: string | CompromiseDoc,
  ignoredTerms: Set<string> = new Set(),
  rawText?: string
): Suggestion[] {
  const doc = getNlpDoc(input);
  const text = typeof input === 'string' ? input : (rawText ?? doc.text());
  const suggestions: Suggestion[] = [];

  const sentences = doc.json({ offset: true }) as any[];
  for (const s of sentences) {
    if (!s.terms || s.terms.length < 2) continue;

    for (let i = 0; i < s.terms.length - 1; i++) {
      const t1 = s.terms[i];
      const t2 = s.terms[i + 1];

      if (!t1.normal || !t2.normal) continue;

      // Check if normalized word stems match (ignoring case & trailing punctuation)
      if (t1.normal.toLowerCase() === t2.normal.toLowerCase()) {
        const wordLower = t1.normal.toLowerCase();

        // Skip if whitelisted in ignored terms
        if (ignoredTerms.has(wordLower)) {
          continue;
        }

        const startIndex = t1.offset.start;
        const endIndex = t2.offset.start + t2.offset.length;
        const fullMatch = text.slice(startIndex, endIndex);

        suggestions.push({
          id: `rep-${startIndex}-${endIndex}`,
          type: 'repeated-word',
          title: `Repeated word: "${t1.text}"`,
          description: `The word "${t1.text}" appears consecutively. Consider removing one instance.`,
          originalText: fullMatch,
          replacementText: t1.text,
          startIndex,
          endIndex,
          severity: 'warning',
        });
      }
    }
  }

  return suggestions;
}
