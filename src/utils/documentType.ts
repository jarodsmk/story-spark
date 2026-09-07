export type DocumentCategory = 'scene' | 'character' | 'world';

/**
 * Determines whether a file path corresponds to a manuscript scene, a character profile, or a world/lore entry.
 */
export function getDocumentCategory(filePath: string): DocumentCategory {
  if (!filePath) return 'scene';
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();

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
