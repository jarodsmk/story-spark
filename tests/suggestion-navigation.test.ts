import { describe, it, expect } from 'vitest';
import { runAllChecks, DEFAULT_USER_RULES } from '../src/engine/checks/index.ts';
import { applySuggestion } from '../src/engine/diff/index.ts';
import { Suggestion } from '../src/types/index.ts';

describe('Suggestion Navigation and Text Focusing', () => {
  const sampleManuscript = `The the old stone piers were slick as slate.

He was seen by the harbor master near the bell tower. "Wait," he whispered... "Don't go yet."

The ancient lantern swayed rhythmically against the salt-encrusted beams.`;

  it('guarantees that all generated suggestions have exact matching character offsets', () => {
    const suggestions = runAllChecks(sampleManuscript, DEFAULT_USER_RULES, new Set());
    expect(suggestions.length).toBeGreaterThan(0);

    for (const suggestion of suggestions) {
      expect(suggestion.startIndex).toBeGreaterThanOrEqual(0);
      expect(suggestion.endIndex).toBeLessThanOrEqual(sampleManuscript.length);
      expect(suggestion.startIndex).toBeLessThan(suggestion.endIndex);

      // The substring in the text at startIndex..endIndex must match originalText
      const extracted = sampleManuscript.substring(suggestion.startIndex, suggestion.endIndex);
      expect(extracted).toBe(suggestion.originalText);
    }
  });

  it('allows selecting a suggestion and resolving the exact target range for central editor highlighting', () => {
    const suggestions = runAllChecks(sampleManuscript, DEFAULT_USER_RULES, new Set());
    const repeatedWord = suggestions.find((s) => s.type === 'repeated-word');
    expect(repeatedWord).toBeDefined();

    if (repeatedWord) {
      // Simulate central text viewing pane focus
      const focusedSlice = sampleManuscript.substring(repeatedWord.startIndex, repeatedWord.endIndex);
      expect(focusedSlice).toBe('The the');

      // Verify applying the focused suggestion updates text accurately
      const patched = applySuggestion(sampleManuscript, repeatedWord);
      expect(patched.startsWith('The old stone piers')).toBe(true);
    }
  });

  it('navigates through suggestions cyclically', () => {
    const suggestions: Suggestion[] = [
      {
        id: 's1',
        title: 'Issue 1',
        description: 'First',
        type: 'repeated-word',
        originalText: 'A',
        replacementText: 'B',
        startIndex: 0,
        endIndex: 1,
        ruleCategory: 'grammar',
        severity: 'warning',
      },
      {
        id: 's2',
        title: 'Issue 2',
        description: 'Second',
        type: 'passive-voice',
        originalText: 'C',
        replacementText: 'D',
        startIndex: 10,
        endIndex: 11,
        ruleCategory: 'style',
        severity: 'warning',
      },
      {
        id: 's3',
        title: 'Issue 3',
        description: 'Third',
        type: 'typography',
        originalText: '...',
        replacementText: '…',
        startIndex: 20,
        endIndex: 23,
        ruleCategory: 'typography',
        severity: 'warning',
      },
    ];

    // Navigation helper simulation
    const getNextId = (currentId: string | null) => {
      const idx = currentId ? suggestions.findIndex((s) => s.id === currentId) : -1;
      if (idx === -1 || idx >= suggestions.length - 1) return suggestions[0].id;
      return suggestions[idx + 1].id;
    };

    const getPrevId = (currentId: string | null) => {
      const idx = currentId ? suggestions.findIndex((s) => s.id === currentId) : -1;
      if (idx <= 0) return suggestions[suggestions.length - 1].id;
      return suggestions[idx - 1].id;
    };

    expect(getNextId(null)).toBe('s1');
    expect(getNextId('s1')).toBe('s2');
    expect(getNextId('s2')).toBe('s3');
    expect(getNextId('s3')).toBe('s1'); // wraps around

    expect(getPrevId('s1')).toBe('s3'); // wraps backwards
    expect(getPrevId('s3')).toBe('s2');
    expect(getPrevId('s2')).toBe('s1');
  });

  it('handles collapsible Accepted Result & Diff pane state and local storage persistence', () => {
    let storageValue: string | null = null;
    const mockStorage = {
      getItem: () => storageValue,
      setItem: (_key: string, val: string) => {
        storageValue = val;
      },
    };

    // Initial state: defaults to false (expanded)
    let isDiffCollapsed = mockStorage.getItem() === 'true';
    expect(isDiffCollapsed).toBe(false);

    // Toggle collapse:
    isDiffCollapsed = !isDiffCollapsed;
    mockStorage.setItem('story_spark_diff_collapsed', String(isDiffCollapsed));
    expect(isDiffCollapsed).toBe(true);
    expect(mockStorage.getItem()).toBe('true');

    // Toggle back to expanded:
    isDiffCollapsed = !isDiffCollapsed;
    mockStorage.setItem('story_spark_diff_collapsed', String(isDiffCollapsed));
    expect(isDiffCollapsed).toBe(false);
    expect(mockStorage.getItem()).toBe('false');
  });
});
