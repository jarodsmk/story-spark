import nlp from 'compromise';

export type CompromiseDoc = ReturnType<typeof nlp>;

/**
 * Returns a Compromise document. If the input is already a Compromise document,
 * returns it directly to avoid duplicate parsing across check passes.
 * Gracefully handles empty or non-string inputs.
 */
export function getNlpDoc(input?: string | CompromiseDoc | null): CompromiseDoc {
  if (!input) {
    return nlp('');
  }
  if (typeof input === 'string') {
    return nlp(input);
  }
  return input;
}

/**
 * Extracts exact character start and end offsets from a Compromise match item.
 */
export function getMatchOffsets(
  m: any,
  rawText?: string
): { startIndex: number; endIndex: number; matchedText: string } | null {
  if (!m) return null;

  let startIndex: number | undefined;
  let endIndex: number | undefined;

  if (m.terms && m.terms.length > 0) {
    const firstTerm = m.terms[0];
    const lastTerm = m.terms[m.terms.length - 1];

    if (firstTerm.offset && typeof firstTerm.offset.start === 'number') {
      startIndex = firstTerm.offset.start;
    }
    if (
      lastTerm.offset &&
      typeof lastTerm.offset.start === 'number' &&
      typeof lastTerm.offset.length === 'number'
    ) {
      endIndex = lastTerm.offset.start + lastTerm.offset.length;
    }
  }

  if (startIndex === undefined || endIndex === undefined) {
    if (m.offset && typeof m.offset.start === 'number' && typeof m.offset.length === 'number') {
      startIndex = m.offset.start;
      endIndex = startIndex + m.offset.length;
    }
  }

  if (startIndex === undefined || endIndex === undefined || startIndex >= endIndex) {
    return null;
  }

  const matchedText = rawText ? rawText.slice(startIndex, endIndex) : (m.text || '');
  return { startIndex, endIndex, matchedText };
}

export { nlp };
