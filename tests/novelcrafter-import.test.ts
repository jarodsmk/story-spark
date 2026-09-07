import { describe, it, expect, beforeEach } from 'vitest';
import JSZip from 'jszip';
import { parseNovelCrafterZip, splitNovelManuscript } from '../src/engine/novelcrafter/index.ts';
import { executeNovelCrafterImport } from '../src/engine/novelcrafter/importer.ts';
import { fs } from '../src/storage/fs.ts';
import { Novel } from '../src/types/index.ts';

describe('NovelCrafter ZIP Export & Import Engine', () => {
  beforeEach(async () => {
    // Clean up virtual filesystem
    fs.clear();
  });

  it('correctly splits novel.md manuscript into sequential chapters and scenes', () => {
    const rawManuscript = `# Cyber Chronicle

# Chapter 1: Neon Shadows
The rain drummed against the ferrocrete pavement in District 9. Aria adjusted her ocular dampener.

# Chapter 2: The Data Heist
The vault door hissed open with a cloud of cryogenic vapor. Vane slipped inside quietly.

# Chapter 3: Escape from Sector Zero
Alarms wailed across the upper towers. The sky was lit with search beacons.
`;

    const scenes = splitNovelManuscript(rawManuscript, 'Cyber Chronicle');

    expect(scenes.length).toBe(3);
    expect(scenes[0].title).toBe('Chapter 1: Neon Shadows');
    expect(scenes[0].suggestedFilename).toBe('01-chapter-1-neon-shadows.md');
    expect(scenes[0].content).toContain('District 9');
    expect(scenes[0].wordCount).toBeGreaterThan(10);

    expect(scenes[1].title).toBe('Chapter 2: The Data Heist');
    expect(scenes[1].suggestedFilename).toBe('02-chapter-2-the-data-heist.md');

    expect(scenes[2].title).toBe('Chapter 3: Escape from Sector Zero');
    expect(scenes[2].suggestedFilename).toBe('03-chapter-3-escape-from-sector-zero.md');
  });

  it('parses a complete NovelCrafter export archive with characters, locations, lore, codex, and novel.md', async () => {
    const zip = new JSZip();

    // Matching the exact structure in the screenshot:
    // characters/, locations/, lore/, codex.html, novel.md
    zip.file(
      'characters/Aria Vance.md',
      `# Aria Vance\n\n- Role: Infiltrator\n- Status: Active\n\nA cybernetic rogue operating in the lower wards.`
    );
    zip.file(
      'characters/Vane Kross.md',
      `# Vane Kross\n\n- Role: Tech Specialist\n\nFormer corp engineer turned renegade.`
    );
    zip.file(
      'locations/Neon Spire.md',
      `# Neon Spire\n\nThe central megastructure piercing the smog layer.`
    );
    zip.file(
      'lore/Biocoding Tech.md',
      `# Biocoding Tech\n\nNeural gene-editing algorithms used to enhance cognitive reflexes.`
    );
    zip.file(
      'codex.html',
      `<!DOCTYPE html><html><head><title>Cyber Chronicle Codex</title><meta name="description" content="A gritty cyberpunk saga."></head><body><h1>Codex</h1></body></html>`
    );
    zip.file(
      'novel.md',
      `# Cyber Chronicle\n\n# Chapter 1: The Inciting Breach\n\nSirens echoed through the steel corridors...\n\n# Chapter 2: The Underground Network\n\nDeep beneath the substations, rebel runners met in secret.`
    );

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const parsed = await parseNovelCrafterZip(zipBlob, 'CyberChronicle_Export.zip');

    expect(parsed.suggestedTitle).toBe('Cyber Chronicle');
    expect(parsed.suggestedGenre).toBe('Sci-Fi Cyberpunk');
    expect(parsed.hasCodexHtml).toBe(true);
    expect(parsed.scenes.length).toBe(2);
    expect(parsed.characters.length).toBe(2);
    expect(parsed.characters.map(c => c.name)).toContain('Aria Vance');
    expect(parsed.characters.map(c => c.name)).toContain('Vane Kross');
    expect(parsed.locations.length).toBe(1);
    expect(parsed.locations[0].name).toBe('Neon Spire');
    expect(parsed.lore.length).toBe(1);
    expect(parsed.lore[0].name).toBe('Biocoding Tech');
  });

  it('executes import into a new novel project in the filesystem', async () => {
    const zip = new JSZip();
    zip.file('characters/Hero.md', `# Hero\n\nMain protagonist.`);
    zip.file('locations/Citadel.md', `# Citadel\n\nFortress on the cliff.`);
    zip.file('lore/Ancient Runes.md', `# Ancient Runes\n\nMagical inscriptions.`);
    zip.file('novel.md', `# Chapter 1\n\nOnce upon a time in a high tower...`);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const parsed = await parseNovelCrafterZip(zipBlob, 'FantasyNovel.zip');

    const initialNovels: Novel[] = [
      {
        id: 'default',
        title: 'Existing Novel',
        genre: 'General Fiction',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const result = await executeNovelCrafterImport(
      parsed,
      {
        targetMode: 'new_novel',
        title: 'Fantasy Chronicles',
        genre: 'Epic Fantasy',
        description: 'An epic tale.',
        targetWordCount: 60000,
        splitScenes: true,
        importCharacters: true,
        importWorldLore: true,
      },
      initialNovels,
      'default'
    );

    expect(result.novel.title).toBe('Fantasy Chronicles');
    expect(result.updatedNovels.length).toBe(2);
    expect(result.summary.scenesImported).toBe(1);
    expect(result.summary.charactersImported).toBe(1);
    expect(result.summary.locationsImported).toBe(1);
    expect(result.summary.loreImported).toBe(1);

    // Verify files exist in filesystem
    const targetId = result.novel.id;
    const sceneContent = await fs.readFile(`novels/${targetId}/scenes/01-chapter-1.md`);
    expect(sceneContent).toContain('Once upon a time');

    const charContent = await fs.readFile(`novels/${targetId}/bible/characters/hero.md`);
    expect(charContent).toContain('Main protagonist');

    const locContent = await fs.readFile(`novels/${targetId}/bible/world/loc-citadel.md`);
    expect(locContent).toContain('Fortress on the cliff');

    const loreContent = await fs.readFile(`novels/${targetId}/bible/world/lore-ancient-runes.md`);
    expect(loreContent).toContain('Magical inscriptions');
  });
});
