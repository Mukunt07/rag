"use client";

import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  HelpCircle, 
  Cpu, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Award, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BrainCircuit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MODELS } from "@/services/ai/models.registry";

interface Document {
  id: string;
  title: string;
  originalFilename: string;
}

interface Question {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

interface Quiz {
  title: string;
  questions: Question[];
}

interface Flashcard {
  front: string;
  back: string;
}

export function QuizView() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  
  // Workspace selection states
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  
  // Selection States
  const [selectedDocId, setSelectedDocId] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedModelId, setSelectedModelId] = useState("gemini-3.5-flash");
  
  // Active Tab
  const [activeTab, setActiveTab] = useState<"quiz" | "flashcards">("quiz");

  // Quiz Generation & Active Quiz States
  const [generating, setGenerating] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Flashcards States
  const [generatingFc, setGeneratingFc] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);

  const activeModel = MODELS.find(m => m.id === selectedModelId) || MODELS[0];

  // Fetch Workspaces on load
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch("/api/workspaces");
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Received non-JSON response from server.");
          }
          const data = await res.json();
          setWorkspaces(data.workspaces || []);
          if (data.workspaces?.length > 0) {
            setSelectedWorkspaceId(data.workspaces[0].id);
          }
        }
      } catch (err) {
        console.error("Error loading workspaces for quiz generator:", err);
      } finally {
        setLoadingWorkspaces(false);
      }
    };
    fetchWorkspaces();
  }, []);

  // Fetch Documents scoped to selected workspace
  useEffect(() => {
    if (!selectedWorkspaceId) return;

    const fetchDocs = async () => {
      setLoadingDocs(true);
      try {
        const res = await fetch(`/api/documents?workspaceId=${selectedWorkspaceId}`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Received non-JSON response from server.");
          }
          const data = await res.json();
          setDocuments(data.documents || []);
          if (data.documents?.length > 0) {
            setSelectedDocId(data.documents[0].id);
          } else {
            setSelectedDocId("");
          }
        }
      } catch (err) {
        console.error("Error loading documents for quiz generator:", err);
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchDocs();
  }, [selectedWorkspaceId]);

  const handleGenerateQuiz = async () => {
    if (!selectedDocId) return;

    setGenerating(true);
    setQuiz(null);
    setCurrentIdx(0);
    setUserAnswers([]);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setQuizCompleted(false);

    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDocId,
          questionCount,
          provider: activeModel.provider,
          model: activeModel.id
        })
      });

      if (!res.ok) {
        throw new Error("Failed to generate quiz. Please make sure the document is processed.");
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("The server returned an unexpected response format (HTML instead of JSON).");
      }

      const data = await res.json();
      setQuiz(data);
    } catch (err: any) {
      alert(err.message || "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!selectedDocId) return;
    setGeneratingFc(true);
    setFlashcards([]);
    setFcIndex(0);
    setFcFlipped(false);
    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDocId,
          count: 8,
          provider: activeModel.provider,
          model: activeModel.id
        })
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Received non-JSON response from server.");
        }
        const data = await res.json();
        setFlashcards(data.flashcards || []);
      } else {
        const contentType = res.headers.get("content-type");
        const errorData = (contentType && contentType.includes("application/json"))
          ? await res.json().catch(() => ({}))
          : {};
        alert(errorData.error || "Failed to generate flashcards.");
      }
    } catch (err: any) {
      alert(err.message || "Something went wrong.");
    } finally {
      setGeneratingFc(false);
    }
  };

  const handleAnswerClick = (optionIdx: number) => {
    if (isAnswerRevealed) return;
    setSelectedAnswer(optionIdx);
  };

  const handleRevealAnswer = () => {
    if (selectedAnswer === null) return;
    setUserAnswers(prev => [...prev, selectedAnswer]);
    setIsAnswerRevealed(true);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    
    if (quiz && currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    return userAnswers.reduce((score, ans, idx) => {
      return score + (ans === quiz.questions[idx].answerIndex ? 1 : 0);
    }, 0);
  };

  const resetQuiz = () => {
    setQuiz(null);
    setQuizCompleted(false);
  };

  if (generating) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <div className="relative inline-flex">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 animate-spin"></div>
          <Sparkles className="w-6 h-6 text-yellow-500 absolute inset-0 m-auto animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Generating AI Quiz...</h2>
        <p className="text-sm text-zinc-500 max-w-sm mx-auto">
          We are analyzing document content and crafting multiple-choice questions with detailed explanations.
        </p>
      </div>
    );
  }

  if (generatingFc) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <div className="relative inline-flex">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 animate-spin"></div>
          <BrainCircuit className="w-6 h-6 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Generating AI Flashcards...</h2>
        <p className="text-sm text-zinc-500 max-w-sm mx-auto">
          Creating high-quality study flashcards from your document resource.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-left">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <BrainCircuit className="w-8 h-8 text-indigo-500" />
          Flashcards & Quizzes
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Study smart using AI-generated review tools.
        </p>
      </div>

      {/* Tab Switcher (Only show when not in an active quiz/flashcard session) */}
      {!quiz && flashcards.length === 0 && (
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 text-center transition-colors ${
              activeTab === "quiz"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Practice Quiz
          </button>
          <button
            onClick={() => setActiveTab("flashcards")}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 text-center transition-colors ${
              activeTab === "flashcards"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Study Flashcards
          </button>
        </div>
      )}

      {/* Configuration Form (Only show when not in active quiz/flashcard session) */}
      {!quiz && flashcards.length === 0 && (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
          {loadingDocs ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Spinner className="text-zinc-400" />
              <span className="text-xs text-zinc-500">Loading resources...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-10 text-center">
              <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3 opacity-60" />
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No documents found</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                Please upload a document to your workspace first before creating study tools.
              </p>
            </div>
          ) : (
            <>
              {/* Workspace selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Select Workspace</label>
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Select Document</label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-indigo-500"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title || doc.originalFilename}
                    </option>
                  ))}
                </select>
              </div>

              {/* Configurations for Quiz or Flashcards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeTab === "quiz" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Question Count</label>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-indigo-500"
                    >
                      {[3, 5, 10, 15].map((cnt) => (
                        <option key={cnt} value={cnt}>
                          {cnt} Questions
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Study Count</label>
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-650 dark:text-zinc-300">
                      8 Educational Flashcards
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-zinc-400" />
                    AI Engine Model
                  </label>
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-indigo-500"
                  >
                    {MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                {activeTab === "quiz" ? (
                  <Button 
                    onClick={handleGenerateQuiz}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Start practice test
                  </Button>
                ) : (
                  <Button 
                    onClick={handleGenerateFlashcards}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 fill-white" />
                    Generate Flashcards
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Screen 2: Active Flashcards Session */}
      {flashcards.length > 0 && (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm flex flex-col items-center gap-6">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Card {fcIndex + 1} of {flashcards.length}
            </span>
            <Button variant="outline" size="sm" onClick={() => setFlashcards([])}>
              Exit Session
            </Button>
          </div>
          
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
        </div>
      )}

      {/* Screen 3: Active Quiz Test Session */}
      {quiz && !quizCompleted && (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
          {/* Progress bar */}
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-500">
            <span>Question {currentIdx + 1} of {quiz.questions.length}</span>
            <span>{Math.round(((currentIdx) / quiz.questions.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentIdx / quiz.questions.length) * 100}%` }}
            />
          </div>

          {/* Question */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
              {quiz.questions[currentIdx].question}
            </h3>

            {/* Options */}
            <div className="grid grid-cols-1 gap-3">
              {quiz.questions[currentIdx].options.map((opt, optIdx) => {
                const isSelected = selectedAnswer === optIdx;
                const isCorrectAnswer = quiz.questions[currentIdx].answerIndex === optIdx;
                
                let optStyle = "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 hover:bg-zinc-100/50 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/60";
                if (isSelected) {
                  optStyle = "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20";
                }
                if (isAnswerRevealed) {
                  if (isCorrectAnswer) {
                    optStyle = "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-400";
                  } else if (isSelected) {
                    optStyle = "border-red-500 bg-red-50/30 dark:bg-red-950/20 text-red-900 dark:text-red-400";
                  } else {
                    optStyle = "opacity-50 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50";
                  }
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleAnswerClick(optIdx)}
                    disabled={isAnswerRevealed}
                    className={`p-4 border rounded-xl text-left text-sm transition-all flex items-center justify-between group ${optStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswerRevealed && isCorrectAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isAnswerRevealed && !isCorrectAnswer && isSelected && (
                      <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation / Navigation action */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {isAnswerRevealed && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-800/80 rounded-xl max-w-xl">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Explanation</span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                    {quiz.questions[currentIdx].explanation}
                  </p>
                </div>
              )}
            </div>
            <div className="shrink-0 flex justify-end">
              {!isAnswerRevealed ? (
                <Button
                  onClick={handleRevealAnswer}
                  disabled={selectedAnswer === null}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs flex items-center gap-1.5"
                >
                  {currentIdx === quiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screen 4: Quiz Completed Stats */}
      {quizCompleted && quiz && (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm text-center space-y-6">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Quiz Completed!</h2>
            <p className="text-zinc-500">You scored {calculateScore()} out of {quiz.questions.length}</p>
          </div>

          {/* Score percentage bar */}
          <div className="max-w-xs mx-auto">
            <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(calculateScore() / quiz.questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <Button
              onClick={handleGenerateQuiz}
              variant="outline"
              className="rounded-lg text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retake Test
            </Button>
            <Button
              onClick={resetQuiz}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs"
            >
              Configure Another Test
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
