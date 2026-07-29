"use client";

import React, { useState, useRef } from "react";
import { FileIcon, MoreHorizontal, UploadCloud, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

interface Document {
  id: string;
  name: string;
  date: string;
  size: string;
  workspace: string;
  status: string;
}

export function DocumentsView({ initialDocuments = [] }: { initialDocuments?: Document[] }) {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspaceId", "default-workspace");

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload document");
      }

      setMessage("Document uploaded successfully!");
      router.refresh(); // Refresh the page to show new document
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document? This will remove all associated AI chunks and embeddings.")) return;

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete document");
      }

      setMessage("Document deleted successfully!");
      router.refresh();
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  return (
    <>
      <div className="space-y-6 max-w-6xl mx-auto relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Documents</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage and organize your knowledge files.</p>
          </div>
          <div className="flex items-center gap-4">
            {message && (
              <span className={`text-sm ${message.includes("success") ? "text-emerald-500" : "text-red-500"}`}>
                {message}
              </span>
            )}
            <div>
              <Button 
                type="button" 
                variant="default" 
                className="gap-2" 
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? <Spinner size="sm" className="text-primary-foreground" /> : <UploadCloud className="w-4 h-4" />}
                {isUploading ? "Uploading..." : "Upload Document"}
              </Button>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.md,.rtf,.ppt,.pptx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.tiff,.bmp,.json,.xml,.html,.zip,.eml,.msg"
                onChange={handleFileUpload}
                disabled={isUploading}
                ref={fileInputRef}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
          {initialDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No documents yet</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-2">Upload your first document to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <FileIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p 
                        className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer"
                        onClick={() => setPreviewUrl(`/api/documents/${doc.id}/download`)}
                      >
                        {doc.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.date}</span>
                        <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] ml-2 font-medium truncate max-w-[120px]">
                          {doc.workspace}
                        </span>
                        <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] ml-2 font-medium uppercase">
                          {doc.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => handleDeleteDocument(doc.id, e)}
                      className="text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-6xl bg-white dark:bg-zinc-950 rounded-lg shadow-2xl overflow-hidden flex flex-col" style={{ height: '85vh' }}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileIcon className="w-4 h-4 text-indigo-500" />
                Document Preview
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setPreviewUrl(null)} className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 overflow-hidden relative">
              <iframe src={previewUrl} className="absolute inset-0 w-full h-full border-0" title="Document Preview" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
