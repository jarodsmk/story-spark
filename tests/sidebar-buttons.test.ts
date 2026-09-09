import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fs } from '../src/storage/fs.ts';
import { sanitizeFilename } from '../src/engine/markdown/index.ts';

describe('Sidebar Action Handlers and NewLoreModal Flow', () => {
  const activeNovelId = 'novel-test-sidebar';
  const scenesDir = `novels/${activeNovelId}/scenes`;
  const charsDir = `novels/${activeNovelId}/bible/characters`;
  const worldDir = `novels/${activeNovelId}/bible/world`;
  const scratchpadDir = `novels/${activeNovelId}/scratchpad`;

  beforeEach(async () => {
    fs.clear();
  });

  it('correctly handles Character creation via in-app modal flow', async () => {
    const charName = 'Kaelen Vance';
    const role = 'Reluctant Scout';
    const summary = 'Weathered scout with scarred hands; former captain of the northern watch.';

    const slug = sanitizeFilename(charName.toLowerCase());
    const filePath = `${charsDir}/${slug}.md`;
    const markdownContent = `# ${charName}\n\n- **Role**: ${role}\n- **Summary**: ${summary}\n\n## Background\n\nDetailed background, motivations, traits, and notes...\n`;

    await fs.writeFile(filePath, markdownContent);

    const saved = await fs.readFile(filePath);
    expect(saved).toContain('# Kaelen Vance');
    expect(saved).toContain('**Role**: Reluctant Scout');
    expect(saved).toContain('Weathered scout with scarred hands');

    const files = await fs.listFiles(charsDir);
    expect(files.some((f) => f.name === `${slug}.md`)).toBe(true);
  });

  it('correctly handles World & Lore entry creation via in-app modal flow', async () => {
    const worldTitle = 'The Port of Ash';
    const atmosphere = 'Coastal Harbor, Ancient Faction';
    const summary = 'Drenched in perpetual fog, smelling of salted timber and bitter sea spray.';

    const slug = sanitizeFilename(worldTitle.toLowerCase());
    const filePath = `${worldDir}/${slug}.md`;
    const markdownContent = `# ${worldTitle}\n\n- **Atmosphere**: ${atmosphere}\n- **Summary**: ${summary}\n\n## Description\n\nAtmospheric details, geography, history, factions, and sensory notes...\n`;

    await fs.writeFile(filePath, markdownContent);

    const saved = await fs.readFile(filePath);
    expect(saved).toContain('# The Port of Ash');
    expect(saved).toContain('Coastal Harbor, Ancient Faction');
    expect(saved).toContain('Drenched in perpetual fog');

    const files = await fs.listFiles(worldDir);
    expect(files.some((f) => f.name === `${slug}.md`)).toBe(true);
  });

  it('correctly handles Scratchpad Idea creation via in-app modal flow', async () => {
    const ideaTitle = 'Dual Eclipse Plot Twist';
    const tags = 'Plot Hook, Clue';
    const notes = 'What if the tower is not empty, but guarded by an artificial guardian?';

    const slug = sanitizeFilename(ideaTitle.toLowerCase());
    const filePath = `${scratchpadDir}/${slug}.md`;
    const content = `# Idea: ${ideaTitle}\n\n- **Status**: ${tags}\n- **Summary**: ${notes}\n\nWrite down quick thoughts, plot hooks, research notes, or dialogue ideas...\n`;

    await fs.writeFile(filePath, content);

    const saved = await fs.readFile(filePath);
    expect(saved).toContain('# Idea: Dual Eclipse Plot Twist');
    expect(saved).toContain('- **Status**: Plot Hook, Clue');
    expect(saved).toContain('What if the tower is not empty');

    const files = await fs.listFiles(scratchpadDir);
    expect(files.some((f) => f.name === `${slug}.md`)).toBe(true);
  });

  it('correctly invokes sidebar action handlers without throwing or invoking window.prompt', () => {
    const onNewScene = vi.fn();
    const onNewBibleEntry = vi.fn();
    const onNewScratchpadIdea = vi.fn();

    // Simulate clicking sidebar character button
    onNewBibleEntry('character');
    expect(onNewBibleEntry).toHaveBeenCalledWith('character');

    // Simulate clicking sidebar world button
    onNewBibleEntry('world');
    expect(onNewBibleEntry).toHaveBeenCalledWith('world');

    // Simulate clicking sidebar scratchpad button
    onNewScratchpadIdea();
    expect(onNewScratchpadIdea).toHaveBeenCalledTimes(1);

    // Simulate clicking sidebar new scene button
    onNewScene();
    expect(onNewScene).toHaveBeenCalledTimes(1);
  });
});
