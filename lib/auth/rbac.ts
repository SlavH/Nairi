/**
 * RBAC Manager (Phase 5)
 * Handles role-based access control and permissions
 */
import { createClient } from "@/lib/supabase/server";

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export class RBACManager {
  /**
   * Check if user has a specific permission
   */
  static async hasPermission(
    userId: string,
    permissionName: string
  ): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("user_has_permission", {
      p_user_id: userId,
      p_permission_name: permissionName,
    });

    if (error) throw error;
    return data || false;
  }

  /**
   * Get all roles for a user
   */
  static async getUserRoles(userId: string): Promise<Role[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_user_roles", {
      p_user_id: userId,
    });

    if (error) throw error;

    // Get full role details
    if (data && data.length > 0) {
      const roleNames = data.map((r: { role_name: string }) => r.role_name);
      const { data: roles, error: rolesError } = await supabase
        .from("roles")
        .select("*")
        .in("name", roleNames);

      if (rolesError) throw rolesError;
      return (roles || []).map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        level: r.level,
      }));
    }

    return [];
  }

  /**
   * Assign a role to a user
   */
  static async assignRole(
    userId: string,
    roleName: string,
    grantedBy?: string
  ): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("assign_role", {
      p_user_id: userId,
      p_role_name: roleName,
      p_granted_by: grantedBy || null,
    });

    if (error) throw error;
    return data || false;
  }

  /**
   * Remove a role from a user
   */
  static async removeRole(userId: string, roleName: string): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("remove_role", {
      p_user_id: userId,
      p_role_name: roleName,
    });

    if (error) throw error;
    return data || false;
  }

  /**
   * Get all permissions for a user (across all their roles)
   */
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    const roles = await this.getUserRoles(userId);
    if (roles.length === 0) return [];

    const supabase = await createClient();
    const roleIds = roles.map((r) => r.id);

    const { data, error } = await supabase
      .from("role_permissions")
      .select("permission_id")
      .in("role_id", roleIds);

    if (error) throw error;

    if (data && data.length > 0) {
      const permissionIds = data.map((rp) => rp.permission_id);
      const { data: permissions, error: permsError } = await supabase
        .from("permissions")
        .select("*")
        .in("id", permissionIds);

      if (permsError) throw permsError;

      return (permissions || []).map((p) => ({
        id: p.id,
        name: p.name,
        resource: p.resource,
        action: p.action,
        description: p.description,
      }));
    }

    return [];
  }

  /**
   * Check if user has any of the specified permissions
   */
  static async hasAnyPermission(
    userId: string,
    permissionNames: string[]
  ): Promise<boolean> {
    for (const permissionName of permissionNames) {
      if (await this.hasPermission(userId, permissionName)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all of the specified permissions
   */
  static async hasAllPermissions(
    userId: string,
    permissionNames: string[]
  ): Promise<boolean> {
    for (const permissionName of permissionNames) {
      if (!(await this.hasPermission(userId, permissionName))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get user's highest role level
   */
  static async getHighestRoleLevel(userId: string): Promise<number> {
    const roles = await this.getUserRoles(userId);
    if (roles.length === 0) return 0;
    return Math.max(...roles.map((r) => r.level));
  }

  /**
   * Check if user is admin
   */
  static async isAdmin(userId: string): Promise<boolean> {
    return await this.hasPermission(userId, "admin.system.read");
  }
}
