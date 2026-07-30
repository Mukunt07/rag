import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { keyId, defaultModel } = await req.json();

    if (!keyId) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }

    // 1. Unset all defaults for this user
    await prisma.userApiKey.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false }
    });

    // 2. Set the requested key as default and update its model
    const updatedKey = await prisma.userApiKey.update({
      where: { id: keyId, userId: session.user.id },
      data: { 
        isDefault: true,
        ...(defaultModel ? { defaultModel } : {})
      }
    });

    return NextResponse.json(updatedKey);
  } catch (error) {
    console.error("Failed to set default provider:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
