/**
 * Shared Supabase client mocks for route-handler tests.
 *
 * Supabase's query builder is fluent, so we model each table as a chainable +
 * thenable object. The chain records the terminal operation (`insert`/`update`)
 * and resolves `await`-ed chains to the matching result, while `.single()` /
 * `.limit()` resolve to configurable per-table results. Because `from()` is
 * called multiple times for the same table, each call produces a fresh chain
 * node but shares the table's config (queues, recorded calls, mutable result
 * functions) so tests can drive retry loops and refunds deterministically.
 */
import { vi } from "vitest";

export interface ChainResult {
  data: any;
  error: any;
}

export interface ChainConfig {
  /** Result returned by an awaited `.single()` (used for read queries). */
  singleResult?: () => ChainResult;
  /** FIFO of results for `.single()` — overrides singleResult while non-empty. */
  singleQueue?: ChainResult[];
  /** Result returned when a bare chain is awaited (read-path `.select()`). */
  selectResult?: () => ChainResult;
  /** Result returned when an `insert`-terminated chain is awaited. */
  insertResult?: () => ChainResult;
  /** Result returned when an `update`-terminated chain is awaited (CAS UPDATE). */
  updateResult?: () => ChainResult;
  /** Result returned by an awaited `.limit()`. */
  limitResult?: () => ChainResult;
  /** Records values passed to `.insert()`. */
  insertValues?: any[];
  /** Records values passed to `.update()`. */
  updateValues?: any[];
  /** Counter of `.single()` reads for this table. */
  singleReads?: number;
}

function makeChain(cfg: ChainConfig): any {
  const state: { lastOp: "none" | "insert" | "update" } = { lastOp: "none" };
  cfg.insertValues ??= [];
  cfg.updateValues ??= [];
  cfg.singleReads ??= 0;

  const resolve = (): ChainResult => {
    if (state.lastOp === "insert") return (cfg.insertResult ?? (() => ({ data: null, error: null })))();
    if (state.lastOp === "update") return (cfg.updateResult ?? (() => ({ data: [], error: null })))();
    return (cfg.selectResult ?? (() => ({ data: [], error: null })))();
  };

  const n: any = {
    then(ok: (v: ChainResult) => any, fail: (e: unknown) => any) {
      return Promise.resolve(resolve()).then(ok, fail);
    },
    catch(fail: (e: unknown) => any) {
      return n.then(undefined, fail);
    },
    eq: () => n,
    order: () => n,
    select: () => n,
    single: () => {
      cfg.singleReads! += 1;
      if (cfg.singleQueue && cfg.singleQueue.length > 0) {
        return Promise.resolve(cfg.singleQueue.shift()!);
      }
      return Promise.resolve((cfg.singleResult ?? (() => ({ data: null, error: null })))());
    },
    limit: () => Promise.resolve((cfg.limitResult ?? (() => ({ data: [], error: null })))()),
    insert: (values: any) => {
      state.lastOp = "insert";
      cfg.insertValues!.push(values);
      return n;
    },
    update: (values: any) => {
      state.lastOp = "update";
      cfg.updateValues!.push(values);
      return n;
    },
  };
  return n;
}

export interface MockSupabaseClient {
  client: any;
  from: ReturnType<typeof vi.fn>;
  auth: { getUser: ReturnType<typeof vi.fn> };
  tables: Record<string, ChainConfig>;
}

/**
 * Build a mock supabase client whose `from(table)` dispatch shares one ChainConfig
 * per table name across every call.
 */
export function makeSupabaseClient(tableConfigs: Record<string, ChainConfig> = {}): MockSupabaseClient {
  const tables: Record<string, ChainConfig> = {};
  for (const [table, cfg] of Object.entries(tableConfigs)) {
    tables[table] = cfg;
    cfg.insertValues ??= [];
    cfg.updateValues ??= [];
    cfg.singleReads ??= 0;
  }
  const from = vi.fn((table: string) => {
    const cfg = tables[table];
    if (!cfg) throw new Error(`Unexpected table: ${table}`);
    return makeChain(cfg);
  });
  const auth = {
    getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
  };
  return { client: { from, auth }, from, auth, tables };
}

/**
 * Set `auth.getUser` to return the given user (or null for unauthenticated).
 */
export function setMockUser(client: MockSupabaseClient, user: any): void {
  client.auth.getUser.mockResolvedValue({ data: { user }, error: null });
}
