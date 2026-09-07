import { SceneDocument, BibleEntity } from '../../types/index.ts';

/**
 * Sanitizes a filename to ensure safe storage on Windows, Linux, and macOS.
 * Strips path traversal characters, control characters, and reserved Windows characters.
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/^\.+/, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Parses an imported Markdown or text file into title, synopsis/frontmatter, and body content.
 */
export function parseImportedDocument(content: string, filename: string): { title: string; body: string } {
  const lines = content.split(/\r?\n/);
  let title = filename.replace(/\.(md|markdown|txt)$/i, '');
  let bodyStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('# ')) {
      title = line.replace(/^#\s+/, '').trim();
      bodyStartIndex = i + 1;
      break;
    } else if (line.length > 0) {
      // First non-empty line can be title if no markdown heading
      break;
    }
  }

  // Preserve rest of content
  const body = lines.slice(bodyStartIndex).join('\n').trim();
  return {
    title,
    body: body || content,
  };
}

/**
 * Exports a single scene to clean Markdown or Text format,
 * preserving markdown headings, bulleted lists, and numbered lists.
 */
export function exportScene(scene: SceneDocument, format: 'markdown' | 'text' = 'markdown'): string {
  if (format === 'markdown') {
    let out = `# ${scene.title}\n\n`;
    if (scene.synopsis) {
      out += `> ${scene.synopsis}\n\n`;
    }
    out += scene.content;
    return out;
  } else {
    // Clean text format (strips markdown headers and blockquotes to plain text)
    let out = `${scene.title.toUpperCase()}\n\n`;
    if (scene.synopsis) {
      out += `Summary: ${scene.synopsis}\n\n`;
    }
    // Convert markdown headings to uppercase headers
    const plain = scene.content
      .replace(/^#{1,6}\s+(.+)$/gm, '$1')
      .replace(/^\>\s+/gm, '');
    out += plain;
    return out;
  }
}

export interface CompileOptions {
  sceneSeparator?: 'divider' | 'asterisms' | 'blank';
  chapterHeadingStyle?: 'numbered' | 'original' | 'simple';
  novelTitle?: string;
}

/**
 * Compiles an entire novel manuscript from an ordered list of scenes to clean Markdown.
 */
export function compileNovelManuscript(
  scenes: SceneDocument[],
  bibleEntities: BibleEntity[] = [],
  includeBibleAppendix: boolean = false,
  options?: CompileOptions
): string {
  const sorted = [...scenes].sort((a, b) => a.order - b.order);
  let output = '';

  const separatorStr = options?.sceneSeparator === 'asterisms'
    ? '\n\n* * *\n\n'
    : options?.sceneSeparator === 'blank'
    ? '\n\n\n\n'
    : '\n\n---\n\n';

  for (let i = 0; i < sorted.length; i++) {
    const scene = sorted[i];
    let heading = scene.title;
    if (options?.chapterHeadingStyle === 'numbered') {
      const clean = scene.title.replace(/^\d+-/, '').trim();
      heading = `Chapter ${i + 1}: ${clean}`;
    } else if (options?.chapterHeadingStyle === 'simple') {
      heading = scene.title.replace(/^\d+-/, '').trim();
    }

    output += `# ${heading}\n\n`;
    output += `${scene.content.trim()}`;

    if (i < sorted.length - 1) {
      output += separatorStr;
    } else {
      output += '\n\n';
    }
  }

  if (includeBibleAppendix && bibleEntities.length > 0) {
    output += `---\n\n# Appendix: Story Bible\n\n`;
    for (const entity of bibleEntities) {
      output += `## ${entity.name} (${entity.type.toUpperCase()})\n\n`;
      output += `${entity.content.trim()}\n\n`;
    }
  }

  return output.trim();
}

/**
 * Compiles an entire novel manuscript into clean, formatted plain text (.txt).
 */
export function compileNovelText(
  scenes: SceneDocument[],
  bibleEntities: BibleEntity[] = [],
  includeBibleAppendix: boolean = false,
  options?: CompileOptions
): string {
  const sorted = [...scenes].sort((a, b) => a.order - b.order);
  let output = '';

  if (options?.novelTitle) {
    output += `${options.novelTitle.toUpperCase()}\n`;
    output += `${'='.repeat(Math.min(60, options.novelTitle.length * 2))}\n\n\n`;
  }

  const separatorStr = options?.sceneSeparator === 'asterisms'
    ? '\n\n*   *   *\n\n'
    : options?.sceneSeparator === 'blank'
    ? '\n\n\n\n'
    : '\n\n------------------------------------------------------------\n\n';

  for (let i = 0; i < sorted.length; i++) {
    const scene = sorted[i];
    let heading = scene.title;
    if (options?.chapterHeadingStyle === 'numbered') {
      const clean = scene.title.replace(/^\d+-/, '').trim();
      heading = `CHAPTER ${i + 1}: ${clean.toUpperCase()}`;
    } else {
      heading = scene.title.replace(/^\d+-/, '').trim().toUpperCase();
    }

    output += `${heading}\n`;
    output += `${'-'.repeat(Math.min(40, heading.length))}\n\n`;

    // Strip markdown formatting
    const plainContent = scene.content
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^>\s+/gm, '');

    output += `${plainContent.trim()}`;

    if (i < sorted.length - 1) {
      output += separatorStr;
    } else {
      output += '\n\n';
    }
  }

  if (includeBibleAppendix && bibleEntities.length > 0) {
    output += `\n\n============================================================\n`;
    output += `APPENDIX: STORY BIBLE & LORE\n`;
    output += `============================================================\n\n`;
    for (const entity of bibleEntities) {
      output += `[${entity.type.toUpperCase()}] ${entity.name}\n`;
      output += `${'-'.repeat(entity.name.length + 12)}\n`;
      const cleanEntity = entity.content
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1');
      output += `${cleanEntity.trim()}\n\n`;
    }
  }

  return output.trim();
}

