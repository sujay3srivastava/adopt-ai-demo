-- Normalize seed report content to match Claude's output format
-- and backfill revision column

UPDATE report_versions
SET
  revision = 1,
  revision_note = 'Seed report',
  content = '{
    "tldr": "Month 4 CRUD milestone on track to complete. Contract record creation is in staging — production sign-off expected Monday April 21. Eval pass rate recovered to 93.2%, above the >=93% target. Yash confirmed contract creation is his top priority; live demo scheduled Apr 22.",
    "champion_note": "Hi Yash — contract creation is in staging and hits production Monday. Eval rate is back above 93%. Demo is confirmed for Tuesday the 22nd. Talk then.",
    "next_steps": [
      { "text": "Production deploy contract record creation", "owner": "Rahul M." },
      { "text": "Live demo to Yash Kothari", "owner": "Anirudh S." },
      { "text": "Begin bulk procurement scope", "owner": "Rahul M. + Priya K." },
      { "text": "Month 4 internal Loom review", "owner": "Anirudh S." }
    ]
  }'::jsonb
WHERE engagement_id = '11111111-1111-1111-1111-111111111111'
  AND version_num = 14;

UPDATE report_versions
SET
  revision = 1,
  revision_note = 'Seed report',
  content = '{
    "tldr": "Procurement request creation shipped to production Apr 9. Month 4 CRUD phase underway. Eval pass rate dipped to 90.8% — recovery in progress. Yash added two power user scenarios to scope.",
    "champion_note": "Hi Yash — procurement request creation is live in production. This week we start contract record creation. Quick sync Tuesday to align on power user scenarios?",
    "next_steps": [
      { "text": "Begin contract record creation implementation", "owner": "Rahul M." },
      { "text": "Recover eval pass rate above 93%", "owner": "Priya K." },
      { "text": "Finalize power user scope with Yash", "owner": "Anirudh S." }
    ]
  }'::jsonb
WHERE engagement_id = '11111111-1111-1111-1111-111111111111'
  AND version_num = 13;

UPDATE report_versions
SET
  revision = 1,
  revision_note = 'Seed report',
  content = '{
    "tldr": "Month 3 gate passed Apr 5. Production co-pilot stable with 21% WAU. Month 4 CRUD phase officially kicked off — procurement request creation spec finalized.",
    "champion_note": "Hi Yash — congratulations on passing the Month 3 gate. Month 4 is underway — CRUD features starting this week. Next update in 7 days.",
    "next_steps": [
      { "text": "Begin procurement request creation implementation", "owner": "Rahul M." },
      { "text": "Share Month 4 plan with Yash", "owner": "Anirudh S." }
    ]
  }'::jsonb
WHERE engagement_id = '11111111-1111-1111-1111-111111111111'
  AND version_num = 12;
