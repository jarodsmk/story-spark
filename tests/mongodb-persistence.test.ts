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

  it('checks MongoDB connection status via /api/db/status', async () => {
    const mockStatus = {
      connected: true,
      usingFallback: false,
      databaseName: 'storyspark',
      hasMongoUri: true,
      maskedUri: 'mongodb://***@cluster',
      lastConnectedAt: new Date().toISOString(),
      lastError: null,
      pingTimeMs: 15,
    };

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/db/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockStatus,
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    global.fetch = mockFetch;

    const status = await db.checkDbStatus();
    expect(status.connected).toBe(true);
    expect(status.databaseName).toBe('storyspark');
    expect(status.pingTimeMs).toBe(15);
  });

  it('reconnects and synchronizes local PWA files to MongoDB via /api/db/sync', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/db/reconnect')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, connected: true, databaseName: 'storyspark' }),
        });
      }
      if (url.includes('/api/db/sync')) {
        const body = JSON.parse(options?.body || '{}');
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            syncedFilesCount: (body.files || []).length,
            syncedSettingsCount: 1,
          }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    global.fetch = mockFetch;

    const reconnectResult = await db.reconnectDb();
    expect(reconnectResult.connected).toBe(true);

    const syncResult = await fs.syncAllToRemote();
    expect(syncResult.success).toBe(true);
    expect(syncResult.syncedFilesCount).toBeGreaterThanOrEqual(1);
  });
});
