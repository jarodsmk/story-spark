import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../src/storage/db.ts';
import { fs } from '../src/storage/fs.ts';

describe('MongoDB Storage & Persistence Layer Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('persists and retrieves user rules via MongoDB API endpoints', async () => {
    const mockRules = [
      {
        id: 'rule-test-1',
        name: 'Custom Sentence Length',
        category: 'sentence-length' as const,
        enabled: true,
        threshold: 25,
        description: 'Flag long sentences',
      },
    ];

    const mockFetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/settings/storyspark_user_rules')) {
        if (options && options.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, key: 'storyspark_user_rules' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockRules,
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    global.fetch = mockFetch;

    await db.saveUserRules(mockRules);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/settings/storyspark_user_rules'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ value: mockRules }),
      })
    );

    const retrieved = await db.getUserRules();
    expect(retrieved).toEqual(mockRules);
  });

  it('persists and retrieves files through MongoDB API bridge with offline fallback', async () => {
    const testContent = '# Test Chapter\n\nPersisted to MongoDB.';
    const testPath = 'scenes/99-test.md';

    const mockFetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes(`/api/files/${testPath}`)) {
        if (options && options.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, path: testPath }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ path: testPath, content: testContent }),
        });
      }
      if (url.includes('/api/files?prefix=scenes%2F')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ path: testPath, content: testContent }],
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    global.fetch = mockFetch;

    // Write file
    await fs.writeFile(testPath, testContent);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/files/${testPath}`),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ content: testContent }),
      })
    );

    // Read file
    const content = await fs.readFile(testPath);
    expect(content).toBe(testContent);

    // List files
    const scenes = await fs.listFiles('scenes');
    expect(scenes.some(s => s.name === '99-test.md')).toBe(true);
  });
});
