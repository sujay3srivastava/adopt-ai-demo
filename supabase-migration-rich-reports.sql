-- Rich sample report content for Spendflo (seed data v2)
-- Replaces stripped content with full structured data for display
-- Run with: npx supabase db query --linked -f supabase-migration-rich-reports.sql

UPDATE report_versions
SET content = $json${
  "tldr": "Contract record creation deployed to staging Apr 15, production sign-off expected Apr 21. Eval pass rate recovered to 93.2% after the NLP tokenizer fix merged Apr 14. Yash confirmed contract creation is his top priority and the Apr 22 demo is confirmed.",
  "plan_vs_actual": [
    { "committed": "Recover eval pass rate to >=93%", "status": "Done", "delta": "93.2% as of Apr 14, tokenizer fix merged clean" },
    { "committed": "Contract record creation in staging", "status": "Done", "delta": "Deployed Apr 15, production sign-off Apr 21" },
    { "committed": "Finalize power user scope with Yash", "status": "Done", "delta": "2 scenarios confirmed, added to Month 4 backlog" }
  ],
  "activities": [
    { "source": "jira", "text": "SPEND-151 merged — NLP tokenizer fix restores eval pass rate to 93.2%", "date": "Apr 14" },
    { "source": "slack", "text": "Yash confirmed contract creation is his top priority; demo locked for Apr 22", "date": "Apr 15" },
    { "source": "loom", "text": "Anirudh staging walkthrough — Yash and 3 team members reviewed contract creation flow", "date": "Apr 15" },
    { "source": "fireflies", "text": "Apr 14 sync: bulk procurement scope discussion, Month 4 Q2 backlog prioritization", "date": "Apr 14" }
  ],
  "deliverables": [
    { "deliverable": "Contract record creation (staging)", "type": "Feature", "status": "In Progress", "owner": "Rahul M.", "ticket": "SPEND-155" },
    { "deliverable": "NLP tokenizer hotfix", "type": "Fix", "status": "Live", "owner": "Priya K.", "ticket": "SPEND-151" },
    { "deliverable": "Bulk procurement scope document", "type": "Planning", "status": "In Progress", "owner": "Rahul M. + Priya K.", "ticket": "" }
  ],
  "next_week": [
    { "text": "Production deploy contract record creation", "owner": "Rahul M.", "date": "Apr 21" },
    { "text": "Live demo to Yash Kothari", "owner": "Anirudh S.", "date": "Apr 22" },
    { "text": "Begin bulk procurement implementation", "owner": "Rahul M. + Priya K.", "date": "Apr 23" },
    { "text": "Month 4 internal Loom review", "owner": "Anirudh S.", "date": "Apr 24" }
  ],
  "blockers": [],
  "champion_note": "Hi Yash — contract creation is in staging and looks clean. Eval rate is back above 93% after the tokenizer fix. Demo is locked for Tuesday the 22nd and we will walk through everything live. See you then.",
  "champion_label": "Note to Yash"
}$json$::jsonb
WHERE engagement_id = '11111111-1111-1111-1111-111111111111'
  AND version_num = 14;

