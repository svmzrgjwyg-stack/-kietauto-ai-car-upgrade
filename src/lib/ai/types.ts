import type { Locale, VehicleSelection } from "@/types";

export interface AiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiChatContext {
  locale: Locale;
  vehicle: VehicleSelection | null;
  vehicleLabel?: string;
  comboProductIds?: string[];
}

export interface AiChatRequest {
  messages: AiMessage[];
  context: AiChatContext;
}

export interface AiChatResponse {
  message: AiMessage;
  meta?: {
    provider: string;
    intents?: string[];
  };
}

/**
 * Shared AI adapter interface.
 * Phase 1: MockAiClient only. OpenAiClient is a stub for later — never call paid APIs in MVP.
 */
export interface AiClient {
  readonly name: string;
  chat(request: AiChatRequest): Promise<AiChatResponse>;
}
