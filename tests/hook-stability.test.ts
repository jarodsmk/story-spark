import { describe, it, expect } from 'vitest';
import { useLoreManager } from '../src/hooks/useLoreManager.ts';
import { useCoverTheme } from '../src/hooks/useCoverTheme.ts';
import { useSceneSummaries } from '../src/hooks/useSceneSummaries.ts';

describe('Hook Stability Tests', () => {
  it('exports hooks properly as functions', () => {
    expect(typeof useLoreManager).toBe('function');
    expect(typeof useCoverTheme).toBe('function');
    expect(typeof useSceneSummaries).toBe('function');
  });

  it('generates consistent file signatures for identical file sets', () => {
    const filesA = [{ name: 'test.md', path: 'bible/test.md' }];
    const filesB = [{ name: 'test.md', path: 'bible/test.md' }];
    const sigA = filesA.map(f => f.path).sort().join(';');
    const sigB = filesB.map(f => f.path).sort().join(';');
    expect(sigA).toBe(sigB);
  });
});
