import { MockAiClient } from "./mock-client";
import { OpenAiClient } from "./openai-stub";
import type { AiClient } from "./types";

export type { AiClient, AiChatRequest, AiChatResponse, AiMessage, AiChatContext } from "./types";
export { MockAiClient } from "./mock-client";
export { OpenAiClient } from "./openai-stub";

/** Factory: Phase 1 always returns mock unless AI_PROVIDER=openai (which still no-ops/throws). */
export function getAiClient(): AiClient {
  if (process.env.AI_PROVIDER === "openai") {
    return new OpenAiClient();
  }
  return new MockAiClient();
}
