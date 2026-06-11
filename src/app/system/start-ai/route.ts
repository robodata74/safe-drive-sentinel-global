import { initDispatchAI } from "@/lib/dispatch/initDispatchAI";
import { NextResponse } from "next/server";

export async function POST() {
  initDispatchAI();

  return NextResponse.json({
    status: "Dispatch AI started",
  });
}
