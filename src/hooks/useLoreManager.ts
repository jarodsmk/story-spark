import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

const EMPTY_FILES: FileItem[] = [];

export function useLoreManager(
  activeNovelId: string = 'default',
  bibleFiles: FileItem[] = EMPTY_FILES,
  scratchpadFiles: FileItem[] = EMPTY_FILES
) {
  const [entries, setEntries] = useState<LoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const filesRef = useRef({ bibleFiles, scratchpadFiles });
  filesRef.current = { bibleFiles, scratchpadFiles };

  const filesSignature = useMemo(
    () => [...bibleFiles, ...scratchpadFiles].map((f) => f.path).sort().join(';'),
    [bibleFiles, scratchpadFiles]
  );

  // Load and parse all bible and scratchpad files into LoreEntry objects
  const loadLoreEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded: LoreEntry[] = [];
      const allFiles = [...filesRef.current.bibleFiles, ...filesRef.current.scratchpadFiles];
      for (const file of allFiles) {
        try {
          const content = await fs.readFile(file.path);
          const parsed = parseLoreMarkdown(file.path, content);
          loaded.push(parsed);
        } catch (e) {
          console.warn('Could not read lore/scratchpad file:', file.path, e);
        }
      }
      setEntries(loaded);
    } catch (err) {
      console.error('Failed to load lore entries:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoreEntries();
  }, [activeNovelId, filesSignature, loadLoreEntries]);

  const characters = useMemo(
    () => entries.filter((e) => e.category === 'character'),
    [entries]
  );

  const loreItems = useMemo(
    () => entries.filter((e) => e.category === 'world' || e.category === 'lore'),
    [entries]
  );

  const ideas = useMemo(
    () => entries.filter((e) => e.category === 'idea'),
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

  // Create a new lore or scratchpad entry file and return its path
  const createLoreEntry = useCallback(
    async (
      name: string,
      category: 'character' | 'world' | 'idea',
      details: { roleOrAtmosphere: string; summary: string }
    ): Promise<LoreEntry> => {
      const slug = sanitizeFilename(name.toLowerCase());
      const isChar = category === 'character';
      const isIdea = category === 'idea';

      let dir = '';
      if (activeNovelId === 'default') {
        if (isIdea) {
          dir = 'scratchpad';
        } else {
          dir = isChar ? 'bible/characters' : 'bible/world';
        }
      } else {
        if (isIdea) {
          dir = `novels/${activeNovelId}/scratchpad`;
        } else {
          dir = isChar ? `novels/${activeNovelId}/bible/characters` : `novels/${activeNovelId}/bible/world`;
        }
      }

      const filePath = `${dir}/${slug}.md`;
      let markdownContent = '';

      if (isIdea) {
        const statusVal = details.roleOrAtmosphere || 'Rough Concept';
        markdownContent = `# Idea: ${name}\n\n- **Status**: ${statusVal}\n- **Summary**: ${details.summary || ''}\n\nNotes & inspirations for this idea...\n`;
      } else {
        const titleLabel = isChar ? 'Character' : 'World';
        const attrLabel = isChar ? 'Role' : 'Atmosphere';
        markdownContent = `# ${titleLabel}: ${name}\n\n- **${attrLabel}**: ${details.roleOrAtmosphere || ''}\n- **Summary**: ${details.summary || ''}\n`;
      }

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
    ideas,
    entriesMap,
    isLoading,
    createLoreEntry,
    linkTextToLore,
    unlinkTextFromLore,
    getReferencesInText,
    reloadLore: loadLoreEntries,
  };
}
