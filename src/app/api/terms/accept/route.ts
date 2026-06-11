import { termsGuard } from "@/lib/legal/termsGuard";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const { userId, role } = body;

  if (!userId || !role) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  /**
   * STORE ACCEPTANCE IN MEMORY (replace with DB later)
   */
  termsGuard.accept(userId);

  return NextResponse.json({
    success: true,
    message: "Terms accepted",
  });
}
