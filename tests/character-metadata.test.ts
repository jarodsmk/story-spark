import { describe, it, expect } from 'vitest';
import {
  parseCharacterMetadata,
  serializeCharacterMetadata,
  createDefaultCharacterMetadata,
} from '../src/engine/lore/characterMetadata.ts';

describe('Character Metadata Engine', () => {
  it('parses an existing starter character markdown file with attributes', () => {
    const markdown = `# Character: Kaelen Vance

- **Role**: Protagonist / Reluctant Scout
- **Age**: 24
- **Appearance**: Tall, lean, weathered hands, dark hair cropped short.
- **Goal**: Deliver the encrypted atlas before the Grand Inquisitor seals the gates.`;

    const meta = parseCharacterMetadata('bible/characters/kaelen.md', markdown);

    expect(meta.name).toBe('Kaelen Vance');
    expect(meta.role).toBe('Protagonist / Reluctant Scout');
    expect(meta.age).toBe('24');
    expect(meta.appearance).toBe('Tall, lean, weathered hands, dark hair cropped short.');
    expect(meta.goal).toBe('Deliver the encrypted atlas before the Grand Inquisitor seals the gates.');
    expect(meta.status).toBe('Active');
  });

  it('parses extended character metadata with custom attributes and notes', () => {
    const markdown = `# Character: Mara Lin

- **Role**: Data courier & rogue cybernetics technician
- **Status**: Fugitive
- **Archetype**: Rebel Specialist
- **Age**: 28
- **Aliases**: Ghost Wire, Iris
- **Appearance**: Synthetic iris on the left eye, frayed trench coat, neural shunt port behind ear.
- **Goal**: Deliver the unregistered biocoding package before corporate bounty hunters catch her.
- **Conflict**: Distrust of corporate authority and phantom optical glitches.
- **Stakes**: Total memory wipe or forced neural reconfiguration.
- **Affiliation**: Free Transmitters Guild
- **Relationships**: Jax (Tech Operator ally), Victor Crane (Hostile Broker)
- **Tags**: cyberpunk, courier, synthetic, stealth
- **Summary**: Skilled data courier with a classified synthetic optical implant.
- **Cyberware**: Mk-IV Ocular Sensor
- **Preferred Weapon**: Sub-sonic pulse pistol

## Notes & Backstory

Mara was recruited into the Free Transmitters after escaping the Neo-Bayou labs.
Her primary vulnerability is neural feedback during solar flares.`;

    const meta = parseCharacterMetadata('novels/cyber/bible/characters/mara.md', markdown);

    expect(meta.name).toBe('Mara Lin');
    expect(meta.role).toBe('Data courier & rogue cybernetics technician');
    expect(meta.status).toBe('Fugitive');
    expect(meta.archetype).toBe('Rebel Specialist');
    expect(meta.age).toBe('28');
    expect(meta.aliases).toBe('Ghost Wire, Iris');
    expect(meta.affiliation).toBe('Free Transmitters Guild');
    expect(meta.tags).toBe('cyberpunk, courier, synthetic, stealth');
    expect(meta.notes).toContain('Mara was recruited into the Free Transmitters');
    expect(meta.notes).toContain('solar flares');

    expect(meta.customAttributes).toHaveLength(2);
    expect(meta.customAttributes[0].key).toBe('Cyberware');
    expect(meta.customAttributes[0].value).toBe('Mk-IV Ocular Sensor');
    expect(meta.customAttributes[1].key).toBe('Preferred Weapon');
    expect(meta.customAttributes[1].value).toBe('Sub-sonic pulse pistol');
  });

  it('serializes metadata and allows perfect round-trip parsing', () => {
    const initial = createDefaultCharacterMetadata('Sarah Connor', 'bible/characters/sarah.md');
    initial.role = 'Protagonist / Resistance Leader';
    initial.status = 'Active';
    initial.archetype = 'Warrior Mother';
    initial.age = '32';
    initial.aliases = 'The Mother of the Future';
    initial.appearance = 'Athletic, tactical fatigue pants, aviator glasses';
    initial.goal = 'Prevent Judgment Day and protect John Connor';
    initial.conflict = 'Haunted by visions of nuclear annihilation';
    initial.stakes = 'Extinction of the human species';
    initial.mannerisms = 'Direct gaze, hyper-vigilant scanning of rooms';
    initial.affiliation = 'Human Resistance';
    initial.relationships = 'John Connor (Son), Kyle Reese (Father of John)';
    initial.tags = 'action, sci-fi, survival';
    initial.summary = 'Toughened resistance fighter fighting to protect the future.';
    initial.customAttributes = [{ key: 'Combat Training', value: 'Guerrilla warfare & heavy weapons' }];
    initial.notes = 'Underwent intensive survivalist training across Central America.';

    const serialized = serializeCharacterMetadata(initial);
    expect(serialized).toContain('# Character: Sarah Connor');
    expect(serialized).toContain('- **Role**: Protagonist / Resistance Leader');
    expect(serialized).toContain('- **Combat Training**: Guerrilla warfare & heavy weapons');
    expect(serialized).toContain('## Notes & Backstory');
    expect(serialized).toContain('survivalist training');

    const roundtrip = parseCharacterMetadata('bible/characters/sarah.md', serialized);
    expect(roundtrip.name).toBe('Sarah Connor');
    expect(roundtrip.role).toBe('Protagonist / Resistance Leader');
    expect(roundtrip.status).toBe('Active');
    expect(roundtrip.archetype).toBe('Warrior Mother');
    expect(roundtrip.age).toBe('32');
    expect(roundtrip.customAttributes[0].key).toBe('Combat Training');
    expect(roundtrip.customAttributes[0].value).toBe('Guerrilla warfare & heavy weapons');
    expect(roundtrip.notes).toContain('Underwent intensive survivalist training');
  });
});
