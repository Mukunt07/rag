import { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, FileText, BookOpen, BrainCircuit, Settings, Search, Bell, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-zinc-900 font-bold text-sm leading-none">K</span>
            </div>
            <span className="font-semibold tracking-tight text-lg text-zinc-900 dark:text-zinc-100">KnowledgeHub</span>
          </div>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-6 overflow-y-auto">
          <nav className="space-y-1">
            <p className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Main</p>
            <NavItem href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active />
            <NavItem href="/documents" icon={<FileText className="w-4 h-4" />} label="Documents" />
            <NavItem href="/notes" icon={<BookOpen className="w-4 h-4" />} label="Notes & Summaries" />
            <NavItem href="/quiz" icon={<BrainCircuit className="w-4 h-4" />} label="Flashcards & Quiz" />
          </nav>
          
          <nav className="space-y-1">
            <p className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Workspaces</p>
            <NavItem href="/workspace/personal" icon={<div className="w-2 h-2 rounded-full bg-blue-500" />} label="Personal" />
            <NavItem href="/workspace/research" icon={<div className="w-2 h-2 rounded-full bg-purple-500" />} label="Research" />
            <NavItem href="/workspace/work" icon={<div className="w-2 h-2 rounded-full bg-emerald-500" />} label="Work" />
          </nav>
        </div>
        
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <NavItem href="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden sm:flex relative max-w-md w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search documents, notes, questions..."
                className="h-9 w-64 md:w-80 lg:w-96 pl-9 pr-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-300 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full bg-zinc-100 dark:bg-zinc-800">
              <User className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
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

function NavItem({ href, icon, label, active = false }: { href: string; icon: ReactNode; label: string; active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
        active 
          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium" 
          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
