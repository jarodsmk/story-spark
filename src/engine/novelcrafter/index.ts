import JSZip from 'jszip';
import { sanitizeFilename } from '../markdown/index.ts';
import { Novel } from '../../types/index.ts';

export interface NovelCrafterScene {
  title: string;
  suggestedFilename: string;
  content: string;
  wordCount: number;
}

export interface NovelCrafterBibleItem {
  name: string;
  category: 'character' | 'location' | 'lore';
  suggestedFilename: string;
  content: string;
  wordCount: number;
}

export interface NovelCrafterParseResult {
  zipFilename: string;
  suggestedTitle: string;
  suggestedGenre: string;
  suggestedDescription: string;
  totalWordCount: number;
  scenes: NovelCrafterScene[];
  characters: NovelCrafterBibleItem[];
  locations: NovelCrafterBibleItem[];
  lore: NovelCrafterBibleItem[];
  hasCodexHtml: boolean;
  codexTitle?: string;
  rawNovelMd?: string;
  fileCount: number;
}

/**
 * Counts words in a string.
 */
function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Derives a clean title from a filename or slug.
 */
function formatTitleFromFilename(name: string): string {
  const base = name.replace(/\.(md|markdown|txt|html)$/i, '');
  return base
    .replace(/^(\d+[-_])/, '')
    .replace(/[-_]/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Splits a NovelCrafter novel.md into individual scenes/chapters.
 */
export function splitNovelManuscript(markdown: string, fallbackTitle: string): NovelCrafterScene[] {
  if (!markdown || !markdown.trim()) {
    return [
      {
        title: 'Chapter 1',
        suggestedFilename: '01-chapter-1.md',
        content: `# Chapter 1\n\nStart writing here...`,
        wordCount: 4,
      },
    ];
  }

  const lines = markdown.split(/\r?\n/);
  const headingIndices: { index: number; line: string; level: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(#{1,3})\s+(.*)$/);
    if (match) {
      headingIndices.push({
        index: i,
        line: match[2].trim(),
        level: match[1].length,
      });
    }
  }

  // If no markdown headings were found, check for horizontal rule scene breaks
  if (headingIndices.length === 0) {
    const hrRegex = /\n\s*(?:---|\*\*\*|___|\*\s\*\s\*)\s*\n/g;
    const parts = markdown.split(hrRegex);

    if (parts.length > 1) {
      return parts.map((part, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        const firstLine = part.trim().split(/\r?\n/)[0] || `Scene ${idx + 1}`;
        const title = firstLine.length < 40 ? firstLine : `Scene ${idx + 1}`;
        const slug = sanitizeFilename(title.toLowerCase()) || `scene-${num}`;
        return {
          title,
          suggestedFilename: `${num}-${slug}.md`,
          content: part.trim().startsWith('#') ? part.trim() : `# ${title}\n\n${part.trim()}`,
          wordCount: countWords(part),
        };
      });
    }

    // Keep as single chapter
    return [
      {
        title: fallbackTitle || 'Manuscript',
        suggestedFilename: '01-manuscript.md',
        content: markdown.trim().startsWith('#') ? markdown.trim() : `# ${fallbackTitle || 'Manuscript'}\n\n${markdown.trim()}`,
        wordCount: countWords(markdown),
      },
    ];
  }

  // Determine if the first heading is the Novel Title or already Chapter 1
  let firstIsNovelTitle = false;
  if (headingIndices.length > 1) {
    const firstH = headingIndices[0];
    const secondH = headingIndices[1];
    // If first heading is level 1 and doesn't say "chapter", "prologue", "act"
    const isFirstChapterLike = /^(chapter|act|prologue|part|scene|book)/i.test(firstH.line);
    const isSecondChapterLike = /^(chapter|act|prologue|part|scene)/i.test(secondH.line);

    if (firstH.level === 1 && !isFirstChapterLike && (isSecondChapterLike || secondH.level <= 2)) {
      firstIsNovelTitle = true;
    }
  }

  const scenes: NovelCrafterScene[] = [];
  const startIdx = firstIsNovelTitle ? 1 : 0;

  // If first was novel title and had preface text before chapter 1
  if (firstIsNovelTitle && headingIndices[0].index < headingIndices[1].index - 1) {
    const prefaceLines = lines.slice(headingIndices[0].index + 1, headingIndices[1].index);
    const prefaceText = prefaceLines.join('\n').trim();
    if (prefaceText) {
      scenes.push({
        title: 'Prologue',
        suggestedFilename: '01-prologue.md',
        content: `# Prologue\n\n${prefaceText}`,
        wordCount: countWords(prefaceText),
      });
    }
  }

  for (let i = startIdx; i < headingIndices.length; i++) {
    const current = headingIndices[i];
    const next = headingIndices[i + 1];
    const sectionLines = lines.slice(current.index, next ? next.index : undefined);
    const sectionContent = sectionLines.join('\n').trim();

    const title = current.line.replace(/^#+\s*/, '').trim() || `Scene ${scenes.length + 1}`;
    const num = String(scenes.length + 1).padStart(2, '0');
    const slug = sanitizeFilename(title.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || `scene-${num}`;

    scenes.push({
      title,
      suggestedFilename: `${num}-${slug}.md`,
      content: sectionContent,
      wordCount: countWords(sectionContent),
    });
  }

  return scenes.length > 0 ? scenes : [
    {
      title: fallbackTitle || 'Chapter 1',
      suggestedFilename: '01-chapter-1.md',
      content: markdown,
      wordCount: countWords(markdown),
    }
  ];
}

/**
 * Infers a genre from manuscript text or lore keywords.
 */
function inferGenre(corpus: string): string {
  const lower = corpus.toLowerCase();
  if (lower.includes('cyberpunk') || lower.includes('ocular') || lower.includes('biocoding') || lower.includes('neural')) {
    return 'Sci-Fi Cyberpunk';
  }
  if (lower.includes('spaceship') || lower.includes('orbital') || lower.includes('hyperspace') || lower.includes('galaxy')) {
    return 'Space Opera';
  }
  if (lower.includes('magic') || lower.includes('spell') || lower.includes('dragon') || lower.includes('kingdom') || lower.includes('sword')) {
    return 'Epic Fantasy';
  }
  if (lower.includes('blood') || lower.includes('gothic') || lower.includes('vampire') || lower.includes('curse') || lower.includes('shadow')) {
    return 'Dark Fantasy';
  }
  if (lower.includes('detective') || lower.includes('murder') || lower.includes('suspect') || lower.includes('investigation')) {
    return 'Mystery & Crime';
  }
  if (lower.includes('dystopia') || lower.includes('regime') || lower.includes('wasteland')) {
    return 'Dystopian';
  }
  return 'General Fiction';
}

/**
 * Safely extracts the item's display name from a metadata.json object.
 */
export function extractNameFromMetadata(metadata: any): string {
  if (!metadata || typeof metadata !== 'object') return '';

  const directCandidates = [
    metadata.name,
    metadata.title,
    metadata.label,
    metadata.displayName,
    metadata.entryName,
    metadata.itemName,
    metadata.header,
  ];

  for (const cand of directCandidates) {
    if (typeof cand === 'string' && cand.trim()) {
      return cand.trim();
    }
    if (cand && typeof cand === 'object') {
      if (typeof cand.text === 'string' && cand.text.trim()) return cand.text.trim();
      if (typeof cand.value === 'string' && cand.value.trim()) return cand.value.trim();
      if (typeof cand.name === 'string' && cand.name.trim()) return cand.name.trim();
    }
  }

  // Check nested containers (e.g. data, entry, item, attributes, properties, content)
  const nestedKeys = ['data', 'entry', 'item', 'attributes', 'properties', 'content'];
  for (const key of nestedKeys) {
    if (metadata[key] && typeof metadata[key] === 'object') {
      const subName = extractNameFromMetadata(metadata[key]);
      if (subName) return subName;
    }
  }

  return '';
}

/**
 * Determines whether an entry represents a character, a location, or general world/lore.
 */
export function determineEntryCategory(
  dir: string,
  metadata: any,
  content: string
): 'character' | 'location' | 'lore' {
  const normDir = dir.toLowerCase().replace(/\\/g, '/');

  // 1. Check metadata category/type/kind/role
  const metaCategory = String(
    metadata?.category ||
    metadata?.entryType ||
    metadata?.type ||
    metadata?.kind ||
    metadata?.codexType ||
    ''
  ).toLowerCase();

  if (
    metaCategory === 'character' ||
    metaCategory === 'characters' ||
    metaCategory === 'person' ||
    metaCategory === 'people' ||
    metaCategory === 'actor' ||
    metaCategory === 'cast'
  ) {
    return 'character';
  }

  if (
    metaCategory === 'location' ||
    metaCategory === 'locations' ||
    metaCategory === 'place' ||
    metaCategory === 'places' ||
    metaCategory === 'setting' ||
    metaCategory === 'settings'
  ) {
    return 'location';
  }

  if (
    metaCategory === 'lore' ||
    metaCategory === 'world' ||
    metaCategory === 'item' ||
    metaCategory === 'items' ||
    metaCategory === 'concept' ||
    metaCategory === 'concepts' ||
    metaCategory === 'faction' ||
    metaCategory === 'factions' ||
    metaCategory === 'species' ||
    metaCategory === 'event' ||
    metaCategory === 'events' ||
    metaCategory === 'magic'
  ) {
    return 'lore';
  }

  // If metadata specifies a character role
  if (metadata?.role && typeof metadata.role === 'string') {
    return 'character';
  }

  // 2. Check path segments in folder hierarchy
  const segments = normDir.split('/').filter(Boolean);

  if (
    segments.some(s =>
      s === 'characters' ||
      s === 'character' ||
      s === 'people' ||
      s === 'persons' ||
      s === 'cast' ||
      s === 'protagonists' ||
      s === 'antagonists'
    )
  ) {
    return 'character';
  }

  if (
    segments.some(s =>
      s === 'locations' ||
      s === 'location' ||
      s === 'places' ||
      s === 'settings' ||
      s === 'cities' ||
      s === 'regions' ||
      s === 'realms'
    )
  ) {
    return 'location';
  }

  if (
    segments.some(s =>
      s === 'lore' ||
      s === 'world' ||
      s === 'codex' ||
      s === 'items' ||
      s === 'factions' ||
      s === 'concepts' ||
      s === 'magic' ||
      s === 'species' ||
      s === 'organizations' ||
      s === 'history' ||
      s === 'notes'
    )
  ) {
    return 'lore';
  }

  // 3. Check markdown content markers
  if (content) {
    if (/^#\s*Character:/i.test(content) || /-\s*\*\*Role\*\*:/i.test(content)) {
      return 'character';
    }
    if (/^#\s*Location:/i.test(content) || /-\s*\*\*Atmosphere\*\*:/i.test(content)) {
      return 'location';
    }
  }

  return 'lore';
}

/**
 * Formats markdown content cleanly with category header and metadata attributes.
 */
export function formatBibleItemContent(
  category: 'character' | 'location' | 'lore',
  name: string,
  rawMarkdown: string,
  metadata?: any
): string {
  const prefix = category === 'character' ? 'Character' : category === 'location' ? 'Location' : 'Lore';
  let body = (rawMarkdown || '').trim();

  // If rawMarkdown was empty, fall back to description/notes/summary in metadata
  if (!body && metadata && typeof metadata === 'object') {
    body = String(metadata.description || metadata.notes || metadata.summary || '').trim();
  }

  // Build metadata attribute bullets if not already present in the markdown body
  const metaBullets: string[] = [];
  if (metadata && typeof metadata === 'object') {
    if (metadata.role && typeof metadata.role === 'string' && !body.toLowerCase().includes('role:')) {
      metaBullets.push(`- **Role**: ${metadata.role.trim()}`);
    }
    if (metadata.status && typeof metadata.status === 'string' && !body.toLowerCase().includes('status:')) {
      metaBullets.push(`- **Status**: ${metadata.status.trim()}`);
    }
    if (metadata.age && !body.toLowerCase().includes('age:')) {
      metaBullets.push(`- **Age**: ${metadata.age}`);
    }
    if (metadata.atmosphere && typeof metadata.atmosphere === 'string' && !body.toLowerCase().includes('atmosphere:')) {
      metaBullets.push(`- **Atmosphere**: ${metadata.atmosphere.trim()}`);
    }
    if (metadata.aliases) {
      const aliasStr = Array.isArray(metadata.aliases) ? metadata.aliases.join(', ') : String(metadata.aliases);
      if (aliasStr.trim() && !body.toLowerCase().includes('aliases:') && !body.toLowerCase().includes('alias:')) {
        metaBullets.push(`- **Aliases**: ${aliasStr.trim()}`);
      }
    }
    if (metadata.tags) {
      const tagStr = Array.isArray(metadata.tags) ? metadata.tags.join(', ') : String(metadata.tags);
      if (tagStr.trim() && !body.toLowerCase().includes('tags:')) {
        metaBullets.push(`- **Tags**: ${tagStr.trim()}`);
      }
    }
  }

  const titleHeader = `# ${prefix}: ${name}`;
  const metaBlock = metaBullets.length > 0 ? metaBullets.join('\n') + '\n\n' : '';

  if (!body) {
    return `${titleHeader}\n\n${metaBlock}No description provided.`.trim();
  }

  // If body starts with an H1 heading line, replace the first line with the canonical titleHeader
  if (body.startsWith('#')) {
    const firstNewline = body.indexOf('\n');
    if (firstNewline === -1) {
      return `${titleHeader}\n\n${metaBlock}`.trim();
    }
    const rest = body.slice(firstNewline + 1).trim();
    return `${titleHeader}\n\n${metaBlock}${rest}`.trim();
  }

  return `${titleHeader}\n\n${metaBlock}${body}`.trim();
}

/**
 * Ensures unique suggested filenames within a category.
 */
function makeUniqueFilename(baseSlug: string, used: Set<string>): string {
  let fn = `${baseSlug}.md`;
  let idx = 2;
  while (used.has(fn)) {
    fn = `${baseSlug}-${idx}.md`;
    idx++;
  }
  used.add(fn);
  return fn;
}

/**
 * Parses an uploaded NovelCrafter zip export.
 */
export async function parseNovelCrafterZip(
  file: File | Blob | ArrayBuffer | Uint8Array,
  filename: string
): Promise<NovelCrafterParseResult> {
  const data = typeof (file as any).arrayBuffer === 'function'
    ? await (file as any).arrayBuffer()
    : file;
  const zip = await JSZip.loadAsync(data);

  // 1. Gather all file paths and determine if there's a single top-level directory wrapper
  const filePaths: string[] = [];
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && !relativePath.startsWith('__MACOSX/') && !relativePath.includes('/.DS_Store')) {
      filePaths.push(relativePath);
    }
  });

  if (filePaths.length === 0) {
    throw new Error('The uploaded ZIP archive is empty or does not contain readable files.');
  }

  // Detect common prefix (e.g. "MyNovelExport/novel.md" -> "novel.md")
  let commonPrefix = '';
  const firstSlash = filePaths[0].indexOf('/');
  if (firstSlash !== -1) {
    const candidate = filePaths[0].slice(0, firstSlash + 1);
    if (filePaths.every(p => p.startsWith(candidate))) {
      commonPrefix = candidate;
    }
  }

  // 2. Discover novel.md manuscript and codex.html
  let novelMdContent: string | null = null;
  let codexHtmlContent: string | null = null;

  for (const rawPath of filePaths) {
    const normalized = rawPath.slice(commonPrefix.length).replace(/\\/g, '/');
    const lower = normalized.toLowerCase();
    const baseName = lower.split('/').pop() || '';

    if (baseName === 'novel.md' || baseName === 'manuscript.md') {
      novelMdContent = await zip.file(rawPath)?.async('text') || '';
    } else if (baseName === 'codex.html') {
      codexHtmlContent = await zip.file(rawPath)?.async('text') || '';
    }
  }

  // If novel.md wasn't matched directly, check for any root-level markdown file that isn't entry.md
  if (!novelMdContent) {
    for (const rawPath of filePaths) {
      const normalized = rawPath.slice(commonPrefix.length).replace(/\\/g, '/');
      const lower = normalized.toLowerCase();
      if (!normalized.includes('/') && lower.endsWith('.md') && lower !== 'entry.md') {
        novelMdContent = await zip.file(rawPath)?.async('text') || '';
        break;
      }
    }
  }

  // 3. Extract title and description from codex.html or novel.md or zip filename
  let codexTitle = '';
  let codexDescription = '';
  if (codexHtmlContent) {
    const titleMatch = codexHtmlContent.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      codexTitle = titleMatch[1].replace(/codex/i, '').replace(/[-–—|]/g, '').trim();
    }
    const descMatch = codexHtmlContent.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (descMatch) {
      codexDescription = descMatch[1].trim();
    }
  }

  let suggestedTitle = codexTitle;

  // Try extracting novel title from first heading of novel.md if codex title isn't clear
  if (!suggestedTitle && novelMdContent) {
    const firstH1 = novelMdContent.match(/^#\s+(.+)$/m);
    if (firstH1) {
      const candidate = firstH1[1].trim();
      if (!/^(chapter|act|prologue|part|scene)/i.test(candidate)) {
        suggestedTitle = candidate;
      }
    }
  }

  // Fallback to zip filename
  if (!suggestedTitle) {
    suggestedTitle = filename.replace(/\.zip$/i, '').replace(/[-_]/g, ' ').trim();
  }

  // 4. Process scenes
  let scenes: NovelCrafterScene[] = [];
  if (novelMdContent) {
    scenes = splitNovelManuscript(novelMdContent, suggestedTitle);
  } else {
    // Check if individual scene files exist under scenes/ or chapters/
    const sceneFilePaths = filePaths.filter(p => {
      const normalized = p.slice(commonPrefix.length).replace(/\\/g, '/').toLowerCase();
      const base = normalized.split('/').pop() || '';
      return (
        (normalized.startsWith('scenes/') || normalized.includes('/scenes/') ||
         normalized.startsWith('chapters/') || normalized.includes('/chapters/')) &&
        base.endsWith('.md') &&
        base !== 'entry.md'
      );
    });

    if (sceneFilePaths.length > 0) {
      sceneFilePaths.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      for (let i = 0; i < sceneFilePaths.length; i++) {
        const rawP = sceneFilePaths[i];
        const content = await zip.file(rawP)?.async('text') || '';
        const base = rawP.split('/').pop() || `scene-${i + 1}`;
        const title = formatTitleFromFilename(base);
        const num = String(i + 1).padStart(2, '0');
        const slug = sanitizeFilename(title.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || `scene-${num}`;
        scenes.push({
          title,
          suggestedFilename: `${num}-${slug}.md`,
          content: content.trim().startsWith('#') ? content.trim() : `# ${title}\n\n${content.trim()}`,
          wordCount: countWords(content),
        });
      }
    }
  }

  // 5. Discover and iterate through EVERY subfolder for characters and world/lore items
  const characters: NovelCrafterBibleItem[] = [];
  const locations: NovelCrafterBibleItem[] = [];
  const lore: NovelCrafterBibleItem[] = [];

  const usedCharFilenames = new Set<string>();
  const usedLocFilenames = new Set<string>();
  const usedLoreFilenames = new Set<string>();
  const processedRawPaths = new Set<string>();

  // Group all files by directory (relative to commonPrefix)
  const filesByDir = new Map<string, string[]>();
  for (const rawPath of filePaths) {
    const normalized = rawPath.slice(commonPrefix.length).replace(/\\/g, '/');
    const lastSlash = normalized.lastIndexOf('/');
    const dir = lastSlash === -1 ? '' : normalized.slice(0, lastSlash);
    if (!filesByDir.has(dir)) {
      filesByDir.set(dir, []);
    }
    filesByDir.get(dir)!.push(rawPath);
  }

  // Iterate through EVERY subfolder
  for (const [dir, dirRawPaths] of filesByDir.entries()) {
    if (!dir) continue; // Skip root folder for entry.md subfolder iteration

    // Locate entry.md (or entry.markdown) in this subfolder
    let entryPath = dirRawPaths.find(p => {
      const base = p.replace(/\\/g, '/').split('/').pop()?.toLowerCase();
      return base === 'entry.md' || base === 'entry.markdown';
    });

    // Locate metadata.json in this subfolder
    const metaPath = dirRawPaths.find(p => {
      const base = p.replace(/\\/g, '/').split('/').pop()?.toLowerCase();
      return base === 'metadata.json';
    });

    // If no entry.md was named exactly entry.md, but metadata.json exists, check for any markdown file in that directory
    if (!entryPath && metaPath) {
      entryPath = dirRawPaths.find(p => {
        const base = p.replace(/\\/g, '/').split('/').pop()?.toLowerCase();
        return base?.endsWith('.md') || base?.endsWith('.markdown');
      });
    }

    // If either entry.md or metadata.json is found in this subfolder, process as an item
    if (entryPath || metaPath) {
      if (entryPath) processedRawPaths.add(entryPath);
      if (metaPath) processedRawPaths.add(metaPath);

      let metadata: any = null;
      if (metaPath) {
        try {
          const metaText = await zip.file(metaPath)?.async('text');
          if (metaText) {
            metadata = JSON.parse(metaText);
          }
        } catch (err) {
          console.warn(`Failed to parse metadata.json at ${metaPath}:`, err);
        }
      }

      const rawMarkdown = entryPath ? (await zip.file(entryPath)?.async('text') || '') : '';

      // Determine item name: metadata.json takes precedence
      let itemName = extractNameFromMetadata(metadata);

      if (!itemName && rawMarkdown) {
        const h1Match = rawMarkdown.match(/^#\s+(.+)$/m);
        if (h1Match) {
          const clean = h1Match[1].replace(/^(character|location|lore|world|item|idea):\s*/i, '').trim();
          if (clean && clean.toLowerCase() !== 'entry') {
            itemName = clean;
          }
        }
      }

      if (!itemName) {
        const leafDir = dir.split('/').pop() || 'item';
        itemName = formatTitleFromFilename(leafDir);
      }

      // Determine item category (character, location, or lore)
      const category = determineEntryCategory(dir, metadata, rawMarkdown);

      // Clean & format markdown content with header and attributes
      const formattedContent = formatBibleItemContent(category, itemName, rawMarkdown, metadata);
      const baseSlug = sanitizeFilename(itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || category;

      if (category === 'character') {
        const suggestedFilename = makeUniqueFilename(baseSlug, usedCharFilenames);
        characters.push({
          name: itemName,
          category: 'character',
          suggestedFilename,
          content: formattedContent,
          wordCount: countWords(formattedContent),
        });
      } else if (category === 'location') {
        const suggestedFilename = makeUniqueFilename(`loc-${baseSlug}`, usedLocFilenames);
        locations.push({
          name: itemName,
          category: 'location',
          suggestedFilename,
          content: formattedContent,
          wordCount: countWords(formattedContent),
        });
      } else {
        const suggestedFilename = makeUniqueFilename(`lore-${baseSlug}`, usedLoreFilenames);
        lore.push({
          name: itemName,
          category: 'lore',
          suggestedFilename,
          content: formattedContent,
          wordCount: countWords(formattedContent),
        });
      }
    }
  }

  // 6. Support flat archives (e.g. characters/Aria.md, locations/Spire.md, lore/Runes.md)
  for (const rawPath of filePaths) {
    if (processedRawPaths.has(rawPath)) continue;

    const normalized = rawPath.slice(commonPrefix.length).replace(/\\/g, '/');
    const lower = normalized.toLowerCase();
    const baseName = lower.split('/').pop() || '';

    // Ignore novel.md, codex.html, or non-markdown files
    if (
      baseName === 'novel.md' ||
      baseName === 'manuscript.md' ||
      baseName === 'codex.html' ||
      baseName === 'entry.md' ||
      !baseName.endsWith('.md')
    ) {
      continue;
    }

    const name = formatTitleFromFilename(baseName);
    const baseSlug = sanitizeFilename(name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || 'item';
    const text = await zip.file(rawPath)?.async('text') || '';

    if (lower.startsWith('characters/') || lower.includes('/characters/')) {
      const cleanContent = text.trim().startsWith('#') ? text.trim() : `# Character: ${name}\n\n${text.trim()}`;
      const suggestedFilename = makeUniqueFilename(baseSlug, usedCharFilenames);
      characters.push({
        name,
        category: 'character',
        suggestedFilename,
        content: cleanContent,
        wordCount: countWords(cleanContent),
      });
    } else if (lower.startsWith('locations/') || lower.includes('/locations/')) {
      const cleanContent = text.trim().startsWith('#') ? text.trim() : `# Location: ${name}\n\n${text.trim()}`;
      const suggestedFilename = makeUniqueFilename(`loc-${baseSlug}`, usedLocFilenames);
      locations.push({
        name,
        category: 'location',
        suggestedFilename,
        content: cleanContent,
        wordCount: countWords(cleanContent),
      });
    } else if (lower.startsWith('lore/') || lower.includes('/lore/') || lower.startsWith('world/') || lower.includes('/world/')) {
      const cleanContent = text.trim().startsWith('#') ? text.trim() : `# Lore: ${name}\n\n${text.trim()}`;
      const suggestedFilename = makeUniqueFilename(`lore-${baseSlug}`, usedLoreFilenames);
      lore.push({
        name,
        category: 'lore',
        suggestedFilename,
        content: cleanContent,
        wordCount: countWords(cleanContent),
      });
    }
  }

  // 7. Calculate totals & genre
  const sceneWords = scenes.reduce((acc, s) => acc + s.wordCount, 0);
  const bibleWords = [...characters, ...locations, ...lore].reduce((acc, item) => acc + item.wordCount, 0);
  const totalWordCount = sceneWords > 0 ? sceneWords : bibleWords;

  // Infer genre
  const combinedCorpus = [
    novelMdContent?.slice(0, 5000) || '',
    lore.map(l => l.content).join(' '),
    characters.map(c => c.content).join(' '),
    locations.map(loc => loc.content).join(' '),
  ].join(' ');
  const suggestedGenre = inferGenre(combinedCorpus);

  return {
    zipFilename: filename,
    suggestedTitle: suggestedTitle || 'Imported Novel',
    suggestedGenre,
    suggestedDescription: codexDescription || `Imported from NovelCrafter export (${scenes.length} chapters, ${characters.length} characters, ${locations.length} locations, ${lore.length} lore entries).`,
    totalWordCount,
    scenes,
    characters,
    locations,
    lore,
    hasCodexHtml: Boolean(codexHtmlContent),
    codexTitle,
    rawNovelMd: novelMdContent || undefined,
    fileCount: filePaths.length,
  };
}
