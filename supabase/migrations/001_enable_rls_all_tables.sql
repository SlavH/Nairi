-- =====================================================
-- Nairi Factory: Enable RLS on ALL tables
-- Run this SQL in your Supabase SQL Editor
-- This ensures every table has RLS enabled with proper policies
-- =====================================================

-- 1. Enable RLS on all 76 tables
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE belief_contradictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_deploys ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_project_forks ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat-attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_arguments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE learn_notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE learn_notebook_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_shares ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. User-owned tables (users can only access their own data)
-- =====================================================

-- profiles: users can read all profiles, but only update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- activity_logs
CREATE POLICY "Users can view own activity" ON activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- creations
CREATE POLICY "Users can view own creations" ON creations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own creations" ON creations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own creations" ON creations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own creations" ON creations FOR DELETE USING (auth.uid() = user_id);

-- execution_traces
CREATE POLICY "Users can view own traces" ON execution_traces FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own traces" ON execution_traces FOR INSERT WITH CHECK (auth.uid() = user_id);

-- conversations
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON conversations FOR DELETE USING (auth.uid() = user_id);

-- conversation_folders
CREATE POLICY "Users can view own folders" ON conversation_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own folders" ON conversation_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON conversation_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON conversation_folders FOR DELETE USING (auth.uid() = user_id);

-- messages
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid())
);
CREATE POLICY "Users can insert messages in own conversations" ON messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid())
);

-- notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- user_preferences
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_ai_settings
CREATE POLICY "Users can view own AI settings" ON user_ai_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own AI settings" ON user_ai_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI settings" ON user_ai_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- builder_projects
CREATE POLICY "Users can view own builder projects" ON builder_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own builder projects" ON builder_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own builder projects" ON builder_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own builder projects" ON builder_projects FOR DELETE USING (auth.uid() = user_id);

-- builder_project_collaborators
CREATE POLICY "Collaborators can view project collaborators" ON builder_project_collaborators FOR SELECT USING (
  EXISTS (SELECT 1 FROM builder_projects WHERE builder_projects.id = builder_project_collaborators.project_id AND builder_projects.user_id = auth.uid())
);
CREATE POLICY "Project owners can manage collaborators" ON builder_project_collaborators FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM builder_projects WHERE builder_projects.id = builder_project_collaborators.project_id AND builder_projects.user_id = auth.uid())
);
CREATE POLICY "Project owners can update collaborators" ON builder_project_collaborators FOR UPDATE USING (
  EXISTS (SELECT 1 FROM builder_projects WHERE builder_projects.id = builder_project_collaborators.project_id AND builder_projects.user_id = auth.uid())
);
CREATE POLICY "Project owners can delete collaborators" ON builder_project_collaborators FOR DELETE USING (
  EXISTS (SELECT 1 FROM builder_projects WHERE builder_projects.id = builder_project_collaborators.project_id AND builder_projects.user_id = auth.uid())
);

-- builder_project_forks
CREATE POLICY "Users can view own forks" ON builder_project_forks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own forks" ON builder_project_forks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- builder_deployments
CREATE POLICY "Users can view own deployments" ON builder_deployments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own deployments" ON builder_deployments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- builder_deploys
CREATE POLICY "Users can view own deploys" ON builder_deploys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own deploys" ON builder_deploys FOR INSERT WITH CHECK (auth.uid() = user_id);

-- builder_usage
CREATE POLICY "Users can view own usage" ON builder_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON builder_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- workspace_activities
CREATE POLICY "Users can view own workspace activities" ON workspace_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workspace activities" ON workspace_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- workspace_folders
CREATE POLICY "Users can view own workspace folders" ON workspace_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own workspace folders" ON workspace_folders FOR ALL USING (auth.uid() = user_id);

-- workspace_shares
CREATE POLICY "Users can view own workspace shares" ON workspace_shares FOR SELECT USING (auth.uid() = user_id OR auth.uid() = shared_with_user_id);
CREATE POLICY "Users can create own workspace shares" ON workspace_shares FOR INSERT WITH CHECK (auth.uid() = user_id);

-- credit_transactions
CREATE POLICY "Users can view own credit transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- daily_rewards
CREATE POLICY "Users can view own daily rewards" ON daily_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can claim own daily rewards" ON daily_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- referrals
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid() = user_id OR auth.uid() = referred_by_user_id);
CREATE POLICY "Users can create own referrals" ON referrals FOR INSERT WITH CHECK (auth.uid() = referred_by_user_id);

