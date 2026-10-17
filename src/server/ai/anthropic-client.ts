import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicEnv } from "@/server/env";

const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 1;

let client: Anthropic | null = null;

export function getAnthropic(): { client: Anthropic; model: string } {
  const env = getAnthropicEnv();
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: REQUEST_TIMEOUT_MS, maxRetries: MAX_RETRIES });
  }
  return { client, model: env.ANTHROPIC_MODEL };
}
