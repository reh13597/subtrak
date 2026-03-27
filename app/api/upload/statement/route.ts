import { NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { uploadSchema } from "@/lib/validations/upload";
import { uploadToS3 } from "@/lib/s3";

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

    const s3Key = await uploadToS3(fileData, file.name, file.type);

    const result = await execute(
      `INSERT INTO StatementUpload (userId, fileName, s3Key, mimeType, status, createdAt)
       VALUES (?, ?, ?, ?, 'PENDING', NOW())`,
      [user.id, file.name, s3Key, file.type]
    );

    return NextResponse.json({ uploadId: result.insertId }, { status: 201 });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    const message = err instanceof Error ? err.message : "Failed to upload statement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
