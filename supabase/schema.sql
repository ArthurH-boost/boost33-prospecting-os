-- Boost33 Prospecting OS — Full Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. SCRAPING TRACKER
-- ============================================
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  url text not null,
  type text default 'linkedin_post',
  note text,
  status text default 'pending' check (status in ('pending','scraping','done')),
  profile_count integer default 0,
  desk text not null check (desk in ('Arthur','Boost33','Advisor')),
  created_at timestamptz default now()
);

alter table public.posts enable row level security;
create policy "Authenticated users can manage posts"
  on public.posts for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================
-- 2. CEO FILTER SESSIONS
-- ============================================
create table public.filter_sessions (
  id uuid default uuid_generate_v4() primary key,
  desk text not null check (desk in ('Arthur','Boost33','Advisor')),
  total integer default 0,
  matched integer default 0,
  dupes integer default 0,
  created_at timestamptz default now()
);

alter table public.filter_sessions enable row level security;
create policy "Authenticated users can manage filter_sessions"
  on public.filter_sessions for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================
-- 3. TEMPLATES
-- ============================================
create table public.templates (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sector text,
  persona text,
  lang text default 'FR',
  message text not null,
  created_at timestamptz default now()
);

alter table public.templates enable row level security;
create policy "Authenticated users can manage templates"
  on public.templates for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Seed some default templates
insert into public.templates (name, sector, persona, lang, message) values
  ('Tech CEO FR', 'Tech', 'CEO', 'FR', 'Bonjour {{firstName}}, je me permets de vous contacter car...'),
  ('SaaS Founder EN', 'SaaS', 'Founder', 'EN', 'Hi {{firstName}}, I noticed your company...'),
  ('Retail DG FR', 'Retail', 'DG', 'FR', 'Bonjour {{firstName}}, en tant que Directeur Général de {{company}}...');

-- ============================================
-- 4. CAMPAIGNS
-- ============================================
create table public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  desk text not null check (desk in ('Arthur','Boost33','Advisor')),
  template_id uuid references public.templates(id),
  template_used text,
  start_date date,
  contacts_count integer default 0,
  status text default 'draft' check (status in ('draft','ready','active','paused','completed')),
  schedule_json jsonb default '{}'::jsonb,
  webhook_url text,
  prosp_api_key text,
  created_at timestamptz default now()
);

alter table public.campaigns enable row level security;
create policy "Authenticated users can manage campaigns"
  on public.campaigns for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================
-- 5. PIPELINE STATS
-- ============================================
create table public.pipeline_stats (
  id uuid default uuid_generate_v4() primary key,
  desk text not null check (desk in ('Arthur','Boost33','Advisor')),
  week text not null,
  sent integer default 0,
  accepted integer default 0,
  replies integer default 0,
  rdv integer default 0,
  campaign_id uuid references public.campaigns(id),
  created_at timestamptz default now()
);

alter table public.pipeline_stats enable row level security;
create policy "Authenticated users can manage pipeline_stats"
  on public.pipeline_stats for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================
-- 6. SETTINGS (key-value store)
-- ============================================
create table public.settings (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,
  value text,
  updated_at timestamptz default now()
);

alter table public.settings enable row level security;
create policy "Authenticated users can manage settings"
  on public.settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================
-- 7. LEAD QUALIFICATIONS
-- ============================================
create table public.lead_qualifications (
  id uuid default uuid_generate_v4() primary key,
  contact_name text not null,
  company text,
  reply_content text,
  qualification text not null check (qualification in ('CHAUD','TIEDE','FROID')),
  next_action text not null check (next_action in ('RDV booké','Relance','Pas intéressé')),
  campaign_id uuid references public.campaigns(id),
  desk text not null check (desk in ('Arthur','Boost33','Advisor')),
  created_at timestamptz default now()
);

alter table public.lead_qualifications enable row level security;
create policy "Authenticated users can manage lead_qualifications"
  on public.lead_qualifications for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================
-- 8. TEAM PROFILES
-- ============================================
create table public.team_profiles (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  first_name text not null,
  last_name text not null,
  job_title text not null,
  linkedin_url text not null,
  desk text not null check (desk in ('Arthur','Boost33','Advisor')),
  prosp_api_key text,
  created_at timestamptz default now()
);

alter table public.team_profiles enable row level security;
create policy "Authenticated users can manage team_profiles"
  on public.team_profiles for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
