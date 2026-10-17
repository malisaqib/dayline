import { getConfigStatus } from "@/server/env";

export const dynamic = "force-dynamic";

// Reports which configuration groups are valid (booleans and field names only, never values).
export function GET() {
  const status = getConfigStatus();
  const ok = Object.values(status).every((group) => group.valid);
  const deployment = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  return Response.json({ ok, deployment, config: status }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
