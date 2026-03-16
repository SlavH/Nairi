-- Phase 5: Authorization & RBAC Enhancement
-- Implements role-based access control with fine-grained permissions

-- Roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  level INTEGER NOT NULL, -- Higher number = more permissions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  resource TEXT NOT NULL, -- e.g., 'chat', 'builder', 'workspace'
  action TEXT NOT NULL, -- e.g., 'create', 'read', 'update', 'delete'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- Role permissions (many-to-many)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User roles (users can have multiple roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- Insert default roles
INSERT INTO public.roles (name, description, level) VALUES
  ('user', 'Standard user', 1),
  ('pro', 'Pro subscriber', 2),
  ('admin', 'Administrator', 10),
  ('enterprise', 'Enterprise user', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert common permissions
INSERT INTO public.permissions (name, resource, action, description) VALUES
  -- Chat permissions
  ('chat.create', 'chat', 'create', 'Create new conversations'),
  ('chat.read', 'chat', 'read', 'Read conversations'),
  ('chat.update', 'chat', 'update', 'Update conversations'),
  ('chat.delete', 'chat', 'delete', 'Delete conversations'),
  ('chat.share', 'chat', 'share', 'Share conversations'),
  
  -- Builder permissions
  ('builder.create', 'builder', 'create', 'Create builder projects'),
  ('builder.read', 'builder', 'read', 'Read builder projects'),
  ('builder.update', 'builder', 'update', 'Update builder projects'),
  ('builder.delete', 'builder', 'delete', 'Delete builder projects'),
  ('builder.deploy', 'builder', 'deploy', 'Deploy builder projects'),
  
  -- Workspace permissions
  ('workspace.create', 'workspace', 'create', 'Create workspace items'),
  ('workspace.read', 'workspace', 'read', 'Read workspace items'),
  ('workspace.update', 'workspace', 'update', 'Update workspace items'),
  ('workspace.delete', 'workspace', 'delete', 'Delete workspace items'),
  
  -- Marketplace permissions
  ('marketplace.browse', 'marketplace', 'read', 'Browse marketplace'),
  ('marketplace.purchase', 'marketplace', 'purchase', 'Purchase marketplace items'),
  ('marketplace.create', 'marketplace', 'create', 'Create marketplace items'),
  ('marketplace.publish', 'marketplace', 'publish', 'Publish marketplace items'),
  
  -- Admin permissions
  ('admin.users.read', 'admin', 'users.read', 'View all users'),
  ('admin.users.update', 'admin', 'users.update', 'Update user accounts'),
  ('admin.users.delete', 'admin', 'users.delete', 'Delete user accounts'),
  ('admin.system.read', 'admin', 'system.read', 'View system information'),
  ('admin.system.update', 'admin', 'system.update', 'Update system settings')
ON CONFLICT (name) DO NOTHING;

-- Assign default permissions to roles
DO $$
DECLARE
  v_user_role_id UUID;
  v_pro_role_id UUID;
  v_admin_role_id UUID;
  v_enterprise_role_id UUID;
BEGIN
  SELECT id INTO v_user_role_id FROM public.roles WHERE name = 'user';
  SELECT id INTO v_pro_role_id FROM public.roles WHERE name = 'pro';
  SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'admin';
  SELECT id INTO v_enterprise_role_id FROM public.roles WHERE name = 'enterprise';
  
  -- User permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_user_role_id, id FROM public.permissions
  WHERE name IN ('chat.create', 'chat.read', 'chat.update', 'chat.delete', 'workspace.create', 'workspace.read', 'workspace.update', 'workspace.delete', 'marketplace.browse', 'marketplace.purchase')
  ON CONFLICT DO NOTHING;
  
  -- Pro permissions (includes all user permissions)
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_pro_role_id, id FROM public.permissions
  WHERE name IN ('chat.create', 'chat.read', 'chat.update', 'chat.delete', 'chat.share', 'builder.create', 'builder.read', 'builder.update', 'builder.delete', 'builder.deploy', 'workspace.create', 'workspace.read', 'workspace.update', 'workspace.delete', 'marketplace.browse', 'marketplace.purchase', 'marketplace.create')
  ON CONFLICT DO NOTHING;
  
  -- Enterprise permissions (includes pro permissions)
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_enterprise_role_id, id FROM public.permissions
  WHERE name IN ('chat.create', 'chat.read', 'chat.update', 'chat.delete', 'chat.share', 'builder.create', 'builder.read', 'builder.update', 'builder.delete', 'builder.deploy', 'workspace.create', 'workspace.read', 'workspace.update', 'workspace.delete', 'marketplace.browse', 'marketplace.purchase', 'marketplace.create', 'marketplace.publish')
  ON CONFLICT DO NOTHING;
  
  -- Admin permissions (all permissions)
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_admin_role_id, id FROM public.permissions
  ON CONFLICT DO NOTHING;
END $$;

-- Function to check if user has permission
DROP FUNCTION IF EXISTS public.user_has_permission(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id UUID,
  p_permission_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND p.name = p_permission_name
  ) INTO v_has_permission;
  
  RETURN COALESCE(v_has_permission, FALSE);
END;
$$;

-- Function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id UUID)
RETURNS TABLE(role_name TEXT, role_level INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT r.name, r.level
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
  ORDER BY r.level DESC;
END;
$$;

-- Function to assign role to user
CREATE OR REPLACE FUNCTION public.assign_role(
  p_user_id UUID,
  p_role_name TEXT,
  p_granted_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  SELECT id INTO v_role_id FROM public.roles WHERE name = p_role_name;
  
  IF v_role_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO public.user_roles (user_id, role_id, granted_by)
  VALUES (p_user_id, v_role_id, p_granted_by)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Function to remove role from user
CREATE OR REPLACE FUNCTION public.remove_role(
  p_user_id UUID,
  p_role_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  SELECT id INTO v_role_id FROM public.roles WHERE name = p_role_name;
  
  IF v_role_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  DELETE FROM public.user_roles
  WHERE user_id = p_user_id AND role_id = v_role_id;
  
  RETURN FOUND;
END;
$$;

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "roles_select_all" ON public.roles FOR SELECT USING (true);
CREATE POLICY "permissions_select_all" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Assign default 'user' role to all existing users
DO $$
DECLARE
  v_user_role_id UUID;
BEGIN
  SELECT id INTO v_user_role_id FROM public.roles WHERE name = 'user';
  
  IF v_user_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT id, v_user_role_id
    FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM public.user_roles WHERE role_id = v_user_role_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

COMMENT ON TABLE public.roles IS 'User roles for RBAC';
COMMENT ON TABLE public.permissions IS 'Fine-grained permissions';
COMMENT ON TABLE public.role_permissions IS 'Many-to-many relationship between roles and permissions';
COMMENT ON TABLE public.user_roles IS 'User role assignments';
