"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, FileText, File, AlertCircle, CheckCircle2, Clock, Trash2, ArrowRight } from "lucide-react";
import { formatBytes } from "@/lib/utils";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents?workspaceId=default-workspace");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll for updates if any document is processing
  useEffect(() => {
    fetchDocuments();
    
    const interval = setInterval(() => {
      // Check if we have any pending/running documents
      const needsPolling = documents.some(doc => 
        doc.status !== "READY" && doc.status !== "FAILED"
      );
      
      if (needsPolling) {
        fetchDocuments();
      }
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspaceId", "default-workspace");
    
    try {
      setUploadProgress(40);
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      
      setUploadProgress(80);
      
      if (res.ok) {
        await fetchDocuments();
      } else {
        const error = await res.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Upload error", error);
      alert("An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "READY":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "FAILED":
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case "UPLOADED":
      case "QUEUED":
        return <Clock className="w-5 h-5 text-slate-400" />;
      default:
        // Processing stages
        return (
          <div className="relative flex items-center justify-center w-5 h-5">
            <div className="absolute w-full h-full border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        );
    }
  };

  const getStatusBadge = (doc: any) => {
    const job = doc.processingJobs && doc.processingJobs.length > 0 ? doc.processingJobs[0] : null;
    
    if (doc.status === "READY") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
          Ready
        </span>
      );
    }
    
    if (doc.status === "FAILED") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400" title={job?.errorMessage || "Processing failed"}>
          Failed
        </span>
      );
    }
    
    if (job) {
      return (
        <div className="flex flex-col gap-1 w-32">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{job.stage.toLowerCase()}</span>
            <span>{Math.round(job.progress)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${job.progress}%` }}
            ></div>
          </div>
        </div>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
        Queued
      </span>
    );
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
      </div>

      <div className="grid gap-6">
        {/* Upload Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl transition-all duration-200
            ${isDragging 
              ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20" 
              : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
            }
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.txt,.docx,.csv"
          />
          
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className={`p-4 rounded-full ${isDragging ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400" : "bg-white text-slate-400 shadow-sm dark:bg-slate-900 dark:text-slate-500"}`}>
              <Upload className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Click or drag file to this area to upload
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files.
              </p>
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 mt-4 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isUploading ? `Uploading... ${uploadProgress}%` : "Select Files"}
            </button>
          </div>
        </div>

        {/* Documents Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Knowledge Base</h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                <h4 className="text-base font-medium text-slate-900 dark:text-slate-100">No documents uploaded</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Upload your first document to start building your knowledge base.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-medium rounded-tl-lg">Document Name</th>
                      <th className="px-6 py-4 font-medium">Size</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium">Date Uploaded</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium rounded-tr-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(doc.status)}
                            <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[300px]">
                              {doc.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {formatBytes(doc.originalSize)}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {doc.documentType}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(doc)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors dark:hover:bg-indigo-900/30">
                              <ArrowRight className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors dark:hover:bg-rose-900/30">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
