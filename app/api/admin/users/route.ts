/**
 * Admin User Management API (Phase 5)
 * Endpoints for managing users, roles, and permissions
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RBACManager } from "@/lib/auth/rbac";
import { handleError } from "@/lib/errors/handler";
import { forbiddenError, unauthorizedError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";

export const GET = withLogging(async (req: NextRequest) => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return handleError(unauthorizedError("Authentication required"));
    }

    // Check admin permission
    const isAdmin = await RBACManager.isAdmin(user.id);
    if (!isAdmin) {
      return handleError(forbiddenError("Admin access required"));
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Get users
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, subscription_tier, created_at")
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get roles for each user
    const usersWithRoles = await Promise.all(
      (users || []).map(async (u) => {
        const roles = await RBACManager.getUserRoles(u.id);
        return {
          ...u,
          roles: roles.map((r) => r.name),
        };
      })
    );

    return NextResponse.json({
      users: usersWithRoles,
      pagination: {
        page,
        limit,
        total: users?.length || 0,
      },
    });
  } catch (error) {
    return handleError(error);
  }
});
