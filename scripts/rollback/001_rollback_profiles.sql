-- Rollback script for 001_create_profiles.sql
-- WARNING: This will remove the profiles table and all related functions/triggers
-- Only run this if you need to completely remove the profiles system

BEGIN;

-- Drop trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop function
DROP FUNCTION IF EXISTS public.generate_referral_code();

-- Drop policies
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- Drop table (CASCADE will remove dependent objects)
DROP TABLE IF EXISTS public.profiles CASCADE;

COMMIT;
