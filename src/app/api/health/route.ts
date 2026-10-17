import { getConfigStatus } from "@/server/env";
import { fetchArticlePool } from "@/server/sources/pool";

export const dynamic = "force-dynamic";

// Reports which configuration groups are valid (booleans and field names only, never values).
// With ?sources=1 it also fetches every enabled feed once and reports per-source counts or errors.
export async function GET(request: Request) {
  const status = getConfigStatus();
  const ok = Object.values(status).every((group) => group.valid);
  const deployment = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";

  let sources: Record<string, number | string> | undefined;
  if (new URL(request.url).searchParams.get("sources") === "1") {
    const pool = await fetchArticlePool();
    sources = {};
    for (const article of pool.articles) {
      sources[article.sourceId] = ((sources[article.sourceId] as number | undefined) ?? 0) + 1;
    }
    for (const failure of pool.failedSources) {
      sources[failure.sourceId] = `error: ${failure.reason}`;
    }
  }

  return Response.json({ ok, deployment, config: status, sources }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
