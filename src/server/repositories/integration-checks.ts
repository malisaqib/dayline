import type { SupabaseClient } from "@supabase/supabase-js";

const TABLE = "integration_checks";

export type IntegrationCheckRow = {
  id: string;
  note: string;
  created_at: string;
};

export async function insertIntegrationCheck(db: SupabaseClient, note: string): Promise<IntegrationCheckRow> {
  const { data, error } = await db.from(TABLE).insert({ note }).select().single();
  if (error) {
    throw new Error(`insert ${TABLE}: ${error.message}`);
  }
  return data as IntegrationCheckRow;
}

export async function findIntegrationCheck(db: SupabaseClient, id: string): Promise<IntegrationCheckRow | null> {
  const { data, error } = await db.from(TABLE).select().eq("id", id).maybeSingle();
  if (error) {
    throw new Error(`select ${TABLE}: ${error.message}`);
  }
  return data as IntegrationCheckRow | null;
}

export async function deleteIntegrationCheck(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from(TABLE).delete().eq("id", id);
  if (error) {
    throw new Error(`delete ${TABLE}: ${error.message}`);
  }
}
