import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary">KnowledgeHub AI</h1>
          <p className="text-sm text-muted-foreground mt-2">Your intelligent knowledge workspace</p>
        </div>
        {children}
      </div>
    </div>
  );
}
