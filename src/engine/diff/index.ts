import { diffWords, diffLines, Change } from 'diff';

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

/**
 * Computes word-level diff between original and modified text.
 */
export function computeWordDiff(original: string, modified: string): DiffPart[] {
  const changes: Change[] = diffWords(original, modified);
  return changes.map(c => ({
    value: c.value,
    added: c.added,
    removed: c.removed,
  }));
}

/**
 * Computes line-level diff between original and modified text.
 */
export function computeLineDiff(original: string, modified: string): DiffPart[] {
  const changes: Change[] = diffLines(original, modified);
  return changes.map(c => ({
    value: c.value,
    added: c.added,
    removed: c.removed,
  }));
}

/**
 * Applies a single suggestion replacement to the target text.
 */
export function applySuggestion(
  text: string,
  startIndex: number,
  endIndex: number,
  replacement: string
): string {
  if (startIndex < 0 || endIndex > text.length || startIndex > endIndex) {
    return text;
  }
  return text.slice(0, startIndex) + replacement + text.slice(endIndex);
}

/**
 * Replaces a selected passage with rewritten text.
 */
export function replacePassage(
  fullText: string,
  selectionStart: number,
  selectionEnd: number,
  newPassage: string
): string {
  if (selectionStart < 0 || selectionEnd > fullText.length || selectionStart > selectionEnd) {
    return fullText;
  }
  return fullText.slice(0, selectionStart) + newPassage + fullText.slice(selectionEnd);
}
