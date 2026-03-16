/**
 * Admin User Role Management API (Phase 5)
 * Assign or remove roles for users
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RBACManager } from "@/lib/auth/rbac";
import { handleError } from "@/lib/errors/handler";
import { forbiddenError, unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { z } from "zod";

const assignRoleSchema = z.object({
  role: z.enum(["user", "pro", "admin", "enterprise"]),
  action: z.enum(["assign", "remove"]),
});

export const POST = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) => {
  try {
    const { userId } = await params;
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

    const body = await req.json();
    const { role, action } = assignRoleSchema.parse(body);

    let success: boolean;
    if (action === "assign") {
      success = await RBACManager.assignRole(userId, role, user.id);
    } else {
      success = await RBACManager.removeRole(userId, role);
    }

    if (!success) {
      return handleError(
        validationError(`Failed to ${action} role: ${role}`)
      );
    }

    // Get updated roles
    const roles = await RBACManager.getUserRoles(userId);

    return NextResponse.json({
      success: true,
      message: `Role ${role} ${action}ed successfully`,
      roles: roles.map((r) => r.name),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(validationError("Invalid request body", { errors: error.errors }));
    }
    return handleError(error);
  }
});
