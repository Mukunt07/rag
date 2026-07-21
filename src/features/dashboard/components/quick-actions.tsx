import { Plus, Search, BookOpen, BrainCircuit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ACTIONS = [
  { id: 1, label: "Create Workspace", icon: <Plus className="w-4 h-4" />, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  { id: 2, label: "Semantic Search", icon: <Search className="w-4 h-4" />, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { id: 3, label: "Generate Summary", icon: <BookOpen className="w-4 h-4" />, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
  { id: 4, label: "Create Flashcards", icon: <BrainCircuit className="w-4 h-4" />, color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" },
];

export function QuickActions() {
  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Jump straight into your workflows.</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-3">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              className="flex items-center gap-3 p-3 text-left bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors rounded-lg group"
            >
              <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${action.color}`}>
                {action.icon}
              </div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
