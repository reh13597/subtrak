import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type RouteParams = { params: Promise<{ uploadId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const { uploadId } = await params;
    const id = parseInt(uploadId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 });
    }

    const { acceptedIds } = await request.json();

    if (!Array.isArray(acceptedIds) || acceptedIds.length === 0) {
      return NextResponse.json(
        { error: "acceptedIds must be a non-empty array" },
        { status: 400 }
      );
    }

    const upload = await prisma.statementUpload.findUnique({ where: { id } });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    if (upload.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const extractions = await prisma.extractedSubscription.findMany({
      where: {
        id: { in: acceptedIds.map(Number) },
        uploadId: id,
      },
    });

    if (extractions.length === 0) {
      return NextResponse.json(
        { error: "No matching extractions found for this upload" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.extractedSubscription.updateMany({
        where: { id: { in: extractions.map((e) => e.id) } },
        data: { reviewStatus: "ACCEPTED" },
      });

      for (const ext of extractions) {
        await tx.subscription.create({
          data: {
            userId: user.id,
            name: ext.name,
            price: ext.price,
            currency: ext.currency,
            billingCycle: ext.billingCycle,
            providerUrl: ext.providerUrl,
            nextBillingDate: ext.nextBillingDate,
            status: "ACTIVE",
          },
        });
      }
    });

    return NextResponse.json({ created: extractions.length });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    const message = err instanceof Error ? err.message : "Failed to confirm extractions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
