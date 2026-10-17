import { z } from "zod";

/*
 * Two kinds of configuration:
 * - Public: Supabase URL and publishable key. Safe in the browser; RLS protects data.
 * - Secret: Supabase secret key (sb_secret_...), database URL and OpenRouter key.
 *   Server-only; never prefix with NEXT_PUBLIC_.
 */
const publicSupabaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

const supabaseSecretSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().startsWith("sb_secret_"),
});

export const DEFAULT_OPENROUTER_MODEL = "google/gemini-3.8-flash";

const openRouterEnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().startsWith("sk-or-"),
  // An empty value in .env.local means "use the default", not an invalid model.
  OPENROUTER_MODEL: z
    .string()
    .optional()
    .transform((value) => value?.trim() || DEFAULT_OPENROUTER_MODEL),
});

// Shared with Supabase Cron, which sends it as a bearer token to /api/internal/daily-editions.
const cronEnvSchema = z.object({
  CRON_SECRET: z.string().min(32),
});

const databaseEnvSchema = z.object({
  SUPABASE_DB_URL: z.string().startsWith("postgres"),
});

export class MissingConfigError extends Error {
  constructor(group: string, issues: z.core.$ZodIssue[]) {
    const fields = issues.map((issue) => issue.path.join(".")).join(", ");
    super(`${group} configuration missing or invalid: ${fields}`);
    this.name = "MissingConfigError";
  }
}

function readGroup<T>(group: string, schema: z.ZodType<T>, source: Record<string, string | undefined>): T {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    throw new MissingConfigError(group, parsed.error.issues);
  }
  return parsed.data;
}

// NEXT_PUBLIC_ values must be referenced by name so Next.js can inline them in middleware and client bundles.
export const getPublicSupabaseEnv = () =>
  readGroup("Supabase (public)", publicSupabaseSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
export const getSupabaseSecretEnv = () => readGroup("Supabase (secret)", supabaseSecretSchema, process.env);
export const getOpenRouterEnv = () => readGroup("OpenRouter", openRouterEnvSchema, process.env);
export const getDatabaseEnv = () => readGroup("Database", databaseEnvSchema, process.env);
export const getCronEnv = () => readGroup("Cron", cronEnvSchema, process.env);

type GroupStatus = { valid: boolean; invalidFields: string[]; missingFields: string[] };

function statusOf(attempt: () => unknown, values: Record<string, string | undefined>): GroupStatus {
  try {
    attempt();
    return { valid: true, invalidFields: [], missingFields: [] };
  } catch (error) {
    const fields = error instanceof MissingConfigError ? (error.message.split(": ")[1]?.split(", ") ?? []) : ["unknown"];
    // "missing" = unset or empty; "invalid" = set but failing validation. Values are never reported.
    const missing = fields.filter((f) => !values[f]);
    return { valid: false, invalidFields: fields.filter((f) => !missing.includes(f)), missingFields: missing };
  }
}

/** Runtime config health for /api/health: names of invalid fields only, never values. */
export function getConfigStatus(): Record<string, GroupStatus> {
  return {
    supabasePublic: statusOf(getPublicSupabaseEnv, {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }),
    supabaseSecret: statusOf(getSupabaseSecretEnv, process.env),
    openRouter: statusOf(getOpenRouterEnv, process.env),
    cron: statusOf(getCronEnv, process.env),
  };
}

export function isAiConfigured(): boolean {
  return openRouterEnvSchema.safeParse(process.env).success;
}
