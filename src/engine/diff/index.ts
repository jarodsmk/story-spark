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
 * Accepts either (text, startIndex, endIndex, replacement) or (text, suggestionObj).
 */
export function applySuggestion(
  text: string,
  startIndexOrSuggestion: number | { startIndex: number; endIndex: number; replacementText: string },
  endIndex?: number,
  replacement?: string
): string {
  let start: number;
  let end: number;
  let rep: string;

  if (typeof startIndexOrSuggestion === 'object') {
    start = startIndexOrSuggestion.startIndex;
    end = startIndexOrSuggestion.endIndex;
    rep = startIndexOrSuggestion.replacementText;
  } else {
    start = startIndexOrSuggestion;
    end = endIndex ?? startIndexOrSuggestion;
    rep = replacement ?? '';
  }

  if (start < 0 || end > text.length || start > end) {
    return text;
  }
  return text.slice(0, start) + rep + text.slice(end);
}

/**
 * Applies multiple suggestions in descending order of startIndex
 * to prevent index displacement.
 */
export function applyMultipleSuggestions(
  text: string,
  suggestions: Array<{ startIndex: number; endIndex: number; replacementText: string }>
): string {
  // Sort descending by startIndex
  const sorted = [...suggestions].sort((a, b) => b.startIndex - a.startIndex);
  let current = text;
  for (const s of sorted) {
    current = applySuggestion(current, s.startIndex, s.endIndex, s.replacementText);
  }
  return current;
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