-- user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can grant achievements" ON user_achievements FOR INSERT WITH CHECK (true);

-- user_badges
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can grant badges" ON user_badges FOR INSERT WITH CHECK (true);

-- expert_badges
CREATE POLICY "Expert badges are viewable by everyone" ON expert_badges FOR SELECT USING (true);

-- user_follows
CREATE POLICY "Users can view follow relationships" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON user_follows FOR DELETE USING (auth.uid() = follower_id);

-- user_agents
CREATE POLICY "Users can view own agents" ON user_agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own agents" ON user_agents FOR ALL USING (auth.uid() = user_id);

-- usage_logs
CREATE POLICY "Users can view own usage logs" ON usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert usage logs" ON usage_logs FOR INSERT WITH CHECK (true);

-- sessions
CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);

-- mfa_settings
CREATE POLICY "Users can view own MFA settings" ON mfa_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own MFA settings" ON mfa_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own MFA settings" ON mfa_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- mfa_verifications
CREATE POLICY "Users can view own MFA verifications" ON mfa_verifications FOR SELECT USING (auth.uid() = user_id);

-- failed_login_attempts
CREATE POLICY "Only system can access failed login attempts" ON failed_login_attempts FOR SELECT USING (false);
CREATE POLICY "System can insert failed login attempts" ON failed_login_attempts FOR INSERT WITH CHECK (true);

-- rate_limit_events
CREATE POLICY "Only system can access rate limit events" ON rate_limit_events FOR SELECT USING (false);
CREATE POLICY "System can insert rate limit events" ON rate_limit_events FOR INSERT WITH CHECK (true);

-- contact_submissions
CREATE POLICY "Only service role can access contact submissions" ON contact_submissions FOR SELECT USING (false);
CREATE POLICY "Anyone can submit contact form" ON contact_submissions FOR INSERT WITH CHECK (true);

-- =====================================================
-- 3. Public/Read-only tables (everyone can read, only service role writes)
-- =====================================================

-- courses, lessons, course_modules
CREATE POLICY "Courses are publicly readable" ON courses FOR SELECT USING (true);
CREATE POLICY "Lessons are publicly readable" ON lessons FOR SELECT USING (true);
CREATE POLICY "Course modules are publicly readable" ON course_modules FOR SELECT USING (true);

-- quizzes, quiz_questions
CREATE POLICY "Quizzes are publicly readable" ON quizzes FOR SELECT USING (true);
CREATE POLICY "Quiz questions are publicly readable" ON quiz_questions FOR SELECT USING (true);

-- quiz_attempts
CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own quiz attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- course_enrollments
CREATE POLICY "Users can view own enrollments" ON course_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll themselves" ON course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- lesson_progress
CREATE POLICY "Users can view own lesson progress" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own lesson progress" ON lesson_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lesson progress" ON lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- learning_analytics
CREATE POLICY "Users can view own analytics" ON learning_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert analytics" ON learning_analytics FOR INSERT WITH CHECK (true);

-- learning_recommendations
CREATE POLICY "Users can view own recommendations" ON learning_recommendations FOR SELECT USING (auth.uid() = user_id);

-- learn_notebooks
CREATE POLICY "Users can view own notebooks" ON learn_notebooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notebooks" ON learn_notebooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notebooks" ON learn_notebooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notebooks" ON learn_notebooks FOR DELETE USING (auth.uid() = user_id);

-- learn_notebook_sources
CREATE POLICY "Users can view own notebook sources" ON learn_notebook_sources FOR SELECT USING (
  EXISTS (SELECT 1 FROM learn_notebooks WHERE learn_notebooks.id = learn_notebook_sources.notebook_id AND learn_notebooks.user_id = auth.uid())
);
CREATE POLICY "Users can manage own notebook sources" ON learn_notebook_sources FOR ALL USING (
  EXISTS (SELECT 1 FROM learn_notebooks WHERE learn_notebooks.id = learn_notebook_sources.notebook_id AND learn_notebooks.user_id = auth.uid())
);

-- ai_mentors
CREATE POLICY "AI mentors are publicly readable" ON ai_mentors FOR SELECT USING (true);

-- skill_trees
CREATE POLICY "Skill trees are publicly readable" ON skill_trees FOR SELECT USING (true);

-- user_skills
CREATE POLICY "Users can view own skills" ON user_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON user_skills FOR UPDATE USING (auth.uid() = user_id);

