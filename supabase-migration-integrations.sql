-- Run in Supabase SQL editor

-- Per-engagement integration configuration
create table if not exists project_integrations (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid references engagements(id) on delete cascade,
  service text not null,
  config jsonb not null default '{}',
  status text default 'configured',
  created_at timestamptz default now(),
  unique(engagement_id, service)
);

-- Inbox items: documents/notes dumped into a project
create table if not exists inbox_items (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid references engagements(id) on delete cascade,
  title text,
  body text not null,
  source_label text default 'document',
  created_at timestamptz default now()
);

-- RLS
alter table project_integrations enable row level security;
create policy "anon full access" on project_integrations for all to anon using (true) with check (true);

alter table inbox_items enable row level security;
create policy "anon full access" on inbox_items for all to anon using (true) with check (true);
