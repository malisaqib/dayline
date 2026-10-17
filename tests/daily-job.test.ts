import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runDailyEditionJob, JOB_PAGE_SIZE, type DailyJobDeps, type DailyJobResult } from "@/server/services/daily-job";
import { handleDailyEditionRequest } from "@/server/services/daily-job-handler";
import { GenerationError, type GenerationResult } from "@/server/services/generate-edition";

const SECRET = "s".repeat(40);
const NOW = new Date("2026-10-17T01:00:00Z");
const RESULT: DailyJobResult = { localDate: "2026-10-17", examined: 2, created: 1, reused: 1, failed: 0, durationMs: 5 };

function request(authorization?: string): Request {
  return new Request("http://localhost/api/internal/daily-editions", { method: "POST", headers: authorization ? { authorization } : {} });
}

describe("daily job endpoint authorization", () => {
  const run = async (authorization: string | undefined, { secret }: { secret: string | undefined } = { secret: SECRET }) => {
    let calls = 0;
    const response = await handleDailyEditionRequest(request(authorization), { secret, runJob: async () => (calls++, RESULT) });
    return { response, calls };
  };

  it("returns 401 without authorization and does not run the job", async () => {
    const { response, calls } = await run(undefined);
    assert.equal(response.status, 401);
    assert.equal(calls, 0);
  });

  it("returns 401 for a wrong token, a non-bearer scheme, or an unset server secret", async () => {
    assert.equal((await run(`Bearer ${"x".repeat(40)}`)).response.status, 401);
    assert.equal((await run(`Basic ${SECRET}`)).response.status, 401);
    assert.equal((await run("Bearer ", { secret: "" })).response.status, 401);
    const unset = await run(`Bearer ${SECRET}`, { secret: undefined });
    assert.equal(unset.response.status, 401);
    assert.equal(unset.calls, 0);
  });

  it("runs the job with the correct token and returns only the counts", async () => {
    const { response, calls } = await run(`Bearer ${SECRET}`);
    assert.equal(response.status, 200);
    assert.equal(calls, 1);
    const body = await response.json();
    assert.deepEqual(Object.keys(body).sort(), ["created", "durationMs", "examined", "failed", "localDate", "reused"]);
    assert.ok(!JSON.stringify(body).includes(SECRET));
  });
});

function generationResult(reused: boolean): GenerationResult {
  return {
    edition: { id: "e", userId: "private-user-id", localDate: "2026-10-17", timezone: "Asia/Karachi", generatedAt: "", sourcesFetchedAt: "", profile: { topics: ["space"] }, stories: [], todayInThree: [] },
    stats: { reused, durationMs: 1, poolSize: 0, failedSources: [], summaryCacheHits: 0, modelCalls: 0, modelFailures: 0, todayInThree: 0 },
  };
}

function fakeDeps(ids: string[], behaviour: (id: string) => "created" | "reused" | "fail"): DailyJobDeps & { poolLoads: () => number } {
  let loads = 0;
  return {
    listUserIds: async (after, limit) => {
      const start = after ? ids.indexOf(after) + 1 : 0;
      return ids.slice(start, start + limit);
    },
    generate: async (id, options) => {
      const outcome = behaviour(id);
      if (outcome === "fail") {
        throw new GenerationError("no_matches", "no stories");
      }
      if (outcome === "created") {
        await options.loadPool?.();
      }
      return generationResult(outcome === "reused");
    },
    loadPool: async () => {
      loads += 1;
      return { articles: [], fetchedAt: "", failedSources: [] };
    },
    poolLoads: () => loads,
  };
}

describe("daily job run", () => {
  it("reuses existing editions, creates missing ones and fetches the pool once", async () => {
    const deps = fakeDeps(["a", "b", "c", "d"], (id) => (id === "a" || id === "c" ? "reused" : "created"));
    const result = await runDailyEditionJob(NOW, deps);
    assert.deepEqual({ ...result, durationMs: 0 }, { localDate: "2026-10-17", examined: 4, created: 2, reused: 2, failed: 0, durationMs: 0 });
    assert.equal(deps.poolLoads(), 1);
  });

  it("keeps processing other readers when one fails", async () => {
    const result = await runDailyEditionJob(NOW, fakeDeps(["a", "b", "c"], (id) => (id === "b" ? "fail" : "created")));
    assert.equal(result.failed, 1);
    assert.equal(result.created, 2);
  });

  it("walks every page of readers", async () => {
    const ids = Array.from({ length: JOB_PAGE_SIZE + 7 }, (_, i) => `user-${String(i).padStart(4, "0")}`);
    const result = await runDailyEditionJob(NOW, fakeDeps(ids, () => "reused"));
    assert.equal(result.examined, ids.length);
  });

  it("does not leak reader ids in its result", async () => {
    const result = await runDailyEditionJob(NOW, fakeDeps(["private-user-id"], () => "created"));
    assert.ok(!JSON.stringify(result).includes("private-user-id"));
  });
});
