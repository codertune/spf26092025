/*
  Smart Process Flow - Database Schema
  ------------------------------------
  Tables: users, work_history, blog_posts, system_settings
  Features: UUID PKs, timestamps, JSON fields, RLS policies
*/

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ================= USERS =================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    credits INTEGER DEFAULT 100,
    is_admin BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    email_verified BOOLEAN DEFAULT false,
    member_since DATE DEFAULT CURRENT_DATE,
    trial_ends_at DATE,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_activity DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================= WORK HISTORY =================
CREATE TABLE IF NOT EXISTS work_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_id VARCHAR(100) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    file_name TEXT NOT NULL,
    credits_used INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    result_files JSONB DEFAULT '[]',
    download_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ================= BLOG POSTS =================
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author VARCHAR(255) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    featured BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft',
    views INTEGER DEFAULT 0,
    meta_title VARCHAR(500),
    meta_description TEXT,
    meta_keywords TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================= SYSTEM SETTINGS =================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credits_per_bdt DECIMAL(5,2) DEFAULT 2.0,
    credits_per_process DECIMAL(5,2) DEFAULT 0.5,
    free_trial_credits INTEGER DEFAULT 100,
    min_purchase_credits INTEGER DEFAULT 200,
    enabled_services JSONB DEFAULT '[]',
    system_notification JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================= INDEXES =================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_work_history_user_id ON work_history(user_id);
CREATE INDEX IF NOT EXISTS idx_work_history_created_at ON work_history(created_at);
CREATE INDEX IF NOT EXISTS idx_work_history_service_id ON work_history(service_id);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);

-- ================= RLS =================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- USERS policies
DROP POLICY IF EXISTS users_read ON users;
DROP POLICY IF EXISTS users_update ON users;
DROP POLICY IF EXISTS users_insert ON users;

CREATE POLICY users_read ON users FOR SELECT USING (true);
CREATE POLICY users_update ON users FOR UPDATE USING (true);
CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (true);

-- WORK_HISTORY policies
DROP POLICY IF EXISTS wh_read ON work_history;
DROP POLICY IF EXISTS wh_insert ON work_history;
DROP POLICY IF EXISTS wh_update ON work_history;

CREATE POLICY wh_read ON work_history FOR SELECT USING (true);
CREATE POLICY wh_insert ON work_history FOR INSERT WITH CHECK (true);
CREATE POLICY wh_update ON work_history FOR UPDATE USING (true);

-- BLOG_POSTS policies
DROP POLICY IF EXISTS blog_read ON blog_posts;
DROP POLICY IF EXISTS blog_manage ON blog_posts;

CREATE POLICY blog_read ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY blog_manage ON blog_posts FOR ALL USING (true);

-- SYSTEM_SETTINGS policies
DROP POLICY IF EXISTS settings_read ON system_settings;
DROP POLICY IF EXISTS settings_manage ON system_settings;

CREATE POLICY settings_read ON system_settings FOR SELECT USING (true);
CREATE POLICY settings_manage ON system_settings FOR ALL USING (true);
