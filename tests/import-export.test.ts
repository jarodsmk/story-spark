import { describe, it, expect } from 'vitest';
import { 
  sanitizeFilename, 
  parseImportedDocument, 
  exportScene, 
  compileNovelManuscript,
  compileNovelText
} from '../src/engine/markdown/index.ts';
import { generateNovelPDF, cleanProseForExport } from '../src/engine/export/pdfExport.ts';
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

    it('compiles only the selected subset of scenes when user deselects scenes', () => {
      const allScenes: SceneDocument[] = [
        { id: '1', title: 'Chapter 1: The Outset', filename: '01.md', content: 'Beginning of journey.', order: 1 },
        { id: '2', title: 'Draft Deleted Scene', filename: '02.md', content: 'This should be omitted.', order: 2 },
        { id: '3', title: 'Chapter 2: The Forest', filename: '03.md', content: 'Deep in the woods.', order: 3 },
      ];

      // Author selects only Scene 1 and Scene 3
      const selectedScenes = [allScenes[0], allScenes[2]];
      const compiled = compileNovelManuscript(selectedScenes, [], false, {
        chapterHeadingStyle: 'numbered',
        sceneSeparator: 'divider',
      });

      expect(compiled).toContain('Chapter 1: The Outset');
      expect(compiled).toContain('Beginning of journey.');
      expect(compiled).toContain('Chapter 2: The Forest');
      expect(compiled).toContain('Deep in the woods.');
      expect(compiled).not.toContain('Draft Deleted Scene');
      expect(compiled).not.toContain('This should be omitted.');
      expect(compiled).toContain('---');
    });
  });

  describe('compileNovelText', () => {
    it('compiles clean plain text without markdown syntax and with clean headers and dividers', () => {
      const selectedScenes: SceneDocument[] = [
        {
          id: '1',
          title: '01-the-arrival',
          filename: '01.md',
          content: '# Header\n\n[Kaelen](bible/characters/kaelen.md) walked into **the mist**.',
          order: 1,
        },
        {
          id: '2',
          title: 'The Tavern',
          filename: '02.md',
          content: 'Warm fire crackled inside.',
          order: 2,
        },
      ];

      const txt = compileNovelText(selectedScenes, [], false, {
        novelTitle: 'Echoes of Mist',
        chapterHeadingStyle: 'numbered',
        sceneSeparator: 'asterisms',
      });

      expect(txt).toContain('ECHOES OF MIST');
      expect(txt).toContain('CHAPTER 1: THE-ARRIVAL');
      expect(txt).toContain('Kaelen walked into the mist.');
      expect(txt).not.toContain('[Kaelen](bible/characters/kaelen.md)');
      expect(txt).not.toContain('**the mist**');
      expect(txt).toContain('*   *   *');
      expect(txt).toContain('CHAPTER 2: THE TAVERN');
      expect(txt).toContain('Warm fire crackled inside.');
    });
  });

  describe('generateNovelPDF', () => {
    it('cleans prose properly for typesetting and PDF layout', () => {
      const dirty = '# Heading 1\n\n[Hero](characters/hero.md) drew his **silver sword** and looked *carefully*.\n\n> A dire whisper.';
      const clean = cleanProseForExport(dirty);
      expect(clean).not.toContain('# Heading 1');
      expect(clean).toContain('Hero drew his silver sword and looked carefully.');
      expect(clean).not.toContain('[');
      expect(clean).not.toContain('**');
      expect(clean).not.toContain('*carefully*');
      expect(clean).toContain('A dire whisper.');
    });

    it('generates a valid multi-page jsPDF instance for selected novel scenes', () => {
      const scenes = [
        {
          id: '1',
          title: 'The Great Expedition',
          content: 'The sea was quiet before dawn. Sailors prepared the sails in absolute silence.',
          order: 1,
        },
        {
          id: '2',
          title: 'The Lighthouse',
          content: 'From the tall tower, a lone light swept across the waves.',
          order: 2,
        },
      ];
      const bible = [
        {
          id: 'b1',
          name: 'Captain Jack',
          type: 'character',
          content: 'Seasoned navigator with a wooden compass.',
        },
      ];

      const pdf = generateNovelPDF({
        title: 'Voyage of the Sea Wolf',
        genre: 'Nautical Adventure',
        author: 'Jane Author',
        scenes,
        bibleEntities: bible,
        includeBibleAppendix: true,
        includeCoverPage: true,
        pageNumbers: true,
        fontFamily: 'times',
        chapterHeadingStyle: 'numbered',
        sceneSeparator: 'pagebreak',
      });

      expect(pdf).toBeDefined();
      const numPages = pdf.getNumberOfPages();
      // Should have cover page + chapter pages + appendix page
      expect(numPages).toBeGreaterThanOrEqual(3);

      const blob = pdf.output('blob');
      expect(blob).toBeDefined();
      expect(blob.size).toBeGreaterThan(1000);
      expect(blob.type).toContain('pdf');
    });
  });
});
