require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY not set in .env');
  process.exit(1);
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// GET /config.js — inject Supabase credentials from env vars
// IMPORTANT: registered before express.static() so a physical config.js can never shadow this route
app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  res.send(`window.SUPABASE_URL = '${process.env.SUPABASE_URL}'; window.SUPABASE_ANON_KEY = '${process.env.SUPABASE_ANON_KEY}';`);
});

app.use(express.static(path.join(__dirname)));

// POST /api/generate-report
// Body: { engagement, brd, activities, weekLabel, periodLabel, priorReports }
// Returns: { content: { tldr, plan_vs_actual, activities, deliverables, next_week, blockers, champion_note, champion_label } }
app.post('/api/generate-report', async (req, res) => {
  const { engagement, brd, activities, weekLabel, periodLabel, priorReports } = req.body;

  const activitiesText = (activities || []).map(a => {
    const src = (a.source || '').toUpperCase();
    return `[${src}] ${a.headline || ''}: ${a.body_text || ''}`;
  }).join('\n') || 'No activities selected.';

  const brdSections = [];
  if (brd.objectives)      brdSections.push('OBJECTIVES:\n' + JSON.stringify(brd.objectives, null, 2));
  if (brd.delivery_plan)   brdSections.push('DELIVERY PLAN:\n' + JSON.stringify(brd.delivery_plan, null, 2));
  if (brd.success_metrics) brdSections.push('SUCCESS METRICS:\n' + JSON.stringify(brd.success_metrics, null, 2));
  const brdText = brdSections.join('\n\n') || 'No BRD content loaded.';

  const priorContext = (priorReports || []).length > 0
    ? '\nPRIOR WEEKS (for continuity):\n' +
      priorReports.map(r => `${r.week}: ${r.tldr}`).join('\n')
    : '';

  const champFirstName = (engagement.client_name || 'Champion').split(' ')[0];

  const prompt = `You are generating a weekly status report for a customer success engagement at an AI company.

ENGAGEMENT: ${engagement.name} with ${engagement.client_name}
ENGAGEMENT LEAD: ${engagement.lead_name || 'Lab0 Team'}
REPORT PERIOD: ${weekLabel} (${periodLabel})

BRD CONTEXT:
${brdText}
${priorContext}
SELECTED ACTIVITY ITEMS THIS WEEK:
${activitiesText}

Generate a structured weekly status report. Respond ONLY with valid JSON, no markdown fences, no explanation:
{
  "tldr": "2-3 sentence executive summary of this week's progress against BRD goals",
  "plan_vs_actual": [
    { "committed": "what was committed this week", "status": "Done|In Progress|Behind|Blocked", "delta": "brief outcome note or variance" }
  ],
  "activities": [
    { "source": "slack|jira|loom|fireflies", "text": "one sentence description of the activity", "date": "Month Day" }
  ],
  "deliverables": [
    { "deliverable": "item name", "type": "Feature|Fix|Eval|Milestone|Planning", "status": "Live|In Progress|Blocked|Complete", "owner": "Name", "ticket": "JIRA-XXX or empty string" }
  ],
  "next_week": [
    { "text": "specific action item", "owner": "Owner Name", "date": "Month Day" }
  ],
  "blockers": [],
  "champion_note": "3-4 sentence warm personal note from the engagement lead to the client champion — direct, specific to this week's wins and next steps",
  "champion_label": "Note to ${champFirstName}"
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = message.content[0].text.trim();
    const content = JSON.parse(raw);
    res.json({ content });
  } catch (err) {
    console.error('generate-report error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/edit-report
// Body: { content, prompt, revisionHistory }
// Returns: { content } (full content object with all sections updated)
app.post('/api/edit-report', async (req, res) => {
  const { content, prompt, revisionHistory } = req.body;

  const planText = (content.plan_vs_actual || [])
    .map(r => `- ${r.committed}: ${r.status}${r.delta ? ' (' + r.delta + ')' : ''}`)
    .join('\n') || 'None';

  const nextWeekText = (content.next_week || content.next_steps || [])
    .map((s, i) => `${i + 1}. ${s.text} (${s.owner}${s.date ? ', ' + s.date : ''})`)
    .join('\n') || 'None';

  const blockersText = (content.blockers || []).join('\n') || 'None';

  const historyContext = (revisionHistory || []).length > 1
    ? '\nREVISION HISTORY (most recent first):\n' +
      revisionHistory.map(r => `v${r.revision}${r.note ? ' [' + r.note + ']' : ''}: ${r.tldr}`).join('\n')
    : '';

  const userPrompt = `You are editing a weekly customer success status report based on a user instruction.

CURRENT REPORT (v${(revisionHistory && revisionHistory[0] && revisionHistory[0].revision) || 1}):

TL;DR: ${content.tldr}

Plan vs Actual:
${planText}

Next Week Commitments:
${nextWeekText}

Blockers: ${blockersText}

Champion Note: ${content.champion_note}
${historyContext}
USER INSTRUCTION: ${prompt}

Return the complete revised report as JSON only, no markdown fences, no explanation. Return ALL fields, preserving any sections not mentioned in the instruction:
{
  "tldr": "...",
  "plan_vs_actual": [{ "committed": "...", "status": "Done|In Progress|Behind|Blocked", "delta": "..." }],
  "activities": ${JSON.stringify(content.activities || [])},
  "deliverables": ${JSON.stringify(content.deliverables || [])},
  "next_week": [{ "text": "...", "owner": "...", "date": "..." }],
  "blockers": [],
  "champion_note": "...",
  "champion_label": "${content.champion_label || 'Champion Note'}"
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You edit customer success reports. Respond only with valid JSON.',
      messages: [{ role: 'user', content: userPrompt }]
    });

    const raw = message.content[0].text.trim();
    const revised = JSON.parse(raw);
    res.json({ content: revised });
  } catch (err) {
    console.error('edit-report error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/extract-activity
// Body: { title, body, source_label, engagementName }
// Returns: { items: [{ source, headline, body_text, meta_text }] }
app.post('/api/extract-activity', async (req, res) => {
  const { title, body, source_label, engagementName } = req.body;

  const prompt = `You are extracting structured activity items from a raw document for a customer success engagement tracker.

ENGAGEMENT: ${engagementName || 'Unknown'}
DOCUMENT TITLE: ${title || 'Untitled'}
SOURCE TYPE: ${source_label || 'document'}

DOCUMENT CONTENT:
${body}

Extract the key activity items, updates, decisions, blockers, and action items from this document.
Each item should map to one of these sources: slack, jira, loom, fireflies (pick the closest match based on source type).

Respond ONLY with valid JSON, no markdown:
{
  "items": [
    {
      "source": "slack",
      "headline": "short headline (max 80 chars)",
      "body_text": "one sentence summary of this activity item",
      "meta_text": "date or context label if identifiable, otherwise empty string"
    }
  ]
}

Extract between 2 and 6 items. Prefer specificity over generic summaries.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = message.content[0].text.trim();
    const result = JSON.parse(raw);
    res.json(result);
  } catch (err) {
    console.error('extract-activity error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log('Adopt AI server: http://localhost:' + PORT);
});
