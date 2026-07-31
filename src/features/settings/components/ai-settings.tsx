"use client";

import React, { useEffect, useState } from "react";
import { ProviderCard } from "./provider-card";
import { MODELS } from "@/services/ai/models.registry";

export function AiSettings() {
  const [keys, setKeys] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Default selection state
  const [defaultProvider, setDefaultProvider] = useState<string>("gemini");
  const [defaultModel, setDefaultModel] = useState<string>("gemini-3.5-flash");
  const [isSavingDefault, setIsSavingDefault] = useState(false);

  const fetchSettings = async () => {
    try {
      const [keysRes, usageRes] = await Promise.all([
        fetch("/api/settings/providers"),
        fetch("/api/settings/usage")
      ]);
      if (keysRes.ok) {
        const data = await keysRes.json();
        setKeys(data);
        const defaultKey = data.find((k: any) => k.isDefault) || data[0];
        if (defaultKey) {
          setDefaultProvider(defaultKey.provider);
          setDefaultModel(defaultKey.defaultModel || "");
        }
      }
      if (usageRes.ok) {
        setUsage(await usageRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveDefault = async () => {
    if (!defaultProvider || !defaultModel) return;
    
    const targetKey = keys.find(k => k.provider === defaultProvider);
    if (!targetKey) {
      alert("Please configure an API key for this provider first.");
      return;
    }

    setIsSavingDefault(true);
    try {
      const res = await fetch("/api/settings/providers/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId: targetKey.id, defaultModel })
      });
      if (res.ok) {
        await fetchSettings();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingDefault(false);
    }
  };

  const getAvailableModels = () => {
    return MODELS.filter(m => m.provider === defaultProvider && !m.supportsEmbeddings);
  };

  const hasConfiguredKeys = keys.length > 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Default Configuration Section */}
      <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">Active Configuration</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Select the provider and model to use by default for chat, summarization, and quizzes.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">Default Provider</label>
            <select
              value={defaultProvider}
              onChange={(e) => {
                setDefaultProvider(e.target.value);
                const models = MODELS.filter(m => m.provider === e.target.value && !m.supportsEmbeddings);
                if (models.length > 0) setDefaultModel(models[0].id);
              }}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">Default Model</label>
            <select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {getAvailableModels().map(m => (
                <option key={m.id} value={m.id}>
                  {m.displayName} {m.recommended ? "(Recommended)" : ""} {m.supportsVision ? "👁️" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-5 flex items-center">
          <button
            onClick={handleSaveDefault}
            disabled={isSavingDefault || !hasConfiguredKeys}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {isSavingDefault ? "Saving..." : "Save Default Configuration"}
          </button>
          {!hasConfiguredKeys && (
            <span className="text-sm text-red-500 ml-3">Please configure at least one provider below first.</span>
          )}
        </div>
      </section>
      
      {/* Configured Providers */}
      <section>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">Providers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <ProviderCard 
             providerId="gemini" 
             providerName="Google Gemini" 
             configuredKey={keys.find(k => k.provider === 'gemini')} 
             onRefresh={fetchSettings} 
           />
           <ProviderCard 
             providerId="openai" 
             providerName="OpenAI" 
             configuredKey={keys.find(k => k.provider === 'openai')} 
             onRefresh={fetchSettings} 
           />
        </div>
      </section>

      {/* Usage Stats */}
      <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">Usage & Billing (This Month)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
             <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Today's Requests</div>
             <div className="text-2xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{usage?.todayRequests || 0}</div>
           </div>
           <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
             <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Monthly Tokens</div>
             <div className="text-2xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{usage?.monthlyTokens?.toLocaleString() || 0}</div>
           </div>
           <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
             <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Est. Cost</div>
             <div className="text-2xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">${usage?.estimatedCost?.toFixed(2) || "0.00"}</div>
           </div>
        </div>
      </section>
    </div>
  );
}
