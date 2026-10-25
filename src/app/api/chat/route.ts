import { NextResponse } from "next/server";
import { getAiClient } from "@/lib/ai";
import type { AiChatRequest } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AiChatRequest;
    const client = getAiClient();
    const response = await client.chat(body);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
