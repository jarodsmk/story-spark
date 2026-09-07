import nlp from 'compromise';

export type CompromiseDoc = ReturnType<typeof nlp>;

/**
 * Returns a Compromise document. If the input is already a Compromise document,
 * returns it directly to avoid duplicate parsing across check passes.
 */
export function getNlpDoc(input: string | CompromiseDoc): CompromiseDoc {
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
  if (!m || !m.terms || m.terms.length === 0) {
    if (m?.offset && typeof m.offset.start === 'number' && typeof m.offset.length === 'number') {
      const startIndex = m.offset.start;
      const endIndex = startIndex + m.offset.length;
      const matchedText = rawText ? rawText.slice(startIndex, endIndex) : m.text;
      return { startIndex, endIndex, matchedText };
    }
    return null;
  }

  const firstTerm = m.terms[0];
  const lastTerm = m.terms[m.terms.length - 1];

  if (!firstTerm.offset || !lastTerm.offset) {
    return null;
  }

  const startIndex = firstTerm.offset.start;
  const endIndex = lastTerm.offset.start + lastTerm.offset.length;
  const matchedText = rawText ? rawText.slice(startIndex, endIndex) : m.terms.map((t: any) => t.text).join(' ');

  return { startIndex, endIndex, matchedText };
}

export { nlp };
