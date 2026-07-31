"use client";

import React, { useState } from "react";
import { AiSettings } from "./ai-settings";
import { User, Palette, Zap } from "lucide-react";

export function SettingsView() {
  const [activeTab, setActiveTab] = useState("ai");

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col md:flex-row gap-8 py-6">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Settings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage your account preferences and integrations.</p>
        </div>

        <nav className="flex flex-col gap-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "profile" 
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" 
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          
          <button
            onClick={() => setActiveTab("appearance")}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "appearance" 
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" 
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            <Palette className="w-4 h-4" />
            Appearance
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "ai" 
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" 
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            <Zap className="w-4 h-4" />
            AI Providers
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === "profile" && (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">Profile</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Profile management coming soon.</p>
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">Appearance</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Theme customization coming soon.</p>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <AiSettings />
          </div>
        )}
      </main>
      
    </div>
  );
}
