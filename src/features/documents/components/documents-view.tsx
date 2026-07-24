import React from "react";

export function DocumentsView() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Documents</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage and organize your knowledge files.</p>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No documents yet</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">Upload your first document to get started.</p>
        <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
          Upload Document
        </button>
      </div>
    </div>
  );
}
