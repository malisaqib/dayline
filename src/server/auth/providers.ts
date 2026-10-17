import { getPublicSupabaseEnv } from "@/server/env";

const settingsSchemaKeys = ["google"] as const;

export type ProviderFlags = Record<(typeof settingsSchemaKeys)[number], boolean>;

export async function enabledProviders(): Promise<ProviderFlags> {
  const env = getPublicSupabaseEnv();
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      return { google: false };
    }
    const body = (await response.json()) as { external?: Record<string, boolean> };
    return { google: body.external?.google === true };
  } catch {
    return { google: false };
  }
}
