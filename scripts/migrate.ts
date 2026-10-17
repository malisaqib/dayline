import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { getDatabaseEnv } from "@/server/env";

const MIGRATIONS_DIR = path.resolve("supabase/migrations");

// Applies each .sql file once, in filename order, recording it in schema_migrations.
async function main() {
  const sql = postgres(getDatabaseEnv().SUPABASE_DB_URL, { max: 1, onnotice: () => {} });
  try {
    await sql`create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
    const applied = new Set((await sql<{ name: string }[]>`select name from public.schema_migrations`).map((r) => r.name));
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip    ${file}`);
        continue;
      }
      const body = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`insert into public.schema_migrations (name) values (${file})`;
      });
      console.log(`applied ${file}`);
    }
  } finally {
    await sql.end();
  }
}

main().catch((error: Error) => {
  console.error(`migration failed: ${error.message}`);
  process.exit(1);
});
