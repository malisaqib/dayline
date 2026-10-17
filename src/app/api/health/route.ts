import { getConfigStatus } from "@/server/env";

export const dynamic = "force-dynamic";

// Reports which configuration groups are valid (booleans and field names only, never values).
export function GET() {
  const status = getConfigStatus();
  const ok = Object.values(status).every((group) => group.valid);
  return Response.json({ ok, config: status }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
