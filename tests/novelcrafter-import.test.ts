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

  it('correctly imports characters and world lore from subfolders containing entry.md and metadata.json', async () => {
    const zip = new JSZip();

    // Directory-based structure where each item is in a subfolder with entry.md and metadata.json
    zip.file(
      'characters/char-001/entry.md',
      `A cybernetic rogue operating in the lower wards of District 9.`
    );
    zip.file(
      'characters/char-001/metadata.json',
      JSON.stringify({
        name: 'Aria Vance',
        role: 'Infiltrator',
        status: 'Active',
        aliases: ['Ghost', 'Cipher'],
      })
    );

    zip.file(
      'characters/char-002/entry.md',
      `Former megacorp engineer turned underground hacker.`
    );
    zip.file(
      'characters/char-002/metadata.json',
      JSON.stringify({
        name: 'Vane Kross',
        role: 'Tech Specialist',
        status: 'Alive',
      })
    );

    // World / locations in subfolders
    zip.file(
      'world/locations/citadel/entry.md',
      `The central corporate megastructure piercing the cloud smog.`
    );
    zip.file(
      'world/locations/citadel/metadata.json',
      JSON.stringify({
        name: 'The High Citadel',
        atmosphere: 'Cold and imposing',
        type: 'location',
      })
    );

    // World / lore items in nested subfolders
    zip.file(
      'world/lore/magic/biocoding/entry.md',
      `Neural gene-editing algorithms used to enhance cognitive reflexes.`
    );
    zip.file(
      'world/lore/magic/biocoding/metadata.json',
      JSON.stringify({
        name: 'Biocoding Tech',
        category: 'magic',
      })
    );

    zip.file(
      'world/factions/syndicate/entry.md',
      `The shadow network governing the black markets.`
    );
    zip.file(
      'world/factions/syndicate/metadata.json',
      JSON.stringify({
        title: 'The Syndicate',
        tags: ['underworld', 'faction'],
      })
    );

    // Manuscript
    zip.file(
      'novel.md',
      `# Cyber Saga\n\n# Chapter 1: The Breach\n\nAria stepped into the rain.\n\n# Chapter 2: The Network\n\nVane monitored the data feed.`
    );

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const parsed = await parseNovelCrafterZip(zipBlob, 'CyberSaga.zip');

    // Verify parser iterated through subfolders and read names from metadata.json
    expect(parsed.characters.length).toBe(2);
    expect(parsed.characters.map(c => c.name)).toContain('Aria Vance');
    expect(parsed.characters.map(c => c.name)).toContain('Vane Kross');
    expect(parsed.characters.map(c => c.suggestedFilename)).toContain('aria-vance.md');
    expect(parsed.characters.map(c => c.suggestedFilename)).toContain('vane-kross.md');
    // Ensure none of the filenames or names are "entry" or "metadata"
    expect(parsed.characters.some(c => c.name.toLowerCase() === 'entry')).toBe(false);
    expect(parsed.characters.some(c => c.name.toLowerCase() === 'metadata')).toBe(false);

    // Verify character markdown content formatting with metadata attributes
    const ariaChar = parsed.characters.find(c => c.name === 'Aria Vance')!;
    expect(ariaChar.content).toContain('# Character: Aria Vance');
    expect(ariaChar.content).toContain('- **Role**: Infiltrator');
    expect(ariaChar.content).toContain('- **Status**: Active');
    expect(ariaChar.content).toContain('- **Aliases**: Ghost, Cipher');
    expect(ariaChar.content).toContain('cybernetic rogue');

    // Verify location was parsed from world/locations/citadel/
    expect(parsed.locations.length).toBe(1);
    const citadelLoc = parsed.locations[0];
    expect(citadelLoc.name).toBe('The High Citadel');
    expect(citadelLoc.suggestedFilename).toBe('loc-the-high-citadel.md');
    expect(citadelLoc.content).toContain('# Location: The High Citadel');
    expect(citadelLoc.content).toContain('- **Atmosphere**: Cold and imposing');
    expect(citadelLoc.content).toContain('megastructure');

    // Verify lore was parsed from nested world subfolders
    expect(parsed.lore.length).toBe(2);
    expect(parsed.lore.map(l => l.name)).toContain('Biocoding Tech');
    expect(parsed.lore.map(l => l.name)).toContain('The Syndicate');
    expect(parsed.lore.map(l => l.suggestedFilename)).toContain('lore-biocoding-tech.md');
    expect(parsed.lore.map(l => l.suggestedFilename)).toContain('lore-the-syndicate.md');

    // Execute filesystem import
    const initialNovels: Novel[] = [
      {
        id: 'default',
        title: 'My Project',
        genre: 'General Fiction',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const result = await executeNovelCrafterImport(
      parsed,
      {
        targetMode: 'new_novel',
        title: 'Cyber Saga',
        genre: 'Sci-Fi Cyberpunk',
        description: 'A deep cyberpunk adventure.',
        targetWordCount: 75000,
        splitScenes: true,
        importCharacters: true,
        importWorldLore: true,
      },
      initialNovels,
      'default'
    );

    expect(result.summary.charactersImported).toBe(2);
    expect(result.summary.locationsImported).toBe(1);
    expect(result.summary.loreImported).toBe(2);

    const novelId = result.novel.id;

    // Verify characters were written to bible/characters/
    const ariaFile = await fs.readFile(`novels/${novelId}/bible/characters/aria-vance.md`);
    expect(ariaFile).toContain('# Character: Aria Vance');
    expect(ariaFile).toContain('- **Role**: Infiltrator');

    const vaneFile = await fs.readFile(`novels/${novelId}/bible/characters/vane-kross.md`);
    expect(vaneFile).toContain('# Character: Vane Kross');

    // Verify location was written to bible/world/
    const citadelFile = await fs.readFile(`novels/${novelId}/bible/world/loc-the-high-citadel.md`);
    expect(citadelFile).toContain('# Location: The High Citadel');

    // Verify lore was written to bible/world/
    const biocodingFile = await fs.readFile(`novels/${novelId}/bible/world/lore-biocoding-tech.md`);
    expect(biocodingFile).toContain('# Lore: Biocoding Tech');

    const syndicateFile = await fs.readFile(`novels/${novelId}/bible/world/lore-the-syndicate.md`);
    expect(syndicateFile).toContain('# Lore: The Syndicate');
  });

  it('handles codex-only exports where no novel.md is included', async () => {
    const zip = new JSZip();

    zip.file(
      'characters/protagonist/entry.md',
      `The chosen one who can communicate with the stars.`
    );
    zip.file(
      'characters/protagonist/metadata.json',
      JSON.stringify({ name: 'Solara', role: 'Stargazer' })
    );

    zip.file(
      'world/places/sanctuary/entry.md',
      `The secluded temple on the mountaintop.`
    );
    zip.file(
      'world/places/sanctuary/metadata.json',
      JSON.stringify({ name: 'Starlight Sanctuary', type: 'location' })
    );

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const parsed = await parseNovelCrafterZip(zipBlob, 'CodexExport.zip');

    expect(parsed.scenes.length).toBe(0);
    expect(parsed.characters.length).toBe(1);
    expect(parsed.characters[0].name).toBe('Solara');
    expect(parsed.locations.length).toBe(1);
    expect(parsed.locations[0].name).toBe('Starlight Sanctuary');

    const result = await executeNovelCrafterImport(
      parsed,
      {
        targetMode: 'new_novel',
        title: 'Starlight Codex',
        genre: 'Epic Fantasy',
        description: 'Bible import only.',
        targetWordCount: 50000,
        splitScenes: true,
        importCharacters: true,
        importWorldLore: true,
      },
      [],
      'default'
    );

    expect(result.summary.charactersImported).toBe(1);
    expect(result.summary.locationsImported).toBe(1);
    expect(result.summary.scenesImported).toBe(1); // Provided starter chapter for new novel
  });
});
