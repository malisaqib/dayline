import { z } from "zod";

// Server-only configuration. None of these names use NEXT_PUBLIC_, so Next.js never bundles them for the browser.
const supabaseEnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
});

const anthropicEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(20),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-opus-5-5"),
});

const databaseEnvSchema = z.object({
  SUPABASE_DB_URL: z.string().startsWith("postgres"),
});

export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;
export type AnthropicEnv = z.infer<typeof anthropicEnvSchema>;
export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export class MissingConfigError extends Error {
  constructor(group: string, issues: z.core.$ZodIssue[]) {
    const fields = issues.map((issue) => issue.path.join(".")).join(", ");
    super(`${group} configuration missing or invalid: ${fields}`);
    this.name = "MissingConfigError";
  }
}

function readGroup<T>(group: string, schema: z.ZodType<T>): T {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new MissingConfigError(group, parsed.error.issues);
  }
  return parsed.data;
}

export const getSupabaseEnv = () => readGroup("Supabase", supabaseEnvSchema);
export const getAnthropicEnv = () => readGroup("Anthropic", anthropicEnvSchema);
export const getDatabaseEnv = () => readGroup("Database", databaseEnvSchema);
