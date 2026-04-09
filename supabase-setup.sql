-- ========================================
-- Lab0 x Adopt AI Demo -- Supabase Setup
-- Run this in: npx supabase db query --linked < supabase-setup.sql
-- ========================================

-- 1. TABLES

create table if not exists engagements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_name text not null,
  status text default 'active',
  pilot_start date,
  checkpoint_date date,
  lead_name text,
  fde_name text,
  created_at timestamptz default now()
);

create table if not exists brd_content (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid references engagements(id) on delete cascade,
  section_key text not null,
  content jsonb not null,
  version int default 1,
  updated_at timestamptz default now(),
  unique(engagement_id, section_key)
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid references engagements(id) on delete cascade,
  source text not null,
  headline text,
  body_text text,
  meta_text text,
  selected boolean default true,
  activity_ts timestamptz,
  created_at timestamptz default now()
);

create table if not exists report_versions (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid references engagements(id) on delete cascade,
  version_num int not null,
  week_label text,
  period_label text,
  content jsonb not null,
  status text default 'draft',
  created_at timestamptz default now()
);

create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  master_prompt text,
  report_template text default 'standard',
  delivery_method text default 'email',
  cadence text default 'weekly',
  created_at timestamptz default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  role text default 'viewer',
  avatar_initials text,
  avatar_color text,
  created_at timestamptz default now()
);

create table if not exists integration_settings (
  id uuid primary key default gen_random_uuid(),
  service text not null unique,
  status text default 'connected',
  connected_since date,
  config jsonb,
  created_at timestamptz default now()
);

-- 2. SEED DATA

do $$
declare
  spendflo_id uuid := '11111111-1111-1111-1111-111111111111';
  doola_id    uuid := '22222222-2222-2222-2222-222222222222';
  rallyup_id  uuid := '33333333-3333-3333-3333-333333333333';
begin

-- Engagements
insert into engagements (id, name, client_name, status, pilot_start, checkpoint_date, lead_name, fde_name)
values
  (spendflo_id, 'Spendflo Pilot', 'Spendflo Inc.', 'active',      '2026-01-05', '2026-07-05', 'Anirudh S.', 'Rahul M.'),
  (doola_id,    'Doola Pilot',    'Doola',         'active',      '2026-02-10', '2026-04-30', 'Krishna P.', 'Priya K.'),
  (rallyup_id,  'RallyUp Pilot',  'RallyUp',       'gate_overdue','2026-01-20', '2026-03-31', 'Anirudh S.', 'Rahul M.')
on conflict (id) do nothing;

-- BRD: Engagement Overview
insert into brd_content (engagement_id, section_key, content) values (
  spendflo_id, 'overview',
  '{"client":"Spendflo Inc.","champion":"Yash Kothari","champion_title":"Head of Product","exec_sponsor":"Spendflo CEO","engagement_lead":"Anirudh S.","fde_lead":"Rahul M.","contract":"6-Month Pilot","start":"Jan 5, 2026","gate_3":"Apr 5, 2026","gate_6":"Jul 5, 2026"}'
) on conflict (engagement_id, section_key) do nothing;

-- BRD: Business Objectives
insert into brd_content (engagement_id, section_key, content) values (
  spendflo_id, 'objectives',
  '{"items":[{"color":"#ff5203","title":"Replace Manual Navigation with Conversational AI","desc":"Co-pilot must answer procurement queries in natural language within 10 seconds."},{"color":"#0364ff","title":"Full RBAC Compliance Across Multi-Tenant Architecture","desc":"Zero cross-role data exposure across all user types."},{"color":"#f7d241","title":"Drive Adoption: Co-pilot Displaces Traditional Navigation","desc":"Target: >40% of routine queries via co-pilot by Month 6."}]}'
) on conflict (engagement_id, section_key) do nothing;

