"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeedbackState, FeedbackStatus } from "@/components/ui/feedback-state";

export function UploadCard() {
  const [status, setStatus] = useState<FeedbackStatus>("idle");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-reset success/error states after 3 seconds
  useEffect(() => {
    if (status === "success" || status === "error") {
      const timer = setTimeout(() => setStatus("idle"), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("loading");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspaceId", "default-workspace"); // route handles this safely

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload document");
      }

      setStatus("success");
      setMessage("Document uploaded successfully!");
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden h-full flex flex-col">
      <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>Add new PDFs, DOCX, or text files to your workspace.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 flex-1 flex flex-col justify-center">
        {status === "idle" ? (
          <label className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-10 flex flex-col items-center justify-center text-center transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:border-indigo-500/50 cursor-pointer group flex-1">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md,.rtf,.ppt,.pptx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.tiff,.bmp,.json,.xml,.html,.zip,.eml,.msg"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Click to upload or drag and drop
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
              PDF, DOCX, TXT, CSV, Images, or Markdown (max. 50MB)
            </p>
            <Button type="button" variant="secondary" className="shadow-none pointer-events-none">
              Select Files
            </Button>
          </label>
        ) : (
          <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col items-center justify-center flex-1 bg-zinc-50/50 dark:bg-zinc-900/20">
            <FeedbackState 
              status={status} 
              loadingTitle="Uploading..." 
              loadingDescription="Please wait while we upload and process your document."
              successTitle="Upload Complete"
              successDescription={message}
              errorTitle="Upload Failed"
              errorDescription={message}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
