export type DocumentCategory = 'scene' | 'character' | 'world' | 'scratchpad';

/**
 * Determines whether a file path corresponds to a manuscript scene, a character profile, a world/lore entry, or a scratchpad idea.
 */
export function getDocumentCategory(filePath: string): DocumentCategory {
  if (!filePath) return 'scene';
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();

  // Scratchpad idea entries
  if (
    normalized.includes('/scratchpad/') ||
    normalized.startsWith('scratchpad/') ||
    normalized.endsWith('/scratchpad') ||
    normalized.includes('/ideas/') ||
    normalized.startsWith('ideas/')
  ) {
    return 'scratchpad';
  }

  // Character story bible entries
  if (
    normalized.includes('/characters/') ||
    normalized.startsWith('bible/characters/') ||
    normalized.endsWith('/characters')
  ) {
    return 'character';
  }

  // World and lore story bible entries
  if (
    normalized.includes('/world/') ||
    normalized.startsWith('bible/world/') ||
    normalized.endsWith('/world')
  ) {
    return 'world';
  }

  return 'scene';
}

/**
 * Returns true if the file path represents a Story Bible screen (character profile or world/lore entry).
 */
export function isCharacterOrWorldDocument(filePath: string): boolean {
  const category = getDocumentCategory(filePath);
  return category === 'character' || category === 'world';
}

/**
 * Returns true if the file path represents a scratchpad idea document.
 */
export function isScratchpadDocument(filePath: string): boolean {
  return getDocumentCategory(filePath) === 'scratchpad';
}
