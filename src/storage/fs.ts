import { sanitizeFilename } from '../engine/markdown/index.ts';

export interface FileItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
}

export const DEFAULT_STARTER_FILES: Record<string, string> = {
  'scenes/01-prologue.md': `# Prologue: The Whisper of Ash\n\nThe sky above the port was the color of television, tuned to a dead channel. It had been raining for three days straight, and the old stone piers were slick as oiled slate.\n\n[Kaelen](bible/characters/kaelen.md) pulled his wool coat tighter around his shivering shoulders. He had had enough of cold harbors and whispered promises from men who never kept their word. The letter was crumpled in his damp pocket, its wax seal cracked and broken.\n\n"Are you waiting for the [midnight cutter](bible/world/midnight-cutter.md)?" a voice rasped from the fog behind him.\n\nHe turned slowly. A woman with silver hair stood beneath the broken streetlamp.\n\n"I was told the courier would be alone," Kaelen whispered.\n\nShe laughed quietly. "In this city, boy, no one is ever truly alone."`,
  'scenes/02-the-lower-docks.md': `# Chapter 1: The Lower Docks\n\nThe tavern smelled of sour ale, wet dog, and burnt tallow candles. [Kaelen](bible/characters/kaelen.md) slipped into the booth farthest from the guttering hearth, keeping his back firmly pressed against the timber wall.\n\nAcross the room, sailors from the southern archipelago were drinking heavily and arguing over the price of salt.`,
  'bible/characters/kaelen.md': `# Character: Kaelen Vance\n\n- **Role**: Protagonist / Reluctant Scout\n- **Age**: 24\n- **Appearance**: Tall, lean, weathered hands, dark hair cropped short.\n- **Goal**: Deliver the encrypted atlas before the Grand Inquisitor seals the gates.`,
  'bible/world/midnight-cutter.md': `# World: The Midnight Cutter\n\n- **Type**: Vessel / Smuggling Ketch\n- **Atmosphere**: Black-hulled, muffled oarlocks, runs the fog line without imperial signal lights.\n- **Significance**: The sole clandestine escape craft ferrying refugees past the harbor blockades.`,
  'scratchpad/ancient-harbor-cipher.md': `# Idea: Ancient Harbor Cipher\n\n- **Status**: Key Clue\n- **Tags**: Harbor, Mystery, Cryptography\n- **Summary**: The encrypted atlas might align with the rhythmic flashing of the outer shoals buoy lights.\n\nWhat if the cipher isn't a parchment map, but an acoustic or optical sequence?\nKaelen could realize this while waiting for the Midnight Cutter at the lower docks.\n\nKey thoughts:\n- Connect the grandfather clock cadence with the lighthouse beam.\n- Inquisitor scouts know about the ink, but not the light sequence.`,
  'novels/neon-horizon/scenes/01-signal-in-the-rain.md': `# Chapter 1: Signal in the Rain\n\nThe neon glyphs of [District 9](novels/neon-horizon/bible/world/district-9.md) bled across the cracked acrylic pavement. [Mara](novels/neon-horizon/bible/characters/mara.md) adjusted her ocular filter, cutting through the chromatic glare of the orbital transport billboards.\n\nThe package in her trench coat buzzed with a low harmonic frequency—unregistered biocoding from the offshore labs.\n\n"Mara, you're being pinged on the secondary band," Jax warned through her auditory implant, his synthesized cadence ragged with interference.\n\n"I see them," she whispered, stepping beneath the dripping overhang of an abandoned ramen cart.`,
  'novels/neon-horizon/scenes/02-orbital-transfer.md': `# Chapter 2: Orbital Transfer\n\nThe mag-lev terminal vibrated beneath her boots. Across the departure concourse, corporate peacekeepers in matte-black armor were scanning retinal IDs.\n\nMara kept her chin down, her synthetic left iris calibrated to mimic standard civilian reflectance.`,
  'novels/neon-horizon/bible/characters/mara.md': `# Character: Mara Lin\n\n- **Role**: Data courier & rogue cybernetics technician\n- **Age**: 28\n- **Appearance**: Synthetic iris on the left eye, frayed trench coat, neural shunt port behind ear.\n- **Goal**: Deliver the unregistered biocoding package before the corporate bounty hunters triangulate her signal.`,
  'novels/neon-horizon/bible/world/district-9.md': `# World: District 9 (The Lower Sump)\n\n- **Atmosphere**: Drenched in perpetual acidic drizzle and holographic neon reflections.\n- **Key Locations**: The Orbital Transfer Spire, Old Acrylic Market, Sub-level 4 coolant tunnels.`,
  'novels/neon-horizon/scratchpad/neural-resonance-echo.md': `# Idea: Neural Resonance Echo\n\n- **Status**: Subplot Hook\n- **Tags**: Cybernetics, Lore, Mystery\n- **Summary**: The biocoding package emits harmonic resonance that triggers phantom memories in Mara's synthetic iris.\n\nWhenever the carrier wave surges, Mara catches glimpses of the lab where the optic prototype was assembled.\nCould lead to discovering who funded her extraction operation.`,
  'novels/neon-horizon/scenes/01-chapter-1.md': `# Chapter 1: Signal in the Rain\n\nThe neon glyphs of [District 9](novels/neon-horizon/bible/world/district-9.md) bled across the cracked acrylic pavement. [Mara](novels/neon-horizon/bible/characters/mara.md) adjusted her ocular filter, cutting through the chromatic glare of the orbital transport billboards.\n\nThe package in her trench coat buzzed with a low harmonic frequency—unregistered biocoding from the offshore labs.\n\n"Mara, you're being pinged on the secondary band," Jax warned through her auditory implant, his synthesized cadence ragged with interference.\n\n"I see them," she whispered, stepping beneath the dripping overhang of an abandoned ramen cart.`,
};

