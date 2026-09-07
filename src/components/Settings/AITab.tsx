import React, { useState, useEffect, useMemo } from 'react';
import { LLMSettings } from '../../types/index.ts';
import {
  Shield,
  ExternalLink,
  RefreshCw,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Cpu,
  ChevronDown,
  ChevronUp,
  Server,
  Zap,
} from 'lucide-react';
import {
  PROVIDERS,
  ProviderOption,
  ModelOption,
  inferProvider,
  getProviderById,
  fetchLiveProviderModels,
} from '../../engine/ai/providers.ts';

interface AITabProps {
  settings: LLMSettings;
  onSave: (settings: LLMSettings) => void;
}

export const AITab: React.FC<AITabProps> = ({ settings, onSave }) => {
  const [local, setLocal] = useState<LLMSettings>(settings);

  // Determine current active provider
  const [selectedProviderId, setSelectedProviderId] = useState<string>(() => {
    const inferred = inferProvider(settings.baseUrl, settings.provider);
    return inferred.id;
  });

  const currentProvider: ProviderOption = useMemo(() => {
    return getProviderById(selectedProviderId);
  }, [selectedProviderId]);

  // Dynamic live-fetched models for this session
  const [liveModels, setLiveModels] = useState<Record<string, ModelOption[]>>({});
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Combined models for active provider: curated preset + any live fetched models
  const availableModels: ModelOption[] = useMemo(() => {
    const presets = currentProvider.models;
    const fetched = liveModels[currentProvider.id] || [];
    if (fetched.length === 0) return presets;

    // Merge without duplicates
    const presetIds = new Set(presets.map(m => m.id));
    const uniqueFetched = fetched.filter(m => !presetIds.has(m.id));
    return [...presets, ...uniqueFetched];
  }, [currentProvider, liveModels]);

  // Is the current model in the available list?
  const isCurrentModelInList = useMemo(() => {
    return availableModels.some(m => m.id === local.model);
  }, [availableModels, local.model]);

  // Is "Custom Model" input mode active?
  const [isCustomModelMode, setIsCustomModelMode] = useState<boolean>(() => {
    if (!settings.model) return false;
    const inferred = inferProvider(settings.baseUrl, settings.provider);
    return !inferred.models.some(m => m.id === settings.model);
  });

  const [customModelInput, setCustomModelInput] = useState<string>(() => {
    const inferred = inferProvider(settings.baseUrl, settings.provider);
    if (!inferred.models.some(m => m.id === settings.model)) {
      return settings.model;
    }
    return '';
  });

  // UI state
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    latency?: number;
  }>({ loading: false });

  // Keep local state synced if parent props change
  useEffect(() => {
    setLocal(settings);
    const inferred = inferProvider(settings.baseUrl, settings.provider);
    setSelectedProviderId(inferred.id);
    if (!inferred.models.some(m => m.id === settings.model)) {
      setIsCustomModelMode(true);
      setCustomModelInput(settings.model);
    }
  }, [settings]);

  // Handler when switching provider
  const handleProviderChange = (newProviderId: string) => {
    setSelectedProviderId(newProviderId);
    const newProv = getProviderById(newProviderId);

    // Pick first recommended model
    const defaultModel = newProv.models[0]?.id || 'custom';
    setIsCustomModelMode(false);
    setCustomModelInput('');
    setFetchError(null);
    setTestStatus({ loading: false });

    // Update settings with new provider and default base URL
    setLocal(prev => ({
      ...prev,
      provider: newProviderId,
      baseUrl: newProv.defaultBaseUrl,
      model: defaultModel,
    }));
  };

  // Handler when switching model in dropdown
  const handleModelSelectChange = (val: string) => {
    if (val === '__custom__') {
      setIsCustomModelMode(true);
      const targetModel = customModelInput.trim() || local.model;
      setLocal(prev => ({ ...prev, model: targetModel }));
    } else {
      setIsCustomModelMode(false);
      setLocal(prev => ({ ...prev, model: val }));
    }
  };

  const handleCustomModelInputChange = (val: string) => {
    setCustomModelInput(val);
    setLocal(prev => ({ ...prev, model: val.trim() }));
  };

  // Fetch live models from provider endpoint
  const handleFetchLiveModels = async () => {
    if (!local.baseUrl) return;
    setIsFetchingModels(true);
    setFetchError(null);

    try {
      const models = await fetchLiveProviderModels(local.baseUrl, local.apiKey);
      if (models.length === 0) {
        setFetchError('No models returned by this endpoint.');
      } else {
        setLiveModels(prev => ({
          ...prev,
          [currentProvider.id]: models,
        }));
      }
    } catch (err: any) {
      setFetchError(err.message || 'Failed to fetch models from provider.');
    } finally {
      setIsFetchingModels(false);
    }
  };

  // Test connection to provider endpoint
  const handleTestConnection = async () => {
    setTestStatus({ loading: true });
    const startTime = performance.now();

    const cleanBaseUrl = (local.baseUrl || '').replace(/\/+$/, '');
    if (!cleanBaseUrl) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Base URL is required to test connection.',
      });
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (local.apiKey) {
      headers['Authorization'] = `Bearer ${local.apiKey.trim()}`;
    }
    if (cleanBaseUrl.includes('openrouter.ai')) {
      if (typeof window !== 'undefined') {
        headers['HTTP-Referer'] = window.location.origin;
      }
      headers['X-Title'] = 'StorySpark Novel Studio';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      // First attempt: lightweight chat completion test with 1 max token
      const compResp = await fetch(`${cleanBaseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: local.model || currentProvider.models[0]?.id || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
        signal: controller.signal,
      });

      const elapsed = Math.round(performance.now() - startTime);
      clearTimeout(timeoutId);

      if (compResp.ok) {
        setTestStatus({
          loading: false,
          success: true,
          latency: elapsed,
          message: `Connected successfully! Model responded in ${elapsed}ms.`,
        });
        return;
      }

      // If chat returned error, inspect error details
      const errorText = await compResp.text().catch(() => '');
      let detail = compResp.statusText;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.error?.message) {
          detail = parsed.error.message;
        } else if (parsed.message) {
          detail = parsed.message;
        }
      } catch {}

      setTestStatus({
        loading: false,
        success: false,
        latency: elapsed,
        message: `HTTP ${compResp.status}: ${detail || 'Request rejected by model provider.'}`,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - startTime);
      if (err.name === 'AbortError') {
        setTestStatus({
          loading: false,
          success: false,
          message: 'Connection timed out after 12s. Verify your network or local server.',
        });
      } else {
        setTestStatus({
          loading: false,
          success: false,
          message: err.message || 'Connection failed. Check Base URL, network, or CORS.',
        });
      }
    }
  };

  const handleSave = () => {
    const finalSettings: LLMSettings = {
      ...local,
      provider: selectedProviderId,
      baseUrl: local.baseUrl.trim(),
      apiKey: local.apiKey.trim(),
      model: local.model.trim() || currentProvider.models[0]?.id || 'custom',
      systemPrompt: local.systemPrompt || '',
    };
    onSave(finalSettings);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  // Selected model metadata
  const selectedModelMeta = availableModels.find(m => m.id === local.model);

  return (
    <div className="space-y-3.5 text-stone-200">
      {/* Privacy Notice Banner */}
      <div className="p-2.5 bg-emerald-950/40 border border-emerald-900/60 rounded-md text-emerald-300 text-[11px] flex items-start gap-2">
        <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold">Local Privacy Guarantee:</span> Only your actively selected passage or brainstorm instructions are sent. Your full novel manuscript is never uploaded or used for model training.
        </div>
      </div>

      {/* Provider Selection */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-stone-300 font-medium text-xs flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Provider</span>
          </label>
          {currentProvider.badge && (
            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[10px] font-medium">
              {currentProvider.badge}
            </span>
          )}
        </div>
        <select
          value={selectedProviderId}
          onChange={e => handleProviderChange(e.target.value)}
          className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded p-2 text-stone-100 text-xs focus:outline-none transition"
        >
          {PROVIDERS.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} {p.badge ? `(${p.badge})` : ''}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-stone-400 mt-1 flex items-center justify-between">
          <span>{currentProvider.description}</span>
          {currentProvider.docsUrl && (
            <a
              href={currentProvider.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-0.5 text-[10px] flex-shrink-0 ml-2"
            >
              Get Key <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </p>
      </div>

      {/* Supported Model Dropdown */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-stone-300 font-medium text-xs flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-500" />
            <span>Supported Model ({currentProvider.name})</span>
          </label>

          <button
            type="button"
            onClick={handleFetchLiveModels}
            disabled={isFetchingModels || !local.baseUrl}
            title="Fetch available models from this endpoint"
            className="text-[10px] text-stone-400 hover:text-amber-400 flex items-center gap-1 disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isFetchingModels ? 'Fetching...' : 'Fetch Live Models'}</span>
          </button>
        </div>

        <select
          value={isCustomModelMode ? '__custom__' : local.model}
          onChange={e => handleModelSelectChange(e.target.value)}
          className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded p-2 text-stone-100 text-xs focus:outline-none transition font-mono"
        >
          {availableModels.map(m => (
            <option key={m.id} value={m.id}>
              {m.name} {m.badge ? `[${m.badge}]` : ''} ({m.category || 'Model'})
            </option>
          ))}
          <option value="__custom__">-- Custom Model Identifier... --</option>
        </select>

        {/* Custom Model Input (if selected or unlisted model) */}
        {isCustomModelMode && (
          <div className="mt-1.5">
            <input
              type="text"
              value={customModelInput}
              onChange={e => handleCustomModelInputChange(e.target.value)}
              placeholder="e.g. meta-llama/llama-3.3-70b-instruct or custom-model:latest"
              className="w-full bg-stone-950 border border-amber-700/60 rounded p-2 text-stone-100 font-mono text-xs focus:outline-none focus:border-amber-500 transition"
            />
            <span className="text-[10px] text-stone-400 mt-0.5 block">
              Enter the exact model identifier expected by your provider's API.
            </span>
          </div>
        )}

        {fetchError && (
          <div className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Model info banner */}
        {!isCustomModelMode && selectedModelMeta?.description && (
          <div className="mt-1.5 p-2 bg-stone-950/60 border border-stone-800/80 rounded text-[11px] text-stone-300 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-stone-200">{selectedModelMeta.name}</span>
              <span className="text-stone-400 ml-1.5">— {selectedModelMeta.description}</span>
            </div>
          </div>
        )}
      </div>

      {/* Base URL */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-stone-300 font-medium text-xs">Base URL</label>
          {local.baseUrl !== currentProvider.defaultBaseUrl && (
            <button
              type="button"
              onClick={() => setLocal(prev => ({ ...prev, baseUrl: currentProvider.defaultBaseUrl }))}
              className="text-[10px] text-amber-500 hover:underline"
            >
              Reset to Default
            </button>
          )}
        </div>
        <input
          type="text"
          value={local.baseUrl}
          onChange={e => setLocal({ ...local, baseUrl: e.target.value })}
          placeholder={currentProvider.defaultBaseUrl}
          className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded p-2 text-stone-200 font-mono text-xs focus:outline-none transition"
        />
      </div>

      {/* API Key */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-stone-300 font-medium text-xs">
            API Key {currentProvider.apiKeyRequired ? '' : '(Optional for Local)'}
          </label>
          <span className="text-[10px] text-stone-500">
            {currentProvider.apiKeyRequired ? 'Encrypted locally' : 'Leave empty for local servers'}
          </span>
        </div>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={local.apiKey}
            onChange={e => setLocal({ ...local, apiKey: e.target.value })}
            placeholder={currentProvider.placeholderApiKey}
            className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded p-2 pr-8 text-stone-200 font-mono text-xs focus:outline-none transition"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-2 top-2 text-stone-500 hover:text-stone-300 transition"
          >
            {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Advanced System Directives (Collapsible) */}
      <div className="border-t border-stone-800 pt-2.5">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-stone-400 hover:text-stone-200 text-xs py-1"
        >
          <span className="font-medium">Author System Directive (Optional)</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="mt-1.5">
            <p className="text-[10px] text-stone-500 mb-1.5">
              Custom instructions injected into every AI generation & rewrite (e.g. tone, POV, banned clichés).
            </p>
            <textarea
              rows={3}
              value={local.systemPrompt || ''}
              onChange={e => setLocal({ ...local, systemPrompt: e.target.value })}
              placeholder="e.g. You are assisting with a dark fantasy novel. Emphasize visceral atmospheric sensory details, crisp sentence cadence, and avoid melodrama."
              className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded p-2 text-stone-200 text-xs focus:outline-none transition"
            />
          </div>
        )}
      </div>

      {/* Test Connection Feedback */}
      {testStatus.message && (
        <div
          className={`p-2.5 rounded-md border text-xs flex items-start gap-2 ${
            testStatus.success
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
          }`}
        >
          {testStatus.success ? (
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="leading-tight">
            <span>{testStatus.message}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testStatus.loading || !local.baseUrl}
          className="flex-1 py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium rounded text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
        >
          {testStatus.loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Testing Connection...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Connection</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
        >
          {saveSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Settings Saved!</span>
            </>
          ) : (
            <span>Save BYOM Settings</span>
          )}
        </button>
      </div>
    </div>
  );
};
