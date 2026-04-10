import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCourseAnalyticsForUser } from "@/lib/queries/course-analytics";

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const payload = await getCourseAnalyticsForUser(user.id);
    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
