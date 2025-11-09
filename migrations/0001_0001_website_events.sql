-- Migration number: 0001 	 2025-11-08T17:58:26.712Z

-- Create table for website analytics/events as requested
CREATE TABLE IF NOT EXISTS website_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  session_id TEXT,
  event_type TEXT,
  page_url TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  timestamp TEXT,
  page_load_time INTEGER NOT NULL DEFAULT 0,
  first_contentful_paint INTEGER NOT NULL DEFAULT 0,
  largest_contentful_paint INTEGER NOT NULL DEFAULT 0,
  time_on_page INTEGER NOT NULL DEFAULT 0,
  scroll_depth REAL NOT NULL DEFAULT 0,
  event_date TEXT,
  page_views INTEGER NOT NULL DEFAULT 0,
  sessions INTEGER NOT NULL DEFAULT 0,
  total_events INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  scroll_events INTEGER NOT NULL DEFAULT 0,
  total_time_on_page INTEGER NOT NULL DEFAULT 0,
  average_scroll_depth REAL NOT NULL DEFAULT 0,
  average_time_on_page REAL NOT NULL DEFAULT 0,
  first_seen TEXT,
  last_seen TEXT,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  name TEXT,
  city TEXT,
  country TEXT
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_website_events_event_date ON website_events(event_date);
CREATE INDEX IF NOT EXISTS idx_website_events_page_url ON website_events(page_url);
CREATE INDEX IF NOT EXISTS idx_website_events_session_id ON website_events(session_id);
CREATE INDEX IF NOT EXISTS idx_website_events_event_type ON website_events(event_type);
CREATE INDEX IF NOT EXISTS idx_website_events_timestamp ON website_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_website_events_utm_source ON website_events(utm_source);
CREATE INDEX IF NOT EXISTS idx_website_events_utm_medium ON website_events(utm_medium);
CREATE INDEX IF NOT EXISTS idx_website_events_city ON website_events(city);
CREATE INDEX IF NOT EXISTS idx_website_events_country ON website_events(country);

-- Composite indexes for common analytics queries
CREATE INDEX IF NOT EXISTS idx_website_events_event_date_page_url ON website_events(event_date, page_url);
CREATE INDEX IF NOT EXISTS idx_website_events_event_date_event_type ON website_events(event_date, event_type);
CREATE INDEX IF NOT EXISTS idx_website_events_session_id_timestamp ON website_events(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_website_events_page_url_event_type ON website_events(page_url, event_type);
CREATE INDEX IF NOT EXISTS idx_website_events_event_date_utm_source_medium ON website_events(event_date, utm_source, utm_medium);
