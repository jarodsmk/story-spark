import { describe, it, expect, beforeEach } from 'vitest';
import { fs } from '../src/storage/fs.ts';
import { sanitizeFilename } from '../src/engine/markdown/index.ts';
import { getDocumentCategory, isScratchpadDocument, isCharacterOrWorldDocument } from '../src/utils/documentType.ts';

describe('Manuscript Target Progress Word Count Calculation & Scratchpad Logic', () => {
  const activeNovelId = 'novel-test-progress';
  const scenesDir = `novels/${activeNovelId}/scenes`;
  const bibleCharsDir = `novels/${activeNovelId}/bible/characters`;
  const scratchpadDir = `novels/${activeNovelId}/scratchpad`;

  beforeEach(async () => {
    fs.clear();
  });

  // Helper matching the exact logic used in useProjectFiles.ts
  async function computeManuscriptTotalWordCount(
    sceneFiles: { path: string; name: string }[],
    currentContent?: string,
    currentFilePath?: string
  ): Promise<number> {
    let total = 0;
    for (const f of sceneFiles) {
      try {
        let text: string;
        if (currentFilePath && f.path === currentFilePath && currentContent !== undefined) {
          text = currentContent;
        } else {
          text = await fs.readFile(f.path);
        }
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        total += words;
      } catch {
        // ignore
      }
    }
    return total;
  }

  // Helper matching createScratchpadIdea in useProjectFiles.ts
  async function createScratchpadIdea(
    title: string,
    existingCount: number,
    initialContent?: string
  ): Promise<string> {
    const safeTitle = title.trim() || `Idea ${existingCount + 1}`;
    let clean = sanitizeFilename(safeTitle.toLowerCase());
    if (!clean) {
      clean = `idea-${Date.now()}`;
    }
    let path = `${scratchpadDir}/${clean}.md`;
    try {
      const existing = await fs.readFile(path);
      if (existing !== null && existing !== undefined) {
        path = `${scratchpadDir}/${clean}-${Date.now().toString().slice(-4)}.md`;
      }
    } catch {
      // File doesn't exist, good
    }
    const content =
      initialContent ??
      `# Idea: ${safeTitle}\n\n- **Status**: Rough Concept\n- **Summary**: Ad-hoc idea for reference and exploration.\n\nWrite down quick thoughts, plot hooks, research notes, or dialogue ideas...\n`;
    await fs.writeFile(path, content);
    return path;
  }

  it('accurately calculates Target progress by summing words from all manuscript scenes only', async () => {
    const scene1 = `${scenesDir}/01-prologue.md`;
    const scene2 = `${scenesDir}/02-chapter-1.md`;
    const characterFile = `${bibleCharsDir}/kaelen.md`;
    const ideaFile = `${scratchpadDir}/subterranean-passage.md`;

    // Scene 1: 10 words
    await fs.writeFile(scene1, 'One two three four five six seven eight nine ten.');
    // Scene 2: 14 words
    await fs.writeFile(
      scene2,
      'The ancient tower loomed high above the misty cliffs guarding secrets of lost ages.'
    );
    // Character: 25 words (Story Bible - NOT part of manuscript scenes)
    await fs.writeFile(
      characterFile,
      '# Kaelen Vance\n\nA seasoned scout from the frontier valleys who survived the siege of Ash and knows every hidden passage through the mountain range.'
    );
    // Scratchpad Idea: 30 words (Ad-hoc ideas - NOT part of manuscript scenes)
    await fs.writeFile(
      ideaFile,
      '# Idea: Subterranean Passage\n\nWhat if the passage is flooded with salt water during high tide? The heroes will need an underwater breathing glyph or wait for dawn.'
    );

    const sceneFiles = await fs.listFiles(scenesDir);
    expect(sceneFiles.length).toBe(2);

    // Initial total manuscript word count: Scene 1 (10) + Scene 2 (14) = 24 words
    const initialTotal = await computeManuscriptTotalWordCount(sceneFiles);
    expect(initialTotal).toBe(24);

    // Test Target Progress Percentage calculation
    const targetGoal = 100;
    const progressPct = Math.min(100, Math.round((initialTotal / targetGoal) * 100));
    expect(progressPct).toBe(24); // 24%

    // When the user edits Scene 2 in the editor, live word changes reflect immediately
    const liveDraft =
      'The ancient tower loomed high above the misty cliffs guarding secrets of lost ages. ' +
      'A violent gale swept through the ruins.'; // 7 additional words -> 14 + 7 = 21 words
    const liveTotal = await computeManuscriptTotalWordCount(sceneFiles, liveDraft, scene2);
    expect(liveTotal).toBe(31); // 10 + 21 = 31 words
    expect(Math.round((liveTotal / targetGoal) * 100)).toBe(31);

    // When the user edits a scratchpad note or character file in the editor, it does NOT inflate manuscript target progress
    const scratchpadDraft = 'Drafting lots of extra notes in the idea scratchpad note...';
    const totalWhileViewingIdea = await computeManuscriptTotalWordCount(sceneFiles, scratchpadDraft, ideaFile);
    expect(totalWhileViewingIdea).toBe(24); // Remains exact manuscript sum
  });

  it('correctly classifies document categories for scene, character, world, and scratchpad files', () => {
    expect(getDocumentCategory('scenes/01-chapter-1.md')).toBe('scene');
    expect(getDocumentCategory(`novels/${activeNovelId}/scenes/02-chapter-2.md`)).toBe('scene');
    expect(getDocumentCategory(`novels/${activeNovelId}/bible/characters/elena.md`)).toBe('character');
    expect(getDocumentCategory(`novels/${activeNovelId}/bible/world/citadel.md`)).toBe('world');
    expect(getDocumentCategory(`novels/${activeNovelId}/scratchpad/idea-belltower.md`)).toBe('scratchpad');
    expect(getDocumentCategory('scratchpad/my-plot-twist.md')).toBe('scratchpad');

    expect(isScratchpadDocument(`novels/${activeNovelId}/scratchpad/idea-belltower.md`)).toBe(true);
    expect(isScratchpadDocument(`novels/${activeNovelId}/scenes/01-chapter-1.md`)).toBe(false);

    expect(isCharacterOrWorldDocument(`novels/${activeNovelId}/scratchpad/idea.md`)).toBe(false);
    expect(isCharacterOrWorldDocument(`novels/${activeNovelId}/bible/characters/elena.md`)).toBe(true);
  });

  it('creates scratchpad idea files with appropriate templates and names', async () => {
    // Test normal title
    const path1 = await createScratchpadIdea('Ancient Crypt Key', 0);
    expect(path1).toBe(`${scratchpadDir}/ancient-crypt-key.md`);
    const content1 = await fs.readFile(path1);
    expect(content1).toContain('# Idea: Ancient Crypt Key');
    expect(content1).toContain('- **Status**: Rough Concept');
    expect(content1).toContain('- **Summary**: Ad-hoc idea for reference and exploration.');

    // Test fallback when title is blank
    const path2 = await createScratchpadIdea('   ', 1);
    expect(path2).toContain(`${scratchpadDir}/idea-2.md`);
    const content2 = await fs.readFile(path2);
    expect(content2).toContain('# Idea: Idea 2');

    // Test listFiles detects scratchpad files
    const scratchpadFiles = await fs.listFiles(scratchpadDir);
    expect(scratchpadFiles.length).toBe(2);
    expect(scratchpadFiles.map((f) => f.name)).toContain('ancient-crypt-key.md');
    expect(scratchpadFiles.map((f) => f.name)).toContain('idea-2.md');
  });
});