-- BRD: Delivery Plan
insert into brd_content (engagement_id, section_key, content) values (
  spendflo_id, 'delivery_plan',
  '{"rows":[{"month":"Jan 2026","phase":"Foundation & Integration","activities":"REST API, RBAC, agent config","status":"Done","status_class":"status-done"},{"month":"Feb 2026","phase":"QA & Release Hardening","activities":"Full QA suite, SOP docs, staging sign-off","status":"Done","status_class":"status-done"},{"month":"Mar 2026","phase":"Production Launch","activities":"Go-live, pilot cohort, baseline metrics","status":"Done","status_class":"status-done"},{"month":"Apr 2026","phase":"CRUD Expansion","activities":"Procurement + contract creation, power user flows","status":"In Progress","status_class":"status-inprog"},{"month":"May 2026","phase":"Optimisation","activities":"Eval tuning, additional use cases","status":"Planned","status_class":"status-planned"},{"month":"Jun 2026","phase":"Evaluation & Renewal","activities":"Retrospective, ROI measurement, renewal","status":"Planned","status_class":"status-planned"}]}'
) on conflict (engagement_id, section_key) do nothing;

-- BRD: Success Metrics
insert into brd_content (engagement_id, section_key, content) values (
  spendflo_id, 'success_metrics',
  '{"rows":[{"metric":"Co-pilot WAU","target":">30% of users","current":"23% WAU","status":"Watch","status_class":"status-watch"},{"metric":"Navigation Shift","target":">40% by Month 6","current":"18% shift","status":"On track","status_class":"status-ontrack"},{"metric":"Response Time","target":"<1.5s","current":"1.1s","status":"On target","status_class":"status-done"},{"metric":"Eval Pass Rate","target":">=93% Month 3","current":"93.2%","status":"On target","status_class":"status-done"},{"metric":"Thumbs-Down Rate","target":"<3%","current":"1.8%","status":"On target","status_class":"status-done"}]}'
) on conflict (engagement_id, section_key) do nothing;

-- Activities for Spendflo
insert into activities (engagement_id, source, headline, body_text, meta_text, selected, activity_ts) values
  (spendflo_id, 'fireflies', 'Yash confirmed contract record creation is the #1 priority.', 'Yash Kothari confirmed contract record creation is the #1 priority for the month. Requested a live demo before Apr 30. Flagged bulk procurement as a future ask.', 'Attendees: Anirudh S., Rahul M., Yash Kothari · 28 min', true,  '2026-04-14 10:00:00+00'),
  (spendflo_id, 'jira',      'CRUD: Contract Record Creation -- implementation started.', 'CRUD: Contract Record Creation ticket created and implementation started.', 'Sprint: Month 4 · Assignee: Rahul M. · Due Apr 18', true, '2026-04-14 14:00:00+00'),
  (spendflo_id, 'slack',     'Contract record spec finalized and approved.', 'Rahul M.: "Contract record spec finalized and approved. Starting implementation -- targeting production by Apr 17."', 'Bengaluru · reacted by Anirudh S.', true, '2026-04-14 14:34:00+00'),
  (spendflo_id, 'loom',      'Eval suite update -- CRUD contract record scenarios.', '12 new test cases covering multi-role access and error states added to the eval suite.', 'Watch (4:12)', true, '2026-04-15 09:00:00+00'),
  (spendflo_id, 'slack',     'Eval pass rate recovered to 93.2% -- all CRUD scenarios covered.', 'Rahul M.: "Eval pass rate recovered to 93.2% -- all CRUD scenarios now covered. Back above target."', 'Bengaluru · reacted by Anirudh S.', true, '2026-04-16 09:15:00+00'),
  (spendflo_id, 'jira',      'CRUD: Contract Record Creation -- merged to staging.', 'Merged to staging. Awaiting Spendflo tech lead sign-off before production deploy.', 'Assignee: Rahul M. · Sprint: Month 4', true, '2026-04-17 11:00:00+00'),
  (spendflo_id, 'slack',     'Updated SOP documentation for CRUD flows.', 'Priya K.: "Updated SOP documentation for CRUD flows. Internal reference only."', 'Not selected · internal note', false, '2026-04-16 11:02:00+00'),
  (spendflo_id, 'fireflies', 'Team aligned: contract creation targets production Apr 18.', 'Team aligned on contract creation targeting production Apr 18. Eval recovery on track. No blockers.', 'Attendees: Rahul M., Priya K. · 15 min', true, '2026-04-16 15:00:00+00');

