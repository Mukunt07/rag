import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        ownerId: session.user.id,
        deletedAt: null
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("Failed to fetch workspaces", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newWorkspace = await prisma.workspace.create({
      data: {
        name,
        description: description || null,
        ownerId: session.user.id
      }
    });

    return NextResponse.json({ success: true, workspace: newWorkspace });
  } catch (error) {
    console.error("Failed to create workspace", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
