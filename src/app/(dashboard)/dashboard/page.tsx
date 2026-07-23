import { StatisticsCards } from "@/features/dashboard/components/statistics-cards";
import { DashboardGrid } from "@/features/dashboard/components/dashboard-grid";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Dashboard - KnowledgeHub AI",
  description: "Your knowledge workspace overview.",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  const userName = session?.user?.name || "User";

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Overview</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Welcome back, {userName}! Here's what's happening in your workspaces.</p>
      </div>

      <StatisticsCards />

      <DashboardGrid />
    </div>
  );
}