UPDATE report_versions
SET content = $json${
  "tldr": "Procurement request creation shipped to production Apr 9. Eval pass rate dipped to 90.8% — regression traced to an NLP tokenizer update, fix scoped and in progress. Yash added two power user scenarios (multi-vendor comparison, bulk re-order) to the Month 4 scope.",
  "plan_vs_actual": [
    { "committed": "Procurement request creation (backend + UI)", "status": "Done", "delta": "Shipped prod Apr 9, SPEND-148 merged clean" },
    { "committed": "Eval pass rate >=93%", "status": "Behind", "delta": "90.8% this week — NLP tokenizer regression, SPEND-151 scoped" },
    { "committed": "Month 4 roadmap alignment with Yash", "status": "Done", "delta": "2 power user scenarios added to backlog" }
  ],
  "activities": [
    { "source": "jira", "text": "SPEND-148 merged — procurement request creation live in production", "date": "Apr 9" },
    { "source": "slack", "text": "Yash added multi-vendor comparison and bulk re-order as Month 4 power user scenarios", "date": "Apr 10" },
    { "source": "fireflies", "text": "Apr 8 team sync: eval regression traced to NLP tokenizer update deployed Apr 7", "date": "Apr 8" },
    { "source": "loom", "text": "Priya eval audit walkthrough — 8 min, 6 viewers, regression root cause identified", "date": "Apr 9" }
  ],
  "deliverables": [
    { "deliverable": "Procurement request creation", "type": "Feature", "status": "Live", "owner": "Rahul M.", "ticket": "SPEND-148" },
    { "deliverable": "NLP tokenizer hotfix", "type": "Fix", "status": "In Progress", "owner": "Priya K.", "ticket": "SPEND-151" },
    { "deliverable": "Power user scenarios document", "type": "Planning", "status": "In Progress", "owner": "Anirudh S.", "ticket": "" }
  ],
  "next_week": [
    { "text": "Recover eval pass rate above 93%", "owner": "Priya K.", "date": "Apr 15" },
    { "text": "Begin contract record creation implementation", "owner": "Rahul M.", "date": "Apr 15" },
    { "text": "Finalize power user scope document with Yash", "owner": "Anirudh S.", "date": "Apr 14" }
  ],
  "blockers": [
    "Eval regression from NLP tokenizer update deployed Apr 7 (SPEND-151). Priya has root cause isolated — fix expected Apr 11."
  ],
  "champion_note": "Hi Yash — procurement request creation is live in production as of today. Eval rate dipped after a tokenizer update last week and Priya has a fix scoped for Tuesday. Want a quick 15 minutes to finalize the two power user scenarios you added?",
  "champion_label": "Note to Yash"
}$json$::jsonb
WHERE engagement_id = '11111111-1111-1111-1111-111111111111'
  AND version_num = 13;

UPDATE report_versions
SET content = $json${
  "tldr": "Month 3 gate passed Apr 5 with green status. Production co-pilot launched Apr 2 with 21% WAU on day one, exceeding our 15% projection. Month 4 kicked off with procurement request creation spec signed off and Rahul starting backend work this week.",
  "plan_vs_actual": [
    { "committed": "Production co-pilot go-live", "status": "Done", "delta": "Launched Apr 2, 21% WAU vs 15% target" },
    { "committed": "Month 3 gate review", "status": "Done", "delta": "Passed Apr 5, green status, zero blockers" },
    { "committed": "Begin Month 4 planning", "status": "Done", "delta": "Procurement request creation spec signed off Apr 4" }
  ],
  "activities": [
    { "source": "slack", "text": "Yash confirmed Month 3 gate passed and greenlit Month 4 scope", "date": "Apr 5" },
    { "source": "loom", "text": "Anirudh co-pilot demo for Yash's team — 12 viewers, strong positive feedback session", "date": "Apr 3" },
    { "source": "jira", "text": "SPEND-142 closed — production co-pilot monitoring and alerting setup complete", "date": "Apr 2" },
    { "source": "fireflies", "text": "Apr 5 gate review: 21% WAU, eval pass rate 93.8%, customer satisfaction 4.6 out of 5", "date": "Apr 5" }
  ],
  "deliverables": [
    { "deliverable": "Production co-pilot", "type": "Feature", "status": "Live", "owner": "Rahul M.", "ticket": "SPEND-139" },
    { "deliverable": "Month 3 gate presentation", "type": "Milestone", "status": "Complete", "owner": "Anirudh S.", "ticket": "" },
    { "deliverable": "Month 4 spec (procurement request creation)", "type": "Planning", "status": "Complete", "owner": "Priya K.", "ticket": "SPEND-145" }
  ],
  "next_week": [
    { "text": "Begin procurement request creation backend", "owner": "Rahul M.", "date": "Apr 12" },
    { "text": "Set up eval framework for CRUD operations", "owner": "Priya K.", "date": "Apr 12" },
    { "text": "Schedule alignment sync with Yash on Month 4 roadmap", "owner": "Anirudh S.", "date": "Apr 10" }
  ],
  "blockers": [],
  "champion_note": "Hi Yash — Month 3 is officially in the books. 21% WAU on day one exceeded our 15% target, which is a strong signal. Month 4 kicks off with procurement request creation this week. Ping me Thursday and we can do a quick sync on the roadmap.",
  "champion_label": "Note to Yash"
}$json$::jsonb
WHERE engagement_id = '11111111-1111-1111-1111-111111111111'
  AND version_num = 12;
