import { Suggestion } from '../../types/index.ts';
import { getNlpDoc, CompromiseDoc } from './compromise.ts';

/**
 * Deterministic typography checks powered by spencermountain/compromise:
 * 1. Multiple consecutive spaces
 * 2. Standardize ellipses: "..." -> "…"
 * 3. Standardize em-dashes: "--" or "---" -> "—"
 * 4. Excessive punctuation: "??", "!!" -> single mark
 * 5. Straight double quotes -> Curly double quotes “...”
 * 6. Contraction straight apostrophes -> Typographic curly apostrophe ’ (e.g. don't -> don’t)
 * 7. Space before punctuation (e.g. "word ," -> "word,")
 * 8. Missing space after sentence punctuation (e.g. "sentence.Next" -> "sentence. Next")
 * 9. Dialogue punctuation placement: period/comma outside closing quote (e.g. "hello". -> "hello.")
 * 10. En-dash for number/year ranges: "1990-1995" -> "1990–1995"
 */
export function checkTypography(
  input: string | CompromiseDoc,
  rawText?: string
): Suggestion[] {
  const doc = getNlpDoc(input);
  const text = typeof input === 'string' ? input : (rawText ?? doc.text());
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
      severity: 'suggestion',
    });
  }

  // 3. Double/Triple hyphens (--) -> Em-dash (—)
  const emDashRegex = /---?|--/g;
  while ((match = emDashRegex.exec(text)) !== null) {
    const lineStart = text.lastIndexOf('\n', match.index) + 1;
    const lineEnd = text.indexOf('\n', match.index);
    const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd).trim();
    if (line === '---' || line === '----') {
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
      replacementText: match[0][0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
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
      severity: 'suggestion',
    });
  }

  // 6. Contraction straight apostrophes -> Typographic curly apostrophe (’)
  const contractionRegex = /\b([a-zA-Z]+)'([a-zA-Z]+)\b/g;
  while ((match = contractionRegex.exec(text)) !== null) {
    const full = match[0];
    const replacement = `${match[1]}’${match[2]}`;
    suggestions.push({
      id: `typo-apostrophe-${match.index}`,
      type: 'typography',
      title: 'Curly contraction apostrophe',
      description: `Standardize straight apostrophe in "${full}" to typographic curly apostrophe "${replacement}".`,
      originalText: full,
      replacementText: replacement,
      startIndex: match.index,
      endIndex: match.index + full.length,
      severity: 'suggestion',
    });
  }

  // 7. Errant space before punctuation mark: "word ," or "sentence ."
  const spaceBeforePunctRegex = /\b([a-zA-Z0-9]+)\s+([,.:;?!])/g;
  while ((match = spaceBeforePunctRegex.exec(text)) !== null) {
    const full = match[0];
    const word = match[1];
    const punct = match[2];
    suggestions.push({
      id: `typo-space-before-${match.index}`,
      type: 'typography',
      title: `Unwanted space before "${punct}"`,
      description: `Remove the space before the punctuation mark.`,
      originalText: full,
      replacementText: `${word}${punct}`,
      startIndex: match.index,
      endIndex: match.index + full.length,
      severity: 'suggestion',
    });
  }

  // 8. Missing space after sentence punctuation (e.g. "word.Another")
  const missingSpaceRegex = /([a-zA-Z]{2,})([.?!])([A-Z][a-zA-Z]+)/g;
  while ((match = missingSpaceRegex.exec(text)) !== null) {
    const full = match[0];
    const firstWord = match[1];
    const punct = match[2];
    const secondWord = match[3];
    suggestions.push({
      id: `typo-space-after-${match.index}`,
      type: 'typography',
      title: 'Missing space after punctuation',
      description: 'Insert a space after the sentence-ending punctuation.',
      originalText: full,
      replacementText: `${firstWord}${punct} ${secondWord}`,
      startIndex: match.index,
      endIndex: match.index + full.length,
      severity: 'suggestion',
    });
  }

  // 9. Punctuation placed outside closing quotation mark: "word". or "word",
  const punctOutsideQuoteRegex = /"([^"\n]+)"([,.])/g;
  while ((match = punctOutsideQuoteRegex.exec(text)) !== null) {
    const full = match[0];
    const dialogue = match[1];
    const punct = match[2];
    suggestions.push({
      id: `typo-quote-punct-${match.index}`,
      type: 'typography',
      title: 'Dialogue punctuation placement',
      description: 'Standard fiction typography places periods and commas inside closing quotation marks.',
      originalText: full,
      replacementText: `"${dialogue}${punct}"`,
      startIndex: match.index,
      endIndex: match.index + full.length,
      severity: 'suggestion',
    });
  }

  // 10. En-dash for number/year ranges: "1990-1995" -> "1990–1995"
  const numberRangeRegex = /\b(\d{2,4})\s*-\s*(\d{2,4})\b/g;
  while ((match = numberRangeRegex.exec(text)) !== null) {
    const full = match[0];
    const startNum = match[1];
    const endNum = match[2];
    suggestions.push({
      id: `typo-endash-${match.index}`,
      type: 'typography',
      title: 'Number range en-dash',
      description: 'Use an en-dash (–) rather than a hyphen (-) for date or numerical ranges.',
      originalText: full,
      replacementText: `${startNum}–${endNum}`,
      startIndex: match.index,
      endIndex: match.index + full.length,
      severity: 'suggestion',
    });
  }

  return suggestions;
}
