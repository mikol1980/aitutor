-- src/db/schema.sql

-- ### 1. ENUM Types ###

CREATE TYPE content_usage_type AS ENUM ('explanation', 'exercise', 'diagnostic_question');
CREATE TYPE user_progress_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE message_sender AS ENUM ('user', 'ai');

-- ### 2. Tables ###

-- Users & Profiles
-- Stores public user data. Private data is on auth.users.
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    login TEXT UNIQUE NOT NULL CHECK (char_length(login) >= 3),
    email TEXT UNIQUE NOT NULL,
    has_completed_tutorial BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Knowledge Graph
-- Represents broad subject areas, e.g., "Functions".
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    display_order INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Represents specific concepts within a section, e.g., "Linear Functions".
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    display_order INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Defines prerequisites, e.g., Topic A must be completed before Topic B.
CREATE TABLE topic_dependencies (
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    dependency_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (topic_id, dependency_id)
);

-- Learning Content
-- Central repository for all educational materials.
CREATE TABLE learning_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    usage_type content_usage_type NOT NULL,
    content JSONB NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Diagnostic Tests
-- Defines a test for a specific section.
CREATE TABLE diagnostic_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID UNIQUE NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Links questions from learning_content to a diagnostic test.
CREATE TABLE diagnostic_test_learning_content (
    test_id UUID NOT NULL REFERENCES diagnostic_tests(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES learning_content(id) ON DELETE CASCADE,
    PRIMARY KEY (test_id, content_id)
);

-- User Progress & Sessions
-- Records a user's attempt at a diagnostic test.
CREATE TABLE diagnostic_test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    diagnostic_test_id UUID NOT NULL REFERENCES diagnostic_tests(id) ON DELETE CASCADE,
    score FLOAT NOT NULL CHECK (score >= 0 AND score <= 1),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stores the user's specific answer to a question in a test attempt.
CREATE TABLE user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES diagnostic_test_attempts(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES learning_content(id) ON DELETE CASCADE,
    answer_content JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL
);

-- Represents a single learning session.
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    ai_summary TEXT
);

-- Stores the transcript of a learning session.
CREATE TABLE session_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    sender message_sender NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tracks a user's mastery of a specific topic.
CREATE TABLE user_progress (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    status user_progress_status NOT NULL DEFAULT 'not_started',
    score FLOAT CHECK (score >= 0 AND score <= 1),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, topic_id)
);

-- ### 3. Functions & Triggers ###

-- Function to create a profile when a new user signs up in Supabase auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, login, email)
  VALUES (new.id, new.raw_user_meta_data->>'login', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new user is inserted.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ### 4. Views ###

-- Simplifies querying for the user's overall progress map.
CREATE OR REPLACE VIEW vw_user_skill_map AS
SELECT
    p.id as user_id,
    s.id as section_id,
    s.title as section_title,
    t.id as topic_id,
    t.title as topic_title,
    COALESCE(up.status, 'not_started') as status,
    up.score
FROM
    profiles p
CROSS JOIN sections s
JOIN topics t ON s.id = t.section_id
LEFT JOIN user_progress up ON p.id = up.user_id AND t.id = up.topic_id
ORDER BY
    s.display_order, t.display_order;

-- Simplifies querying for session details including user info.
CREATE OR REPLACE VIEW vw_session_details AS
SELECT
    s.id as session_id,
    s.started_at,
    s.ended_at,
    s.ai_summary,
    p.id as user_id,
    p.login,
    t.id as topic_id,
    t.title as topic_title
FROM
    sessions s
JOIN profiles p ON s.user_id = p.id
LEFT JOIN topics t ON s.topic_id = t.id;

-- ### 5. Row Level Security (RLS) ###

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Users can see and edit their own profile.
CREATE POLICY "Allow users to manage their own profile"
ON profiles FOR ALL
USING (auth.uid() = id);

-- Users can manage their own test attempts.
CREATE POLICY "Allow users to manage their own test attempts"
ON diagnostic_test_attempts FOR ALL
USING (auth.uid() = user_id);

-- Users can manage their own answers.
CREATE POLICY "Allow users to manage their own answers"
ON user_answers FOR ALL
USING (EXISTS (
    SELECT 1 FROM diagnostic_test_attempts
    WHERE id = attempt_id AND user_id = auth.uid()
));

-- Users can manage their own sessions.
CREATE POLICY "Allow users to manage their own sessions"
ON sessions FOR ALL
USING (auth.uid() = user_id);

-- Users can manage messages in their own sessions.
CREATE POLICY "Allow users to manage messages in their own sessions"
ON session_messages FOR ALL
USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE id = session_id AND user_id = auth.uid()
));

-- Users can manage their own progress.
CREATE POLICY "Allow users to manage their own progress"
ON user_progress FOR ALL
USING (auth.uid() = user_id);

-- ### 6. Indexes ###

-- Foreign Key Indexes
CREATE INDEX ON topics (section_id);
CREATE INDEX ON learning_content (topic_id);
CREATE INDEX ON diagnostic_tests (section_id);
CREATE INDEX ON diagnostic_test_learning_content (test_id);
CREATE INDEX ON diagnostic_test_learning_content (content_id);
CREATE INDEX ON diagnostic_test_attempts (user_id);
CREATE INDEX ON diagnostic_test_attempts (diagnostic_test_id);
CREATE INDEX ON user_answers (attempt_id);
CREATE INDEX ON user_answers (content_id);
CREATE INDEX ON sessions (user_id);
CREATE INDEX ON sessions (topic_id);
CREATE INDEX ON session_messages (session_id);
CREATE INDEX ON user_progress (topic_id);

-- Composite Indexes
CREATE INDEX ON user_progress (user_id, topic_id);

-- Other Indexes
CREATE INDEX ON learning_content USING GIN (content);