-- Report: Week 14 (Draft)
insert into report_versions (engagement_id, version_num, week_label, period_label, content, status) values (
  spendflo_id, 14, 'Week 14', 'Apr 14-18, 2026',
  '{"week_num":14,"status":"On Track","tldr":"Month 4 CRUD milestone on track to complete. Contract record creation is in staging -- production sign-off expected Monday April 21. Eval pass rate recovered to 93.2%, above the >=93% target. Yash confirmed contract creation is his top priority; live demo scheduled Apr 22.","plan_vs_actual":[{"scope":"Procurement request creation","status":"Shipped -- Apr 9","delta":"On plan"},{"scope":"Contract record creation","status":"Staging -- sign-off pending","delta":"On plan"},{"scope":"Power user flows for finance leads","status":"Scoped with Yash -- in progress","delta":"On plan"},{"scope":"Eval pass rate >=93% maintained","status":"93.2% -- recovered","delta":"On target"}],"activities":[{"source":"Fireflies","source_color":"#ff5203","date":"Apr 14","text":"Yash confirmed priority, demo requested before Apr 30."},{"source":"Slack","source_color":"#0364ff","date":"Apr 16","text":"Eval pass rate recovered to 93.2% -- back above target."},{"source":"Jira","source_color":"#f7d241","date":"Apr 17","text":"Contract creation merged to staging -- sign-off pending."},{"source":"Loom","source_color":"#ffc0f5","date":"Apr 15","text":"Eval suite updated -- CRUD contract record scenarios.","loom_link":"Watch (4:12)"}],"deliverables":[{"name":"Contract Record Creation","type":"Feature","status":"Staging, sign-off pending","owner":"Rahul M.","ticket":"ADOPT-240"},{"name":"Eval Suite Recovery","type":"QA","status":"Done -- 93.2%","owner":"Priya K.","ticket":"ADOPT-241"},{"name":"CRUD: Bulk Procurement Scope","type":"Spec","status":"Starting Apr 21","owner":"Rahul M. + Priya K.","ticket":"--"}],"next_week":[{"text":"Production deploy contract record creation","owner":"Rahul M. · Apr 21"},{"text":"Live demo to Yash Kothari","owner":"Anirudh S. · Apr 22"},{"text":"Begin bulk procurement scope","owner":"Rahul M. + Priya K. · Apr 24"},{"text":"Month 4 internal Loom review","owner":"Anirudh S. · Apr 25"}],"blockers":"No active blockers. Staging sign-off is the only pending gate.","champion_note":"Hi Yash -- contract creation is in staging and hits production Monday. Eval rate is back above 93%. Demo is confirmed for Tuesday the 22nd. Talk then.","champion_name":"Yash Kothari","champion_title":"Head of Product · Spendflo"}',
  'draft'
);

-- Report: Week 13 (Sent)
insert into report_versions (engagement_id, version_num, week_label, period_label, content, status) values (
  spendflo_id, 13, 'Week 13', 'Apr 7-11, 2026',
  '{"week_num":13,"status":"On Track","tldr":"Procurement request creation shipped to production Apr 9. Month 4 CRUD phase underway. Eval pass rate dipped to 90.8% -- recovery in progress. Yash added two power user scenarios to scope.","plan_vs_actual":[{"scope":"Procurement request creation","status":"Shipped -- Apr 9","delta":"On plan"},{"scope":"Contract record creation","status":"In spec","delta":"On plan"},{"scope":"Power user flows","status":"Scoping with Yash","delta":"On plan"},{"scope":"Eval pass rate >=93%","status":"90.8% -- recovering","delta":"Watch"}],"activities":[{"source":"Fireflies","source_color":"#ff5203","date":"Apr 7","text":"Procurement request creation review call -- Yash approved for production."},{"source":"Jira","source_color":"#f7d241","date":"Apr 9","text":"ADOPT-239 closed -- procurement request creation shipped."},{"source":"Slack","source_color":"#0364ff","date":"Apr 10","text":"Eval pass rate at 90.8% -- below target. Priya investigating."}],"deliverables":[{"name":"Procurement Request Creation","type":"Feature","status":"Shipped -- Apr 9","owner":"Rahul M.","ticket":"ADOPT-239"},{"name":"Contract Record Spec","type":"Spec","status":"In progress","owner":"Rahul M.","ticket":"ADOPT-240"},{"name":"Power User Flow Scoping","type":"Discovery","status":"With Yash","owner":"Anirudh S.","ticket":"--"}],"next_week":[{"text":"Begin contract record creation implementation","owner":"Rahul M. · Apr 14"},{"text":"Recover eval pass rate above 93%","owner":"Priya K. · Apr 16"},{"text":"Finalize power user scope with Yash","owner":"Anirudh S. · Apr 14"}],"blockers":"Eval pass rate at 90.8% -- below 93% target. Priya K. investigating root cause.","champion_note":"Hi Yash -- procurement request creation is live in production. This week we start contract record creation. Quick sync Tuesday to align on power user scenarios?","champion_name":"Yash Kothari","champion_title":"Head of Product · Spendflo"}',
  'sent'
);

