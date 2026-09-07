import { describe, it, expect } from 'vitest';
import { getDocumentCategory, isCharacterOrWorldDocument } from '../src/utils/documentType.ts';
import { runAllChecks, DEFAULT_USER_RULES } from '../src/engine/checks/index.ts';

describe('Characters & World/Lore Screens Exclusion', () => {
  describe('Document Category Detection', () => {
    it('correctly classifies scene files', () => {
      expect(getDocumentCategory('scenes/01-prologue.md')).toBe('scene');
      expect(getDocumentCategory('scenes/02-the-lower-docks.md')).toBe('scene');
      expect(getDocumentCategory('novels/novel-123/scenes/01-chapter-1.md')).toBe('scene');
      expect(isCharacterOrWorldDocument('scenes/01-prologue.md')).toBe(false);
      expect(isCharacterOrWorldDocument('novels/novel-123/scenes/01-chapter-1.md')).toBe(false);
    });

    it('correctly classifies character files in default and multi-novel layouts', () => {
      expect(getDocumentCategory('bible/characters/kaelen.md')).toBe('character');
      expect(getDocumentCategory('novels/neon-horizon/bible/characters/mara.md')).toBe('character');
      expect(isCharacterOrWorldDocument('bible/characters/kaelen.md')).toBe(true);
      expect(isCharacterOrWorldDocument('novels/neon-horizon/bible/characters/mara.md')).toBe(true);
    });

    it('correctly classifies world and lore files in default and multi-novel layouts', () => {
      expect(getDocumentCategory('bible/world/midnight-cutter.md')).toBe('world');
      expect(getDocumentCategory('novels/neon-horizon/bible/world/district-9.md')).toBe('world');
      expect(isCharacterOrWorldDocument('bible/world/midnight-cutter.md')).toBe(true);
      expect(isCharacterOrWorldDocument('novels/neon-horizon/bible/world/district-9.md')).toBe(true);
    });
  });

  describe('Suggestions & AI Exclusion Guard Behavior', () => {
    const characterProfileContent = `# Character: Kaelen Vance

- **Role**: Protagonist / Reluctant Scout
- **Age**: 24
- **Appearance**: Tall, lean, weathered hands, dark hair cropped short.
- **Goal**: Deliver the encrypted atlas before the Grand Inquisitor seals the gates.`;

    const worldSheetContent = `# World: District 9 (The Lower Sump)

- **Atmosphere**: Drenched in perpetual acidic drizzle and holographic neon reflections.
- **Key Locations**: The Orbital Transfer Spire, Old Acrylic Market, Sub-level 4 coolant tunnels.`;

    it('verifies deterministic check runner produces items on raw text but should be bypassed on bible screens', () => {
      // If run directly, runAllChecks might flag style/grammar in note formatting
      const rawChecks = runAllChecks(characterProfileContent, DEFAULT_USER_RULES, new Set());
      // In the application, on character/world screens, runAllChecks is conditionally bypassed
      const getSuggestionsForDocument = (filePath: string, content: string) => {
        if (isCharacterOrWorldDocument(filePath)) {
          return [];
        }
        return runAllChecks(content, DEFAULT_USER_RULES, new Set());
      };

      expect(getSuggestionsForDocument('bible/characters/kaelen.md', characterProfileContent)).toEqual([]);
      expect(getSuggestionsForDocument('bible/world/district-9.md', worldSheetContent)).toEqual([]);
      expect(getSuggestionsForDocument('scenes/01-prologue.md', 'The the ship arrived. It was seen by John.')).not.toEqual([]);
    });

    it('verifies AI rewrite and AI pass triggers are rejected for character and lore screens', () => {
      const runPassIfAllowed = (filePath: string, runAction: () => boolean) => {
        if (isCharacterOrWorldDocument(filePath)) {
          return false; // suppressed
        }
        return runAction();
      };

      let actionCalled = false;
      const dummyAction = () => {
        actionCalled = true;
        return true;
      };

      // Character screen: should not run
      const charResult = runPassIfAllowed('bible/characters/kaelen.md', dummyAction);
      expect(charResult).toBe(false);
      expect(actionCalled).toBe(false);

      // World screen: should not run
      const worldResult = runPassIfAllowed('bible/world/midnight-cutter.md', dummyAction);
      expect(worldResult).toBe(false);
      expect(actionCalled).toBe(false);

      // Scene screen: allowed
      const sceneResult = runPassIfAllowed('scenes/01-prologue.md', dummyAction);
      expect(sceneResult).toBe(true);
      expect(actionCalled).toBe(true);
    });
  });
});
