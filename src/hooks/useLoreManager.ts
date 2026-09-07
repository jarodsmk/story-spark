import { useState, useEffect, useCallback, useMemo } from 'react';
import { fs, FileItem } from '../storage/fs.ts';
import { sanitizeFilename } from '../engine/markdown/index.ts';
import {
  LoreEntry,
  parseLoreMarkdown,
  findLoreReferences,
  LoreReferenceMatch,
  insertLoreReference,
  unlinkLoreReference,
} from '../engine/lore/loreReference.ts';

export function useLoreManager(activeNovelId: string = 'default', bibleFiles: FileItem[] = []) {
  const [entries, setEntries] = useState<LoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load and parse all bible files into LoreEntry objects
  const loadLoreEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded: LoreEntry[] = [];
      for (const file of bibleFiles) {
        try {
          const content = await fs.readFile(file.path);
          const parsed = parseLoreMarkdown(file.path, content);
          loaded.push(parsed);
        } catch (e) {
          console.warn('Could not read bible file:', file.path, e);
        }
      }
      setEntries(loaded);
    } catch (err) {
      console.error('Failed to load lore entries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [bibleFiles]);

  useEffect(() => {
    loadLoreEntries();
  }, [loadLoreEntries]);

  const characters = useMemo(
    () => entries.filter((e) => e.category === 'character'),
    [entries]
  );

  const loreItems = useMemo(
    () => entries.filter((e) => e.category === 'world' || e.category === 'lore'),
    [entries]
  );

  const entriesMap = useMemo(() => {
    const map = new Map<string, LoreEntry>();
    for (const e of entries) {
      map.set(e.id, e);
      map.set(e.path, e);
      map.set(e.filename, e);
    }
    return map;
  }, [entries]);

  // Create a new lore entry file and return its path
  const createLoreEntry = useCallback(
    async (
      name: string,
      category: 'character' | 'world',
      details: { roleOrAtmosphere: string; summary: string }
    ): Promise<LoreEntry> => {
      const slug = sanitizeFilename(name.toLowerCase());
      const isChar = category === 'character';

      let dir = '';
      if (activeNovelId === 'default') {
        dir = isChar ? 'bible/characters' : 'bible/world';
      } else {
        dir = isChar ? `novels/${activeNovelId}/bible/characters` : `novels/${activeNovelId}/bible/world`;
      }

      const filePath = `${dir}/${slug}.md`;
      const titleLabel = isChar ? 'Character' : 'World';
      const attrLabel = isChar ? 'Role' : 'Atmosphere';

      const markdownContent = `# ${titleLabel}: ${name}\n\n- **${attrLabel}**: ${details.roleOrAtmosphere || ''}\n- **Summary**: ${details.summary || ''}\n`;

      await fs.writeFile(filePath, markdownContent);

      const newEntry = parseLoreMarkdown(filePath, markdownContent);
      setEntries((prev) => [...prev.filter((e) => e.path !== filePath), newEntry]);

      return newEntry;
    },
    [activeNovelId]
  );

  // Link selected text in content to target lore path
  const linkTextToLore = useCallback(
    (
      content: string,
      start: number,
      end: number,
      targetPath: string
    ): { newContent: string; insertedLength: number } => {
      const res = insertLoreReference(content, start, end, targetPath);
      return { newContent: res.newText, insertedLength: res.insertedLength };
    },
    []
  );

  // Unlink reference back to plain anchor text
  const unlinkTextFromLore = useCallback(
    (content: string, start: number, end: number): { newContent: string; unlinkedText: string } => {
      const res = unlinkLoreReference(content, start, end);
      return { newContent: res.newText, unlinkedText: res.unlinkedText };
    },
    []
  );

  // Find references in current scene text
  const getReferencesInText = useCallback(
    (text: string): LoreReferenceMatch[] => {
      return findLoreReferences(text, entries);
    },
    [entries]
  );

  return {
    entries,
    characters,
    loreItems,
    entriesMap,
    isLoading,
    createLoreEntry,
    linkTextToLore,
    unlinkTextFromLore,
    getReferencesInText,
    reloadLore: loadLoreEntries,
  };
}
