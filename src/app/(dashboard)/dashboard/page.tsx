import { UploadCard } from "@/features/dashboard/components/upload-card";
import { RecentDocuments } from "@/features/dashboard/components/recent-documents";
import { StatisticsCards } from "@/features/dashboard/components/statistics-cards";
import { QuickActions } from "@/features/dashboard/components/quick-actions";

export const metadata = {
  title: "Dashboard - KnowledgeHub AI",
  description: "Your knowledge workspace overview.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Overview</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Welcome back! Here's what's happening in your workspaces.</p>
      </div>

      <StatisticsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <UploadCard />
          <RecentDocuments />
        </div>
        <div className="space-y-8">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
