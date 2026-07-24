import { ReactNode } from "react";
import { Search, Bell, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { InteractiveBackground } from "@/components/interactive-background";
import { Sidebar } from "@/features/dashboard/components/sidebar";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  const userInitials = session?.user?.name
    ? session.user.name.substring(0, 2).toUpperCase()
    : "U";

  const userId = session?.user?.id;
  let recentDocuments: any[] = [];

  if (userId) {
    const rawDocs = await prisma.document.findMany({
      where: { uploadedById: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    recentDocuments = rawDocs.map(doc => ({
      id: doc.id,
      name: doc.originalFilename,
    }));
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex relative z-0">
      <InteractiveBackground />
      <Sidebar recentDocuments={recentDocuments} />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden sm:flex relative max-w-md w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search documents, notes, questions..."
                className="h-9 w-64 md:w-80 lg:w-96 pl-9 pr-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-300 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-medium">
              {userInitials}
            </Button>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}


