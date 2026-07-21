"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white dark:bg-zinc-950 flex flex-col md:flex-row selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* Left Pane - Immersive Interactive Brand Experience */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-zinc-950 relative border-r border-white/10 flex-col justify-between overflow-hidden p-12 group">
        
        {/* Interactive Spotlight background */}
        <motion.div 
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          animate={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.08), transparent 40%)`
          }}
        />
        
        {/* Subtle animated grid - Made more visible per user request */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_30%,transparent_100%)] opacity-100 z-0" />

        {/* Floating gradient orb */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] z-0"
        />

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="flex items-center gap-3 mb-16"
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/10">
              <span className="text-zinc-950 font-black text-xl leading-none">K</span>
            </div>
            <span className="font-bold tracking-tight text-2xl text-white">KnowledgeHub</span>
          </motion.div>
          
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.15 }
              }
            }}
          >
            {["Your personal", "AI-powered", "research assistant."].map((text, i) => (
              <motion.div
                key={text}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] } }
                }}
                className={`text-5xl font-semibold tracking-tight leading-[1.1] mb-2 ${
                  i === 1 ? "text-indigo-400" : "text-white"
                }`}
              >
                {text}
              </motion.div>
            ))}
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-zinc-400 text-lg leading-relaxed max-w-md mt-8"
          >
            Upload documents, extract insights, generate study materials, and seamlessly query your entire knowledge base in real-time.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="relative z-10 text-sm text-zinc-600 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          System Operational • {new Date().getFullYear()}
        </motion.div>
      </div>

      {/* Right Pane - Form area */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative z-10 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        
        {/* Interactive Spotlight background for the form area */}
        <motion.div 
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          animate={{
            background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.07), transparent 40%)`
          }}
        />

        {/* Subtle grid for right pane as well */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] z-0" />

        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-zinc-950 dark:bg-white rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white dark:text-zinc-950 font-black text-xl leading-none">K</span>
            </div>
            <span className="font-bold tracking-tight text-2xl text-zinc-900 dark:text-white">KnowledgeHub</span>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
