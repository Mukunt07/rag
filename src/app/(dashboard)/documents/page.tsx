import { DocumentsView } from "@/features/documents/components/documents-view";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Documents - KnowledgeHub AI",
  description: "Manage your documents in KnowledgeHub AI.",
};

export default async function DocumentsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  const userId = session?.user?.id;
  let rawDocs: any[] = [];

  if (userId) {
    rawDocs = await prisma.document.findMany({
      where: { uploadedById: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        workspace: {
          select: { name: true }
        }
      }
    });
  }

  const documents = rawDocs.map(doc => ({
    id: doc.id,
    name: doc.originalFilename,
    date: new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(doc.createdAt),
    size: `${(doc.fileSize / (1024 * 1024)).toFixed(2)} MB`,
    workspace: doc.workspace.name,
    status: doc.status
  }));

  return <DocumentsView initialDocuments={documents} />;
}
