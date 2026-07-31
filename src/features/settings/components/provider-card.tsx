import React, { useState } from "react";
import { CheckCircle2, XCircle, Plus, Trash2, Key, RefreshCw, AlertCircle, Eye, EyeOff } from "lucide-react";

export function ProviderCard({ providerId, providerName, configuredKey, onRefresh }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success?: boolean; error?: string} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleTestAndSave = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // 1. Test Connection
      const testRes = await fetch("/api/settings/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId, apiKey: apiKeyInput })
      });
      const testData = await testRes.json();
      
      let hasTestError = false;
      if (!testRes.ok || !testData.success) {
        setTestResult({ error: testData.details || testData.error || "Connection failed, but key was saved." });
        hasTestError = true;
      } else {
        setTestResult({ success: true });
      }

      // 2. Save (We now save it even if the test fails, per user request)
      setIsSaving(true);
      const saveRes = await fetch("/api/settings/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId, apiKey: apiKeyInput, status: hasTestError ? "error" : "active" })
      });

      if (saveRes.ok) {
        setIsAdding(false);
        setApiKeyInput("");
        onRefresh();
      }
    } catch (e: any) {
      setTestResult({ error: e.message || "An error occurred" });
    } finally {
      setIsTesting(false);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!configuredKey) return;
    if (!confirm(`Are you sure you want to delete your ${providerName} API key?`)) return;
    
    await fetch(`/api/settings/providers?id=${configuredKey.id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{providerName}</h4>
        {configuredKey && configuredKey.status === "active" ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
            <CheckCircle2 className="w-4 h-4" /> Connected
          </span>
        ) : configuredKey && configuredKey.status === "error" ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900/50">
            <AlertCircle className="w-4 h-4" /> Connection Failed
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800">
            <XCircle className="w-4 h-4" /> Not Configured
          </span>
        )}
      </div>

      {configuredKey && !isAdding && (
        <div className="text-sm text-zinc-500 flex flex-col gap-3">
          <div className="flex justify-between">
            <span>Last Used</span>
            <span className="text-zinc-900 dark:text-zinc-100">
              {new Date(configuredKey.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => setIsAdding(true)}
              className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-zinc-900 dark:text-zinc-100"
            >
              Replace Key
            </button>
            <button 
              onClick={handleDelete}
              className="flex-1 px-3 py-2 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-md text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {(!configuredKey || isAdding) && (
        <div className="flex flex-col gap-3 mt-2">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={`Enter ${providerName} API Key`}
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              className="w-full pl-3 pr-10 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {testResult?.error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{testResult.error}</span>
            </div>
          )}
          {testResult?.success && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Connection Successful!</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleTestAndSave}
              disabled={!apiKeyInput || isTesting || isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTesting ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Testing...</>
              ) : isSaving ? (
                "Saving..."
              ) : (
                "Save & Connect"
              )}
            </button>
            {isAdding && configuredKey && (
              <button
                onClick={() => { setIsAdding(false); setTestResult(null); }}
                className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
