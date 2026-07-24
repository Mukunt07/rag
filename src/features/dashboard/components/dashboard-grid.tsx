"use client";

import React, { useState, useEffect } from "react";
import GridLayout, { Responsive, WidthProvider, LayoutItem, Layout } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { GripHorizontal } from "lucide-react";

import { UploadCard } from "@/features/dashboard/components/upload-card";
import { RecentDocuments } from "@/features/dashboard/components/recent-documents";
import { QuickActions } from "@/features/dashboard/components/quick-actions";

const ResponsiveGridLayout = WidthProvider(Responsive);

type WidgetId = "upload" | "recent" | "quick";

const DEFAULT_LAYOUT: Layout = [
  { i: "upload", x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 2 },
  { i: "recent", x: 2, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
  { i: "quick", x: 0, y: 2, w: 3, h: 1, minW: 1, minH: 1 }
];

export function DashboardGrid({ recentDocuments = [] }: { recentDocuments?: any[] }) {
  const [layout, setLayout] = useState<Layout>(DEFAULT_LAYOUT);
  const [isMounted, setIsMounted] = useState(false);

  const WIDGETS: Record<WidgetId, { component: React.ReactNode }> = {
    upload: { component: <UploadCard /> },
    recent: { component: <RecentDocuments documents={recentDocuments} /> },
    quick: { component: <QuickActions /> }
  };

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("dashboard-grid-layout-v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLayout(parsed);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleLayoutChange = (newLayout: Layout) => {
    setLayout(newLayout);
    localStorage.setItem("dashboard-grid-layout-v1", JSON.stringify(newLayout));
  };

  if (!isMounted) return null; // Prevent hydration mismatch

  return (
    <div className="relative z-10 w-full">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 3, md: 3, sm: 2, xs: 1, xxs: 1 }}
        rowHeight={150}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        margin={[32, 32]}
        isBounded={false}
      >
        {layout.map((item) => {
          const widgetId = item.i as WidgetId;
          if (!WIDGETS[widgetId]) return null;
          
          return (
            <div key={item.i} className="group relative">
              <div className="drag-handle absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-50 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm rounded-md shadow-sm border border-zinc-200 dark:border-zinc-800">
                <GripHorizontal className="w-5 h-5" />
              </div>
              <div className="w-full h-full overflow-hidden [&>div]:h-full [&>div]:w-full [&>div]:flex [&>div]:flex-col">
                {WIDGETS[widgetId].component}
              </div>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}
