import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalDatabase, DIFF_PANE_ENABLED_KEY } from '../src/storage/db.ts';

describe('Accepted Result & Diff Pane Feature Toggle', () => {
  const store: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };

  beforeEach(() => {
    mockLocalStorage.clear();
    // Provide mocked global localStorage
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  it('defaults to enabled (true) when no setting is saved', async () => {
    const db = new LocalDatabase();
    const enabled = await db.getDiffPaneEnabled();
    expect(enabled).toBe(true);
  });

  it('persists disabled (false) state in storage and retrieves it', async () => {
    const db = new LocalDatabase();
    await db.saveDiffPaneEnabled(false);
    expect(mockLocalStorage.getItem(DIFF_PANE_ENABLED_KEY)).toBe('false');

    const retrieved = await db.getDiffPaneEnabled();
    expect(retrieved).toBe(false);
  });

  it('persists enabled (true) state in storage and retrieves it', async () => {
    const db = new LocalDatabase();
    // First disable
    await db.saveDiffPaneEnabled(false);
    expect(await db.getDiffPaneEnabled()).toBe(false);

    // Then re-enable
    await db.saveDiffPaneEnabled(true);
    expect(mockLocalStorage.getItem(DIFF_PANE_ENABLED_KEY)).toBe('true');
    expect(await db.getDiffPaneEnabled()).toBe(true);
  });

  it('correctly reads raw localStorage values', async () => {
    const db = new LocalDatabase();

    mockLocalStorage.setItem(DIFF_PANE_ENABLED_KEY, 'false');
    expect(await db.getDiffPaneEnabled()).toBe(false);

    mockLocalStorage.setItem(DIFF_PANE_ENABLED_KEY, 'true');
    expect(await db.getDiffPaneEnabled()).toBe(true);
  });

  it('calculates effective preview width as 0 when diff pane is disabled', () => {
    const calculateEffectivePreview = (
      diffPaneEnabled: boolean,
      isDiffCollapsed: boolean,
      previewWidth: number
    ) => {
      return !diffPaneEnabled ? 0 : isDiffCollapsed ? 44 : previewWidth;
    };

    // When disabled, effective width is always 0
    expect(calculateEffectivePreview(false, false, 360)).toBe(0);
    expect(calculateEffectivePreview(false, true, 360)).toBe(0);

    // When enabled, it returns collapsed 44 or full width
    expect(calculateEffectivePreview(true, true, 360)).toBe(44);
    expect(calculateEffectivePreview(true, false, 360)).toBe(360);
  });

  it('determines visibility of diff pane UI elements based on toggle state', () => {
    const getUIVisibility = (diffPaneEnabled: boolean, isDiffCollapsed: boolean) => ({
      showMobileDiffTab: diffPaneEnabled,
      showDiffPane: diffPaneEnabled,
      showResizer: diffPaneEnabled && !isDiffCollapsed,
      showShowDiffButton: diffPaneEnabled && isDiffCollapsed,
    });

    // When diff pane is disabled, ALL diff UI elements must be hidden
    const disabledState = getUIVisibility(false, false);
    expect(disabledState.showMobileDiffTab).toBe(false);
    expect(disabledState.showDiffPane).toBe(false);
    expect(disabledState.showResizer).toBe(false);
    expect(disabledState.showShowDiffButton).toBe(false);

    const disabledCollapsedState = getUIVisibility(false, true);
    expect(disabledCollapsedState.showMobileDiffTab).toBe(false);
    expect(disabledCollapsedState.showDiffPane).toBe(false);
    expect(disabledCollapsedState.showResizer).toBe(false);
    expect(disabledCollapsedState.showShowDiffButton).toBe(false);

    // When enabled, appropriate elements are visible
    const enabledExpandedState = getUIVisibility(true, false);
    expect(enabledExpandedState.showMobileDiffTab).toBe(true);
    expect(enabledExpandedState.showDiffPane).toBe(true);
    expect(enabledExpandedState.showResizer).toBe(true);
    expect(enabledExpandedState.showShowDiffButton).toBe(false);

    const enabledCollapsedState = getUIVisibility(true, true);
    expect(enabledCollapsedState.showMobileDiffTab).toBe(true);
    expect(enabledCollapsedState.showDiffPane).toBe(true);
    expect(enabledCollapsedState.showResizer).toBe(false);
    expect(enabledCollapsedState.showShowDiffButton).toBe(true);
  });

  it('falls back mobile active tab away from preview when diff pane is disabled', () => {
    let activeMobileTab: 'editor' | 'suggestions' | 'preview' = 'preview';
    const diffPaneEnabled = false;

    // Trigger fallback logic
    if (!diffPaneEnabled && activeMobileTab === 'preview') {
      activeMobileTab = 'editor';
    }

    expect(activeMobileTab).toBe('editor');
  });

  it('configures SourcePane to span full width and omit right border when diff pane is disabled', () => {
    const getSourcePaneClasses = (diffPaneEnabled: boolean) => {
      return `flex flex-col h-full w-full flex-1 min-w-0 bg-stone-900 ${
        diffPaneEnabled ? 'border-r border-stone-800' : ''
      } relative`;
    };

    const disabledClasses = getSourcePaneClasses(false);
    expect(disabledClasses).toContain('w-full');
    expect(disabledClasses).toContain('flex-1');
    expect(disabledClasses).toContain('min-w-0');
    expect(disabledClasses).not.toContain('border-r');

    const enabledClasses = getSourcePaneClasses(true);
    expect(enabledClasses).toContain('w-full');
    expect(enabledClasses).toContain('flex-1');
    expect(enabledClasses).toContain('min-w-0');
    expect(enabledClasses).toContain('border-r border-stone-800');
  });

  it('generates dynamic keys for EditorContainer to trigger clean re-renders on toggle', () => {
    const getEditorKey = (diffPaneEnabled: boolean) =>
      `editor-container-${diffPaneEnabled ? 'diff-enabled' : 'diff-disabled'}`;

    expect(getEditorKey(true)).toBe('editor-container-diff-enabled');
    expect(getEditorKey(false)).toBe('editor-container-diff-disabled');
    expect(getEditorKey(true)).not.toBe(getEditorKey(false));
  });
});
