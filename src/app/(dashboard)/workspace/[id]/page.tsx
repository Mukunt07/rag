import { WorkspaceView } from "@/features/workspaces/components/workspace-view";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const title = id.charAt(0).toUpperCase() + id.slice(1);
  return {
    title: `${title} Workspace - KnowledgeHub AI`,
  };
}

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkspaceView workspaceId={id} />;
}
