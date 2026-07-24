import React from "react";

export function SettingsView() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your account preferences and configurations.</p>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
        <div className="space-y-4">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Profile</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Update your personal details.</p>
          </div>
          
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Appearance</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Customize the interface theme.</p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">API Keys</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage your API integrations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
