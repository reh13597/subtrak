import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { extractSubscriptionsFromFile, calculateNextBillingDate } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";

type RouteParams = { params: Promise<{ uploadId: string }> };

const EXTRACT_MAX_PER_WINDOW = 5;
const EXTRACT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

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
    return NextResponse.json({ error: "Failed to fetch extractions" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);

    const rateLimitKey = `extract:${user.id}`;
    const { allowed, retryAfterMs } = checkRateLimit(
      rateLimitKey,
      EXTRACT_MAX_PER_WINDOW,
      EXTRACT_WINDOW_MS
    );

    if (!allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${Math.ceil(retryAfterMs / 60_000)} minute(s).` },
        { status: 429 }
      );
    }

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
            rawJson: JSON.parse(JSON.stringify(item)),
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
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
