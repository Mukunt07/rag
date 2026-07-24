"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  BrainCircuit,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function Sidebar({ recentDocuments = [] }: { recentDocuments?: any[] }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      className="hidden md:flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl relative z-20"
    >
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0 relative">
        <div className="flex items-center gap-3 w-full">
          <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white dark:text-zinc-900 font-bold text-sm leading-none">K</span>
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-semibold tracking-tight text-lg text-zinc-900 dark:text-zinc-100 whitespace-nowrap overflow-hidden"
              >
                KnowledgeHub
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-sm flex items-center justify-center hover:scale-110 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 z-50 transition-all"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 py-6 px-4 space-y-6 overflow-y-auto overflow-x-hidden">
        <nav className="space-y-1">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 whitespace-nowrap"
              >
                Main
              </motion.p>
            )}
          </AnimatePresence>
          <NavItem href="/dashboard" icon={<LayoutDashboard className="w-4 h-4 shrink-0" />} label="Dashboard" isCollapsed={isCollapsed} active />
          <NavItem href="/documents" icon={<FileText className="w-4 h-4 shrink-0" />} label="Documents" isCollapsed={isCollapsed} />
          <NavItem href="/notes" icon={<BookOpen className="w-4 h-4 shrink-0" />} label="Notes & Summaries" isCollapsed={isCollapsed} />
          <NavItem href="/quiz" icon={<BrainCircuit className="w-4 h-4 shrink-0" />} label="Flashcards & Quiz" isCollapsed={isCollapsed} />
        </nav>

        <nav className="space-y-1">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 whitespace-nowrap"
              >
                Workspaces
              </motion.p>
            )}
          </AnimatePresence>
          <NavItem href="/workspace/personal" icon={<div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />} label="Personal" isCollapsed={isCollapsed} />
          <NavItem href="/workspace/research" icon={<div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />} label="Research" isCollapsed={isCollapsed} />
          <NavItem href="/workspace/work" icon={<div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />} label="Work" isCollapsed={isCollapsed} />
        </nav>

        {recentDocuments.length > 0 && (
          <nav className="space-y-1 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 whitespace-nowrap"
                >
                  Recent Documents
                </motion.p>
              )}
            </AnimatePresence>
            {recentDocuments.map((doc) => (
              <NavItem 
                key={doc.id} 
                href={`/documents`} 
                icon={<FileIcon className="w-4 h-4 shrink-0" />} 
                label={doc.name} 
                isCollapsed={isCollapsed} 
              />
            ))}
          </nav>
        )}
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2 shrink-0">
        <NavItem href="/settings" icon={<Settings className="w-4 h-4 shrink-0" />} label="Settings" isCollapsed={isCollapsed} />
        <button
          onClick={handleLogout}
          className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 w-full ${isCollapsed ? 'justify-center' : 'gap-3'}`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden text-left"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}

function NavItem({ href, icon, label, active = false, isCollapsed }: { href: string; icon: ReactNode; label: string; active?: boolean; isCollapsed: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${active
          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
        } ${isCollapsed ? 'justify-center' : 'gap-3'}`}
      title={isCollapsed ? label : undefined}
    >
      {icon}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="whitespace-nowrap overflow-hidden"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
