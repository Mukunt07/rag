"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FileIcon, 
  UploadCloud, 
  Send, 
  Sparkles, 
  Cpu, 
  Bot, 
  User, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  HelpCircle,
  X,
  ExternalLink,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MODELS } from "@/services/ai/models.registry";

interface Document {
  id: string;
  title: string;
  createdAt: string;
  workspaceId: string;
  processingJobs?: {
    status: string;
  }[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: any[];
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Hello! I can help you analyze documents in this workspace. Ask me anything about them, or choose your preferred model."
};

export function WorkspaceView({ workspaceId }: { workspaceId: string }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  
  // Chat States
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("gemini-3.5-flash");
  const [loadingChat, setLoadingChat] = useState(false);
  
  // UX Interaction States
  const [activeCitation, setActiveCitation] = useState<any | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocName, setPreviewDocName] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeModel = MODELS.find(m => m.id === selectedModelId) || MODELS[0];

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/documents?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Error fetching workspace documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(() => {
      fetchDocuments();
    }, 5000);
    return () => clearInterval(interval);
  }, [workspaceId]);

  useEffect(() => {
    // Clear chat history immediately to prevent flickering
    setMessages([WELCOME_MESSAGE]);
    
    const fetchChatHistory = async () => {
      try {
        const res = await fetch(`/api/chat?workspaceId=${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
        }
      } catch (err) {
        console.error("Error fetching chat history:", err);
      }
    };

    fetchChatHistory();
  }, [workspaceId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingChat]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspaceId", workspaceId);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload document");
      }

      setUploadMessage("Document uploaded successfully! Indexing started.");
      fetchDocuments();
    } catch (error: any) {
      setUploadMessage(error.message || "Failed to upload document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening document preview
    if (!confirm("Are you sure you want to delete this document? This will remove all associated AI chunks and embeddings.")) return;

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete document");
      }

      setUploadMessage("Document deleted successfully.");
      fetchDocuments();
    } catch (err: any) {
      alert(err.message || "Failed to delete document.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loadingChat) return;

    const userMsg = inputMessage;
    setInputMessage("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoadingChat(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMsg,
          workspaceId,
          provider: activeModel.provider,
          model: activeModel.id
        })
      });

      if (!res.ok) {
        throw new Error("Failed to get response from AI assistant.");
      }

      const data = await res.json();
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.answer, 
        sources: data.sources 
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `Error: ${err.message || "Something went wrong."}` 
      }]);
    } finally {
      setLoadingChat(false);
    }
  };

  const getDocNameById = (id: string) => {
    return documents.find(d => d.id === id)?.title || "Unknown Document";
  };

  const getStatusIndicator = (doc: Document) => {
    const job = doc.processingJobs?.[0];
    if (!job) return <Clock className="w-4 h-4 text-zinc-400" />;
    
    switch (job.status.toUpperCase()) {
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "RUNNING":
      case "PENDING":
        return <Spinner size="sm" className="text-indigo-500" />;
      case "FAILED":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  const workspaceTitle = workspaceId.charAt(0).toUpperCase() + workspaceId.slice(1);

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-500" />
            {workspaceTitle} Workspace
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Ask questions, analyze documents, and study smarter.
          </p>
        </div>

        {/* Model Selector Dropdown */}
        <div className="relative inline-block text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">AI Model:</span>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {MODELS.filter(m => !m.supportsEmbeddings).map((model) => (
                <option key={model.id} value={model.id}>
                  {model.displayName} ({model.provider})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Split Layout Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 overflow-hidden">
        {/* Left Side: Document Binder */}
        <div className="lg:col-span-4 flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm h-full">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              Documents ({documents.length})
            </h3>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Spinner size="sm" /> : <UploadCloud className="w-3.5 h-3.5" />}
              {uploading ? "Uploading..." : "Add Doc"}
            </Button>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
          </div>

          {/* Doc List Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {uploadMessage && (
              <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                uploadMessage.includes("success") 
                  ? "bg-emerald-50/50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400"
                  : "bg-red-50/50 border-red-200 text-red-855 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400"
              }`}>
                <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{uploadMessage}</span>
              </div>
            )}

            {loadingDocs ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Spinner className="text-zinc-400" />
                <span className="text-xs text-zinc-500">Loading documents...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="py-16 text-center">
                <UploadCloud className="w-8 h-8 text-zinc-350 dark:text-zinc-650 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-300">No documents yet</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px] mx-auto">Upload files to begin querying them with AI.</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-150 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-colors group cursor-pointer"
                  onClick={() => {
                    setPreviewDocUrl(`/api/documents/${doc.id}/download`);
                    setPreviewDocName(doc.title);
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded bg-zinc-200/50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-450 shrink-0">
                      <FileIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-250 truncate pr-2 group-hover:text-indigo-500 transition-colors">
                        {doc.title}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    {getStatusIndicator(doc)}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteDocument(doc.id, e)}
                      className="p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Chat Workspace */}
        <div className="lg:col-span-8 flex flex-col bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm h-full">
          {/* Active Model Indicator Bar */}
          <div className="px-4 py-2 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <span className="text-xs font-medium text-zinc-550 dark:text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
              Selected Model: <strong>{activeModel.displayName}</strong>
            </span>
            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 text-[10px] rounded font-medium border border-indigo-100 dark:border-indigo-900/30">
              {activeModel.provider.toUpperCase()}
            </span>
          </div>

          {/* Conversation Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === "user" 
                    ? "bg-indigo-600 text-white" 
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="space-y-2">
                  <div className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 text-zinc-800 dark:text-indigo-200 rounded-tl-none"
                  }`}>
                    {msg.content}
                  </div>

                  {/* Sources Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-1 mr-1">Sources:</span>
                      {msg.sources.map((src: any, sIdx: number) => (
                        <button 
                          key={sIdx} 
                          type="button"
                          onClick={() => setActiveCitation(src)}
                          className="bg-zinc-200/60 dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-[10px] text-zinc-750 dark:text-zinc-350 hover:text-indigo-650 dark:hover:text-indigo-400 px-2.5 py-0.5 rounded border border-zinc-300/40 dark:border-zinc-800 font-medium transition-colors max-w-[150px] truncate cursor-pointer flex items-center gap-1"
                        >
                          📄 Chunk {src.chunkIndex} {src.pageNumber && `(p. ${src.pageNumber})`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loadingChat && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-sm text-zinc-555">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <Spinner size="sm" className="text-indigo-500" />
                  <span className="text-xs text-zinc-555">{activeModel.displayName} is thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Area */}
          <form 
            onSubmit={handleSendMessage} 
            className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 items-center shrink-0"
          >
            <input
              type="text"
              placeholder={documents.length === 0 ? "Upload documents first..." : "Ask a question about the workspace..."}
              className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-850 dark:text-zinc-100 placeholder-zinc-405 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              value={inputMessage}
              disabled={documents.length === 0 || loadingChat}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <Button 
              type="submit" 
              className="rounded-xl px-4 py-2.5 h-auto bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              disabled={!inputMessage.trim() || loadingChat}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </Button>
          </form>
        </div>
      </div>

      {/* UX Modal: Citation & Source Inspector */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/30">
              <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                Source Citation Inspector
              </h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => setActiveCitation(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Document</p>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 flex items-center gap-1">
                  {getDocNameById(activeCitation.documentId)}
                  <button 
                    onClick={() => {
                      setPreviewDocUrl(`/api/documents/${activeCitation.documentId}/download`);
                      setPreviewDocName(getDocNameById(activeCitation.documentId));
                      setActiveCitation(null);
                    }}
                    className="text-indigo-500 hover:text-indigo-600 transition-colors p-1"
                    title="Open Document Preview"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Chunk Index</p>
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">{activeCitation.chunkIndex}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Page Number</p>
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">{activeCitation.pageNumber || "N/A"}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Cited Text Segment</p>
                <div className="mt-1.5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-h-[180px] overflow-y-auto">
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                    "{activeCitation.text}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UX Modal: Document Reader/Preview */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-5xl bg-white dark:bg-zinc-950 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileIcon className="w-4 h-4 text-indigo-500" />
                Preview: {previewDocName}
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setPreviewDocUrl(null);
                  setPreviewDocName(null);
                }} 
                className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 relative">
              <iframe src={previewDocUrl} className="absolute inset-0 w-full h-full border-0" title="Document Preview" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
