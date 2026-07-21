import { FileText, Folder, MessageSquare, BrainCircuit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatisticsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        title="Total Documents" 
        value="24" 
        trend="+3 this week"
        icon={<FileText className="w-5 h-5 text-blue-500" />}
      />
      <StatCard 
        title="Active Workspaces" 
        value="4" 
        trend="Personal, Work..."
        icon={<Folder className="w-5 h-5 text-emerald-500" />}
      />
      <StatCard 
        title="AI Conversations" 
        value="128" 
        trend="+12 this week"
        icon={<MessageSquare className="w-5 h-5 text-purple-500" />}
      />
      <StatCard 
        title="Generated Quizzes" 
        value="15" 
        trend="+2 this week"
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
