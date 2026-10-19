/**
 * RecommendationEngine — F37: exclusion filter must use PostgREST array form,
 * not the invalid parenthesized-string form.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

import { RecommendationEngine } from "@/lib/marketplace/recommendation";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/server");

type Recorder = { not?: unknown[] };

function makeBuilder(result: unknown, recorder: Recorder) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    not: (col: string, op: string, val: unknown) => {
      recorder.not = [col, op, val];
      return builder;
    },
    then: (onFulfilled: unknown, onRejected: unknown) =>
      Promise.resolve(result).then(onFulfilled as never, onRejected as never),
  };
  return builder;
}

describe("RecommendationEngine.getRecommendations (F37)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes installed ids to .not('id','in', ...) as an array", async () => {
    const recorder: Recorder = {};
    const client = {
      from: (table: string) => {
        if (table === "user_agents") {
          return makeBuilder(
            { data: [{ agent_id: "a1" }, { agent_id: "b2" }], error: null },
            recorder
          );
        }
        return makeBuilder({ data: [], error: null }, recorder);
      },
    };
    vi.mocked(createClient).mockResolvedValue(client as never);

    await RecommendationEngine.getRecommendations("user-1", 5);

    expect(recorder.not).toEqual(["id", "in", ["a1", "b2"]]);
  });
});
