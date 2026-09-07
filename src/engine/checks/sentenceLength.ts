import { Suggestion } from '../../types/index.ts';
import { getNlpDoc, CompromiseDoc } from './compromise.ts';

/**
 * Flags sentences that exceed a configurable word count threshold (default 30 words)
 * using spencermountain/compromise sentence segmentation and term parsing.
 * Preserves headings and markdown lists without treating them as run-on sentences.
 */
export function checkSentenceLength(
  input: string | CompromiseDoc,
  threshold: number = 30,
  rawText?: string
): Suggestion[] {
  const doc = getNlpDoc(input);
  const text = typeof input === 'string' ? input : (rawText ?? doc.text());
  const suggestions: Suggestion[] = [];

  const sentences = doc.sentences();
  sentences.forEach((s) => {
    const sJson = (s.json({ offset: true }) as any[])[0];
    if (!sJson || !sJson.offset) return;

    const raw = s.text();
    const trimmed = raw.trim();

    // Ignore markdown headings, list markers, blank lines
    if (
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('-') ||
      /^\d+\./.test(trimmed)
    ) {
      return;
    }

    const words = s.terms();
    const wordCount = words.length;

    if (wordCount > threshold) {
      const leadWsMatch = raw.match(/^\s*/);
      const leadWs = leadWsMatch ? leadWsMatch[0].length : 0;
      const trailWsMatch = raw.match(/\s*$/);
      const trailWs = trailWsMatch ? trailWsMatch[0].length : 0;

      const startIndex = sJson.offset.start + leadWs;
      const endIndex = sJson.offset.start + raw.length - trailWs;
      const originalText = text.slice(startIndex, endIndex);

      suggestions.push({
        id: `len-${startIndex}-${endIndex}`,
        type: 'sentence-length',
        title: `Long sentence (${wordCount} words)`,
        description: `This sentence exceeds the target threshold of ${threshold} words. Long sentences can diminish pacing in fiction. Consider splitting into two or more sentences.`,
        originalText,
        replacementText: originalText,
        startIndex,
        endIndex,
        severity: 'warning',
      });
    }
  });

  return suggestions;
}
