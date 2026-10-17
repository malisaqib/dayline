import { timingSafeEqual } from "node:crypto";
import type { DailyJobResult } from "./daily-job";

const MIN_SECRET_LENGTH = 32;

/** Constant-time bearer check. An unset or short server secret rejects every request. */
export function isAuthorizedCronRequest(authorization: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < MIN_SECRET_LENGTH || !authorization?.startsWith("Bearer ")) {
    return false;
  }
  const given = Buffer.from(authorization.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

const NO_STORE = { "Cache-Control": "no-store" };

/** Route logic for the daily job, separated so authorization and responses are testable. */
export async function handleDailyEditionRequest(
  request: Request,
  deps: { secret: string | undefined; runJob: () => Promise<DailyJobResult> },
): Promise<Response> {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"), deps.secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }
  try {
    return Response.json(await deps.runJob(), { headers: NO_STORE });
  } catch (error) {
    console.error(`[daily-job] run failed: ${error instanceof Error ? error.message.slice(0, 160) : "unknown"}`);
    return Response.json({ error: "daily job failed" }, { status: 500, headers: NO_STORE });
  }
}
