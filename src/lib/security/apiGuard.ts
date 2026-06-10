import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://safe-drive-web.vercel.app",
  "https://safedriveglobal.app",
];

/**
 * Basic origin + method protection
 */
export function apiGuard(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const method = req.method;

  /**
   * BLOCK invalid methods
   */
  const allowedMethods = ["GET", "POST", "PUT", "DELETE"];

  if (!allowedMethods.includes(method)) {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  /**
   * BLOCK unknown origins (prevents browser-based abuse)
   */
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: "Unauthorized origin" }, { status: 403 });
  }

  return null;
}
