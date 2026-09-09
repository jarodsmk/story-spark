import React from 'react';
import { Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useMongoDbStatus } from '../../hooks/useMongoDbStatus.ts';

interface MongoDbStatusIndicatorProps {
  variant?: 'sidebar' | 'collapsed';
  onOpenSettings?: () => void;
  className?: string;
}

export const MongoDbStatusIndicator: React.FC<MongoDbStatusIndicatorProps> = ({
  variant = 'sidebar',
  onOpenSettings,
  className = '',
}) => {
  const { status, isChecking, isSyncing, syncAll } = useMongoDbStatus();

  if (variant === 'collapsed') {
    return (
      <button
        type="button"
        id="collapsed-mongodb-status-btn"
        onClick={() => (onOpenSettings ? onOpenSettings() : syncAll())}
        title={
          status.connected
            ? `MongoDB Connected (${status.databaseName}) - Click to sync or manage`
            : `MongoDB Offline / Local Fallback - Click to manage`
        }
        className={`p-2 rounded transition-colors relative group cursor-pointer ${
          status.connected
            ? 'text-emerald-400 hover:text-emerald-300 hover:bg-stone-900'
            : 'text-amber-400 hover:text-amber-300 hover:bg-stone-900'
        } ${className}`}
      >
        <Database className="w-4 h-4" />
        <span
          className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-1 ring-stone-950 ${
            status.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
          }`}
        />
      </button>
    );
  }

  return (
    <div
      id="sidebar-mongodb-status-indicator"
      className={`px-2.5 py-1.5 rounded bg-stone-900/60 border border-stone-800/80 flex items-center justify-between text-[11px] select-none ${className}`}
    >
      <button
        type="button"
        onClick={onOpenSettings}
        title="Click to view MongoDB status & settings"
        className="flex items-center space-x-1.5 min-w-0 text-left cursor-pointer group flex-1"
      >
        <span className="relative flex h-2 w-2 flex-shrink-0">
          {status.connected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status.connected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </span>
        <span className="truncate font-mono text-[10px] text-stone-300 group-hover:text-amber-300 transition-colors">
          {status.connected ? `MongoDB: ${status.databaseName || 'connected'}` : 'Storage: Local Offline'}
        </span>
      </button>

      <button
        type="button"
        onClick={() => syncAll()}
        disabled={isSyncing || isChecking}
        title={isSyncing ? 'Syncing with MongoDB...' : 'Sync local manuscript to MongoDB'}
        className="p-1 text-stone-400 hover:text-amber-400 rounded hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0 ml-1"
      >
        {isSyncing ? (
          <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
        ) : status.connected ? (
          <CheckCircle2 className="w-3 h-3 text-emerald-400 hover:text-emerald-300" />
        ) : (
          <RefreshCw className="w-3 h-3 text-amber-400 hover:text-amber-300" />
        )}
      </button>
    </div>
  );
};
