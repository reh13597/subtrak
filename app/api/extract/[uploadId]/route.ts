import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { extractSubscriptionsFromFile, calculateNextBillingDate } from "@/lib/ai";

type RouteParams = { params: Promise<{ uploadId: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const { uploadId } = await params;
    const id = parseInt(uploadId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 });
    }

    const upload = await prisma.statementUpload.findUnique({ where: { id } });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    if (upload.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const extractions = await prisma.extractedSubscription.findMany({
      where: { uploadId: id },
      orderBy: { confidenceScore: "desc" },
    });

    const items = extractions.map((e) => ({
      id: e.id,
      name: e.name,
      price: Number(e.price),
      currency: e.currency,
      billingCycle: e.billingCycle,
      providerUrl: e.providerUrl,
      lastChargeDate: e.lastChargeDate?.toISOString() ?? null,
      nextBillingDate: e.nextBillingDate?.toISOString() ?? null,
      confidenceScore: e.confidenceScore,
      reviewStatus: e.reviewStatus,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    const message = err instanceof Error ? err.message : "Failed to fetch extractions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const { uploadId } = await params;
    const id = parseInt(uploadId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 });
    }

    const upload = await prisma.statementUpload.findUnique({ where: { id } });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    if (upload.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!upload.fileData) {
      return NextResponse.json({ error: "Upload has no file data" }, { status: 400 });
    }

    await prisma.statementUpload.update({
      where: { id },
      data: { status: "PROCESSING" },
    });

    const result = await extractSubscriptionsFromFile(
      Buffer.from(upload.fileData),
      upload.mimeType,
      upload.fileName
    );

    if (!result.success) {
      await prisma.statementUpload.update({
        where: { id },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    const extractions = await prisma.$transaction(
      result.data.map((item) => {
        const lastChargeDate = item.lastChargeDate ? new Date(item.lastChargeDate) : null;
        const nextBillingDate = item.lastChargeDate
          ? calculateNextBillingDate(item.lastChargeDate, item.billingCycle)
          : null;

        return prisma.extractedSubscription.create({
          data: {
            uploadId: id,
            name: item.name,
            price: item.price,
            currency: item.currency,
            billingCycle: item.billingCycle,
            providerUrl: item.providerUrl ?? null,
            lastChargeDate,
            nextBillingDate,
            confidenceScore: item.confidenceScore,
            reviewStatus: "PENDING",
            rawJson: item as Record<string, unknown>,
          },
        });
      })
    );

    await prisma.statementUpload.update({
      where: { id },
      data: { status: "DONE" },
    });

    const items = extractions.map((e) => ({
      id: e.id,
      name: e.name,
      price: Number(e.price),
      currency: e.currency,
      billingCycle: e.billingCycle,
      providerUrl: e.providerUrl,
      lastChargeDate: e.lastChargeDate?.toISOString() ?? null,
      nextBillingDate: e.nextBillingDate?.toISOString() ?? null,
      confidenceScore: e.confidenceScore,
      reviewStatus: e.reviewStatus,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    const message = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
