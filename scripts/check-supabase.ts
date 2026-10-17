import { getSupabaseAdmin } from "@/server/db/supabase-admin";
import { deleteIntegrationCheck, findIntegrationCheck, insertIntegrationCheck } from "@/server/repositories/integration-checks";

async function main() {
  const db = getSupabaseAdmin();
  const note = `phase0-check ${new Date().toISOString()}`;

  const inserted = await insertIntegrationCheck(db, note);
  console.log(`write  ok: id ${inserted.id}`);

  try {
    const found = await findIntegrationCheck(db, inserted.id);
    if (found?.note !== note) {
      throw new Error("read-back did not match the written record");
    }
    console.log(`read   ok: note matches, created_at ${found.created_at}`);
  } finally {
    await deleteIntegrationCheck(db, inserted.id);
    const gone = (await findIntegrationCheck(db, inserted.id)) === null;
    console.log(`delete ${gone ? "ok" : "FAILED"}: test record ${gone ? "removed" : "still present"}`);
  }
}

main().catch((error: Error) => {
  console.error(`Supabase check failed: ${error.message}`);
  process.exit(1);
});
