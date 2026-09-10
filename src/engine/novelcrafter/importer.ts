import { fs } from '../../storage/fs.ts';
import { db } from '../../storage/db.ts';
import { Novel } from '../../types/index.ts';
import { sanitizeFilename } from '../markdown/index.ts';
import { NovelCrafterParseResult } from './index.ts';

export interface NovelCrafterImportOptions {
  targetMode: 'new_novel' | 'active_novel';
  title: string;
  genre: string;
  description: string;
  targetWordCount: number;
  splitScenes: boolean;
  importCharacters: boolean;
  importWorldLore: boolean;
}

export interface NovelCrafterImportSummary {
  novelId: string;
  novelTitle: string;
  isNewNovel: boolean;
  scenesImported: number;
  charactersImported: number;
  locationsImported: number;
  loreImported: number;
  totalWords: number;
  firstScenePath: string;
}

export async function executeNovelCrafterImport(
  parsed: NovelCrafterParseResult,
  options: NovelCrafterImportOptions,
  currentNovels: Novel[],
  activeNovelId: string
): Promise<{ novel: Novel; updatedNovels: Novel[]; summary: NovelCrafterImportSummary }> {
  const isNewNovel = options.targetMode === 'new_novel';
  let targetNovelId: string;
  let targetNovel: Novel;
  let updatedNovels: Novel[];

  if (isNewNovel) {
    const slug = sanitizeFilename(options.title.toLowerCase()) || 'novel';
    targetNovelId = `${slug}-${Date.now().toString(36)}`;
    const now = Date.now();
    targetNovel = {
      id: targetNovelId,
      title: options.title.trim() || 'Imported Novel',
      genre: options.genre || 'General Fiction',
      description: options.description.trim() || '',
      targetWordCount: options.targetWordCount || 50000,
      createdAt: now,
      updatedAt: now,
    };
    updatedNovels = [...currentNovels, targetNovel];
  } else {
    targetNovelId = activeNovelId;
    const existing = currentNovels.find(n => n.id === activeNovelId) || currentNovels[0];
    targetNovel = {
      ...existing,
      updatedAt: Date.now(),
    };
    updatedNovels = currentNovels.map(n => n.id === activeNovelId ? targetNovel : n);
  }

  // Determine target directories
  const isDefaultRoot = targetNovelId === 'default';
  const scenesDir = isDefaultRoot ? 'scenes/' : `novels/${targetNovelId}/scenes/`;
  const charDir = isDefaultRoot ? 'bible/characters/' : `novels/${targetNovelId}/bible/characters/`;
  const worldDir = isDefaultRoot ? 'bible/world/' : `novels/${targetNovelId}/bible/world/`;

  let scenesImported = 0;
  let firstScenePath = '';

  // 1. Write Scenes
  if (options.splitScenes && parsed.scenes.length > 0) {
    for (let i = 0; i < parsed.scenes.length; i++) {
      const scene = parsed.scenes[i];
      const filePath = `${scenesDir}${scene.suggestedFilename}`;
      await fs.writeFile(filePath, scene.content);
      scenesImported++;
      if (i === 0) firstScenePath = filePath;
    }
  } else if (parsed.scenes.length > 0 || parsed.rawNovelMd) {
    const fullContent = parsed.rawNovelMd || (parsed.scenes.map(s => s.content).join('\n\n---\n\n'));
    const filePath = `${scenesDir}01-novel.md`;
    await fs.writeFile(filePath, fullContent);
    scenesImported = 1;
    firstScenePath = filePath;
  } else if (isNewNovel) {
    // For a brand new novel with only bible/codex imported, provide a starter scene
    const filePath = `${scenesDir}01-chapter-1.md`;
    await fs.writeFile(filePath, `# Chapter 1\n\nBegin your novel here...`);
    scenesImported = 1;
    firstScenePath = filePath;
  }

  // 2. Write Characters
  let charactersImported = 0;
  if (options.importCharacters && parsed.characters.length > 0) {
    for (const char of parsed.characters) {
      const filePath = `${charDir}${char.suggestedFilename}`;
      await fs.writeFile(filePath, char.content);
      charactersImported++;
    }
  }

  // 3. Write Locations & Lore into World
  let locationsImported = 0;
  let loreImported = 0;
  if (options.importWorldLore) {
    for (const loc of parsed.locations) {
      const filePath = `${worldDir}${loc.suggestedFilename}`;
      await fs.writeFile(filePath, loc.content);
      locationsImported++;
    }
    for (const item of parsed.lore) {
      const filePath = `${worldDir}${item.suggestedFilename}`;
      await fs.writeFile(filePath, item.content);
      loreImported++;
    }
  }

  // If firstScenePath is still empty, fall back to existing scene or first imported item
  if (!firstScenePath) {
    const existingScenes = await fs.listFiles(scenesDir);
    if (existingScenes.length > 0) {
      firstScenePath = existingScenes[0].path;
    } else if (parsed.characters.length > 0 && options.importCharacters) {
      firstScenePath = `${charDir}${parsed.characters[0].suggestedFilename}`;
    } else if (parsed.locations.length > 0 && options.importWorldLore) {
      firstScenePath = `${worldDir}${parsed.locations[0].suggestedFilename}`;
    } else if (parsed.lore.length > 0 && options.importWorldLore) {
      firstScenePath = `${worldDir}${parsed.lore[0].suggestedFilename}`;
    } else {
      firstScenePath = `${scenesDir}01-chapter-1.md`;
    }
  }

  // Save database state
  await db.saveNovels(updatedNovels);
  await db.setActiveNovelId(targetNovelId);

  const summary: NovelCrafterImportSummary = {
    novelId: targetNovelId,
    novelTitle: targetNovel.title,
    isNewNovel,
    scenesImported,
    charactersImported,
    locationsImported,
    loreImported,
    totalWords: parsed.totalWordCount,
    firstScenePath,
  };

  return {
    novel: targetNovel,
    updatedNovels,
    summary,
  };
}
