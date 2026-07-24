import { FileText, MoreHorizontal, FileIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Document {
  id: string;
  name: string;
  date: string;
  size: string;
  workspace: string;
}

export function RecentDocuments({ documents = [] }: { documents?: Document[] }) {
  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 shrink-0 py-4">
        <div>
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>Your recently uploaded or viewed files.</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="hidden sm:flex">View All</Button>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {documents.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 dark:text-zinc-400">
              No recent documents found.
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer truncate max-w-[150px] sm:max-w-[200px]">
                      {doc.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.date}</span>
                      <span className="hidden sm:inline-block px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] ml-2 font-medium truncate max-w-[80px]">
                        {doc.workspace}
                      </span>
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