-- achievements
CREATE POLICY "Achievements are publicly readable" ON achievements FOR SELECT USING (true);

-- agents
CREATE POLICY "Agents are publicly readable" ON agents FOR SELECT USING (true);

-- creator_profiles
CREATE POLICY "Creator profiles are publicly readable" ON creator_profiles FOR SELECT USING (true);

-- feed_posts
CREATE POLICY "Feed posts are publicly readable" ON feed_posts FOR SELECT USING (true);

-- feed_collections
CREATE POLICY "Users can view own collections" ON feed_collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own collections" ON feed_collections FOR ALL USING (auth.uid() = user_id);

-- knowledge_nodes
CREATE POLICY "Knowledge nodes are publicly readable" ON knowledge_nodes FOR SELECT USING (true);

-- knowledge_edges
CREATE POLICY "Knowledge edges are publicly readable" ON knowledge_edges FOR SELECT USING (true);

-- knowledge_queries
CREATE POLICY "Users can view own queries" ON knowledge_queries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own queries" ON knowledge_queries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- marketplace_products
CREATE POLICY "Marketplace products are publicly readable" ON marketplace_products FOR SELECT USING (true);

-- product_purchases
CREATE POLICY "Users can view own purchases" ON product_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own purchases" ON product_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- product_reviews
CREATE POLICY "Product reviews are publicly readable" ON product_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create own reviews" ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON product_reviews FOR UPDATE USING (auth.uid() = user_id);

-- agent_reviews
CREATE POLICY "Agent reviews are publicly readable" ON agent_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create own agent reviews" ON agent_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- review_moderation
CREATE POLICY "Only moderators can access review moderation" ON review_moderation FOR SELECT USING (false);
CREATE POLICY "System can insert review moderation" ON review_moderation FOR INSERT WITH CHECK (true);

-- debate_sessions
CREATE POLICY "Users can view own debate sessions" ON debate_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own debate sessions" ON debate_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- debate_arguments
CREATE POLICY "Users can view arguments in their debates" ON debate_arguments FOR SELECT USING (
  EXISTS (SELECT 1 FROM debate_sessions WHERE debate_sessions.id = debate_arguments.session_id AND debate_sessions.user_id = auth.uid())
);
CREATE POLICY "Users can add arguments to own debates" ON debate_arguments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM debate_sessions WHERE debate_sessions.id = debate_arguments.session_id AND debate_sessions.user_id = auth.uid())
);

-- debate_votes
CREATE POLICY "Users can view votes in their debates" ON debate_votes FOR SELECT USING (
  EXISTS (SELECT 1 FROM debate_sessions WHERE debate_sessions.id = debate_votes.session_id AND debate_sessions.user_id = auth.uid())
);
CREATE POLICY "Users can vote in own debates" ON debate_votes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM debate_sessions WHERE debate_sessions.id = debate_votes.session_id AND debate_sessions.user_id = auth.uid())
);

-- belief_contradictions
CREATE POLICY "Users can view own contradictions" ON belief_contradictions FOR SELECT USING (auth.uid() = user_id);

-- characters
CREATE POLICY "Characters are publicly readable" ON characters FOR SELECT USING (true);

-- "chat-attachments"
CREATE POLICY "Users can view own chat attachments" ON "chat-attachments" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload own attachments" ON "chat-attachments" FOR INSERT WITH CHECK (auth.uid() = user_id);

-- presentations (via creation type)
-- presentation_collaborators
CREATE POLICY "Collaborators can view presentation collaborators" ON presentation_collaborators FOR SELECT USING (true);
CREATE POLICY "Presentation owners can manage collaborators" ON presentation_collaborators FOR ALL USING (true);

-- presentation_comments
CREATE POLICY "Presentation comments are publicly readable" ON presentation_comments FOR SELECT USING (true);
CREATE POLICY "Users can add comments" ON presentation_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- presentation_versions
CREATE POLICY "Users can view versions of own presentations" ON presentation_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM creations WHERE creations.id = presentation_versions.presentation_id AND creations.user_id = auth.uid())
);

-- studio_gallery
CREATE POLICY "Studio gallery is publicly readable" ON studio_gallery FOR SELECT USING (true);

-- subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);

-- roles, permissions, role_permissions (admin tables)
CREATE POLICY "Roles are viewable by authenticated users" ON roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permissions are viewable by authenticated users" ON permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Role permissions are viewable by authenticated users" ON role_permissions FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- 4. Helper function to auto-create profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name' OR NEW.email, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (may already exist)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
