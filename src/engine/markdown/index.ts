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

/**
 * Compiles an entire novel manuscript from an ordered list of scenes.
 */
export function compileNovelManuscript(
  scenes: SceneDocument[],
  bibleEntities: BibleEntity[] = [],
  includeBibleAppendix: boolean = false
): string {
  const sorted = [...scenes].sort((a, b) => a.order - b.order);
  let output = '';

  for (const scene of sorted) {
    output += `# ${scene.title}\n\n`;
    output += `${scene.content.trim()}\n\n---\n\n`;
  }

  if (includeBibleAppendix && bibleEntities.length > 0) {
    output += `# Appendix: Story Bible\n\n`;
    for (const entity of bibleEntities) {
      output += `## ${entity.name} (${entity.type.toUpperCase()})\n\n`;
      output += `${entity.content.trim()}\n\n`;
    }
  }

  return output.trim();
}
