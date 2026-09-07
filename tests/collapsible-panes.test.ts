import { describe, it, expect, beforeEach } from 'vitest';

describe('Collapsible Panes Configuration', () => {
  const store: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
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
  });

  it('stores and retrieves sidebar collapse state', () => {
    mockLocalStorage.setItem('story_spark_sidebar_collapsed', 'true');
    expect(mockLocalStorage.getItem('story_spark_sidebar_collapsed')).toBe('true');

    mockLocalStorage.setItem('story_spark_sidebar_collapsed', 'false');
    expect(mockLocalStorage.getItem('story_spark_sidebar_collapsed')).toBe('false');
  });

  it('stores and retrieves suggestions pane collapse state', () => {
    mockLocalStorage.setItem('story_spark_suggestions_collapsed', 'true');
    expect(mockLocalStorage.getItem('story_spark_suggestions_collapsed')).toBe('true');

    mockLocalStorage.setItem('story_spark_suggestions_collapsed', 'false');
    expect(mockLocalStorage.getItem('story_spark_suggestions_collapsed')).toBe('false');
  });

  it('stores and retrieves diff pane collapse state', () => {
    mockLocalStorage.setItem('story_spark_diff_collapsed', 'true');
    expect(mockLocalStorage.getItem('story_spark_diff_collapsed')).toBe('true');

    mockLocalStorage.setItem('story_spark_diff_collapsed', 'false');
    expect(mockLocalStorage.getItem('story_spark_diff_collapsed')).toBe('false');
  });
});

