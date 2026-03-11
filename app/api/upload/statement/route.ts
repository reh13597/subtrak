import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { uploadSchema } from "@/lib/validations/upload";

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validation = uploadSchema.safeParse({
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileData = Buffer.from(arrayBuffer);

    const upload = await prisma.statementUpload.create({
      data: {
        userId: user.id,
        fileName: file.name,
        fileData,
        mimeType: file.type,
        status: "PENDING",
      },
    });

    return NextResponse.json({ uploadId: upload.id }, { status: 201 });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    const message = err instanceof Error ? err.message : "Failed to upload statement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
