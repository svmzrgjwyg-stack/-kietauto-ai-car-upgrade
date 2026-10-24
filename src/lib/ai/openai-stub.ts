import type { AiChatRequest, AiChatResponse, AiClient } from "./types";

/**
 * OpenAI adapter stub for a future phase.
 * - Does NOT require API keys to boot the app.
 * - Does NOT call the network in Phase 1.
 * - Throws if invoked without OPENAI_API_KEY (or if keys exist but Phase 1 policy forbids calls).
 */
export class OpenAiClient implements AiClient {
  readonly name = "openai-stub";

  async chat(_request: AiChatRequest): Promise<AiChatResponse> {
    void _request;
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        "OpenAiClient: OPENAI_API_KEY is not set. Phase 1 uses MockAiClient only.",
      );
    }
    // Even with a key present, Phase 1 must not call paid APIs.
    throw new Error(
      "OpenAiClient: network calls are disabled in Phase 1 MVP. Use MockAiClient.",
    );
  }
}
