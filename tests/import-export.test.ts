import { describe, it, expect } from 'vitest';
import { 
  sanitizeFilename, 
  parseImportedDocument, 
  exportScene, 
  compileNovelManuscript 
} from '../src/engine/markdown/index.ts';
import { SceneDocument, BibleEntity } from '../src/types/index.ts';

describe('Markdown & Safe File System Transformations', () => {
  describe('sanitizeFilename', () => {
    it('strips dangerous path traversal and Windows reserved characters', () => {
      const malicious = '../../etc/passwd.md';
      const clean = sanitizeFilename(malicious);
      expect(clean).not.toContain('..');
      expect(clean).not.toContain('/');

      const windowsInvalid = 'Chapter 1: The "Secret" <Docks>?*.md';
      const cleanWindows = sanitizeFilename(windowsInvalid);
      expect(cleanWindows).not.toContain(':');
      expect(cleanWindows).not.toContain('"');
      expect(cleanWindows).not.toContain('<');
      expect(cleanWindows).not.toContain('>');
      expect(cleanWindows).not.toContain('?');
      expect(cleanWindows).not.toContain('*');
    });
  });

  describe('parseImportedDocument', () => {
    it('extracts markdown title from # heading', () => {
      const content = '# Chapter 5: The High Tower\n\nThe stairs spiraled upward indefinitely.';
      const parsed = parseImportedDocument(content, 'test-import.md');
      expect(parsed.title).toBe('Chapter 5: The High Tower');
      expect(parsed.body).toBe('The stairs spiraled upward indefinitely.');
    });

    it('falls back to filename if no heading is present', () => {
      const content = 'Plain unformatted text without markdown headers.';
      const parsed = parseImportedDocument(content, 'untitled-note.txt');
      expect(parsed.title).toBe('untitled-note');
      expect(parsed.body).toBe(content);
    });
  });

  describe('exportScene', () => {
    const scene: SceneDocument = {
      id: 'scene-1',
      title: 'The Great Gate',
      filename: '01-great-gate.md',
      content: 'The hinges groaned loudly as the portcullis rose.',
      order: 1,
      synopsis: 'Kaelen arrives at the gate.',
    };

    it('exports markdown preserving title and synopsis', () => {
      const md = exportScene(scene, 'markdown');
      expect(md).toContain('# The Great Gate');
      expect(md).toContain('> Kaelen arrives at the gate.');
      expect(md).toContain('The hinges groaned loudly');
    });

    it('exports clean text format', () => {
      const txt = exportScene(scene, 'text');
      expect(txt).toContain('THE GREAT GATE');
      expect(txt).toContain('Summary: Kaelen arrives at the gate.');
      expect(txt).toContain('The hinges groaned loudly');
    });
  });

  describe('compileNovelManuscript', () => {
    it('orders scenes correctly and appends story bible appendix', () => {
      const scenes: SceneDocument[] = [
        { id: '2', title: 'Chapter 2', filename: '02.md', content: 'Scene two content.', order: 2 },
        { id: '1', title: 'Chapter 1', filename: '01.md', content: 'Scene one content.', order: 1 },
      ];
      const bible: BibleEntity[] = [
        { id: 'b1', type: 'character', name: 'Hero', filename: 'hero.md', content: 'Brave warrior.' }
      ];

      const compiled = compileNovelManuscript(scenes, bible, true);
      const posChap1 = compiled.indexOf('Chapter 1');
      const posChap2 = compiled.indexOf('Chapter 2');
      const posAppendix = compiled.indexOf('Appendix: Story Bible');

      expect(posChap1).toBeLessThan(posChap2);
      expect(posChap2).toBeLessThan(posAppendix);
      expect(compiled).toContain('Hero (CHARACTER)');
    });
  });
});
