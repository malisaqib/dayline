import { runDailyEditionJob } from "@/server/services/daily-job";
import { handleDailyEditionRequest } from "@/server/services/daily-job-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Generation for all readers can take minutes; Supabase Cron waits up to the same limit.
export const maxDuration = 300;

// Called by Supabase Cron (pg_net) every morning with `Authorization: Bearer <CRON_SECRET>`.
export function POST(request: Request) {
  return handleDailyEditionRequest(request, { secret: process.env.CRON_SECRET, runJob: () => runDailyEditionJob() });
}
