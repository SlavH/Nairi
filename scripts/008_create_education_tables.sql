-- Education Platform (Nairi Learn) Tables

-- Skill trees for game-like learning progression
CREATE TABLE IF NOT EXISTS public.skill_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  color TEXT DEFAULT '#00c9c8',
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual skills within a tree
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES public.skill_trees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  level INTEGER DEFAULT 1,
  xp_required INTEGER DEFAULT 100,
  prerequisites UUID[] DEFAULT '{}', -- Array of skill IDs required
  position_x INTEGER DEFAULT 0, -- For visual tree layout
  position_y INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User skill progress
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  current_xp INTEGER DEFAULT 0,
  mastery_level INTEGER DEFAULT 0, -- 0-5 mastery levels
  unlocked BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  last_practiced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Courses (structured learning paths)
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  thumbnail_url TEXT,
  creator_id UUID REFERENCES auth.users(id),
  price_cents INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  estimated_hours INTEGER DEFAULT 1,
  enrollment_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course modules (sections)
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons within modules
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT, -- Markdown content
  lesson_type TEXT DEFAULT 'text' CHECK (lesson_type IN ('text', 'video', 'quiz', 'exercise', 'simulation')),
  duration_minutes INTEGER DEFAULT 5,
  order_index INTEGER NOT NULL,
  ai_tutor_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quizzes and assessments
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quiz_type TEXT DEFAULT 'multiple_choice' CHECK (quiz_type IN ('multiple_choice', 'oral_exam', 'coding', 'essay')),
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  is_adaptive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  options JSONB, -- For multiple choice
  correct_answer TEXT,
  explanation TEXT,
  difficulty INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User course enrollments
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress_percent INTEGER DEFAULT 0,
  current_lesson_id UUID REFERENCES public.lessons(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  certificate_issued BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, course_id)
);

-- User lesson progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER DEFAULT 0,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER,
  passed BOOLEAN,
  answers JSONB,
  time_taken_seconds INTEGER,
  ai_feedback TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Mentors (long-term domain mentors)
CREATE TABLE IF NOT EXISTS public.ai_mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL, -- e.g., 'programming', 'mathematics', 'writing'
  mentor_name TEXT NOT NULL,
  mentor_personality TEXT, -- Teaching style description
  interaction_count INTEGER DEFAULT 0,
  last_interaction TIMESTAMPTZ,
  progress_notes TEXT, -- AI's notes on user progress
  teaching_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure courses.creator_id exists (for existing DBs that had courses without it)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id);

-- Enable RLS for all tables
ALTER TABLE public.skill_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_mentors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "skill_trees_public_read" ON public.skill_trees;
DROP POLICY IF EXISTS "skills_read" ON public.skills;
DROP POLICY IF EXISTS "user_skills_own" ON public.user_skills;
DROP POLICY IF EXISTS "courses_public_read" ON public.courses;
DROP POLICY IF EXISTS "courses_creator_manage" ON public.courses;
DROP POLICY IF EXISTS "modules_read" ON public.course_modules;
DROP POLICY IF EXISTS "lessons_read" ON public.lessons;
DROP POLICY IF EXISTS "quizzes_read" ON public.quizzes;
DROP POLICY IF EXISTS "quiz_questions_read" ON public.quiz_questions;
DROP POLICY IF EXISTS "enrollments_own" ON public.course_enrollments;
DROP POLICY IF EXISTS "lesson_progress_own" ON public.lesson_progress;
DROP POLICY IF EXISTS "quiz_attempts_own" ON public.quiz_attempts;
DROP POLICY IF EXISTS "ai_mentors_own" ON public.ai_mentors;
CREATE POLICY "skill_trees_public_read" ON public.skill_trees FOR SELECT USING (is_public = TRUE OR auth.uid() = created_by);
CREATE POLICY "skills_read" ON public.skills FOR SELECT USING (TRUE);
CREATE POLICY "user_skills_own" ON public.user_skills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "courses_public_read" ON public.courses FOR SELECT USING (is_published = TRUE OR auth.uid() = creator_id);
CREATE POLICY "courses_creator_manage" ON public.courses FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "modules_read" ON public.course_modules FOR SELECT USING (TRUE);
CREATE POLICY "lessons_read" ON public.lessons FOR SELECT USING (TRUE);
CREATE POLICY "quizzes_read" ON public.quizzes FOR SELECT USING (TRUE);
CREATE POLICY "quiz_questions_read" ON public.quiz_questions FOR SELECT USING (TRUE);
CREATE POLICY "enrollments_own" ON public.course_enrollments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "lesson_progress_own" ON public.lesson_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "quiz_attempts_own" ON public.quiz_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ai_mentors_own" ON public.ai_mentors FOR ALL USING (auth.uid() = user_id);
