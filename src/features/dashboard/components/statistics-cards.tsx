import { FileText, Folder, MessageSquare, BrainCircuit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Stats {
  totalDocs: number;
  activeWorkspaces: number;
  totalConversations: number;
  generatedQuizzes: number;
}

export function StatisticsCards({ stats = { totalDocs: 0, activeWorkspaces: 0, totalConversations: 0, generatedQuizzes: 0 } }: { stats?: Stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        title="Total Documents" 
        value={stats.totalDocs.toString()} 
        trend="Across all workspaces"
        icon={<FileText className="w-5 h-5 text-blue-500" />}
      />
      <StatCard 
        title="Active Workspaces" 
        value={stats.activeWorkspaces.toString()} 
        trend="Owned by you"
        icon={<Folder className="w-5 h-5 text-emerald-500" />}
      />
      <StatCard 
        title="AI Conversations" 
        value={stats.totalConversations.toString()} 
        trend="Active chats"
        icon={<MessageSquare className="w-5 h-5 text-purple-500" />}
      />
      <StatCard 
        title="Generated Quizzes" 
        value={stats.generatedQuizzes.toString()} 
        trend="Saved artifacts"
        icon={<BrainCircuit className="w-5 h-5 text-rose-500" />}
      />
    </div>
  );
}

function StatCard({ title, value, trend, icon }: { title: string; value: string; trend: string; icon: React.ReactNode }) {
  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</h3>
          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">{trend}</p>
      </CardContent>
    </Card>
  );
}
