-- Shopify Marketing Solution - Analytics Database Schema
-- Run with: supabase db push OR apply via Supabase dashboard

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SHOPS
-- ============================================================
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_domain TEXT UNIQUE NOT NULL,
  shop_name TEXT,
  tracking_id TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shops_domain ON shops(shop_domain);
CREATE INDEX idx_shops_tracking ON shops(tracking_id);

-- ============================================================
-- VISITORS
-- ============================================================
CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  is_returning BOOLEAN DEFAULT FALSE,
  visit_count INT DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  UNIQUE(shop_id, visitor_id)
);

CREATE INDEX idx_visitors_shop ON visitors(shop_id);
CREATE INDEX idx_visitors_last_seen ON visitors(shop_id, last_seen_at DESC);

-- ============================================================
-- VISITOR SESSIONS
-- ============================================================
CREATE TABLE visitor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  visitor_uuid UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  landing_page TEXT,
  exit_page TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  traffic_source TEXT,
  converted BOOLEAN DEFAULT FALSE,
  order_value DECIMAL(12, 2),
  UNIQUE(shop_id, session_id)
);

CREATE INDEX idx_sessions_shop ON visitor_sessions(shop_id);
CREATE INDEX idx_sessions_started ON visitor_sessions(shop_id, started_at DESC);
CREATE INDEX idx_sessions_traffic ON visitor_sessions(shop_id, traffic_source);
CREATE INDEX idx_sessions_converted ON visitor_sessions(shop_id, converted);

-- ============================================================
-- PAGE VIEWS
-- ============================================================
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  session_uuid UUID NOT NULL REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  visitor_uuid UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  page_title TEXT,
  time_on_page_seconds INT,
  is_exit BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pageviews_shop ON page_views(shop_id);
CREATE INDEX idx_pageviews_session ON page_views(session_uuid);
CREATE INDEX idx_pageviews_url ON page_views(shop_id, url);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  session_uuid UUID NOT NULL REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  visitor_uuid UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  product_id TEXT,
  product_title TEXT,
  collection_id TEXT,
  order_value DECIMAL(12, 2),
  search_query TEXT,
  button_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_shop ON events(shop_id);
CREATE INDEX idx_events_type ON events(shop_id, event_type);
CREATE INDEX idx_events_product ON events(shop_id, product_id);
CREATE INDEX idx_events_created ON events(shop_id, created_at DESC);

-- ============================================================
-- PRODUCT ANALYTICS (daily aggregates)
-- ============================================================
CREATE TABLE product_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_title TEXT,
  date DATE NOT NULL,
  views INT DEFAULT 0,
  add_to_carts INT DEFAULT 0,
  purchases INT DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  UNIQUE(shop_id, product_id, date)
);

CREATE INDEX idx_product_analytics_shop_date ON product_analytics(shop_id, date DESC);

-- ============================================================
-- SEGMENTS
-- ============================================================
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  segment_type TEXT NOT NULL,
  criteria JSONB DEFAULT '{}'::jsonb,
  member_count INT DEFAULT 0,
  refreshed_at TIMESTAMPTZ,
  UNIQUE(shop_id, slug)
);

CREATE INDEX idx_segments_shop ON segments(shop_id);

-- ============================================================
-- SEGMENT MEMBERS
-- ============================================================
CREATE TABLE segment_members (
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  visitor_uuid UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (segment_id, visitor_uuid)
);

-- ============================================================
-- AI RECOMMENDATIONS
-- ============================================================
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  expected_impact TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'completed')),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_shop ON ai_recommendations(shop_id, status, generated_at DESC);

-- ============================================================
-- WEEKLY REPORTS
-- ============================================================
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  insights JSONB DEFAULT '[]'::jsonb,
  top_actions JSONB DEFAULT '[]'::jsonb,
  growth_opportunities JSONB DEFAULT '[]'::jsonb,
  waste_points JSONB DEFAULT '[]'::jsonb,
  performance_summary TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, week_start)
);

CREATE INDEX idx_reports_shop ON weekly_reports(shop_id, week_start DESC);

-- ============================================================
-- CHAT
-- ============================================================
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_conversations_shop ON chat_conversations(shop_id, updated_at DESC);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; no public policies needed for backend-only access

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
