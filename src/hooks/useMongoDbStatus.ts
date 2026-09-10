import { useState, useEffect, useCallback } from 'react';
import { db, MongoDbStatus } from '../storage/db.ts';
import { fs } from '../storage/fs.ts';

export function useMongoDbStatus() {
  const [status, setStatus] = useState<MongoDbStatus>({
    connected: false,
    usingFallback: true,
    databaseName: 'storyspark',
    hasMongoUri: false,
    maskedUri: null,
    lastConnectedAt: null,
    lastError: null,
    pingTimeMs: null,
  });
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await db.checkDbStatus();
      setStatus(res);
    } catch {
      setStatus(prev => ({
        ...prev,
        connected: false,
        usingFallback: true,
        lastError: 'Network unreachable',
      }));
    } finally {
      setIsChecking(false);
    }
  }, []);

  const reconnect = useCallback(async (mongoUri?: string, dbName?: string) => {
    setIsReconnecting(true);
    try {
      const res = await db.reconnectDb(mongoUri, dbName);
      await checkStatus();
      return res;
    } finally {
      setIsReconnecting(false);
    }
  }, [checkStatus]);

  const syncAll = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fs.syncAllToRemote();
      if (res.success) {
        setLastSyncedAt(new Date());
      }
      return res;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();

    // Check status periodically every 30 seconds
    const interval = setInterval(() => {
      checkStatus();
    }, 30000);

    const handleOnline = () => {
      checkStatus();
      // Auto-sync when coming back online
      syncAll();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkStatus, syncAll]);

  return {
    status,
    isChecking,
    isSyncing,
    isReconnecting,
    lastSyncedAt,
    checkStatus,
    reconnect,
    syncAll,
  };
}
