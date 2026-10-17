import { z } from "zod";

/*
 * Two kinds of configuration:
 * - Public: Supabase URL and publishable key. Safe in the browser; RLS protects data.
 * - Secret: Supabase secret/service-role key, database URL and Anthropic key.
 *   Server-only; never prefix with NEXT_PUBLIC_.
 */
const publicSupabaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

const supabaseSecretSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
});

const anthropicEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(20),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-opus-5-5"),
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
export const getAnthropicEnv = () => readGroup("Anthropic", anthropicEnvSchema, process.env);
export const getDatabaseEnv = () => readGroup("Database", databaseEnvSchema, process.env);

export function isAnthropicConfigured(): boolean {
  return anthropicEnvSchema.safeParse(process.env).success;
}
