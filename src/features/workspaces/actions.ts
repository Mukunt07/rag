"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createWorkspace(data: { name: string; description?: string; icon?: string }) {
  const session = await getSession();
  
  const workspace = await prisma.workspace.create({
    data: {
      name: data.name,
      description: data.description,
      icon: data.icon,
      ownerId: session.user.id,
    }
  });

  revalidatePath("/dashboard");
  return workspace;
}

export async function getWorkspaces() {
  const session = await getSession();
  
  return prisma.workspace.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });
}

export async function deleteWorkspace(id: string) {
  const session = await getSession();
  
  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace || workspace.ownerId !== session.user.id) {
    throw new Error("Unauthorized");
  }
  
  await prisma.workspace.delete({ where: { id } });
  revalidatePath("/dashboard");
}
