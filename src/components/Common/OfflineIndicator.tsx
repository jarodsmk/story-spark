import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.ts';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center space-x-2.5 rounded-lg bg-stone-900/95 border border-amber-500/40 px-3 py-2 text-xs font-medium text-stone-200 shadow-xl backdrop-blur-xs animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="relative flex items-center justify-center">
        <WifiOff className="w-4 h-4 text-amber-400" />
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
      </div>
      <div>
        <span className="font-semibold text-amber-300">Offline Studio</span>
        <span className="hidden sm:inline text-stone-400 ml-1.5">— Local manuscript drafts & grammar checks active</span>
      </div>
    </div>
  );
};
