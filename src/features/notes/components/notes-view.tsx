import React from "react";

export function NotesView() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Notes & Summaries</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Review AI-generated summaries and your personal notes.</p>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No notes yet</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">Generate a summary from a document to get started.</p>
      </div>
    </div>
  );
}
