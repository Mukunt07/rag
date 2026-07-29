"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, BookOpen, BrainCircuit, X, Sparkles, FileText, ChevronRight, ChevronLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

interface Document {
  id: string;
  title: string;
  originalFilename: string;
  status: string;
}

interface Workspace {
  id: string;
  name: string;
}

interface RetrievedChunk {
  id: string;
  score: number;
  content: string;
  documentId: string;
  pageNumber?: number;
  document?: {
    originalFilename: string;
  };
}

interface Flashcard {
  front: string;
  back: string;
}

export function QuickActions() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<"workspace" | "search" | "summary" | "flashcards" | null>(null);
  
  // Loading & Data States
  const [documents, setDocuments] = useState<Document[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // 1. Create Workspace States
  const [wsName, setWsName] = useState("");
  const [wsDesc, setWsDesc] = useState("");
  const [wsCreating, setWsCreating] = useState(false);

  // 2. Semantic Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWsId, setSelectedWsId] = useState("all");
  const [searchResults, setSearchResults] = useState<RetrievedChunk[]>([]);
  const [searching, setSearching] = useState(false);

  // 3. Generate Summary States
  const [selectedDocId, setSelectedDocId] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);

  // 4. Create Flashcards States
  const [selectedDocIdFc, setSelectedDocIdFc] = useState("");
  const [generatingFc, setGeneratingFc] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);

  const fetchDocsAndWorkspaces = async () => {
    setLoadingData(true);
    try {
      const [docsRes, wsRes] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/workspaces")
      ]);
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        const readyDocs = (docsData.documents || []).filter((d: any) => d.status === "READY");
        setDocuments(readyDocs);
        if (readyDocs.length > 0) {
          setSelectedDocId(readyDocs[0].id);
          setSelectedDocIdFc(readyDocs[0].id);
        }
      }
      if (wsRes.ok) {
        const wsData = await wsRes.json();
        setWorkspaces(wsData.workspaces || []);
      }
    } catch (err) {
      console.error("Error fetching data for quick actions:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (activeModal && activeModal !== "workspace") {
      fetchDocsAndWorkspaces();
    }
  }, [activeModal]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;

    setWsCreating(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: wsName, description: wsDesc }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveModal(null);
        setWsName("");
        setWsDesc("");
        // Redirect to new workspace and trigger hard refresh to fetch layouts
        router.push(`/workspace/${data.workspace.id}`);
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to create workspace");
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setWsCreating(false);
    }
  };

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const options: any = {};
      if (selectedWsId !== "all") {
        options.workspaceId = selectedWsId;
      }
      const res = await fetch("/api/retrieval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, options }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.chunks || []);
      } else {
        alert("Search failed.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedDocId) return;
    setSummarizing(true);
    setSummaryResult(null);
    try {
      const res = await fetch("/api/summary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: selectedDocId })
      });
      if (res.ok) {
        const data = await res.json();
        setSummaryResult(data.summary);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to summarize.");
      }
    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setSummarizing(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!selectedDocIdFc) return;
    setGeneratingFc(true);
    setFlashcards([]);
    setFcIndex(0);
    setFcFlipped(false);
    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: selectedDocIdFc, count: 8 })
      });
      if (res.ok) {
        const data = await res.json();
        setFlashcards(data.flashcards || []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to generate flashcards.");
      }
    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setGeneratingFc(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSummaryResult(null);
    setFlashcards([]);
    setSearchResults([]);
    setSearchQuery("");
  };

  return (
    <>
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-full">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump straight into your workflows.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex items-center justify-center">
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => setActiveModal("workspace")}
              className="flex items-center gap-3 p-3 text-left bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors rounded-xl group w-full h-14"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors truncate">
                Create Workspace
              </span>
            </button>

            <button
              onClick={() => setActiveModal("search")}
              className="flex items-center gap-3 p-3 text-left bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors rounded-xl group w-full h-14"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Search className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors truncate">
                Semantic Search
              </span>
            </button>

            <button
              onClick={() => setActiveModal("summary")}
              className="flex items-center gap-3 p-3 text-left bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors rounded-xl group w-full h-14"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors truncate">
                Generate Summary
              </span>
            </button>

            <button
              onClick={() => setActiveModal("flashcards")}
              className="flex items-center gap-3 p-3 text-left bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-rose-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors rounded-xl group w-full h-14"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors truncate">
                Create Flashcards
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Modal Wrapper Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 text-left">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="flex items-center gap-2.5">
                {activeModal === "workspace" && (
                  <>
                    <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Plus className="w-4 h-4" /></div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Create New Workspace</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Add a workspace to categorize your documents.</p>
                    </div>
                  </>
                )}
                {activeModal === "search" && (
                  <>
                    <div className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><Search className="w-4 h-4" /></div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Semantic Search Engine</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Search conceptually across all document chunks.</p>
                    </div>
                  </>
                )}
                {activeModal === "summary" && (
                  <>
                    <div className="w-8 h-8 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center"><BookOpen className="w-4 h-4" /></div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Generate AI Summary</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Extract an executive brief and takeaways.</p>
                    </div>
                  </>
                )}
                {activeModal === "flashcards" && (
                  <>
                    <div className="w-8 h-8 rounded-md bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center"><BrainCircuit className="w-4 h-4" /></div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100">AI Flashcard Generator</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Generate and test yourself with flippable study cards.</p>
                    </div>
                  </>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto min-h-0">
              {/* 1. CREATE WORKSPACE FORM */}
              {activeModal === "workspace" && (
                <form onSubmit={handleCreateWorkspace} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Workspace Name</label>
                    <input
                      type="text"
                      value={wsName}
                      onChange={(e) => setWsName(e.target.value)}
                      placeholder="e.g. History Studies, Product Launch"
                      className="w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Description (Optional)</label>
                    <textarea
                      value={wsDesc}
                      onChange={(e) => setWsDesc(e.target.value)}
                      placeholder="Brief summary of the purpose of this workspace..."
                      className="w-full h-24 p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                    <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                    <Button type="submit" disabled={wsCreating}>
                      {wsCreating ? <Spinner size="sm" className="text-white" /> : "Create Workspace"}
                    </Button>
                  </div>
                </form>
              )}

              {/* 2. SEMANTIC SEARCH ENGINE */}
              {activeModal === "search" && (
                <div className="space-y-6">
                  <form onSubmit={handleSemanticSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Type a concept, question, or term..."
                        className="w-full h-10 pl-9 pr-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        required
                      />
                    </div>
                    {workspaces.length > 0 && (
                      <select
                        value={selectedWsId}
                        onChange={(e) => setSelectedWsId(e.target.value)}
                        className="h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      >
                        <option value="all">All Workspaces</option>
                        {workspaces.map(ws => (
                          <option key={ws.id} value={ws.id}>{ws.name}</option>
                        ))}
                      </select>
                    )}
                    <Button type="submit" disabled={searching}>
                      {searching ? <Spinner size="sm" /> : "Search"}
                    </Button>
                  </form>

                  <div className="space-y-4">
                    {searching ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <Spinner size="lg" />
                        <span className="text-sm text-zinc-500">Retrieving content...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Top Semantic Matches</h4>
                        <div className="space-y-3 divide-y divide-zinc-100 dark:divide-zinc-900">
                          {searchResults.map((chunk, idx) => (
                            <div key={idx} className="pt-3 first:pt-0 space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5" />
                                  Match #{idx + 1} ({Math.round(chunk.score * 100)}% Match)
                                </span>
                                {chunk.pageNumber && (
                                  <span className="text-zinc-400">Page {chunk.pageNumber}</span>
                                )}
                              </div>
                              <p className="text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded border border-zinc-100 dark:border-zinc-900 leading-relaxed">
                                {chunk.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-zinc-400 text-sm">
                        Enter a query to find semantically relevant contents from your documents.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. GENERATE SUMMARY */}
              {activeModal === "summary" && (
                <div className="space-y-6">
                  {summaryResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-semibold">Summary generated and saved successfully to Notes!</span>
                      </div>
                      <div className="p-5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg max-h-[40vh] overflow-y-auto">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 font-normal">
                          {summaryResult}
                        </p>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setSummaryResult(null)}>Summarize Another</Button>
                        <Button onClick={() => router.push("/notes")}>View all Notes</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Select Document</label>
                        {loadingData ? (
                          <div className="h-10 w-full rounded border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-sm text-zinc-400">
                            <Spinner size="sm" className="mr-2" /> Loading processed documents...
                          </div>
                        ) : documents.length > 0 ? (
                          <select
                            value={selectedDocId}
                            onChange={(e) => setSelectedDocId(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          >
                            {documents.map((doc) => (
                              <option key={doc.id} value={doc.id}>{doc.originalFilename}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-4 rounded border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 text-sm">
                            Please upload a document to your workspace first before generating a summary.
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                        <Button variant="outline" onClick={closeModal}>Cancel</Button>
                        <Button 
                          onClick={handleGenerateSummary} 
                          disabled={summarizing || documents.length === 0}
                          className="gap-2"
                        >
                          {summarizing ? <Spinner size="sm" className="text-white" /> : <Sparkles className="w-4 h-4" />}
                          {summarizing ? "Summarizing..." : "Generate Summary"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. CREATE FLASHCARDS */}
              {activeModal === "flashcards" && (
                <div className="space-y-6">
                  {flashcards.length > 0 ? (
                    <div className="space-y-6 flex flex-col items-center">
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                        Card {fcIndex + 1} of {flashcards.length}
                      </span>
                      
                      {/* Flippable Card Container */}
                      <div 
                        onClick={() => setFcFlipped(!fcFlipped)}
                        className="w-full max-w-md h-64 cursor-pointer relative group"
                        style={{ perspective: "1000px" }}
                      >
                        <div 
                          className="w-full h-full rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-8 flex flex-col items-center justify-center text-center relative bg-white dark:bg-zinc-900/60 hover:shadow-xl"
                          style={{
                            transform: fcFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                            transformStyle: "preserve-3d",
                            transition: "transform 0.6s ease"
                          }}
                        >
                          {/* Front of Card */}
                          <div 
                            className={`absolute inset-0 p-6 flex flex-col items-center justify-center transition-opacity duration-300 ${fcFlipped ? 'opacity-0' : 'opacity-100'}`}
                            style={{ backfaceVisibility: "hidden" }}
                          >
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest absolute top-4 left-4 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded">QUESTION</span>
                            <p className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-100 leading-snug">
                              {flashcards[fcIndex].front}
                            </p>
                            <span className="text-xs text-zinc-400 mt-6 group-hover:text-indigo-600 transition-colors">Click to flip card</span>
                          </div>

                          {/* Back of Card */}
                          <div 
                            className={`absolute inset-0 p-6 flex flex-col items-center justify-center transition-opacity duration-300 ${fcFlipped ? 'opacity-100' : 'opacity-0'}`}
                            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                          >
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest absolute top-4 left-4 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">ANSWER</span>
                            <p className="text-sm sm:text-base font-normal text-zinc-700 dark:text-zinc-300 leading-relaxed">
                              {flashcards[fcIndex].back}
                            </p>
                            <span className="text-xs text-zinc-400 mt-6 group-hover:text-indigo-600 transition-colors">Click to flip back</span>
                          </div>
                        </div>
                      </div>

                      {/* Navigation Controls */}
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => { setFcIndex(prev => Math.max(0, prev - 1)); setFcFlipped(false); }}
                          disabled={fcIndex === 0}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setFcFlipped(!fcFlipped)}
                          className="gap-2"
                        >
                          <RefreshCw className="w-4 h-4" /> Flip
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => { setFcIndex(prev => Math.min(flashcards.length - 1, prev + 1)); setFcFlipped(false); }}
                          disabled={fcIndex === flashcards.length - 1}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>

                      <div className="flex gap-3 border-t border-zinc-100 dark:border-zinc-900 w-full pt-4 justify-end">
                        <Button variant="outline" onClick={() => setFlashcards([])}>Start New Set</Button>
                        <Button onClick={closeModal}>Finish Studying</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Select Document</label>
                        {loadingData ? (
                          <div className="h-10 w-full rounded border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-sm text-zinc-400">
                            <Spinner size="sm" className="mr-2" /> Loading processed documents...
                          </div>
                        ) : documents.length > 0 ? (
                          <select
                            value={selectedDocIdFc}
                            onChange={(e) => setSelectedDocIdFc(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          >
                            {documents.map((doc) => (
                              <option key={doc.id} value={doc.id}>{doc.originalFilename}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-4 rounded border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 text-sm">
                            Please upload a document to your workspace first before creating flashcards.
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                        <Button variant="outline" onClick={closeModal}>Cancel</Button>
                        <Button 
                          onClick={handleGenerateFlashcards} 
                          disabled={generatingFc || documents.length === 0}
                          className="gap-2"
                        >
                          {generatingFc ? <Spinner size="sm" className="text-white" /> : <BrainCircuit className="w-4 h-4" />}
                          {generatingFc ? "Generating..." : "Generate Flashcards"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
