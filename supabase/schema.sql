-- daily account snapshot (one row per day)
create table account_snapshots (
  id uuid primary key default gen_random_uuid(),
  captured_on date not null unique,
  reach int,
  followers int,
  profile_views int,        -- 7-day rolling aggregate, stored daily
  accounts_engaged int      -- 7-day rolling aggregate, stored daily
);

-- reel metadata (static, one row per reel)
create table reels (
  id uuid primary key default gen_random_uuid(),
  ig_media_id text not null unique,
  caption text,
  permalink text,
  thumbnail_url text,
  posted_at timestamptz,
  format text,        -- viral | yap | cookup | pov | placement
  funnel_stage text   -- TOFU | MOFU | BOFU
);

-- per-reel metrics snapshot (pulled daily so you see growth over time)
create table reel_snapshots (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid references reels(id) on delete cascade,
  captured_on date not null,
  views int,
  reach int,
  saved int,
  shares int,
  comments int,
  total_interactions int,
  avg_watch_time numeric,
  total_watch_time numeric,
  unique(reel_id, captured_on)
);
