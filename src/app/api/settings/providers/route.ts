import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { encryptionService } from "@/services/security/encryption.service";
import { ProviderResolver } from "@/services/ai/provider.resolver";
import { ProviderError } from "@/services/ai/ai.provider";
import { AIProviderId } from "@/services/ai/models.registry";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const keys = await prisma.userApiKey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        provider: true,
        keyName: true,
        defaultModel: true,
        isDefault: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(keys);
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { provider, apiKey, keyName, defaultModel, isDefault, status } = body;

    if (!provider || !apiKey) {
      return NextResponse.json({ error: "Provider and API Key are required" }, { status: 400 });
    }

    const cleanApiKey = apiKey.replace(/[^\x20-\x7E]/g, '').trim();

    // Validate API Key before saving
    try {
      const { provider: aiProviderInstance, config } = await ProviderResolver.resolveFromRaw(provider as AIProviderId, cleanApiKey, defaultModel);
      await aiProviderInstance.validateApiKey(config);
    } catch (error: any) {
      if (error instanceof ProviderError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: "Failed to validate API key." }, { status: 400 });
    }

    const encryptedKey = encryptionService.encrypt(cleanApiKey);

    // If setting as default, unset others for this provider
    if (isDefault) {
      await prisma.userApiKey.updateMany({
        where: { userId: session.user.id, provider },
        data: { isDefault: false }
      });
    }

    const newKey = await prisma.userApiKey.create({
      data: {
        userId: session.user.id,
        provider,
        encryptedKey,
        keyName: keyName || `${provider} Key`,
        defaultModel,
        isDefault: isDefault || false,
        status: status || "active",
      }
    });

    return NextResponse.json({
      id: newKey.id,
      provider: newKey.provider,
      keyName: newKey.keyName,
      defaultModel: newKey.defaultModel,
      isDefault: newKey.isDefault,
      status: newKey.status
    });
  } catch (error) {
    console.error("Error saving provider key:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }

    await prisma.userApiKey.delete({
      where: { 
        id,
        userId: session.user.id // Ensure user owns the key
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting provider key:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
