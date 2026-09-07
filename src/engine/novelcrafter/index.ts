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

  // 2. Classify files
  let novelMdContent: string | null = null;
  let codexHtmlContent: string | null = null;
  const characterFiles: { path: string; name: string }[] = [];
  const locationFiles: { path: string; name: string }[] = [];
  const loreFiles: { path: string; name: string }[] = [];

  for (const rawPath of filePaths) {
    const normalized = rawPath.slice(commonPrefix.length);
    const lower = normalized.toLowerCase();

    if (lower === 'novel.md' || lower === 'manuscript.md' || lower.endsWith('/novel.md')) {
      novelMdContent = await zip.file(rawPath)?.async('text') || '';
    } else if (lower === 'codex.html' || lower.endsWith('/codex.html')) {
      codexHtmlContent = await zip.file(rawPath)?.async('text') || '';
    } else if (lower.startsWith('characters/') || lower.includes('/characters/')) {
      const name = formatTitleFromFilename(normalized.split('/').pop() || '');
      characterFiles.push({ path: rawPath, name });
    } else if (lower.startsWith('locations/') || lower.includes('/locations/')) {
      const name = formatTitleFromFilename(normalized.split('/').pop() || '');
      locationFiles.push({ path: rawPath, name });
    } else if (lower.startsWith('lore/') || lower.includes('/lore/')) {
      const name = formatTitleFromFilename(normalized.split('/').pop() || '');
      loreFiles.push({ path: rawPath, name });
    }
  }

  // If novel.md wasn't matched directly, check for any root-level markdown file
  if (!novelMdContent) {
    for (const rawPath of filePaths) {
      const normalized = rawPath.slice(commonPrefix.length);
      if (!normalized.includes('/') && normalized.endsWith('.md')) {
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
  const scenes = splitNovelManuscript(novelMdContent || '', suggestedTitle);
  const totalWordCount = scenes.reduce((acc, s) => acc + s.wordCount, 0);

  // 5. Process characters
  const characters: NovelCrafterBibleItem[] = [];
  for (const cf of characterFiles) {
    const text = (await zip.file(cf.path)?.async('text')) || '';
    const slug = sanitizeFilename(cf.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || 'character';
    const cleanContent = text.trim().startsWith('#') ? text.trim() : `# Character: ${cf.name}\n\n${text.trim()}`;
    characters.push({
      name: cf.name,
      category: 'character',
      suggestedFilename: `${slug}.md`,
      content: cleanContent,
      wordCount: countWords(cleanContent),
    });
  }

  // 6. Process locations
  const locations: NovelCrafterBibleItem[] = [];
  for (const lf of locationFiles) {
    const text = (await zip.file(lf.path)?.async('text')) || '';
    const slug = sanitizeFilename(lf.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || 'location';
    const cleanContent = text.trim().startsWith('#') ? text.trim() : `# Location: ${lf.name}\n\n${text.trim()}`;
    locations.push({
      name: lf.name,
      category: 'location',
      suggestedFilename: `loc-${slug}.md`,
      content: cleanContent,
      wordCount: countWords(cleanContent),
    });
  }

  // 7. Process lore
  const lore: NovelCrafterBibleItem[] = [];
  for (const rf of loreFiles) {
    const text = (await zip.file(rf.path)?.async('text')) || '';
    const slug = sanitizeFilename(rf.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || 'lore';
    const cleanContent = text.trim().startsWith('#') ? text.trim() : `# Lore: ${rf.name}\n\n${text.trim()}`;
    lore.push({
      name: rf.name,
      category: 'lore',
      suggestedFilename: `lore-${slug}.md`,
      content: cleanContent,
      wordCount: countWords(cleanContent),
    });
  }

  // Infer genre
  const combinedCorpus = [
    novelMdContent?.slice(0, 5000) || '',
    lore.map(l => l.content).join(' '),
    characters.map(c => c.content).join(' '),
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
