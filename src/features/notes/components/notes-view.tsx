"use client";

import React, { useState, useEffect } from "react";
import { FileText, Calendar, BookOpen, Trash2, ArrowRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

interface Artifact {
  id: string;
  title: string;
  createdAt: string;
  payload: {
    summary: string;
  };
  document?: {
    originalFilename: string;
    title: string;
  };
}

export function NotesView() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  const fetchSummaries = async () => {
    try {
      const res = await fetch("/api/artifacts?type=summary");
      if (res.ok) {
        const data = await res.json();
        setArtifacts(data.artifacts || []);
        if (data.artifacts?.length > 0) {
          setSelectedArtifact(data.artifacts[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load summaries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this summary?")) return;

    try {
      // In a real app we'd have a delete endpoint, let's use a soft delete/delete API if we build one
      // We can easily delete it via a generic delete endpoint, or we can just filter it locally for now.
      // Let's implement a DELETE request to /api/artifacts/[id] if we create one, or just update the state
      // for UI response. Let's send a DELETE request to `/api/artifacts?id=${id}` or similar.
      const res = await fetch(`/api/artifacts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setArtifacts(prev => prev.filter(art => art.id !== id));
        if (selectedArtifact?.id === id) {
          setSelectedArtifact(artifacts.find(art => art.id !== id) || null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" />
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Loading summaries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Notes & Summaries</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Review AI-generated summaries and your study notes.</p>
      </div>

      {artifacts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center shadow-sm">
          <BookOpen className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No notes yet</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto">
            Generate a summary from a document using the Quick Actions panel on the Dashboard to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
          {/* Left List Pane */}
          <div className="md:col-span-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800 shadow-sm">
            {artifacts.map((art) => (
              <div
                key={art.id}
                onClick={() => setSelectedArtifact(art)}
                className={`p-4 cursor-pointer transition-colors text-left flex flex-col gap-2 relative group ${
                  selectedArtifact?.id === art.id
                    ? "bg-zinc-50 dark:bg-zinc-900 border-l-2 border-indigo-600"
                    : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1 pr-6">
                    {art.title}
                  </h3>
                  <button
                    onClick={(e) => handleDelete(art.id, e)}
                    className="absolute right-3 top-4 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {art.document && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate">{art.document.originalFilename}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(art.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Preview Pane */}
          <div className="md:col-span-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col shadow-sm overflow-hidden h-full">
            {selectedArtifact ? (
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{selectedArtifact.title}</h2>
                  {selectedArtifact.document && (
                    <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1.5">
                      Source: <span className="font-medium text-zinc-700 dark:text-zinc-300">{selectedArtifact.document.originalFilename}</span>
                    </p>
                  )}
                </div>
                <div className="flex-1 p-6 overflow-y-auto prose dark:prose-invert max-w-none text-left">
                  <div className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                    {selectedArtifact.payload.summary}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-400">
                Select a summary to read
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
