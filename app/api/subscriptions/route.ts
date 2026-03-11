import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { subscriptionCreateSchema } from "@/lib/validations/subscription";
import { Prisma } from "@/lib/generated/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const billingCycle = searchParams.get("billingCycle");

    const where: Prisma.SubscriptionWhereInput = { userId: user.id };

    if (search) {
      where.name = { contains: search };
    }
    if (status) {
      where.status = status as Prisma.EnumSubscriptionStatusFilter["equals"];
    }
    if (billingCycle) {
      where.billingCycle = billingCycle as Prisma.EnumBillingCycleFilter["equals"];
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscriptions });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    const message = err instanceof Error ? err.message : "Failed to fetch subscriptions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const data = subscriptionCreateSchema.parse(body);

    const subscription = await prisma.subscription.create({
      data: {
        ...data,
        userId: user.id,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    if (err instanceof Error && err.name === "ZodError") {
      return NextResponse.json({ error: (err as any).issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to create subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
