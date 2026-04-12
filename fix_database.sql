-- Run this explicitly in your Supabase SQL Editor to fix the server errors

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE TABLE IF NOT EXISTS cognitive_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress',
    test_config JSONB NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- Note: The update_updated_at_column() function is assumed to already exist 
-- as it is typically created in earlier migrations. If you get an error here, comment these 3 lines out.
CREATE TRIGGER update_cognitive_sessions_updated_at
    BEFORE UPDATE ON cognitive_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS cognitive_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES cognitive_sessions(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL,
    score FLOAT NOT NULL,
    score_components JSONB NOT NULL DEFAULT '{}',
    responses JSONB NOT NULL,
    metadata JSONB,
    time_taken_seconds FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cognitive_sessions_user_status ON cognitive_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_cognitive_results_user_test ON cognitive_results(user_id, test_type);
CREATE INDEX IF NOT EXISTS idx_cognitive_results_session_id ON cognitive_results(session_id);

CREATE INDEX IF NOT EXISTS idx_cognitive_sessions_user_created ON cognitive_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cognitive_results_user_created ON cognitive_results (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cognitive_results_user_latest ON cognitive_results (user_id, created_at DESC) WHERE score IS NOT NULL;

CREATE TABLE IF NOT EXISTS cognitive_summary_cache (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    latest_score FLOAT,
    average_score FLOAT,
    trend_direction TEXT,
    recent_scores JSONB,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_summary_cache_updated ON cognitive_summary_cache (last_updated DESC);

ALTER TABLE cognitive_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_summary_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access_sessions" ON cognitive_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access_results" ON cognitive_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access_cache" ON cognitive_summary_cache FOR ALL USING (true) WITH CHECK (true);
