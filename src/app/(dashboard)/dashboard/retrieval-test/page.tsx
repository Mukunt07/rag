"use client";

import React, { useState } from "react";
import { Search, SlidersHorizontal, Info, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { RetrievalResponse } from "@/services/retrieval/retrieval.types";

export default function RetrievalTestPage() {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(10);
  const [threshold, setThreshold] = useState(0.0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RetrievalResponse | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/retrieval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          options: {
            limit,
            scoreThreshold: threshold,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to search");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Retrieval Diagnostics</h1>
          <p className="text-muted-foreground mt-1">
            Test and tune the vector search pipeline before LLM generation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5" />
                Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Top K (Limit)</label>
                <Input 
                  type="number" 
                  value={limit} 
                  onChange={(e) => setLimit(Number(e.target.value))} 
                  min={1} 
                  max={50}
                />
                <p className="text-xs text-muted-foreground">Number of chunks to return.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Score Threshold</label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={threshold} 
                  onChange={(e) => setThreshold(Number(e.target.value))} 
                  min={0} 
                  max={1}
                />
                <p className="text-xs text-muted-foreground">Minimum similarity score (0.0 to 1.0).</p>
              </div>
            </CardContent>
          </Card>

          {result && (
            <Card className="bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                  <Info className="w-5 h-5" />
                  Debug Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-indigo-100 dark:border-indigo-900 pb-2">
                  <span className="text-muted-foreground">Execution</span>
                  <span className="font-mono font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {result.metrics.executionTimeMs} ms
                  </span>
                </div>
                <div className="flex justify-between border-b border-indigo-100 dark:border-indigo-900 pb-2">
                  <span className="text-muted-foreground">Returned</span>
                  <span className="font-mono font-medium">{result.metrics.totalReturned} chunks</span>
                </div>
                <div className="flex justify-between border-b border-indigo-100 dark:border-indigo-900 pb-2">
                  <span className="text-muted-foreground">Avg Score</span>
                  <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    {result.metrics.averageScore.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-indigo-100 dark:border-indigo-900 pb-2">
                  <span className="text-muted-foreground">Highest</span>
                  <span className="font-mono font-medium">{result.metrics.highestScore.toFixed(4)}</span>
                </div>
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-muted-foreground">Embedding Model</span>
                  <span className="font-mono text-xs bg-white dark:bg-zinc-900 p-1.5 rounded border truncate">
                    {result.metrics.embeddingModelUsed}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Collection</span>
                  <span className="font-mono text-xs bg-white dark:bg-zinc-900 p-1.5 rounded border truncate">
                    {result.metrics.collectionName}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Search Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Enter a search query to test semantic retrieval..."
                    className="pl-10 h-12 text-base"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-8" disabled={isLoading}>
                  {isLoading ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
                  {isLoading ? "Searching..." : "Search"}
                </Button>
              </form>
              {error && <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>}
            </CardContent>
          </Card>

          {/* Results List */}
          {result && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Retrieved Chunks
              </h2>
              
              {result.chunks.length === 0 ? (
                <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
                  No chunks matched your query or threshold.
                </div>
              ) : (
                <div className="space-y-4">
                  {result.chunks.map((chunk, index) => (
                    <Card key={chunk.id} className="overflow-hidden">
                      <div className="bg-zinc-50 dark:bg-zinc-900/50 border-b p-3 px-5 flex flex-wrap items-center justify-between gap-4 text-sm">
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Score</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-lg leading-none">
                              {chunk.score.toFixed(4)}
                            </span>
                          </div>
                          
                          <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
                          
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground mb-0.5">Document</span>
                            <span className="font-medium truncate max-w-[200px]" title={chunk.source}>
                              {chunk.documentName || chunk.source || "Unknown Document"}
                            </span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground mb-0.5">Location</span>
                            <span className="font-medium">
                              {chunk.pageNumber ? `Page ${chunk.pageNumber} • ` : ""}Chunk {chunk.chunkIndex}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                            {chunk.wordCount} words
                          </span>
                          <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded uppercase">
                            {chunk.language}
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-serif">
                          {chunk.text}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
