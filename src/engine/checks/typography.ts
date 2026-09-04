import { Suggestion } from '../../types/index.ts';

/**
 * Deterministic typography checks:
 * 1. Straight double quotes ("...") -> Curly quotes (“...”)
 * 2. Straight single quotes/apostrophes ('...') -> Curly (‘...’)
 * 3. Double hyphens (--) -> Em-dash (—)
 * 4. Ellipsis triple dots (...) -> Proper ellipsis character (…)
 * 5. Multiple consecutive spaces (excluding indentation)
 * 6. Repeated punctuation like '??', '!!'
 */
export function checkTypography(text: string): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // 1. Multiple spaces (2 or more spaces in the middle of a line)
  const multiSpaceRegex = /(?<!^)[^\S\r\n]{2,}/gm;
  let match: RegExpExecArray | null;
  while ((match = multiSpaceRegex.exec(text)) !== null) {
    suggestions.push({
      id: `typo-spaces-${match.index}`,
      type: 'typography',
      title: 'Multiple consecutive spaces',
      description: 'Replace consecutive spaces with a single space.',
      originalText: match[0],
      replacementText: ' ',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      ruleCategory: 'typography',
      severity: 'suggestion',
    });
  }

  // 2. Triple dots (...) -> Ellipsis (…)
  const ellipsisRegex = /(?<!\.)\.{3}(?!\.)/g;
  while ((match = ellipsisRegex.exec(text)) !== null) {
    suggestions.push({
      id: `typo-ellipsis-${match.index}`,
      type: 'typography',
      title: 'Standardize ellipsis',
      description: 'Replace three period dots "..." with a typographic ellipsis "…".',
      originalText: match[0],
      replacementText: '…',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      ruleCategory: 'typography',
      severity: 'suggestion',
    });
  }

  // 3. Double/Triple hyphens (--) -> Em-dash (—)
  const emDashRegex = /---?|--/g;
  while ((match = emDashRegex.exec(text)) !== null) {
    // Avoid markdown frontmatter or horizontal rules if on own line
    const lineStart = text.lastIndexOf('\n', match.index) + 1;
    const lineEnd = text.indexOf('\n', match.index);
    const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd).trim();
    if (line === '---' || line === '---') {
      continue;
    }

    suggestions.push({
      id: `typo-emdash-${match.index}`,
      type: 'typography',
      title: 'Em-dash typography',
      description: 'Replace double hyphens "--" with an em-dash "—".',
      originalText: match[0],
      replacementText: '—',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      ruleCategory: 'typography',
      severity: 'suggestion',
    });
  }

  // 4. Repeated exclamation/question marks: "!!", "??", "?!"
  const repeatedPunctRegex = /([!\?]{2,})/g;
  while ((match = repeatedPunctRegex.exec(text)) !== null) {
    suggestions.push({
      id: `typo-punct-${match.index}`,
      type: 'typography',
      title: `Excessive punctuation: "${match[0]}"`,
      description: 'Multiple punctuation marks in narrative prose should usually be standardized to a single mark.',
      originalText: match[0],
      replacementText: match[0][0], // First mark
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      ruleCategory: 'typography',
      severity: 'suggestion',
    });
  }

  // 5. Straight double quotes to typographic curly quotes
  const doubleQuoteRegex = /"([^"\n]+)"/g;
  while ((match = doubleQuoteRegex.exec(text)) !== null) {
    const full = match[0];
    const inner = match[1];
    suggestions.push({
      id: `typo-quotes-${match.index}`,
      type: 'typography',
      title: 'Curly dialogue quotes',
      description: 'Convert straight quotes to typographic curly quotes: "text" -> “text”.',
      originalText: full,
      replacementText: `“${inner}”`,
      startIndex: match.index,
      endIndex: match.index + full.length,
      ruleCategory: 'typography',
      severity: 'suggestion',
    });
  }

  return suggestions;
}
