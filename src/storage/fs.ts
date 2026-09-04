import { sanitizeFilename } from '../engine/markdown/index.ts';

export interface FileItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
}

class LocalFilesystem {
  private isTauri: boolean;
  private memoryStore: Map<string, string> = new Map();
  private apiBaseUrl: string;

  constructor() {
    this.isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    this.apiBaseUrl = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3001';
    this.initDefaultProject();
  }

  private initDefaultProject() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('storyspark_fs_backup') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        for (const [k, v] of Object.entries(parsed)) {
          this.memoryStore.set(k, v as string);
        }
        return;
      } catch (e) {
        console.error('Failed to parse local backup', e);
      }
    }

    this.memoryStore.set(
      'scenes/01-prologue.md',
      `# Prologue: The Whisper of Ash\n\nThe sky above the port was the color of television, tuned to a dead channel. It had been raining for three days straight, and the the old stone piers were slick as oiled slate.\n\nKaelen pulled his wool coat tighter around his shivering shoulders. He had had enough of cold harbors and whispered promises from men who never kept their word. The letter was was crumpled in his damp pocket, its wax seal cracked and broken.\n\n"Are you waiting for the midnight cutter?" a voice rasped from the fog behind him.\n\nHe turned slowly. A woman with silver hair stood stood beneath the broken streetlamp.\n\n"I was told the courier would be alone," Kaelen whispered.\n\nShe laughed quietly. "In this city, boy, no one is ever truly alone."`
    );

    this.memoryStore.set(
      'scenes/02-the-lower-docks.md',
      `# Chapter 1: The Lower Docks\n\nThe tavern smelled of sour ale, wet dog, and burnt tallow candles. Kaelen slipped into the booth farthest from the guttering hearth, keeping his back firmly pressed against the timber wall.\n\nAcross the room, sailors from the southern archipelago were drinking heavily and arguing over the price of salt.`
    );

    this.memoryStore.set(
      'bible/characters/kaelen.md',
      `# Character: Kaelen Vance\n\n- **Role**: Protagonist / Reluctant Scout\n- **Age**: 24\n- **Appearance**: Tall, lean, weathered hands, dark hair cropped short.\n- **Goal**: Deliver the encrypted atlas before the Grand Inquisitor seals the gates.`
    );

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

    const content = this.memoryStore.get(relativePath);
    if (content === undefined) {
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

  getAllFiles(): Record<string, string> {
    const obj: Record<string, string> = {};
    for (const [k, v] of this.memoryStore.entries()) {
      obj[k] = v;
    }
    return obj;
  }
}

export const fs = new LocalFilesystem();
