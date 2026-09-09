import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Monitor } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'compact' | 'collapsed';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'sidebar',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // If already running in standalone PWA mode, suppress the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      // Show guided instructions for platforms where beforeinstallprompt is absent
      setShowGuideModal(true);
    }
  };

  if (variant === 'collapsed') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          title="Install StorySpark App"
          className={`p-2 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-900 transition-colors ${className}`}
        >
          <Download className="w-4 h-4" />
        </button>

        {showGuideModal && renderGuideModal()}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Install StorySpark on desktop or mobile home screen"
        className={`
          flex items-center space-x-2 w-full px-2.5 py-1.5 rounded-md text-xs font-medium
          text-stone-300 hover:text-amber-300 bg-stone-900/80 hover:bg-stone-800/90
          border border-stone-800/80 hover:border-amber-700/50 transition-all duration-150 group
          ${className}
        `}
      >
        <div className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400 group-hover:bg-amber-500/20">
          <Download className="w-3 h-3" />
        </div>
        <span className="truncate">Install Studio App</span>
        {isInstallable && (
          <span className="ml-auto text-[10px] bg-amber-950/80 text-amber-400 border border-amber-800/60 px-1.5 py-0.5 rounded font-mono">
            PWA
          </span>
        )}
      </button>

      {showGuideModal && renderGuideModal()}
    </>
  );

  function renderGuideModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-2xl space-y-4 text-stone-200 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-stone-100">Install StorySpark</h3>
                <p className="text-[11px] text-stone-400">Run as a standalone offline desktop or mobile app</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-stone-300">
            {isIOS ? (
              <div className="bg-stone-950/60 border border-stone-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-medium">
                  <Smartphone className="w-4 h-4" />
                  <span>iOS Safari Installation</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-stone-300">
                  <li>
                    Tap the <Share2 className="w-3.5 h-3.5 inline text-amber-400 mx-1" /> <strong>Share</strong> button in the Safari toolbar.
                  </li>
                  <li>
                    Scroll down and select <PlusSquare className="w-3.5 h-3.5 inline text-amber-400 mx-1" /> <strong>Add to Home Screen</strong>.
                  </li>
                  <li>
                    Tap <strong>Add</strong> in the top right corner.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="bg-stone-950/60 border border-stone-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-medium">
                  <Monitor className="w-4 h-4" />
                  <span>Desktop Chrome, Edge & Brave</span>
                </div>
                <p className="text-stone-300">
                  Look for the <strong>Install</strong> icon in your browser's address bar (on the right), or open the browser menu (<strong>⋮</strong>) and click <strong>"Install StorySpark"</strong>.
                </p>
              </div>
            )}

            <p className="text-[11px] text-stone-400 bg-stone-950/40 p-2.5 rounded border border-stone-800/60">
              ✓ Once installed, StorySpark launches in its own dedicated window without browser chrome, and works offline with local manuscript storage.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }
};