-- Report: Week 12 (Sent)
insert into report_versions (engagement_id, version_num, week_label, period_label, content, status) values (
  spendflo_id, 12, 'Week 12', 'Mar 31-Apr 4, 2026',
  '{"week_num":12,"status":"On Track","tldr":"Month 3 gate passed Apr 5. Production co-pilot stable with 21% WAU. Month 4 CRUD phase officially kicked off -- procurement request creation spec finalized.","plan_vs_actual":[{"scope":"Month 3 gate review","status":"Passed -- Apr 5","delta":"On plan"},{"scope":"Co-pilot WAU baseline","status":"21% WAU","delta":"On track"},{"scope":"Month 4 kickoff","status":"Kicked off Apr 7","delta":"On plan"}],"activities":[{"source":"Fireflies","source_color":"#ff5203","date":"Apr 5","text":"Month 3 gate call -- passed. Yash and CEO signed off on renewal to Month 6."},{"source":"Slack","source_color":"#0364ff","date":"Apr 4","text":"WAU metrics confirmed -- 21% baseline ahead of 30% Month 6 target."}],"deliverables":[{"name":"Month 3 Gate","type":"Milestone","status":"Passed","owner":"Anirudh S.","ticket":"--"},{"name":"Procurement Request Spec","type":"Spec","status":"Finalized","owner":"Rahul M.","ticket":"ADOPT-239"}],"next_week":[{"text":"Begin procurement request creation implementation","owner":"Rahul M. · Apr 7"},{"text":"Share Month 4 plan with Yash","owner":"Anirudh S. · Apr 7"}],"blockers":"None.","champion_note":"Hi Yash -- congratulations on passing the Month 3 gate. Month 4 is underway -- CRUD features starting this week. Next update in 7 days.","champion_name":"Yash Kothari","champion_title":"Head of Product · Spendflo"}',
  'sent'
);

-- User Settings
insert into user_settings (master_prompt, report_template, delivery_method, cadence)
values (
  'You are generating a weekly status report for {{client_name}} from {{engagement_lead}}. Structure: TL;DR referencing BRD delivery plan, Plan vs. Actual table, Activity feed (Fireflies then Slack then Jira then Loom), Deliverables, Next week, Blockers, Champion message. Tone: direct, factual, confident. Champion: {{champion_name}}, {{champion_title}}.',
  'standard', 'email', 'weekly'
);

-- Team Members
insert into team_members (name, email, role, avatar_initials, avatar_color) values
  ('Anirudh S.', 'anirudh@adopt.ai',   'admin',  'AS', '#ff5203'),
  ('Rahul M.',   'rahul.m@adopt.ai',   'editor', 'RM', '#0364ff'),
  ('Priya K.',   'priya.k@adopt.ai',   'editor', 'PK', '#f7d241'),
  ('Krishna P.', 'krishna.p@adopt.ai', 'viewer', 'KP', '#ffc0f5');

-- Integration Settings
insert into integration_settings (service, status, connected_since, config) values
  ('fireflies', 'connected', '2026-01-05', '{"workspace":"adopt-ai","sync_cadence":"daily"}'),
  ('jira',      'connected', '2026-01-05', '{"project_key":"ADOPT","board":"FDE Sprint Board"}'),
  ('slack',     'connected', '2026-01-07', '{"workspace":"adopt-ai","channels":["#spendflo-fde","#spendflo-general"]}'),
  ('loom',      'connected', '2026-01-10', '{"workspace":"adopt-ai"}')
on conflict (service) do nothing;

end $$;
