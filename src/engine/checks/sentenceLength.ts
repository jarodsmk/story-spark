import { Suggestion } from '../../types/index.ts';

/**
 * Flags sentences that exceed a configurable word count threshold (default 30 words).
 * Preserves headings and markdown lists without treating them as run-on sentences.
 */
export function checkSentenceLength(
  text: string,
  threshold: number = 30
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // Split on sentence boundaries: '.', '!', '?', or newline
  // We track character indices carefully
  const sentenceRegex = /([^\.\?!;\n]+[\.\?!;]+|[^\.\?!;\n]+$)/g;
  let match: RegExpExecArray | null;

  while ((match = sentenceRegex.exec(text)) !== null) {
    const rawSentence = match[0];
    const trimmed = rawSentence.trim();
    
    // Ignore markdown headings, list markers, blank lines
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('-') || /^\d+\./.test(trimmed)) {
      continue;
    }

    // Calculate word count
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    if (words.length > threshold) {
      const startIndex = match.index + rawSentence.indexOf(trimmed);
      const endIndex = startIndex + trimmed.length;

      suggestions.push({
        id: `len-${startIndex}-${endIndex}`,
        type: 'sentence-length',
        title: `Long sentence (${words.length} words)`,
        description: `This sentence exceeds the target threshold of ${threshold} words. Long sentences can diminish pacing in fiction. Consider splitting into two or more sentences.`,
        originalText: trimmed,
        replacementText: trimmed, // User can rewrite or AI rewrite
        startIndex,
        endIndex,
        ruleCategory: 'style',
        severity: 'warning',
      });
    }
  }

  return suggestions;
}
