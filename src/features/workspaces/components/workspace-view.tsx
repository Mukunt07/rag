import React from "react";

export function WorkspaceView({ workspaceId }: { workspaceId: string }) {
  // Format the ID for display (e.g., "personal" -> "Personal")
  const formattedId = workspaceId.charAt(0).toUpperCase() + workspaceId.slice(1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{formattedId} Workspace</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage documents and settings for this workspace.</p>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Workspace is empty</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">Add your first document to this workspace to get started.</p>
      </div>
    </div>
  );
}
