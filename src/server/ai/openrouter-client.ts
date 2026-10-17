import { z } from "zod";
import { getOpenRouterEnv } from "@/server/env";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 45_000;
const APP_TITLE = "Dayline";

export type JsonSchema = Record<string, unknown>;

export type JsonCompletionRequest = {
  system: string;
  user: string;
  schemaName: string;
  schema: JsonSchema;
  temperature: number;
  maxTokens: number;
  /** "strict": JSON Schema structured output, routed only to providers that support it. "prompt": plain JSON by instruction. */
  mode: "strict" | "prompt";
};

export type JsonCompletion = {
  content: string;
  model: string;
  finishReason: string | null;
  inputTokens: number;
  outputTokens: number;
  structured: boolean;
};

export class OpenRouterError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    /** True when no provider for this model supports strict structured output. */
    readonly unsupportedParameters = false,
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

const responseSchema = z.object({
  model: z.string(),
  choices: z
    .array(
      z.object({
        finish_reason: z.string().nullable().optional(),
        message: z.object({ content: z.string().nullable() }),
      }),
    )
    .min(1),
  usage: z.object({ prompt_tokens: z.number(), completion_tokens: z.number() }).optional(),
});

const errorSchema = z.object({ error: z.object({ message: z.string(), code: z.union([z.number(), z.string()]).optional() }) });

function requestBody(request: JsonCompletionRequest, model: string): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    temperature: request.temperature,
    max_tokens: request.maxTokens,
    messages: [
      { role: "system", content: request.system },
      { role: "user", content: request.user },
    ],
  };
  if (request.mode === "strict") {
    body.response_format = { type: "json_schema", json_schema: { name: request.schemaName, strict: true, schema: request.schema } };
    // Only route to provider endpoints that honour response_format and temperature.
    body.provider = { require_parameters: true };
  }
  return body;
}

/** One chat completion expected to return a JSON object. Never logs the key or the prompt. */
export async function completeJson(request: JsonCompletionRequest): Promise<JsonCompletion> {
  const env = getOpenRouterEnv();

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": APP_TITLE,
      },
      body: JSON.stringify(requestBody(request, env.OPENROUTER_MODEL)),
    });
  } catch (error) {
    throw new OpenRouterError(`request failed: ${(error as Error).message}`, null);
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = errorSchema.safeParse(payload).data?.error.message ?? `HTTP ${response.status}`;
    const unsupported = request.mode === "strict" && response.status === 404 && /support|parameter/i.test(message);
    throw new OpenRouterError(message, response.status, unsupported);
  }

  const parsed = responseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new OpenRouterError("unexpected response shape", response.status);
  }
  const choice = parsed.data.choices[0];
  return {
    content: choice.message.content ?? "",
    model: parsed.data.model,
    finishReason: choice.finish_reason ?? null,
    inputTokens: parsed.data.usage?.prompt_tokens ?? 0,
    outputTokens: parsed.data.usage?.completion_tokens ?? 0,
    structured: request.mode === "strict",
  };
}
