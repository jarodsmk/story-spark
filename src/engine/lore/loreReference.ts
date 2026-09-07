import { sanitizeFilename } from '../markdown/index.ts';

export interface LoreEntry {
  id: string; // e.g. 'bible/characters/kaelen.md' or 'scratchpad/magic-system.md'
  path: string; // full relative path
  filename: string; // 'kaelen.md'
  name: string; // 'Kaelen Vance'
  category: 'character' | 'world' | 'lore' | 'idea';
  summary: string; // concise summary for tooltip
  attributes: Record<string, string>; // parsed attributes e.g. { Role: '...', Appearance: '...', Status: '...' }
  rawContent: string;
}

export interface LoreReferenceMatch {
  raw: string; // e.g. '[Kaelen](bible/characters/kaelen.md)'
  anchorText: string; // 'Kaelen'
  targetPath: string; // 'bible/characters/kaelen.md'
  startIndex: number;
  endIndex: number;
  entry?: LoreEntry;
}

/**
 * Parses a character or world/lore markdown file into a structured LoreEntry.
 */
export function parseLoreMarkdown(path: string, content: string): LoreEntry {
  const normalizedPath = path.replace(/\\/g, '/');
  const filename = normalizedPath.split('/').pop() || path;

  // Determine category from path
  let category: 'character' | 'world' | 'lore' | 'idea' = 'lore';
  if (normalizedPath.includes('characters')) {
    category = 'character';
  } else if (normalizedPath.includes('scratchpad') || normalizedPath.includes('ideas')) {
    category = 'idea';
  } else if (normalizedPath.includes('world') || normalizedPath.includes('locations')) {
    category = 'world';
  }

  // Derive title/name
  let name = filename.replace(/\.(md|markdown|txt)$/i, '').replace(/[-_]/g, ' ');
  name = name.charAt(0).toUpperCase() + name.slice(1);

  const lines = content.split('\n');
  const attributes: Record<string, string> = {};
  const descriptionLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check for Markdown H1: # Character: Name or # World: Name or # Idea: Name or # Name
    if (line.startsWith('#')) {
      const headingMatch = line.replace(/^#+\s*/, '');
      const cleanHeading = headingMatch.replace(/^(character|world|lore|location|idea|scratchpad):\s*/i, '').trim();
      if (cleanHeading) {
        name = cleanHeading;
      }
      continue;
    }

    // Check for bullet attributes: - **Key**: Value or * Key: Value
    const attrMatch = line.match(/^[-*]\s*(?:\*\*)?([A-Za-z0-9_\s]+)(?:\*\*)?:\s*(.+)$/);
    if (attrMatch) {
      const key = attrMatch[1].trim();
      const val = attrMatch[2].trim();
      attributes[key] = val;
      continue;
    }

    // Regular description paragraph
    if (!line.startsWith('-') && !line.startsWith('*') && !line.startsWith('>')) {
      descriptionLines.push(line);
    }
  }

  // Compose concise summary for tooltip display
  let summary = '';
  if (attributes['Role']) {
    summary += `Role: ${attributes['Role']}`;
  } else if (attributes['Atmosphere']) {
    summary += `Atmosphere: ${attributes['Atmosphere']}`;
  } else if (attributes['Status']) {
    summary += `Status: ${attributes['Status']}`;
  } else if (attributes['Type']) {
    summary += `Type: ${attributes['Type']}`;
  }

  if (attributes['Tags']) {
    summary += summary ? ` • Tags: ${attributes['Tags']}` : `Tags: ${attributes['Tags']}`;
  }
  if (attributes['Appearance']) {
    summary += summary ? ` • ${attributes['Appearance']}` : attributes['Appearance'];
  } else if (attributes['Goal']) {
    summary += summary ? ` • Goal: ${attributes['Goal']}` : `Goal: ${attributes['Goal']}`;
  } else if (attributes['Summary']) {
    summary += summary ? ` • ${attributes['Summary']}` : attributes['Summary'];
  } else if (attributes['Significance']) {
    summary += summary ? ` • ${attributes['Significance']}` : attributes['Significance'];
  }

  if (!summary && descriptionLines.length > 0) {
    summary = descriptionLines.slice(0, 2).join(' ');
  }

  if (!summary) {
    summary = category === 'idea'
      ? 'Ad-hoc idea stored in Scratchpad.'
      : `${category === 'character' ? 'Character' : 'Lore'} entry in Story Bible.`;
  }

  return {
    id: normalizedPath,
    path: normalizedPath,
    filename,
    name,
    category,
    summary,
    attributes,
    rawContent: content,
  };
}

