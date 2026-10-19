/**
 * Chat Export API tests — F29: Content-Disposition header injection.
 */
import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "@/app/api/chat/export/route";

const mockUserId = "00000000-0000-0000-0000-000000000001";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getUserIdForApi: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/server");
const { getUserIdForApi } = await import("@/lib/auth");

function mockSupabase(conversation: unknown, messages: unknown[]) {
  return {
    from: (table: string) => {
      if (table === "conversations") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: conversation, error: null }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: messages, error: null }),
          }),
        }),
      };
    },
  };
}

describe("GET /api/chat/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getUserIdForApi).mockResolvedValue(null);
    vi.mocked(createClient).mockResolvedValue({} as never);

    const res = await GET(
      new NextRequest("http://localhost/api/chat/export?conversationId=c1")
    );

    expect(res.status).toBe(401);
  });

  it("neutralizes CRLF/quote injection from the conversation title", async () => {
    vi.mocked(getUserIdForApi).mockResolvedValue(mockUserId);
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase(
        {
          id: "c1",
          title: 'Bad"\r\nSet-Cookie: x=1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        []
      ) as never
    );

    const res = await GET(
      new NextRequest(
        "http://localhost/api/chat/export?conversationId=c1&format=json"
      )
    );

    const cd = res.headers.get("content-disposition") || "";
    expect(cd).not.toMatch(/[\r\n]/);
    expect(cd).toBe('attachment; filename="BadSet-Cookie x=1.json"');
  });

  it("falls back to a default filename when the title is empty", async () => {
    vi.mocked(getUserIdForApi).mockResolvedValue(mockUserId);
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase(
        {
          id: "c1",
          title: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        []
      ) as never
    );

    const res = await GET(
      new NextRequest(
        "http://localhost/api/chat/export?conversationId=c1&format=markdown"
      )
    );

    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="conversation.md"'
    );
  });
});
