import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { subscriptionCreateSchema } from "@/lib/validations/subscription";
import { Prisma } from "@/lib/generated/prisma";
import { z } from "zod";

const querySchema = z.object({
  search: z.string().max(200).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).optional(),
  billingCycle: z.enum(["MONTHLY", "YEARLY", "WEEKLY", "CUSTOM"]).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      billingCycle: searchParams.get("billingCycle") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const { search, status, billingCycle } = parsed.data;
    const where: Prisma.SubscriptionWhereInput = { userId: user.id };

    if (search) {
      where.name = { contains: search };
    }
    if (status) {
      where.status = status;
    }
    if (billingCycle) {
      where.billingCycle = billingCycle;
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscriptions });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
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
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
