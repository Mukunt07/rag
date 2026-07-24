import { StatisticsCards } from "@/features/dashboard/components/statistics-cards";
import { DashboardGrid } from "@/features/dashboard/components/dashboard-grid";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Dashboard - KnowledgeHub AI",
  description: "Your knowledge workspace overview.",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  const userName = session?.user?.name || "User";
  const userId = session?.user?.id;

  let totalDocs = 0;
  let activeWorkspaces = 0;
  let totalConversations = 0;
  let recentDocuments: any[] = [];

  if (userId) {
    // 1. Fetch counts
    totalDocs = await prisma.document.count({
      where: { uploadedById: userId }
    });

    activeWorkspaces = await prisma.workspace.count({
      where: { ownerId: userId }
    });

    totalConversations = await prisma.chatSession.count({
      where: { createdById: userId }
    });

    // 2. Fetch recent documents
    const rawDocs = await prisma.document.findMany({
      where: { uploadedById: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        workspace: {
          select: { name: true }
        }
      }
    });

    recentDocuments = rawDocs.map(doc => ({
      id: doc.id,
      name: doc.originalFilename,
      date: new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(doc.createdAt),
      size: `${((doc as any).originalSize / (1024 * 1024)).toFixed(2)} MB`,
      workspace: doc.workspace.name,
    }));
  }

  const stats = {
    totalDocs,
    activeWorkspaces,
    totalConversations,
    // Just a placeholder for quizzes if we don't have a direct model count for them yet
    generatedQuizzes: 0 
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Overview</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Welcome back, {userName}! Here's what's happening in your workspaces.</p>
      </div>

      <StatisticsCards stats={stats} />

      <DashboardGrid recentDocuments={recentDocuments} />
    </div>
  );
}