/**
 * Normalizes an entry path or reference target for fuzzy/relative comparison.
 */
export function normalizeLorePath(p: string): string {
  return p
    .replace(/\\/g, '/')
    .replace(/^lore:\/?\/?/i, '')
    .replace(/^character:\/?\/?/i, '')
    .replace(/^idea:\/?\/?/i, '')
    .replace(/^scratchpad:\/?\/?/i, '')
    .replace(/^@/, '')
    .toLowerCase()
    .trim();
}

/**
 * Finds a matching LoreEntry for a given target path or identifier.
 */
export function findMatchingLoreEntry(
  target: string,
  entries: LoreEntry[] | Map<string, LoreEntry>
): LoreEntry | undefined {
  const entryList = entries instanceof Map ? Array.from(entries.values()) : entries;
  const normTarget = normalizeLorePath(target);
  const targetBase = normTarget.split('/').pop()?.replace(/\.(md|markdown)$/i, '') || normTarget;

  // 1. Exact path match
  const exact = entryList.find(e => normalizeLorePath(e.path) === normTarget);
  if (exact) return exact;

  // 2. Relative path end match (e.g. "bible/characters/kaelen.md" matching "novels/id/bible/characters/kaelen.md")
  const subPath = entryList.find(e => {
    const eNorm = normalizeLorePath(e.path);
    return eNorm.endsWith(normTarget) || normTarget.endsWith(eNorm);
  });
  if (subPath) return subPath;

  // 3. Filename / slug match
  const byFilename = entryList.find(e => {
    const eBase = e.filename.replace(/\.(md|markdown)$/i, '').toLowerCase();
    return eBase === targetBase;
  });
  if (byFilename) return byFilename;

  // 4. Name match (case-insensitive)
  const byName = entryList.find(e => e.name.toLowerCase() === targetBase.replace(/[-_]/g, ' '));
  if (byName) return byName;

  return undefined;
}

/**
 * Scans markdown manuscript text for character and lore references.
 * Supports:
 * - Standard Markdown links: [Anchor Text](bible/... or lore:... or character:... or @... or file.md)
 * - Wiki links: [[Target]] or [[Target|Anchor Text]]
 */
export function findLoreReferences(
  text: string,
  entries: LoreEntry[] | Map<string, LoreEntry> = []
): LoreReferenceMatch[] {
  const matches: LoreReferenceMatch[] = [];
  if (!text) return matches;

  const entryList = entries instanceof Map ? Array.from(entries.values()) : entries;

  // 1. Standard Markdown links: [text](target)
  const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = mdLinkRegex.exec(text)) !== null) {
    const raw = match[0];
    const anchorText = match[1];
    const targetPath = match[2].trim();
    const startIndex = match.index;
    const endIndex = startIndex + raw.length;

    // Determine if this target points to lore/character/scratchpad
    const isExplicitLore =
      targetPath.includes('bible/') ||
      targetPath.includes('scratchpad/') ||
      targetPath.includes('ideas/') ||
      targetPath.startsWith('lore:') ||
      targetPath.startsWith('character:') ||
      targetPath.startsWith('idea:') ||
      targetPath.startsWith('scratchpad:') ||
      targetPath.startsWith('@') ||
      targetPath.includes('/characters/') ||
      targetPath.includes('/world/') ||
      targetPath.includes('/lore/') ||
      targetPath.includes('/scratchpad/');

    const matchedEntry = findMatchingLoreEntry(targetPath, entryList);

    if (isExplicitLore || matchedEntry) {
      matches.push({
        raw,
        anchorText,
        targetPath,
        startIndex,
        endIndex,
        entry: matchedEntry,
      });
    }
  }

  // 2. Wiki-links: [[target]] or [[target|anchorText]]
  const wikiRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  while ((match = wikiRegex.exec(text)) !== null) {
    const raw = match[0];
    const targetPath = match[1].trim();
    const anchorText = (match[2] || match[1]).trim();
    const startIndex = match.index;
    const endIndex = startIndex + raw.length;

    const matchedEntry = findMatchingLoreEntry(targetPath, entryList);
    matches.push({
      raw,
      anchorText,
      targetPath,
      startIndex,
      endIndex,
      entry: matchedEntry,
    });
  }

  return matches.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Checks if a specific cursor/selection index falls inside an existing lore reference.
 */
