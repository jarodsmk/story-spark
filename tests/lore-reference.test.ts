import { describe, it, expect } from 'vitest';
import {
  parseLoreMarkdown,
  findLoreReferences,
  findMatchingLoreEntry,
  formatLoreReference,
  insertLoreReference,
  unlinkLoreReference,
  findWordBoundariesAtCursor,
  findReferenceAtCursor,
} from '../src/engine/lore/loreReference.ts';

describe('Lore and Character Referencing Engine', () => {
  it('parses character markdown files accurately', () => {
    const md = `# Character: Kaelen Vance

- **Role**: Protagonist / Reluctant Scout
- **Age**: 24
- **Appearance**: Tall, lean, weathered hands, dark hair cropped short.
- **Goal**: Deliver the encrypted atlas before the Grand Inquisitor seals the gates.`;

    const entry = parseLoreMarkdown('bible/characters/kaelen.md', md);
    expect(entry.name).toBe('Kaelen Vance');
    expect(entry.category).toBe('character');
    expect(entry.attributes['Role']).toBe('Protagonist / Reluctant Scout');
    expect(entry.attributes['Age']).toBe('24');
    expect(entry.summary).toContain('Protagonist / Reluctant Scout');
  });

  it('parses world and lore markdown files accurately', () => {
    const md = `# World: District 9 (The Lower Sump)

- **Atmosphere**: Drenched in perpetual acidic drizzle and holographic neon reflections.
- **Key Locations**: The Orbital Transfer Spire, Old Acrylic Market.`;

    const entry = parseLoreMarkdown('bible/world/district-9.md', md);
    expect(entry.name).toBe('District 9 (The Lower Sump)');
    expect(entry.category).toBe('world');
    expect(entry.attributes['Atmosphere']).toContain('perpetual acidic drizzle');
    expect(entry.summary).toContain('Atmosphere:');
  });

  it('detects lore and character markdown links in manuscript text', () => {
    const charEntry = parseLoreMarkdown(
      'bible/characters/kaelen.md',
      '# Character: Kaelen Vance\n- **Role**: Scout'
    );
    const loreEntry = parseLoreMarkdown(
      'bible/world/the-port.md',
      '# World: The Port\n- **Atmosphere**: Misty harbor'
    );

    const text = `The sky above [the port](bible/world/the-port.md) was grey. [Kaelen](bible/characters/kaelen.md) walked onward.`;
    const refs = findLoreReferences(text, [charEntry, loreEntry]);

    expect(refs).toHaveLength(2);
    expect(refs[0].anchorText).toBe('the port');
    expect(refs[0].targetPath).toBe('bible/world/the-port.md');
    expect(refs[0].entry?.name).toBe('The Port');

    expect(refs[1].anchorText).toBe('Kaelen');
    expect(refs[1].targetPath).toBe('bible/characters/kaelen.md');
    expect(refs[1].entry?.name).toBe('Kaelen Vance');
  });

  it('inserts and replaces selected text with a lore reference link', () => {
    const text = 'He knew Kaelen was waiting near the pier.';
    const start = text.indexOf('Kaelen');
    const end = start + 'Kaelen'.length;

    const { newText } = insertLoreReference(text, start, end, 'bible/characters/kaelen.md');
    expect(newText).toBe('He knew [Kaelen](bible/characters/kaelen.md) was waiting near the pier.');
  });

  it('unlinks an existing lore reference back to plain text', () => {
    const text = 'He knew [Kaelen](bible/characters/kaelen.md) was waiting.';
    const start = text.indexOf('[');
    const end = text.indexOf(')') + 1;

    const { newText, unlinkedText } = unlinkLoreReference(text, start, end);
    expect(unlinkedText).toBe('Kaelen');
    expect(newText).toBe('He knew Kaelen was waiting.');
  });

  it('finds word boundaries around a cursor', () => {
    const text = 'Kaelen walked slowly.';
    const boundary = findWordBoundariesAtCursor(text, 2);
    expect(boundary.word).toBe('Kaelen');
    expect(boundary.start).toBe(0);
    expect(boundary.end).toBe(6);
  });

  it('detects if a cursor is inside an existing lore reference', () => {
    const text = 'She asked [the courier](bible/characters/kaelen.md) for help.';
    const cursor = text.indexOf('courier');
    const ref = findReferenceAtCursor(text, cursor);

    expect(ref).not.toBeNull();
    expect(ref?.anchorText).toBe('the courier');
  });
});