class LocalFilesystem {
  private isTauri: boolean;
  private memoryStore: Map<string, string> = new Map();
  private apiBaseUrl: string;

  constructor() {
    this.isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    this.apiBaseUrl = import.meta.env?.VITE_API_BASE_URL ?? '';
    this.initDefaultProject();
  }

  private initDefaultProject() {
    // 1. Preload defaults into memory store
    for (const [k, v] of Object.entries(DEFAULT_STARTER_FILES)) {
      this.memoryStore.set(k, v);
    }

    // 2. Hydrate from localStorage backup if present
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('storyspark_fs_backup') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string') {
            this.memoryStore.set(k, v);
          }
        }
      } catch (e) {
        console.error('Failed to parse local backup', e);
      }
    }

    // 3. Guarantee any missing default starter files are preserved
    for (const [k, v] of Object.entries(DEFAULT_STARTER_FILES)) {
      if (!this.memoryStore.has(k)) {
        this.memoryStore.set(k, v);
      }
    }

    this.persistStore();
  }

  private persistStore() {
    if (typeof localStorage === 'undefined') return;
    const obj: Record<string, string> = {};
    for (const [k, v] of this.memoryStore.entries()) {
      obj[k] = v;
    }
    localStorage.setItem('storyspark_fs_backup', JSON.stringify(obj));
  }

  async readFile(relativePath: string): Promise<string> {
    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<string>('read_novel_file', {
          baseDir: 'StorySparkProject',
          relativePath,
        });
      } catch (err) {
        console.warn('Tauri invoke failed, falling back:', err);
      }
    }

    // Attempt to fetch from MongoDB API
    try {
      const resp = await fetch(`${this.apiBaseUrl}/api/files/${relativePath}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data && typeof data.content === 'string') {
          this.memoryStore.set(relativePath, data.content);
          this.persistStore();
          return data.content;
        }
      }
    } catch {
      // Offline fallback
    }

    let content = this.memoryStore.get(relativePath);
    if (content === undefined) {
      if (DEFAULT_STARTER_FILES[relativePath]) {
        content = DEFAULT_STARTER_FILES[relativePath];
        this.memoryStore.set(relativePath, content);
        this.persistStore();
        return content;
      }
      throw new Error(`File not found: ${relativePath}`);
    }
    return content;
  }

  async writeFile(relativePath: string, content: string): Promise<boolean> {
    const cleanPath = relativePath.split('/').map(part => sanitizeFilename(part)).join('/');

    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('write_novel_file', {
          baseDir: 'StorySparkProject',
          relativePath: cleanPath,
          content,
        });
      } catch (err) {
        console.warn('Tauri invoke failed:', err);
      }
    }

    // Persist to MongoDB API
    try {
      await fetch(`${this.apiBaseUrl}/api/files/${cleanPath}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
    } catch {
      // Offline fallback
    }

    this.memoryStore.set(cleanPath, content);
    this.persistStore();
    return true;
  }

  async listFiles(categoryDir: string): Promise<FileItem[]> {
    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const items = await invoke<FileItem[]>('list_novel_files', {
          baseDir: 'StorySparkProject',
          relativePath: categoryDir,
        });
        if (items && items.length > 0) return items;
      } catch (err) {
        console.warn('Tauri list failed:', err);
      }
    }

    const prefix = categoryDir.endsWith('/') ? categoryDir : `${categoryDir}/`;

    // Attempt to list from MongoDB API
    try {
      const resp = await fetch(`${this.apiBaseUrl}/api/files?prefix=${encodeURIComponent(prefix)}`);
      if (resp.ok) {
        const files: Array<{ path: string; content?: string }> = await resp.json();
        if (Array.isArray(files) && files.length > 0) {
          const results: FileItem[] = [];
          for (const f of files) {
            if (f.path.startsWith(prefix)) {
              const filename = f.path.slice(prefix.length);
              if (!filename.includes('/')) {
                const len = f.content ? f.content.length : 0;
                results.push({
                  name: filename,
                  path: f.path,
                  is_dir: false,
                  size: len,
                });
                if (f.content !== undefined) {
                  this.memoryStore.set(f.path, f.content);
                }
              }
            }
          }
          if (results.length > 0) {
            this.persistStore();
            return results.sort((a, b) => a.name.localeCompare(b.name));
          }
        }
      }
    } catch {
      // Local fallback
    }

    const results: FileItem[] = [];
    for (const [path, content] of this.memoryStore.entries()) {
      if (path.startsWith(prefix)) {
        const filename = path.slice(prefix.length);
        if (!filename.includes('/')) {
          results.push({
            name: filename,
            path: path,
            is_dir: false,
            size: content.length,
          });
        }
      }
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  async deleteFile(relativePath: string): Promise<boolean> {
    if (this.isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('delete_novel_file', {
          baseDir: 'StorySparkProject',
          relativePath,
        });
      } catch (err) {
        console.warn('Tauri delete failed:', err);
      }
    }

    // Delete in MongoDB API
    try {
      await fetch(`${this.apiBaseUrl}/api/files/${relativePath}`, {
        method: 'DELETE',
      });
    } catch {
      // Local fallback
    }

    const res = this.memoryStore.delete(relativePath);
    this.persistStore();
    return res;
  }

  async deleteDirectory(prefix: string): Promise<void> {
    const cleanPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    const filesToDelete: string[] = [];
    for (const p of this.memoryStore.keys()) {
      if (p.startsWith(cleanPrefix)) {
        filesToDelete.push(p);
      }
    }
    for (const f of filesToDelete) {
      await this.deleteFile(f);
    }
  }

  getAllFiles(): Record<string, string> {
    const obj: Record<string, string> = {};
    for (const [k, v] of this.memoryStore.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  clear(): void {
    this.memoryStore.clear();
    this.initDefaultProject();
    this.persistStore();
  }
}

export const fs = new LocalFilesystem();
