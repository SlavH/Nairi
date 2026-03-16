-- Phase 2: Database Indexing & Performance
-- Add indexes on frequently queried columns for performance optimization

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Agents table indexes (if exists); ensure creator_id exists for older DBs
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agents') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'creator_id') THEN
      ALTER TABLE public.agents ADD COLUMN creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_agents_creator_id ON public.agents(creator_id);
    CREATE INDEX IF NOT EXISTS idx_agents_category ON public.agents(category);
    CREATE INDEX IF NOT EXISTS idx_agents_is_featured ON public.agents(is_featured) WHERE is_featured = true;
    CREATE INDEX IF NOT EXISTS idx_agents_created_at ON public.agents(created_at DESC);
  END IF;
END $$;

-- User agents table indexes (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_agents') THEN
    CREATE INDEX IF NOT EXISTS idx_user_agents_user_id ON public.user_agents(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_agents_agent_id ON public.user_agents(agent_id);
    CREATE INDEX IF NOT EXISTS idx_user_agents_user_agent ON public.user_agents(user_id, agent_id);
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_agents' AND column_name = 'installed_at') THEN
      CREATE INDEX IF NOT EXISTS idx_user_agents_installed_at ON public.user_agents(installed_at DESC);
    ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_agents' AND column_name = 'purchased_at') THEN
      CREATE INDEX IF NOT EXISTS idx_user_agents_purchased_at ON public.user_agents(purchased_at DESC);
    END IF;
  END IF;
END $$;

-- Conversations table indexes (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON public.conversations(agent_id) WHERE agent_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON public.conversations(user_id, updated_at DESC);
  END IF;
END $$;

-- Messages table indexes (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
  END IF;
END $$;

-- Subscriptions table indexes (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON public.subscriptions(current_period_end);
  END IF;
END $$;

-- Creations table indexes (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'creations') THEN
    CREATE INDEX IF NOT EXISTS idx_creations_user_id ON public.creations(user_id);
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'creations' AND column_name = 'type') THEN
      CREATE INDEX IF NOT EXISTS idx_creations_type ON public.creations(type);
      CREATE INDEX IF NOT EXISTS idx_creations_user_type_created ON public.creations(user_id, type, created_at DESC);
    END IF;
    CREATE INDEX IF NOT EXISTS idx_creations_created_at ON public.creations(created_at DESC);
  END IF;
END $$;

-- Usage logs table indexes (if exists; column is generation_type per 020, not type)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usage_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usage_logs' AND column_name = 'type') THEN
      CREATE INDEX IF NOT EXISTS idx_usage_logs_type ON public.usage_logs(type);
    ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usage_logs' AND column_name = 'generation_type') THEN
      CREATE INDEX IF NOT EXISTS idx_usage_logs_generation_type ON public.usage_logs(generation_type);
    END IF;
    CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created ON public.usage_logs(user_id, created_at DESC);
    -- Skip idx_usage_logs_user_month: DATE_TRUNC('month', created_at) is not IMMUTABLE (timezone-dependent)
  END IF;
END $$;

-- Activity logs table indexes (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON public.activity_logs(user_id, created_at DESC);
  END IF;
END $$;

-- Notifications table indexes (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read) WHERE read = false;
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
  END IF;
END $$;

-- Builder projects table indexes (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'builder_projects') THEN
    CREATE INDEX IF NOT EXISTS idx_builder_projects_user_id ON public.builder_projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_builder_projects_created_at ON public.builder_projects(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_builder_projects_updated_at ON public.builder_projects(updated_at DESC);
  END IF;
END $$;

-- Marketplace products table indexes (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marketplace_products') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'marketplace_products' AND column_name = 'creator_id') THEN
      CREATE INDEX IF NOT EXISTS idx_marketplace_products_creator_id ON public.marketplace_products(creator_id);
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'marketplace_products' AND column_name = 'category') THEN
      CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON public.marketplace_products(category);
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'marketplace_products' AND column_name = 'is_published') THEN
      CREATE INDEX IF NOT EXISTS idx_marketplace_products_is_published ON public.marketplace_products(is_published) WHERE is_published = true;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'marketplace_products' AND column_name = 'rating') THEN
      CREATE INDEX IF NOT EXISTS idx_marketplace_products_rating ON public.marketplace_products(rating DESC) WHERE rating > 0;
    END IF;
  END IF;
END $$;

-- Courses table indexes (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'category') THEN
      CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'difficulty') THEN
      CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON public.courses(difficulty);
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'is_published') THEN
      CREATE INDEX IF NOT EXISTS idx_courses_is_published ON public.courses(is_published) WHERE is_published = true;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'rating') THEN
      CREATE INDEX IF NOT EXISTS idx_courses_rating ON public.courses(rating DESC) WHERE rating > 0;
    END IF;
  END IF;
END $$;

-- Analyze tables to update statistics
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ANALYZE public.%I', r.tablename);
  END LOOP;
END $$;

-- Create function to monitor slow queries (requires pg_stat_statements extension)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
    CREATE OR REPLACE VIEW public.slow_queries AS
    SELECT 
      query,
      calls,
      total_exec_time,
      mean_exec_time,
      max_exec_time,
      stddev_exec_time
    FROM pg_stat_statements
    WHERE mean_exec_time > 100 -- Queries taking more than 100ms on average
    ORDER BY mean_exec_time DESC
    LIMIT 50;
    
    COMMENT ON VIEW public.slow_queries IS 'Queries with average execution time > 100ms';
  END IF;
END $$;
