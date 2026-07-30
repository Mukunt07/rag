import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayUsage, monthUsage] = await Promise.all([
      prisma.usageMetric.aggregate({
        where: {
          userId: session.user.id,
          createdAt: { gte: today }
        },
        _count: { id: true },
        _sum: { totalTokens: true }
      }),
      prisma.usageMetric.aggregate({
        where: {
          userId: session.user.id,
          createdAt: { gte: firstDayOfMonth }
        },
        _sum: { totalTokens: true, cost: true }
      })
    ]);

    return NextResponse.json({
      todayRequests: todayUsage._count.id || 0,
      todayTokens: todayUsage._sum.totalTokens || 0,
      monthlyTokens: monthUsage._sum.totalTokens || 0,
      estimatedCost: monthUsage._sum.cost || 0
    });
  } catch (error) {
    console.error("Failed to fetch usage metrics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
