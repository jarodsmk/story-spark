import React, { useState } from 'react';
import { Database, RefreshCw, CheckCircle2, AlertTriangle, ArrowUpRight, HardDrive, Wifi, WifiOff, Server } from 'lucide-react';
import { useMongoDbStatus } from '../../hooks/useMongoDbStatus.ts';

export const DatabaseTab: React.FC = () => {
  const {
    status,
    isChecking,
    isSyncing,
    isReconnecting,
    lastSyncedAt,
    checkStatus,
    reconnect,
    syncAll,
  } = useMongoDbStatus();

  const [customUri, setCustomUri] = useState('');
  const [customDbName, setCustomDbName] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleManualSync = async () => {
    setSyncFeedback(null);
    const result = await syncAll();
    if (result.success) {
      setSyncFeedback(`Successfully synchronized ${result.syncedFilesCount} manuscript files and settings to MongoDB!`);
    } else {
      setSyncFeedback('Sync queued locally. Will retry when connected to MongoDB.');
    }
  };

  const handleReconnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncFeedback(null);
    const success = await reconnect(customUri || undefined, customDbName || undefined);
    if (success) {
      setSyncFeedback('Connected to MongoDB database successfully!');
      setShowConfig(false);
    } else {
      setSyncFeedback('Reconnection failed. Running in resilient local storage mode.');
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-800">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-stone-200 text-sm">MongoDB & PWA Persistence</span>
        </div>
        <button
          type="button"
          onClick={() => checkStatus()}
          disabled={isChecking}
          className="flex items-center space-x-1 px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition text-[11px] disabled:opacity-50 cursor-pointer"
          title="Refresh database connection status"
        >
          <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Connection Status Card */}
      <div className="p-3.5 rounded-lg border border-stone-800 bg-stone-950/40 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-stone-300">Connection State:</span>
          {status.connected ? (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>MongoDB Connected</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Local Offline Fallback</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-400">
          <div className="flex items-center space-x-2 bg-stone-900/60 p-2 rounded border border-stone-800/60">
            <Server className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
            <div className="truncate">
              <div className="text-[10px] text-stone-500 uppercase font-mono">Database</div>
              <div className="font-mono text-stone-200 truncate">{status.databaseName || 'storyspark'}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-stone-900/60 p-2 rounded border border-stone-800/60">
            <Wifi className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
            <div className="truncate">
              <div className="text-[10px] text-stone-500 uppercase font-mono">Latency / Ping</div>
              <div className="font-mono text-stone-200">
                {status.pingTimeMs !== null ? `${status.pingTimeMs} ms` : '—'}
              </div>
            </div>
          </div>
        </div>

        {status.maskedUri && (
          <div className="text-[11px] text-stone-400 bg-stone-900/60 p-2 rounded border border-stone-800/60 truncate">
            <span className="text-[10px] text-stone-500 uppercase font-mono block mb-0.5">MongoDB URI</span>
            <span className="font-mono text-stone-300">{status.maskedUri}</span>
          </div>
        )}

        {status.lastError && !status.connected && (
          <div className="text-[11px] text-amber-300 bg-amber-950/30 p-2 rounded border border-amber-800/50 flex items-start space-x-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Notice: </span>
              <span>{status.lastError}</span>
            </div>
          </div>
        )}

        {status.lastConnectedAt && (
          <div className="text-[10px] text-stone-500">
            Last verified connection: {new Date(status.lastConnectedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Sync Section */}
      <div className="p-3.5 rounded-lg border border-stone-800 bg-stone-950/40 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-stone-200">PWA Synchronization</div>
            <div className="text-[11px] text-stone-400">
              Synchronize all local manuscript chapters, bible entries, and settings directly with MongoDB.
            </div>
          </div>
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold text-xs transition disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync to MongoDB'}</span>
          </button>
        </div>

        {lastSyncedAt && (
          <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Last synchronized at {lastSyncedAt.toLocaleTimeString()}</span>
          </div>
        )}

        {syncFeedback && (
          <div className="text-[11px] text-amber-300 bg-stone-900/80 p-2 rounded border border-amber-500/30">
            {syncFeedback}
          </div>
        )}
      </div>

      {/* Manual Connection / Reconnect Toggle */}
      <div className="p-3.5 rounded-lg border border-stone-800 bg-stone-950/40 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-stone-200">MongoDB Connection Controls</div>
            <div className="text-[11px] text-stone-400">
              Force reconnect to the active cluster or configure a new connection string.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="px-2.5 py-1 text-stone-400 hover:text-stone-200 border border-stone-700 hover:border-stone-600 rounded text-[11px] transition cursor-pointer"
          >
            {showConfig ? 'Hide Config' : 'Configure URI'}
          </button>
        </div>

        {showConfig ? (
          <form onSubmit={handleReconnect} className="space-y-2 pt-2 border-t border-stone-800/80">
            <div>
              <label className="block text-[11px] text-stone-400 mb-1">MongoDB Connection String</label>
              <input
                type="text"
                value={customUri}
                onChange={(e) => setCustomUri(e.target.value)}
                placeholder="mongodb+srv://username:password@cluster.mongodb.net/..."
                className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">Database Name</label>
              <input
                type="text"
                value={customDbName}
                onChange={(e) => setCustomDbName(e.target.value)}
                placeholder="storyspark"
                className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isReconnecting}
                className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
              >
                {isReconnecting ? 'Connecting...' : 'Connect & Test'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-stone-400">Attempt immediate reconnection to configured MongoDB:</span>
            <button
              type="button"
              onClick={() => reconnect()}
              disabled={isReconnecting}
              className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isReconnecting ? 'Reconnecting...' : 'Reconnect Now'}
            </button>
          </div>
        )}
      </div>

      {/* Architecture Architecture Notice */}
      <div className="p-3 rounded-lg border border-stone-800/80 bg-stone-900/30 text-[11px] text-stone-400 space-y-1.5 leading-relaxed">
        <div className="font-semibold text-stone-300 flex items-center space-x-1.5">
          <HardDrive className="w-3.5 h-3.5 text-amber-400" />
          <span>Offline-First Architecture & Service Worker Bypass</span>
        </div>
        <p>
          StorySpark uses a resilient dual-layer storage model: the Progressive Web App caches the UI shell for instant offline loading, while all <code className="text-amber-300 font-mono bg-stone-950 px-1 py-0.5 rounded">/api/*</code> requests bypass the Service Worker directly to the MongoDB backend.
        </p>
        <p>
          If internet connection drops, you can continue writing uninterrupted with local backups. When connectivity is restored, all draft modifications automatically sync to your MongoDB cluster.
        </p>
      </div>
    </div>
  );
};
