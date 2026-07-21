"use client";

import React, { useState, useEffect } from "react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal } from "lucide-react";

import { UploadCard } from "@/features/dashboard/components/upload-card";
import { RecentDocuments } from "@/features/dashboard/components/recent-documents";
import { QuickActions } from "@/features/dashboard/components/quick-actions";

type WidgetId = "upload" | "recent" | "quick";

const WIDGETS: Record<WidgetId, { component: React.ReactNode; span: string }> = {
  upload: { component: <UploadCard />, span: "lg:col-span-2" },
  recent: { component: <RecentDocuments />, span: "lg:col-span-2" },
  quick: { component: <QuickActions />, span: "lg:col-span-1" }
};

export function DashboardGrid() {
  const [items, setItems] = useState<WidgetId[]>(["upload", "recent", "quick"]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("dashboard-layout");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3) {
          setItems(parsed);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before dragging starts to allow clicking inside cards
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as WidgetId);
        const newIndex = items.indexOf(over.id as WidgetId);
        
        const newArray = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem("dashboard-layout", JSON.stringify(newArray));
        return newArray;
      });
    }
  };

  if (!isMounted) return null; // Prevent hydration mismatch

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative z-10">
        <SortableContext 
          items={items}
          strategy={rectSortingStrategy}
        >
          {items.map((id) => (
            <SortableWidget key={id} id={id} span={WIDGETS[id].span}>
              {WIDGETS[id].component}
            </SortableWidget>
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}

function SortableWidget({ id, span, children }: { id: string; span: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`${span} relative group ${isDragging ? "opacity-50 scale-105 shadow-2xl" : ""}`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-50 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        <GripHorizontal className="w-5 h-5" />
      </div>
      {children}
    </div>
  );
}
