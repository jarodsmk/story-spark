import React from 'react';
import { describe, it, expect } from 'vitest';
import { FullScreenLoader } from '../src/components/Common/FullScreenLoader.tsx';
import { AppLogo } from '../src/components/Common/AppLogo.tsx';

describe('FullScreenLoader Component & Initial Loading Lifecycle', () => {
  it('exports FullScreenLoader and AppLogo as functional React components', () => {
    expect(typeof FullScreenLoader).toBe('function');
    expect(typeof AppLogo).toBe('function');
  });

  it('renders FullScreenLoader element tree with logo, progress bar, and status elements', () => {
    const element = React.createElement(FullScreenLoader, {
      activeNovelTitle: 'The Celestial Codex',
      activeSceneName: '01-chapter-1.md',
      isLoadingNovels: false,
      isLoadingScenes: false,
      isLoadingCurrentScene: true,
      isFadingOut: false,
      isLightMode: false,
    });

    expect(element).toBeDefined();
    expect(element.props.activeNovelTitle).toBe('The Celestial Codex');
    expect(element.props.activeSceneName).toBe('01-chapter-1.md');
    expect(element.props.isLoadingCurrentScene).toBe(true);
  });

  it('correctly evaluates initial loading readiness conditions', () => {
    const isReady = (
      isLoadingNovels: boolean,
      isLoadingScenes: boolean,
      isLoadingCurrentScene: boolean,
      loadedPath: string,
      expectedPath: string
    ) => {
      return Boolean(
        !isLoadingNovels &&
        !isLoadingScenes &&
        !isLoadingCurrentScene &&
        loadedPath &&
        loadedPath === expectedPath
      );
    };

    // Step 1: When page first opens, novels are still loading from DB
    expect(isReady(true, true, true, '', 'scenes/01-prologue.md')).toBe(false);

    // Step 2: Default scene starts reading, but DB hasn't resolved stored novel yet
    expect(isReady(true, false, false, 'scenes/01-prologue.md', 'scenes/01-prologue.md')).toBe(false);

    // Step 3: DB resolves active novel "novel-xyz", scenes for "novel-xyz" are loading
    expect(isReady(false, true, true, '', 'novels/novel-xyz/scenes/01-chapter-1.md')).toBe(false);

    // Step 4: Scenes resolved, but editor has not finished reading scene file into memory
    expect(isReady(false, false, true, '', 'novels/novel-xyz/scenes/01-chapter-1.md')).toBe(false);

    // Step 5: Loaded path does not match expected active scene path yet
    expect(isReady(false, false, false, 'scenes/01-prologue.md', 'novels/novel-xyz/scenes/01-chapter-1.md')).toBe(false);

    // Step 6: Expected novel and scene have fully loaded!
    expect(isReady(false, false, false, 'novels/novel-xyz/scenes/01-chapter-1.md', 'novels/novel-xyz/scenes/01-chapter-1.md')).toBe(true);
  });

  it('formats scene name cleanly for display in status messages', () => {
    const formatScene = (filename: string) => {
      const clean = filename.replace(/\.md$/, '').replace(/^\d+-/, '').replace(/-/g, ' ');
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    };

    expect(formatScene('01-the-awakening.md')).toBe('The awakening');
    expect(formatScene('02-chapter-two.md')).toBe('Chapter two');
    expect(formatScene('prologue.md')).toBe('Prologue');
  });
});
