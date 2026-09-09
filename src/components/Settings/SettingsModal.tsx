import React, { useState } from 'react';
import { UserRule, IgnoredTerm, LLMSettings, ThemeMode, AuthorProfile } from '../../types/index.ts';
import { X, Sliders, Palette, CheckCircle2, Columns, Layout, Feather } from 'lucide-react';
import { RulesTab } from './RulesTab.tsx';
import { AITab } from './AITab.tsx';
import { TermsTab } from './TermsTab.tsx';
import { AuthorTab } from './AuthorTab.tsx';
import { ThemeModeToggle } from '../Common/ThemeModeToggle.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: UserRule[];
  onSaveRules: (rules: UserRule[]) => void;
  ignoredTerms: IgnoredTerm[];
  onAddIgnoredTerm: (term: string) => void;
  onRemoveIgnoredTerm: (id: string) => void;
  llmSettings: LLMSettings;
  onSaveLLMSettings: (settings: LLMSettings) => void;
  authorProfile?: AuthorProfile;
  onSaveAuthorProfile?: (profile: AuthorProfile) => void;
  themeMode?: ThemeMode;
  onToggleThemeMode?: () => void;
  diffPaneEnabled?: boolean;
  onToggleDiffPane?: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules,
  ignoredTerms,
  onAddIgnoredTerm,
  onRemoveIgnoredTerm,
  llmSettings,
  onSaveLLMSettings,
  authorProfile,
  onSaveAuthorProfile,
  themeMode = 'dark',
  onToggleThemeMode,
  diffPaneEnabled = true,
  onToggleDiffPane,
}) => {
  const [tab, setTab] = useState<'appearance' | 'author' | 'rules' | 'ai' | 'terms'>('appearance');

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    onSaveRules(updated);
  };

  const isLight = themeMode === 'light';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-lg w-full max-w-lg flex flex-col shadow-2xl text-xs max-h-[95vh] sm:max-h-[90vh]">
        <div className="h-10 border-b border-stone-800 px-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-1.5 font-medium text-stone-200">
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>StorySpark Settings</span>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex border-b border-stone-800 px-2 bg-stone-950/40 flex-shrink-0 overflow-x-auto">
          {(['appearance', 'author', 'rules', 'ai', 'terms'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-1.5 px-3 border-b-2 font-medium capitalize cursor-pointer whitespace-nowrap ${tab === t ? 'border-amber-500 text-amber-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
            >
              {t === 'ai' ? 'BYOM' : t === 'appearance' ? 'Appearance & Layout' : t === 'author' ? 'Author Profile' : t}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {tab === 'appearance' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-stone-200 font-semibold text-sm">
                <Palette className="w-4 h-4 text-amber-500" />
                <span>Theme & Color Scheme</span>
              </div>

              {onToggleThemeMode && (
                <ThemeModeToggle
                  id="settings-theme-mode-toggle"
                  themeMode={themeMode}
                  onToggle={onToggleThemeMode}
                  variant="settings"
                />
              )}

              {/* Theme Palette Preview Swatches */}
              <div className="p-3.5 rounded-lg border border-stone-800 bg-stone-950/30 space-y-2.5">
                <div className="text-[11px] font-medium text-stone-300">
                  Active Palette Tokens ({isLight ? 'High-Contrast Light' : 'Dark Stone'})
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full h-7 rounded border border-stone-700 bg-stone-950 shadow-inner flex items-center justify-center text-[10px] text-stone-400 font-mono">950</div>
                    <span className="text-[9px] text-stone-400">Canvas</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full h-7 rounded border border-stone-700 bg-stone-900 shadow-inner flex items-center justify-center text-[10px] text-stone-400 font-mono">900</div>
                    <span className="text-[9px] text-stone-400">Panels</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full h-7 rounded border border-stone-700 bg-stone-800 shadow-inner flex items-center justify-center text-[10px] text-stone-400 font-mono">800</div>
                    <span className="text-[9px] text-stone-400">Borders</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full h-7 rounded border border-stone-700 bg-stone-700 shadow-inner flex items-center justify-center text-[10px] text-stone-200 font-mono">700</div>
                    <span className="text-[9px] text-stone-400">Muted</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full h-7 rounded border border-stone-700 bg-stone-100 shadow-inner flex items-center justify-center text-[10px] text-stone-900 font-mono font-bold">100</div>
                    <span className="text-[9px] text-stone-400">Text</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400 pt-1 border-t border-stone-800/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    {isLight
                      ? 'Inverted high-contrast variables applied to background, panels, borders, editor, and diff.'
                      : 'Deep dark-stone focus palette applied to background, panels, and typography.'}
                  </span>
                </div>
              </div>

              {/* Workspace Layout & Panes Feature Toggles */}
              <div className="pt-3 border-t border-stone-800/80 space-y-3">
                <div className="flex items-center gap-2 text-stone-200 font-semibold text-sm">
                  <Layout className="w-4 h-4 text-amber-500" />
                  <span>Workspace Panes & Layout</span>
                </div>

                <div className="p-3.5 rounded-lg border border-stone-800 bg-stone-950/30 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Columns className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-semibold text-stone-200 text-xs sm:text-sm">
                          Accepted Result & Diff Pane
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 leading-relaxed">
                        Split-screen side comparison displaying live differences, baseline diff markers, and accepted revision previews. When disabled, this pane and all diff controls are completely hidden from the workspace.
                      </p>
                    </div>

                    <button
                      type="button"
                      id="toggle-diff-pane-setting-btn"
                      role="switch"
                      aria-checked={diffPaneEnabled}
                      onClick={() => onToggleDiffPane?.(!diffPaneEnabled)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 ${
                        diffPaneEnabled ? 'bg-amber-600' : 'bg-stone-700'
                      }`}
                    >
                      <span className="sr-only">Toggle Accepted Result & Diff Pane</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          diffPaneEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-stone-800/70 text-[11px]">
                    <span className="text-stone-400">Status:</span>
                    <span
                      className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full text-[10px] ${
                        diffPaneEnabled
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                          : 'bg-stone-800/80 text-stone-400 border border-stone-700/50'
                      }`}
                    >
                      {diffPaneEnabled ? 'Enabled & Visible' : 'Disabled & Hidden'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {tab === 'author' && (
            <AuthorTab
              authorProfile={authorProfile}
              onSave={profile => onSaveAuthorProfile?.(profile)}
            />
          )}
          {tab === 'rules' && <RulesTab rules={rules} onToggle={handleToggle} />}
          {tab === 'ai' && <AITab settings={llmSettings} onSave={onSaveLLMSettings} />}
          {tab === 'terms' && <TermsTab terms={ignoredTerms} onAdd={onAddIgnoredTerm} onRemove={onRemoveIgnoredTerm} />}
        </div>
      </div>
    </div>
  );
};