export function findReferenceAtCursor(
  text: string,
  cursorIndex: number,
  entries: LoreEntry[] | Map<string, LoreEntry> = []
): LoreReferenceMatch | null {
  const refs = findLoreReferences(text, entries);
  for (const ref of refs) {
    if (cursorIndex >= ref.startIndex && cursorIndex <= ref.endIndex) {
      return ref;
    }
  }
  return null;
}

/**
 * Finds word boundaries around a cursor index in text (for right-clicking a single unselected word).
 */
export function findWordBoundariesAtCursor(
  text: string,
  cursorIndex: number
): { word: string; start: number; end: number } {
  if (!text || cursorIndex < 0 || cursorIndex > text.length) {
    return { word: '', start: cursorIndex, end: cursorIndex };
  }

  // If cursor is on a delimiter, step back one char if possible
  let idx = cursorIndex;
  if (idx > 0 && (idx === text.length || !/[\w\p{L}'-]/u.test(text[idx]))) {
    if (/[\w\p{L}'-]/u.test(text[idx - 1])) {
      idx -= 1;
    }
  }

  if (!/[\w\p{L}'-]/u.test(text[idx])) {
    return { word: '', start: cursorIndex, end: cursorIndex };
  }

  let start = idx;
  while (start > 0 && /[\w\p{L}'-]/u.test(text[start - 1])) {
    start--;
  }

  let end = idx;
  while (end < text.length && /[\w\p{L}'-]/u.test(text[end])) {
    end++;
  }

  const word = text.substring(start, end).trim();
  return { word, start, end };
}

/**
 * Formats a markdown link for referencing a character or lore entry.
 */
export function formatLoreReference(anchorText: string, targetPath: string): string {
  const cleanAnchor = anchorText.trim();
  return `[${cleanAnchor}](${targetPath})`;
}

/**
 * Replaces or wraps selected text with a character/lore reference.
 */
export function insertLoreReference(
  fullText: string,
  startIndex: number,
  endIndex: number,
  targetPath: string
): { newText: string; insertedLength: number } {
  const selectedText = fullText.substring(startIndex, endIndex);

  // If the user selected an existing reference [Foo](bar), extract just the anchor text
  const linkMatch = selectedText.match(/^\[([^\]]+)\]\([^)]+\)$/);
  const cleanAnchor = linkMatch ? linkMatch[1] : selectedText;

  const replacement = formatLoreReference(cleanAnchor, targetPath);
  const newText = fullText.substring(0, startIndex) + replacement + fullText.substring(endIndex);

  return {
    newText,
    insertedLength: replacement.length,
  };
}

/**
 * Unlinks an existing reference, keeping only its anchor text.
 */
export function unlinkLoreReference(
  fullText: string,
  startIndex: number,
  endIndex: number
): { newText: string; unlinkedText: string } {
  const selectedText = fullText.substring(startIndex, endIndex);
  const linkMatch = selectedText.match(/^\[([^\]]+)\]\([^)]+\)$/);
  const wikiMatch = selectedText.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);

  let unlinkedText = selectedText;
  if (linkMatch) {
    unlinkedText = linkMatch[1];
  } else if (wikiMatch) {
    unlinkedText = wikiMatch[2] || wikiMatch[1];
  }

  const newText = fullText.substring(0, startIndex) + unlinkedText + fullText.substring(endIndex);
  return { newText, unlinkedText };
}
