// ============================================================
//  Adopt AI - app.js
//  Vanilla JS + Supabase JS v2 (loaded via CDN as window.supabase)
// ============================================================

const sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

let currentEngagementId = null;
let currentReportId = null;
let currentVersionNum = null;
let currentReportData = null;
let reportDirty = false;
let brdOriginalHtml = {};

// ============================================================
//  NAVIGATION
// ============================================================

function goTo(viewId) {
  document.querySelectorAll('.view').forEach(function(v) {
    v.style.display = 'none';
  });
  var el = document.getElementById(viewId);
  if (el) el.style.display = 'block';
  window.scrollTo(0, 0);

  if (viewId === 'view-user-control') {
    loadUserSettings();
  }
}

function setActiveTab(name) {
  document.querySelectorAll('.tab-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.tab === name);
  });
}

// ============================================================
//  MODALS
// ============================================================

function showModal(id) {
  var el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}

function hideModal(id) {
  var el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// ============================================================
//  TOAST
// ============================================================

function showToast(msg, duration) {
  duration = duration || 2000;
  var toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = [
      'position:fixed',
      'bottom:32px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:#1a0e08',
      'color:#fcf3d9',
      'font-family:Inter,sans-serif',
      'font-size:13px',
      'letter-spacing:.04em',
      'padding:10px 20px',
      'z-index:9999',
      'opacity:0',
      'transition:opacity .2s',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function() {
    toast.style.opacity = '0';
  }, duration);
}

// ============================================================
//  PROMPT TOGGLE (kept from original)
// ============================================================

function togglePrompt() {
  var panel = document.getElementById('prompt-panel');
  if (!panel) return;
  panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
}

// ============================================================
//  COMM TOGGLE / COUNTER (kept from original)
// ============================================================

function toggleComm(cb) {
  var item = cb.closest('.comm-item');
  item.classList.toggle('excluded');
  cb.classList.toggle('checked');
  updateCommCounter();
}

function updateCommCounter() {
  var total = document.querySelectorAll('#comm-feed .comm-item').length;
  var excluded = document.querySelectorAll('#comm-feed .comm-item.excluded').length;
  var selected = total - excluded;
  var el = document.getElementById('comm-counter');
  if (el) el.textContent = total + ' items  \u00b7  ' + selected + ' selected  \u00b7  ' + excluded + ' excluded';
}

// ============================================================
//  ENGAGEMENTS
// ============================================================

async function loadEngagements() {
  try {
    var res = await sb.from('engagements').select('*').order('created_at');
    if (res.error) throw res.error;
    var grid = document.querySelector('.cards-grid');
    if (!grid) return;
    var engagements = res.data || [];
    if (engagements.length === 0) return;
    grid.innerHTML = engagements.map(renderEngagementCard).join('');
    var sub = document.querySelector('#view-admin .page-sub');
    if (sub) {
      var active = engagements.filter(function(e) { return e.status === 'active'; }).length;
      sub.textContent = active + ' active engagement' + (active !== 1 ? 's' : '');
    }
  } catch (err) {
    console.error('loadEngagements error:', err);
    showToast('Failed to load engagements');
  }
}

function renderEngagementCard(eng) {
  var statusChip = '';
  if (eng.status === 'active') {
    statusChip = '<div class="status-chip"><svg width="8" height="8" viewBox="0 0 8 8" class="pulse"><rect width="8" height="8" fill="#ff5203"/></svg>Active</div>';
  } else if (eng.status === 'gate_overdue') {
    statusChip = '<div class="status-chip" style="border-color:var(--B);color:var(--B);"><svg width="8" height="8" viewBox="0 0 8 8"><rect width="8" height="8" fill="#0364ff"/></svg>Gate Overdue</div>';
  } else if (eng.status === 'completed') {
    statusChip = '<div class="status-chip" style="border-color:var(--Y);"><svg width="8" height="8" viewBox="0 0 8 8"><rect width="8" height="8" fill="#f7d241"/></svg>Completed</div>';
  } else {
    statusChip = '<div class="status-chip"><svg width="8" height="8" viewBox="0 0 8 8"><rect width="8" height="8" fill="#a89080"/></svg>' + (eng.status || 'Unknown') + '</div>';
  }

  var pilotStart = eng.pilot_start ? new Date(eng.pilot_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
  var checkpointDate = eng.checkpoint_date ? new Date(eng.checkpoint_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

  return [
    '<div class="card">',
    '  <div class="card-stripe">',
    '    <div style="background:var(--O)"></div>',
    '    <div style="background:var(--B)"></div>',
    '    <div style="background:var(--Y)"></div>',
    '    <div style="background:var(--P)"></div>',
    '  </div>',
    '  <div class="card-body">',
    '    <div class="card-top">',
    '      <div class="card-company">' + escHtml(eng.client_name || eng.name || '') + '</div>',
    '      ' + statusChip,
    '    </div>',
    '    <hr class="card-divider">',
    '    <div class="card-row"><span class="card-row-label">Lead</span><span>' + escHtml(eng.lead_name || '-') + '</span></div>',
    '    <div class="card-row"><span class="card-row-label">FDE</span><span>' + escHtml(eng.fde_name || '-') + '</span></div>',
    '    <div class="card-row"><span class="card-row-label">Start</span><span>' + escHtml(pilotStart) + '</span></div>',
    '    <div class="card-row"><span class="card-row-label">Gate</span><span>' + escHtml(checkpointDate) + '</span></div>',
    '    <hr class="card-divider">',
    '    <div class="card-actions">',
    '      <button class="btn" onclick="openEngagement(\'' + eng.id + '\')">View Project</button>',
    '      <button class="btn" onclick="showModal(\'modal-permissions\')">Manage Access</button>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('\n');
}

// ============================================================
//  OPEN ENGAGEMENT
// ============================================================

async function openEngagement(id) {
  currentEngagementId = id;
  try {
    var res = await sb.from('engagements').select('*').eq('id', id).single();
    if (res.error) throw res.error;
    var eng = res.data;

    // Update project header elements across all three project views
    document.querySelectorAll('.proj-company').forEach(function(el) {
      // Preserve child elements (status inline badge, period span), only update text node
      var firstTextNode = null;
      el.childNodes.forEach(function(node) {
        if (node.nodeType === 3 && node.textContent.trim()) firstTextNode = node;
      });
      if (firstTextNode) {
        firstTextNode.textContent = (eng.client_name || eng.name || '') + ' ';
      }
    });

    document.querySelectorAll('.proj-subtitle').forEach(function(el) {
      el.textContent = eng.name || '';
    });

    var pilotStart = eng.pilot_start ? new Date(eng.pilot_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
    var checkpointDate = eng.checkpoint_date ? new Date(eng.checkpoint_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
    document.querySelectorAll('.proj-period').forEach(function(el) {
      el.textContent = 'Start: ' + pilotStart + '  \u00b7  Gate: ' + checkpointDate;
    });

    // Team badges: lead + fde
    var badges = '';
    if (eng.lead_name) {
      var initials = getInitials(eng.lead_name);
      badges += '<div class="team-badge-wrap"><div class="team-badge" style="background:var(--O);">' + escHtml(initials) + '</div><div class="badge-tooltip">' + escHtml(eng.lead_name) + '</div></div>';
    }
    if (eng.fde_name) {
      var fdeInitials = getInitials(eng.fde_name);
      badges += '<div class="team-badge-wrap"><div class="team-badge" style="background:var(--B);">' + escHtml(fdeInitials) + '</div><div class="badge-tooltip">' + escHtml(eng.fde_name) + '</div></div>';
    }
    document.querySelectorAll('.team-badges').forEach(function(el) {
      el.innerHTML = badges;
    });

    await Promise.all([
      loadBRD(id),
      loadActivities(id),
      loadReports(id)
    ]);

    goTo('view-project');
    setActiveTab('brd');
  } catch (err) {
    console.error('openEngagement error:', err);
    showToast('Failed to open engagement');
  }
}

function getInitials(name) {
  if (!name) return '';
  var parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
//  BRD
// ============================================================

async function loadBRD(engId) {
  try {
    var res = await sb.from('brd_content').select('*').eq('engagement_id', engId);
    if (res.error) throw res.error;
    var rows = res.data || [];

    rows.forEach(function(row) {
      var content = row.content || {};
      if (row.section_key === 'overview') {
        renderOverview(content);
      } else if (row.section_key === 'objectives') {
        var sec = document.getElementById('sec-objectives');
        if (sec) sec.innerHTML = renderObjectives((content.items || []));
      } else if (row.section_key === 'delivery_plan') {
        var tbody = document.querySelector('#sec-delivery_plan .tbl tbody');
        if (tbody) tbody.innerHTML = renderDeliveryPlanRows((content.rows || []));
      } else if (row.section_key === 'success_metrics') {
        var tbody2 = document.querySelector('#sec-success_metrics .tbl tbody');
        if (tbody2) tbody2.innerHTML = renderSuccessMetricsRows((content.rows || []));
      }
    });
  } catch (err) {
    console.error('loadBRD error:', err);
    showToast('Failed to load BRD');
  }
}

function renderOverview(content) {
  var mapping = {
    'client': content.client,
    'champion': content.champion,
    'champion_title': content.champion_title,
    'exec_sponsor': content.exec_sponsor,
    'engagement_lead': content.engagement_lead,
    'fde_lead': content.fde_lead,
    'contract': content.contract,
    'start': content.start
  };
  // Update .ig-val cells that follow .ig-label with matching text
  document.querySelectorAll('.info-grid .ig-cell').forEach(function(cell) {
    var label = cell.querySelector('.ig-label');
    var val = cell.querySelector('.ig-val');
    if (!label || !val) return;
    var labelText = label.textContent.trim().toLowerCase().replace(/\s+/g, '_');
    if (mapping[labelText] !== undefined) {
      val.textContent = mapping[labelText] || '';
    }
  });
}

function renderObjectives(items) {
  var colors = ['#ff5203', '#0364ff', '#f7d241', '#ffc0f5'];
  return items.map(function(item, i) {
    var color = item.color || colors[i % colors.length];
    return [
      '<div class="obj-item">',
      '  <svg width="14" height="14" viewBox="0 0 14 14" style="flex-shrink:0;margin-top:5px;"><rect width="14" height="14" fill="' + escHtml(color) + '"/></svg>',
      '  <div>',
      '    <div class="obj-title">' + escHtml(item.title || '') + '</div>',
      '    <div class="obj-desc">' + escHtml(item.desc || '') + '</div>',
      '  </div>',
      '</div>'
    ].join('\n');
  }).join('\n');
}

function renderDeliveryPlanRows(rows) {
  var statusIconColors = {
    'status-done': '#7a6050',
    'status-inprog': '#0364ff',
    'status-planned': '#a89080',
    'status-watch': '#f7d241',
    'status-ontrack': '#ff5203'
  };

  return rows.map(function(row) {
    var cls = row.status_class || 'status-planned';
    var iconColor = statusIconColors[cls] || '#a89080';
    return [
      '<tr>',
      '  <td>' + escHtml(row.month || '') + '</td>',
      '  <td>' + escHtml(row.phase || '') + '</td>',
      '  <td>' + escHtml(row.activities || '') + '</td>',
      '  <td><span class="sts ' + escHtml(cls) + '"><svg width="10" height="10" viewBox="0 0 10 10"><rect width="10" height="10" fill="' + escHtml(iconColor) + '"/></svg>' + escHtml(row.status || '') + '</span></td>',
      '</tr>'
    ].join('\n');
  }).join('\n');
}

function renderSuccessMetricsRows(rows) {
  var statusIconColors = {
    'status-done': '#7a6050',
    'status-inprog': '#0364ff',
    'status-planned': '#a89080',
    'status-watch': '#f7d241',
    'status-ontrack': '#ff5203'
  };

  return rows.map(function(row) {
    var cls = row.status_class || 'status-planned';
    var iconColor = statusIconColors[cls] || '#a89080';
    return [
      '<tr>',
      '  <td>' + escHtml(row.metric || '') + '</td>',
      '  <td>' + escHtml(row.target || '') + '</td>',
      '  <td>' + escHtml(row.current || '') + '</td>',
      '  <td><span class="sts ' + escHtml(cls) + '"><svg width="10" height="10" viewBox="0 0 10 10"><rect width="10" height="10" fill="' + escHtml(iconColor) + '"/></svg>' + escHtml(row.status || '') + '</span></td>',
      '</tr>'
    ].join('\n');
  }).join('\n');
}

// ============================================================
//  BRD INLINE EDITING
// ============================================================

function enableSectionEdit(sectionKey) {
  var secEl = document.getElementById('sec-' + sectionKey);
  if (!secEl) return;

  // Save original HTML for cancel
  brdOriginalHtml[sectionKey] = secEl.innerHTML;

  // Update pencil button to cancel button
  var editBtn = document.querySelector('.sec-edit-btn[data-section="' + sectionKey + '"]');
  if (editBtn) {
    editBtn.innerHTML = '&#215;';
    editBtn.onclick = function() { cancelSectionEdit(sectionKey); };
  }

  if (sectionKey === 'objectives') {
    // Parse current obj-items to get data
    var items = [];
    secEl.querySelectorAll('.obj-item').forEach(function(item) {
      var svg = item.querySelector('svg rect');
      var color = svg ? svg.getAttribute('fill') : '#ff5203';
      var title = item.querySelector('.obj-title');
      var desc = item.querySelector('.obj-desc');
      items.push({
        color: color,
        title: title ? title.textContent : '',
        desc: desc ? desc.textContent : ''
      });
    });

    // Build edit form
    var formHtml = items.map(function(item, i) {
      return [
        '<div class="obj-edit-row" style="padding:12px 0;border-bottom:1px solid var(--rule2);">',
        '  <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">',
        '    <svg width="14" height="14" viewBox="0 0 14 14"><rect width="14" height="14" fill="' + escHtml(item.color) + '"/></svg>',
        '    <input class="obj-edit-title" data-index="' + i + '" data-color="' + escHtml(item.color) + '" type="text" value="' + escHtml(item.title) + '" style="flex:1;font-family:Inter,sans-serif;font-size:14px;font-weight:600;border:1px solid var(--rule2);background:var(--paper);padding:6px 10px;color:var(--ink);">',
        '  </div>',
        '  <textarea class="obj-edit-desc" data-index="' + i + '" rows="2" style="width:100%;font-family:Inter,sans-serif;font-size:14px;color:var(--ink2);background:var(--paper);border:1px solid var(--rule2);padding:6px 10px;line-height:1.65;resize:vertical;">' + escHtml(item.desc) + '</textarea>',
        '</div>'
      ].join('\n');
    }).join('\n');

    formHtml += '<div style="margin-top:12px;"><button class="btn btn-orange" onclick="saveSectionEdit(\'objectives\')">Save</button></div>';
    secEl.innerHTML = formHtml;

  } else if (sectionKey === 'delivery_plan') {
    var tbody = secEl.querySelector('.tbl tbody');
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(function(tr) {
      var cells = tr.querySelectorAll('td');
      // Make Phase (index 1) and Activities (index 2) contenteditable
      if (cells[1]) {
        cells[1].contentEditable = 'true';
        cells[1].style.outline = '1px solid var(--rule)';
        cells[1].style.background = 'rgba(255,82,3,.03)';
      }
      if (cells[2]) {
        cells[2].contentEditable = 'true';
        cells[2].style.outline = '1px solid var(--rule)';
        cells[2].style.background = 'rgba(255,82,3,.03)';
      }
    });
    var saveRow = document.createElement('div');
    saveRow.style.marginTop = '12px';
    saveRow.innerHTML = '<button class="btn btn-orange" onclick="saveSectionEdit(\'delivery_plan\')">Save</button>';
    secEl.appendChild(saveRow);

  } else if (sectionKey === 'success_metrics') {
    var tbody3 = secEl.querySelector('.tbl tbody');
    if (!tbody3) return;
    tbody3.querySelectorAll('tr').forEach(function(tr) {
      var cells = tr.querySelectorAll('td');
      // Make Current (index 2) contenteditable
      if (cells[2]) {
        cells[2].contentEditable = 'true';
        cells[2].style.outline = '1px solid var(--rule)';
        cells[2].style.background = 'rgba(255,82,3,.03)';
      }
    });
    var saveRow2 = document.createElement('div');
    saveRow2.style.marginTop = '12px';
    saveRow2.innerHTML = '<button class="btn btn-orange" onclick="saveSectionEdit(\'success_metrics\')">Save</button>';
    secEl.appendChild(saveRow2);
  }
}

async function saveSectionEdit(sectionKey) {
  var secEl = document.getElementById('sec-' + sectionKey);
  if (!secEl) return;

  var content = {};

  if (sectionKey === 'objectives') {
    var items = [];
    var titleInputs = secEl.querySelectorAll('.obj-edit-title');
    var descTextareas = secEl.querySelectorAll('.obj-edit-desc');
    titleInputs.forEach(function(input, i) {
      items.push({
        color: input.dataset.color || '#ff5203',
        title: input.value,
        desc: descTextareas[i] ? descTextareas[i].value : ''
      });
    });
    content = { items: items };

  } else if (sectionKey === 'delivery_plan') {
    var rows = [];
    var statusIconColors = {
      'status-done': '#7a6050',
      'status-inprog': '#0364ff',
      'status-planned': '#a89080',
      'status-watch': '#f7d241',
      'status-ontrack': '#ff5203'
    };
    secEl.querySelectorAll('.tbl tbody tr').forEach(function(tr) {
      var cells = tr.querySelectorAll('td');
      if (cells.length < 4) return;
      var statusSpan = cells[3].querySelector('.sts');
      var statusClass = '';
      var statusText = '';
      if (statusSpan) {
        statusClass = Array.from(statusSpan.classList).find(function(c) { return c !== 'sts'; }) || 'status-planned';
        statusText = statusSpan.textContent.trim();
      }
      rows.push({
        month: cells[0].textContent.trim(),
        phase: cells[1].textContent.trim(),
        activities: cells[2].textContent.trim(),
        status: statusText,
        status_class: statusClass
      });
    });
    content = { rows: rows };

  } else if (sectionKey === 'success_metrics') {
    var rows2 = [];
    secEl.querySelectorAll('.tbl tbody tr').forEach(function(tr) {
      var cells = tr.querySelectorAll('td');
      if (cells.length < 4) return;
      var statusSpan2 = cells[3].querySelector('.sts');
      var statusClass2 = '';
      var statusText2 = '';
      if (statusSpan2) {
        statusClass2 = Array.from(statusSpan2.classList).find(function(c) { return c !== 'sts'; }) || 'status-planned';
        statusText2 = statusSpan2.textContent.trim();
      }
      rows2.push({
        metric: cells[0].textContent.trim(),
        target: cells[1].textContent.trim(),
        current: cells[2].textContent.trim(),
        status: statusText2,
        status_class: statusClass2
      });
    });
    content = { rows: rows2 };
  }

  try {
    var res = await sb.from('brd_content').upsert({
      engagement_id: currentEngagementId,
      section_key: sectionKey,
      content: content,
      updated_at: new Date().toISOString()
    }, { onConflict: 'engagement_id,section_key' });
    if (res.error) throw res.error;

    showToast('Saved');

    // Re-render from saved data
    if (sectionKey === 'objectives') {
      secEl.innerHTML = renderObjectives(content.items || []);
    } else if (sectionKey === 'delivery_plan') {
      var tbody = secEl.querySelector('.tbl tbody');
      if (tbody) tbody.innerHTML = renderDeliveryPlanRows(content.rows || []);
    } else if (sectionKey === 'success_metrics') {
      var tbody2 = secEl.querySelector('.tbl tbody');
      if (tbody2) tbody2.innerHTML = renderSuccessMetricsRows(content.rows || []);
    }

    // Restore pencil button
    restoreEditBtn(sectionKey);
    delete brdOriginalHtml[sectionKey];

  } catch (err) {
    console.error('saveSectionEdit error:', err);
    showToast('Failed to save');
  }
}

function cancelSectionEdit(sectionKey) {
  var secEl = document.getElementById('sec-' + sectionKey);
  if (secEl && brdOriginalHtml[sectionKey] !== undefined) {
    secEl.innerHTML = brdOriginalHtml[sectionKey];
    delete brdOriginalHtml[sectionKey];
  }
  restoreEditBtn(sectionKey);
}

function restoreEditBtn(sectionKey) {
  var editBtn = document.querySelector('.sec-edit-btn[data-section="' + sectionKey + '"]');
  if (editBtn) {
    editBtn.innerHTML = '&#9998;';
    editBtn.onclick = function() { enableSectionEdit(sectionKey); };
  }
}

// ============================================================
//  ACTIVITIES
// ============================================================

async function loadActivities(engId) {
  try {
    var res = await sb.from('activities').select('*').eq('engagement_id', engId).order('activity_ts', { ascending: false });
    if (res.error) throw res.error;
    var activities = res.data || [];
    var feed = document.getElementById('comm-feed');
    if (!feed) return;

    var sourceColors = {
      'fireflies': '#ff5203',
      'slack': '#0364ff',
      'jira': '#f7d241',
      'loom': '#ffc0f5'
    };

    feed.innerHTML = activities.map(function(act) {
      var color = sourceColors[act.source] || '#a89080';
      var sourceLabel = act.source ? (act.source.charAt(0).toUpperCase() + act.source.slice(1)) : '';
      var isSelected = act.selected !== false;
      var excludedClass = isSelected ? '' : ' excluded';
      var checkedClass = isSelected ? ' checked' : '';

      return [
        '<div class="comm-item' + excludedClass + '">',
        '  <div class="comm-cb-wrap">',
        '    <div class="comm-cb' + checkedClass + '" onclick="toggleComm(this)">',
        '      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">',
        '        <path d="M1 4L3.5 6.5L9 1" stroke="#fcf3d9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
        '      </svg>',
        '    </div>',
        '  </div>',
        '  <div class="comm-icon">',
        '    <svg width="14" height="14" viewBox="0 0 14 14"><rect width="14" height="14" fill="' + escHtml(color) + '"/></svg>',
        '  </div>',
        '  <div class="comm-body">',
        '    <div class="comm-source">' + escHtml(sourceLabel) + (act.meta_text ? '  \u00b7  ' + escHtml(act.meta_text) : '') + '</div>',
        '    <div class="comm-headline">' + escHtml(act.headline || '') + '</div>',
        '    <div class="comm-text">' + escHtml(act.body_text || '') + '</div>',
        '  </div>',
        '</div>'
      ].join('\n');
    }).join('\n');

    updateCommCounter();
  } catch (err) {
    console.error('loadActivities error:', err);
    showToast('Failed to load activities');
  }
}

// ============================================================
//  REPORTS
// ============================================================

async function loadReports(engId, skipAutoLoad) {
  try {
    var res = await sb.from('report_versions').select('*')
      .eq('engagement_id', engId)
      .order('version_num', { ascending: false })
      .order('revision', { ascending: false });
    if (res.error) throw res.error;
    var reports = res.data || [];

    var history = document.querySelector('.report-history');
    if (history) {
      var header = history.querySelector('.rh-header');
      var headerHtml = header ? header.outerHTML : '<div class="rh-header">Report History</div>';
      history.innerHTML = headerHtml + renderReportHistory(reports);
    }

    if (!skipAutoLoad && reports.length > 0) {
      await loadReportVersion(reports[0].id);
    }
  } catch (err) {
    console.error('loadReports error:', err);
    showToast('Failed to load reports');
  }
}

function renderReportHistory(reports) {
  var groups = [];
  var groupMap = {};
  reports.forEach(function(r) {
    var vn = r.version_num;
    if (!groupMap[vn]) { groupMap[vn] = []; groups.push(vn); }
    groupMap[vn].push(r);
  });

  return groups.map(function(vn) {
    var revisions = groupMap[vn];
    var weekLabel = revisions[0].week_label || ('Week ' + vn);

    var revHtml = revisions.map(function(r) {
      var isDraft = r.status === 'draft';
      var chipClass = isDraft ? 'rh-chip draft' : 'rh-chip';
      var chipText = isDraft ? 'Draft' : 'Sent';
      var rev = r.revision || 1;
      var revLabel = rev === 1 ? 'v' + vn : 'v' + vn + '.' + (rev - 1);
      var note = r.revision_note ? escHtml(r.revision_note.slice(0, 52)) : '';
      return [
        '<div class="rh-item" onclick="loadReportVersion(\'' + r.id + '\')" data-id="' + r.id + '">',
        '  <div class="rh-item-main">',
        '    <div class="rh-rev">' + revLabel + '</div>',
        note ? '    <div class="rh-rev-note">' + note + '</div>' : '',
        '  </div>',
        '  <div class="rh-item-right">',
        '    <div class="' + chipClass + '">' + chipText + '</div>',
        '    <button class="rh-restore-btn btn" onclick="event.stopPropagation();restoreVersion(\'' + r.id + '\')">Restore</button>',
        '  </div>',
        '</div>'
      ].filter(Boolean).join('\n');
    }).join('\n');

    return [
      '<div class="rh-week-group">',
      '  <div class="rh-week-label">' + escHtml(weekLabel) + ' <span class="rh-rev-count">' + revisions.length + ' rev' + (revisions.length !== 1 ? 's' : '') + '</span></div>',
      revHtml,
      '</div>'
    ].join('\n');
  }).join('\n');
}

async function loadReportVersion(reportId) {
  try {
    if (reportDirty) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
    }

    var res = await sb.from('report_versions').select('*').eq('id', reportId).single();
    if (res.error) throw res.error;
    var report = res.data;

    currentReportId = reportId;
    currentVersionNum = report.version_num;
    currentReportData = report;
    reportDirty = false;
    updateDirtyBadge();

    // Update toolbar version info
    var infoEl = document.getElementById('rv-version-info');
    if (infoEl) {
      var isDraft = report.status === 'draft';
      infoEl.textContent = (report.week_label || ('Version ' + report.version_num))
        + '  \u00b7  ' + (isDraft ? 'Draft' : 'Sent')
        + (report.period_label ? '  \u00b7  ' + report.period_label : '');
    }

    // Mark active in sidebar
    document.querySelectorAll('.rh-item').forEach(function(item) { item.classList.remove('active'); });
    document.querySelectorAll('.rh-item').forEach(function(item) {
      if (item.getAttribute('data-id') === reportId) item.classList.add('active');
    });

    renderDocCanvas(report, report.content || {});

  } catch (err) {
    console.error('loadReportVersion error:', err);
    showToast('Failed to load report');
  }
}

// ============================================================
//  DOCUMENT CANVAS RENDERING
// ============================================================

function renderDocCanvas(report, content) {
  var paper = document.getElementById('doc-paper');
  if (!paper) return;
  paper.innerHTML = buildDocPaperHtml(report, content);
  wireTableCellEditors();
  wireListItemEditors();
  wireContentEditableTracking();
}

var DOC_ORN_RULE = '<svg class="orn-rule" height="18" viewBox="0 0 660 18" preserveAspectRatio="xMidYMid meet"><rect x="0" y="3" width="13" height="13" fill="#ff5203"/><rect x="18" y="3" width="13" height="13" fill="#0364ff"/><rect x="36" y="3" width="13" height="13" fill="#f7d241"/><rect x="54" y="3" width="13" height="13" fill="#ffc0f5"/><line x1="74" y1="9.5" x2="586" y2="9.5" stroke="#c0a070" stroke-width="1"/><rect x="590" y="3" width="13" height="13" fill="#ffc0f5"/><rect x="608" y="3" width="13" height="13" fill="#f7d241"/><rect x="626" y="3" width="13" height="13" fill="#0364ff"/><rect x="644" y="3" width="13" height="13" fill="#ff5203"/></svg>';

function statusBadge(status) {
  var cls = (status || '').toLowerCase().replace(/\s+/g, '-');
  return '<span class="status-badge ' + escHtml(cls) + '">' + escHtml(status || '') + '</span>';
}

function buildDocPaperHtml(report, content) {
  // Try to get engagement name from the DOM (breadcrumb/project header area)
  var projEl = document.querySelector('.proj-company');
  var engName = projEl ? projEl.firstChild.textContent.trim() : 'Engagement';

  // Doc header
  var docHeader = [
    '<div class="doc-header">',
    '  <div class="doc-eyebrow">Weekly Status Report &nbsp;&middot;&nbsp; Lab0 &times; ' + escHtml(engName) + '</div>',
    '  <div class="doc-week">' + escHtml(report.week_label || 'Report') + '</div>',
    report.period_label ? '  <div class="doc-period">' + escHtml(report.period_label) + '</div>' : '',
    '</div>'
  ].filter(Boolean).join('\n');

  // TL;DR — always contenteditable
  var tldrHtml = [
    '<div class="tldr" id="rv-tldr">',
    '  <span class="tldr-label">TL;DR</span>',
    '  <div class="tldr-body" contenteditable="true" data-field="tldr" spellcheck="true">' + escHtml(content.tldr || '') + '</div>',
    '</div>'
  ].join('\n');

  // Plan vs Actual — editable cells
  var planRows = (content.plan_vs_actual || []).map(function(row, i) {
    return [
      '<tr data-row="' + i + '">',
      '  <td class="editable-cell" data-col="committed">' + escHtml(row.committed || '') + '</td>',
      '  <td class="editable-cell status-cell" data-col="status">' + statusBadge(row.status || '') + '</td>',
      '  <td class="editable-cell" data-col="delta">' + escHtml(row.delta || '') + '</td>',
      '</tr>'
    ].join('\n');
  }).join('\n');

  var planSection = planRows ? [
    '<div class="subsec-hd">Plan vs. Actual</div>',
    '<div class="tbl"><table>',
    '  <thead><tr><th>Committed</th><th>Status</th><th>Delta</th></tr></thead>',
    '  <tbody id="rv-plan-tbody">' + planRows + '</tbody>',
    '</table></div>'
  ].join('\n') : '';

  // Activities — read-only
  var sourceBorderColors = { fireflies: '#ff5203', slack: '#0364ff', jira: '#ddb800', loom: '#c060b0' };
  var activitiesHtml = (content.activities || []).map(function(act) {
    var src = (act.source || '').toLowerCase();
    var borderColor = sourceBorderColors[src] || '#c0a070';
    var sourceLabel = act.source ? (act.source.charAt(0).toUpperCase() + act.source.slice(1)) : '';
    var loomHtml = act.loom_link ? ' <a class="loom-link" href="' + escHtml(act.loom_link) + '" target="_blank">Watch</a>' : '';
    return [
      '<div class="act-item" style="border-left-color:' + borderColor + '">',
      '  <div class="act-source-row">',
      '    <span class="source-pill ' + escHtml(src) + '">' + escHtml(sourceLabel) + '</span>',
      act.date ? '    <span class="act-date">' + escHtml(act.date) + '</span>' : '',
      '  </div>',
      '  <div class="act-text">' + escHtml(act.text || '') + loomHtml + '</div>',
      '</div>'
    ].filter(Boolean).join('\n');
  }).join('\n');

  var activitiesSection = activitiesHtml
    ? '<div class="subsec-hd mt-20">This Week\'s Activity</div><div class="act-list">' + activitiesHtml + '</div>'
    : '';

  // Deliverables — editable cells
  var delivRows = (content.deliverables || []).map(function(d, i) {
    return [
      '<tr data-row="' + i + '">',
      '  <td class="editable-cell" data-col="deliverable">' + escHtml(d.deliverable || '') + '</td>',
      '  <td class="editable-cell" data-col="type"><span class="type-chip">' + escHtml(d.type || '') + '</span></td>',
      '  <td class="editable-cell status-cell" data-col="status">' + statusBadge(d.status || '') + '</td>',
      '  <td class="editable-cell" data-col="owner">' + escHtml(d.owner || '') + '</td>',
      '  <td class="editable-cell ticket-cell" data-col="ticket">' + escHtml(d.ticket || '') + '</td>',
      '</tr>'
    ].join('\n');
  }).join('\n');

  var deliverablesSection = delivRows ? [
    '<div class="subsec-hd mt-20">Key Deliverables</div>',
    '<div class="tbl"><table>',
    '  <thead><tr><th>Deliverable</th><th>Type</th><th>Status</th><th>Owner</th><th>Ticket</th></tr></thead>',
    '  <tbody id="rv-deliv-tbody">' + delivRows + '</tbody>',
    '</table></div>'
  ].join('\n') : '';

  // Next Week — editable text spans
  var nextItems = (content.next_week || []).map(function(item, i) {
    return [
      '<div class="nxt-item" data-row="' + i + '">',
      '  <span class="nxt-num">' + (i + 1) + '.</span>',
      '  <div class="nxt-content">',
      '    <div class="nxt-text editable-text" data-col="text">' + escHtml(item.text || '') + '</div>',
      '    <div class="nxt-meta">',
      '      <span class="owner-pill editable-text" data-col="owner">' + escHtml(item.owner || '') + '</span>',
      item.date ? '      <span class="nxt-date editable-text" data-col="date">' + escHtml(item.date) + '</span>' : '',
      '    </div>',
      '  </div>',
      '</div>'
    ].filter(Boolean).join('\n');
  }).join('\n');

  var nextWeekSection = [
    '<div class="subsec-hd mt-20">Next Week\'s Commitments</div>',
    '<div id="rv-next-week">' + (nextItems || '<p style="font-size:14px;color:var(--ink4);padding:12px 0;">No commitments logged.</p>') + '</div>'
  ].join('\n');

  // Blockers — editable
  var blockersHtml = '';
  if (content.blockers && content.blockers.length > 0) {
    blockersHtml = content.blockers.map(function(b, i) {
      return '<div class="blocker-item editable-text" data-row="' + i + '">' + escHtml(b) + '</div>';
    }).join('\n');
  } else {
    blockersHtml = '<div class="no-blocker">No active blockers.</div>';
  }
  var blockersSection = '<div class="subsec-hd mt-20">Blockers</div>' + blockersHtml;

  // Champion note — always contenteditable
  var champNote = content.champion_note || '';
  var champLabel = content.champion_label || 'Champion Note';
  var champSection = [
    '<div class="champ" id="rv-champion-note">',
    '  <span class="champ-label">' + escHtml(champLabel) + '</span>',
    '  <div class="champ-body" contenteditable="true" data-field="champion_note" spellcheck="true">' + escHtml(champNote) + '</div>',
    '</div>'
  ].join('\n');

  return [
    docHeader,
    tldrHtml,
    DOC_ORN_RULE,
    planSection,
    activitiesSection,
    deliverablesSection,
    nextWeekSection,
    blockersSection,
    DOC_ORN_RULE,
    champSection
  ].filter(Boolean).join('\n');
}

// ============================================================
//  INLINE EDITING WIRING
// ============================================================

function wireTableCellEditors() {
  document.querySelectorAll('#doc-paper .editable-cell').forEach(function(cell) {
    cell.addEventListener('click', function() {
      if (cell.querySelector('input, select')) return;
      var col = cell.getAttribute('data-col');
      var isStatus = cell.classList.contains('status-cell');

      if (isStatus) {
        var current = cell.querySelector('.status-badge');
        var currentVal = current ? current.textContent.trim() : '';
        var statuses = ['Done', 'In Progress', 'Behind', 'Blocked', 'Planning', 'Live', 'Complete'];
        var sel = document.createElement('select');
        sel.className = 'inline-select';
        statuses.forEach(function(s) {
          var opt = document.createElement('option');
          opt.value = s; opt.textContent = s;
          if (s.toLowerCase() === currentVal.toLowerCase()) opt.selected = true;
          sel.appendChild(opt);
        });
        cell.innerHTML = '';
        cell.appendChild(sel);
        sel.focus();
        sel.addEventListener('change', function() { sel.blur(); });
        sel.addEventListener('blur', function() {
          cell.innerHTML = statusBadge(sel.value);
          markDirty();
        });
      } else {
        // For type-chip cells, get text from inside the chip
        var chip = cell.querySelector('.type-chip, .ticket-cell');
        var orig = chip ? chip.textContent.trim() : cell.textContent.trim();
        var inp = document.createElement('input');
        inp.className = 'inline-input';
        inp.type = 'text';
        inp.value = orig;
        cell.innerHTML = '';
        cell.appendChild(inp);
        inp.focus(); inp.select();
        inp.addEventListener('blur', function() {
          // Re-wrap type col in type-chip
          if (col === 'type') {
            cell.innerHTML = '<span class="type-chip">' + escHtml(inp.value) + '</span>';
          } else {
            cell.textContent = inp.value;
          }
          markDirty();
        });
        inp.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
          if (e.key === 'Escape') {
            if (col === 'type') {
              cell.innerHTML = '<span class="type-chip">' + escHtml(orig) + '</span>';
            } else {
              cell.textContent = orig;
            }
          }
        });
      }
    });
  });
}

function wireListItemEditors() {
  document.querySelectorAll('#doc-paper .editable-text').forEach(function(el) {
    el.addEventListener('click', function() {
      if (el.querySelector('input')) return;
      var orig = el.textContent.trim();
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'inline-input';
      inp.value = orig;
      el.innerHTML = '';
      el.appendChild(inp);
      inp.focus(); inp.select();
      inp.addEventListener('blur', function() { el.textContent = inp.value; markDirty(); });
      inp.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
        if (e.key === 'Escape') { el.textContent = orig; }
      });
    });
  });
}

function wireContentEditableTracking() {
  document.querySelectorAll('#doc-paper [contenteditable="true"]').forEach(function(el) {
    el.addEventListener('input', function() { markDirty(); });
  });
}

function markDirty() {
  reportDirty = true;
  updateDirtyBadge();
}

function updateDirtyBadge() {
  var b = document.getElementById('rv-dirty-badge');
  if (b) b.style.display = reportDirty ? 'inline-flex' : 'none';
}

// ============================================================
//  CONTENT SERIALIZER
// ============================================================

function collectDocContent() {
  var paper = document.getElementById('doc-paper');
  if (!paper) return {};

  function cellText(cell) {
    if (!cell) return '';
    var inp = cell.querySelector('input.inline-input');
    if (inp) return inp.value.trim();
    var sel = cell.querySelector('select.inline-select');
    if (sel) return sel.value;
    var badge = cell.querySelector('.status-badge');
    if (badge) return badge.textContent.trim();
    var chip = cell.querySelector('.type-chip');
    if (chip) return chip.textContent.trim();
    return cell.textContent.trim();
  }

  var tldrEl = paper.querySelector('[data-field="tldr"]');
  var tldr = tldrEl ? tldrEl.textContent.trim() : '';

  var planRows = [];
  paper.querySelectorAll('#rv-plan-tbody tr[data-row]').forEach(function(tr) {
    planRows.push({
      committed: cellText(tr.querySelector('[data-col="committed"]')),
      status:    cellText(tr.querySelector('[data-col="status"]')),
      delta:     cellText(tr.querySelector('[data-col="delta"]'))
    });
  });

  var activities = (currentReportData && currentReportData.content && currentReportData.content.activities) || [];

  var deliverables = [];
  paper.querySelectorAll('#rv-deliv-tbody tr[data-row]').forEach(function(tr) {
    deliverables.push({
      deliverable: cellText(tr.querySelector('[data-col="deliverable"]')),
      type:        cellText(tr.querySelector('[data-col="type"]')),
      status:      cellText(tr.querySelector('[data-col="status"]')),
      owner:       cellText(tr.querySelector('[data-col="owner"]')),
      ticket:      cellText(tr.querySelector('[data-col="ticket"]'))
    });
  });

  var next_week = [];
  paper.querySelectorAll('#rv-next-week .nxt-item[data-row]').forEach(function(item) {
    next_week.push({
      text:  cellText(item.querySelector('[data-col="text"]')),
      owner: cellText(item.querySelector('[data-col="owner"]')),
      date:  cellText(item.querySelector('[data-col="date"]')) || ''
    });
  });

  var blockers = [];
  paper.querySelectorAll('.blocker-item[data-row]').forEach(function(item) {
    var txt = cellText(item);
    if (txt) blockers.push(txt);
  });

  var champEl = paper.querySelector('[data-field="champion_note"]');
  var champion_note = champEl ? champEl.textContent.trim() : '';
  var champion_label = (currentReportData && currentReportData.content && currentReportData.content.champion_label) || 'Champion Note';

  return { tldr: tldr, plan_vs_actual: planRows, activities: activities, deliverables: deliverables, next_week: next_week, blockers: blockers, champion_note: champion_note, champion_label: champion_label };
}

// ============================================================
//  SAVE VERSION
// ============================================================

function openSaveModal() {
  if (!currentReportId) { showToast('No report loaded'); return; }
  var noteEl = document.getElementById('save-version-note');
  if (noteEl) noteEl.value = '';
  showModal('modal-save-version');
  setTimeout(function() { if (noteEl) noteEl.focus(); }, 50);
}

function hideSaveModal() {
  hideModal('modal-save-version');
}

async function confirmSaveVersion() {
  try {
    var note = (document.getElementById('save-version-note') || {}).value || '';
    var content = collectDocContent();

    var res = await sb.from('report_versions').select('*').eq('id', currentReportId).single();
    if (res.error) throw res.error;
    var current = res.data;

    var rRes = await sb.from('report_versions')
      .select('revision')
      .eq('engagement_id', current.engagement_id)
      .eq('version_num', current.version_num)
      .order('revision', { ascending: false })
      .limit(1);
    var nextRev = ((rRes.data && rRes.data.length > 0) ? (rRes.data[0].revision || 1) : 1) + 1;

    var ins = await sb.from('report_versions').insert({
      engagement_id: current.engagement_id,
      version_num:   current.version_num,
      week_label:    current.week_label,
      period_label:  current.period_label,
      content:       content,
      status:        current.status,
      revision:      nextRev,
      revision_note: note || 'Manual edit'
    }).select().single();
    if (ins.error) throw ins.error;

    hideSaveModal();
    currentReportId = ins.data.id;
    currentReportData = ins.data;
    reportDirty = false;
    updateDirtyBadge();
    var vn2 = current.version_num || 1;
    var revLabel2 = nextRev === 1 ? 'v' + vn2 : 'v' + vn2 + '.' + (nextRev - 1);
    showToast('Saved as ' + revLabel2);

    await loadReports(current.engagement_id, true);
    document.querySelectorAll('.rh-item').forEach(function(item) {
      if (item.getAttribute('data-id') === ins.data.id) item.classList.add('active');
    });

  } catch (err) {
    console.error('confirmSaveVersion error:', err);
    showToast('Failed to save');
  }
}

async function restoreVersion(reportId) {
  await loadReportVersion(reportId);
  markDirty();
  showToast('Restored. Click Save Version to create a new revision.');
}

// ============================================================
//  EXPORT
// ============================================================

function exportReportPdf() {
  window.print();
}

function exportReportHtml() {
  var paper = document.getElementById('doc-paper');
  if (!paper) { showToast('No report loaded'); return; }

  // Clone and clean up for export
  var clone = paper.cloneNode(true);

  clone.querySelectorAll('input.inline-input').forEach(function(inp) {
    inp.parentNode.replaceChild(document.createTextNode(inp.value), inp);
  });
  clone.querySelectorAll('select.inline-select').forEach(function(sel) {
    var cls = sel.value.toLowerCase().replace(/\s+/g, '-');
    var span = document.createElement('span');
    span.className = 'status-badge ' + cls;
    span.textContent = sel.value;
    sel.parentNode.replaceChild(span, sel);
  });
  clone.querySelectorAll('[contenteditable]').forEach(function(el) {
    el.removeAttribute('contenteditable');
    el.removeAttribute('spellcheck');
    el.removeAttribute('data-field');
  });
  clone.querySelectorAll('[data-col],[data-row]').forEach(function(el) {
    el.removeAttribute('data-col');
    el.removeAttribute('data-row');
  });

  var weekLabel = (currentReportData && currentReportData.week_label) || 'report';
  var clientSlug = 'report';
  var weekSlug = weekLabel.toLowerCase().replace(/\s+/g, '-');
  var filename = clientSlug + '-' + weekSlug + '.html';

  var inlineStyles = [
    ':root{font-size:16px;}',
    'body{background:#e8e0d4;font-family:Inter,Arial,sans-serif;margin:0;padding:40px 0;}',
    '.doc-paper{max-width:820px;margin:0 auto;background:#fcf3d9;padding:56px 64px;box-shadow:0 2px 24px rgba(0,0,0,.10);color:#1a0e08;}',
    '.doc-header{text-align:center;padding:0 0 32px;border-bottom:1.5px solid #c0a070;margin-bottom:32px;}',
    '.doc-eyebrow{font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#7d6255;margin-bottom:14px;}',
    '.doc-week{font-size:28px;font-weight:700;letter-spacing:-.02em;color:#1a0e08;margin-bottom:4px;}',
    '.doc-period{font-size:14px;color:#7a6050;margin-bottom:20px;}',
    '.tldr{border-left:4px solid #ff5203;background:rgba(255,82,3,.05);padding:14px 18px;margin-bottom:20px;}',
    '.tldr-label{font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#ff5203;display:block;margin-bottom:6px;}',
    '.tldr-body{font-size:14.5px;line-height:1.7;color:#3d2a1a;}',
    '.subsec-hd{font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#7a6050;padding-bottom:8px;border-bottom:1px solid #dcc8a8;margin:24px 0 12px;}',
    '.mt-20{margin-top:20px;}',
    '.tbl table{width:100%;border-collapse:collapse;font-size:13.5px;}',
    '.tbl th{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7a6050;padding:7px 10px;border-bottom:1.5px solid #c0a070;text-align:left;}',
    '.tbl td{padding:9px 10px;border-bottom:1px solid #dcc8a8;color:#3d2a1a;vertical-align:top;}',
    '.status-badge{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:0;}',
    '.status-badge.done,.status-badge.live,.status-badge.complete{background:#dcfce7;color:#15692e;}',
    '.status-badge.in-progress{background:#dbeafe;color:#0347b0;}',
    '.status-badge.behind{background:#ffedd5;color:#b83000;}',
    '.status-badge.blocked{background:#fee2e2;color:#991b1b;}',
    '.status-badge.planning{background:#f3f4f6;color:#374151;}',
    '.type-chip{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border:1px solid #dcc8a8;color:#7a6050;}',
    '.ticket-cell{font-family:monospace;font-size:11.5px;color:#7d6255;}',
    '.act-list{margin:0;}',
    '.act-item{padding:12px 0 12px 14px;border-left:3px solid #c0a070;margin-bottom:10px;}',
    '.act-source-row{display:flex;gap:8px;margin-bottom:5px;align-items:center;}',
    '.source-pill{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:2px 6px;border-radius:2px;background:#f3f4f6;color:#374151;}',
    '.source-pill.slack{background:#dbeafe;color:#0364ff;}',
    '.source-pill.jira{background:#fef9c3;color:#6b5200;}',
    '.source-pill.fireflies{background:#ffedd5;color:#b83000;}',
    '.source-pill.loom{background:#fdf4ff;color:#7a1f6a;}',
    '.act-date{font-size:11px;color:#7d6255;}',
    '.act-text{font-size:13.5px;color:#3d2a1a;line-height:1.55;}',
    '.nxt-item{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #dcc8a8;align-items:flex-start;}',
    '.nxt-num{font-size:13px;font-weight:700;color:#7a6050;flex-shrink:0;padding-top:1px;}',
    '.nxt-content{flex:1;}',
    '.nxt-text{font-size:14px;color:#3d2a1a;margin-bottom:4px;}',
    '.nxt-meta{display:flex;gap:8px;align-items:center;}',
    '.owner-pill{font-size:11px;font-weight:600;background:#f3f4f6;color:#3d2a1a;padding:2px 8px;}',
    '.nxt-date{font-size:11px;color:#7d6255;}',
    '.blocker-item{background:rgba(153,27,27,.04);border-left:3px solid #991b1b;padding:10px 14px;margin-bottom:8px;font-size:14px;color:#3d2a1a;}',
    '.no-blocker{padding:12px 14px;background:rgba(247,210,65,.1);border-left:3px solid #f7d241;font-size:14px;color:#3d2a1a;}',
    '.champ{border-left:4px solid #c060b0;padding:16px 20px;background:rgba(192,96,176,.04);margin-top:20px;}',
    '.champ-label{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#c060b0;display:block;margin-bottom:10px;}',
    '.champ-body{font-size:14.5px;line-height:1.7;color:#3d2a1a;}',
    '.orn-rule{display:block;width:100%;margin:20px 0;}'
  ].join('\n');

  var fullHtml = [
    '<!DOCTYPE html><html lang="en"><head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">',
    '<title>' + escHtml(weekLabel) + ' Status Report</title>',
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">',
    '<style>' + inlineStyles + '</style>',
    '</head><body>',
    '<div class="doc-paper">',
    clone.innerHTML,
    '</div>',
    '</body></html>'
  ].join('\n');

  var blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  showToast('Exported ' + filename);
}

// ============================================================
//  AI REPORT GENERATION + EDITING
// ============================================================

async function generateReport() {
  if (!currentEngagementId) { showToast('No engagement open'); return; }

  // Collect selected activity items from DOM
  var selectedItems = document.querySelectorAll('#comm-feed .comm-item:not(.excluded)');
  var activities = Array.from(selectedItems).map(function(el) {
    var sourceEl = el.querySelector('.comm-source');
    var headlineEl = el.querySelector('.comm-headline');
    var textEl = el.querySelector('.comm-text');
    // source label includes meta_text after bullet, strip it for a clean label
    var sourceRaw = sourceEl ? sourceEl.textContent : '';
    var source = sourceRaw.split('\u00b7')[0].trim().toLowerCase();
    return {
      source: source,
      headline: headlineEl ? headlineEl.textContent.trim() : '',
      body_text: textEl ? textEl.textContent.trim() : ''
    };
  });

  try {
    // Fetch engagement
    var engRes = await sb.from('engagements').select('*').eq('id', currentEngagementId).single();
    if (engRes.error) throw engRes.error;
    var engagement = engRes.data;

    // Fetch BRD sections (exclude overview for report context)
    var brdRes = await sb.from('brd_content').select('*').eq('engagement_id', currentEngagementId);
    if (brdRes.error) throw brdRes.error;
    var brd = {};
    (brdRes.data || []).forEach(function(row) { brd[row.section_key] = row.content; });

    // Get next version number
    var vRes = await sb.from('report_versions')
      .select('version_num')
      .eq('engagement_id', currentEngagementId)
      .order('version_num', { ascending: false })
      .limit(1);
    var lastVersion = (vRes.data && vRes.data.length > 0) ? vRes.data[0].version_num : 0;
    var nextVersion = lastVersion + 1;

    var now = new Date();
    var weekLabel = 'Week ' + nextVersion;
    var periodLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + now.getFullYear();

    // Fetch last 2 sent weeks as context for Claude
    var priorRes = await sb.from('report_versions')
      .select('version_num, week_label, content, revision')
      .eq('engagement_id', currentEngagementId)
      .eq('status', 'sent')
      .order('version_num', { ascending: false })
      .order('revision', { ascending: false });
    var seenWeeks = {};
    var priorReports = [];
    (priorRes.data || []).forEach(function(r) {
      if (!seenWeeks[r.version_num] && priorReports.length < 2) {
        seenWeeks[r.version_num] = true;
        priorReports.push({ week: r.week_label || ('Week ' + r.version_num), tldr: (r.content || {}).tldr || '' });
      }
    });

    // Show skeleton while generating
    var docPaper = document.getElementById('doc-paper');
    var docSkeleton = document.getElementById('doc-skeleton');
    if (docPaper) docPaper.style.display = 'none';
    if (docSkeleton) docSkeleton.style.display = 'block';
    showToast('Generating with Claude...');

    var resp = await fetch('http://localhost:3001/api/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engagement: engagement, brd: brd, activities: activities, weekLabel: weekLabel, periodLabel: periodLabel, priorReports: priorReports })
    });
    if (!resp.ok) throw new Error('Server returned ' + resp.status);
    var data = await resp.json();
    if (data.error) throw new Error(data.error);

    // Save as new draft report version (revision 1 — fresh week)
    var ins = await sb.from('report_versions').insert({
      engagement_id: currentEngagementId,
      version_num: nextVersion,
      week_label: weekLabel,
      period_label: periodLabel,
      content: data.content,
      status: 'draft',
      revision: 1,
      revision_note: 'Generated by Claude'
    });
    if (ins.error) throw ins.error;

    showToast('Report generated');

    // Navigate to reports and load new version
    goTo('view-reports');
    setActiveTab('reports');
    if (docSkeleton) docSkeleton.style.display = 'none';
    if (docPaper) docPaper.style.display = 'block';
    await loadReports(currentEngagementId);

  } catch (err) {
    console.error('generateReport error:', err);
    var docPaper2 = document.getElementById('doc-paper');
    var docSkeleton2 = document.getElementById('doc-skeleton');
    if (docSkeleton2) docSkeleton2.style.display = 'none';
    if (docPaper2) docPaper2.style.display = 'block';
    showToast('Generation failed: ' + err.message);
  }
}

async function editWithAI() {
  if (!currentReportId) { showToast('No report loaded'); return; }

  var promptEl = document.getElementById('rv-ai-prompt');
  if (!promptEl || !promptEl.value.trim()) { showToast('Enter a prompt first'); return; }
  var userPrompt = promptEl.value.trim();

  var submitBtn = document.querySelector('.rv-ai-submit');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Editing...'; }

  try {
    // Fetch current row
    var res = await sb.from('report_versions').select('*').eq('id', currentReportId).single();
    if (res.error) throw res.error;
    var current = res.data;

    // Fetch all revisions of this week for context (most recent first)
    var histRes = await sb.from('report_versions')
      .select('revision, revision_note, content')
      .eq('engagement_id', current.engagement_id)
      .eq('version_num', current.version_num)
      .order('revision', { ascending: false });
    var revisionHistory = (histRes.data || []).map(function(r) {
      return {
        revision: r.revision || 1,
        note: r.revision_note || '',
        tldr: (r.content || {}).tldr || ''
      };
    });

    var nextRev = (revisionHistory.length > 0 ? (revisionHistory[0].revision || 1) : 1) + 1;

    showToast('Editing with Claude...');

    var resp = await fetch('http://localhost:3001/api/edit-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: current.content, prompt: userPrompt, revisionHistory: revisionHistory })
    });
    if (!resp.ok) throw new Error('Server returned ' + resp.status);
    var data = await resp.json();
    if (data.error) throw new Error(data.error);

    // Insert as new revision
    var ins = await sb.from('report_versions').insert({
      engagement_id: current.engagement_id,
      version_num: current.version_num,
      week_label: current.week_label,
      period_label: current.period_label,
      content: data.content,
      status: 'draft',
      revision: nextRev,
      revision_note: userPrompt.slice(0, 80)
    }).select().single();
    if (ins.error) throw ins.error;

    var vn3 = current.version_num || 1;
    showToast('Saved as ' + (nextRev === 1 ? 'v' + vn3 : 'v' + vn3 + '.' + (nextRev - 1)));
    closeAiBar();
    currentReportId = ins.data.id;
    await loadReports(current.engagement_id, true);
    await loadReportVersion(ins.data.id);

  } catch (err) {
    console.error('editWithAI error:', err);
    showToast('Edit failed: ' + err.message);
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Edit with AI'; }
  }
}

function openAiBar() {
  var bar = document.getElementById('rv-ai-bar');
  if (bar) { bar.style.display = 'flex'; }
  var ta = document.getElementById('rv-ai-prompt');
  if (ta) { ta.value = ''; ta.focus(); }
}

function closeAiBar() {
  var bar = document.getElementById('rv-ai-bar');
  if (bar) { bar.style.display = 'none'; }
}

// ============================================================
//  INTEGRATIONS
// ============================================================

var INT_FIELDS = {
  slack:      ['channel', 'channel-id', 'webhook'],
  jira:       ['project-key', 'workspace'],
  loom:       ['workspace', 'folder'],
  fireflies:  ['keywords', 'email']
};

async function loadProjectIntegrations(engId) {
  if (!engId) return;
  try {
    var res = await sb.from('project_integrations').select('*').eq('engagement_id', engId);
    if (res.error) throw res.error;

    // Clear all status badges to "Not configured"
    ['slack', 'jira', 'loom', 'fireflies'].forEach(function(svc) {
      var badge = document.getElementById('int-status-' + svc);
      if (badge) { badge.textContent = 'Not configured'; badge.classList.remove('configured'); }
    });

    (res.data || []).forEach(function(row) {
      var svc = row.service;
      var cfg = row.config || {};

      // Populate fields
      var fields = INT_FIELDS[svc] || [];
      fields.forEach(function(field) {
        var el = document.getElementById('int-' + svc + '-' + field);
        if (el && cfg[field]) el.value = cfg[field];
      });

      // Update status badge
      var badge = document.getElementById('int-status-' + svc);
      if (badge) { badge.textContent = 'Configured'; badge.classList.add('configured'); }
    });
  } catch (err) {
    console.error('loadProjectIntegrations error:', err);
  }
}

async function saveIntegration(service) {
  if (!currentEngagementId) { showToast('No engagement open'); return; }

  var fields = INT_FIELDS[service] || [];
  var config = {};
  fields.forEach(function(field) {
    var el = document.getElementById('int-' + service + '-' + field);
    if (el && el.value.trim()) config[field] = el.value.trim();
  });

  try {
    var res = await sb.from('project_integrations').upsert({
      engagement_id: currentEngagementId,
      service: service,
      config: config,
      status: 'configured'
    }, { onConflict: 'engagement_id,service' });
    if (res.error) throw res.error;

    var badge = document.getElementById('int-status-' + service);
    if (badge) { badge.textContent = 'Configured'; badge.classList.add('configured'); }
    showToast(service.charAt(0).toUpperCase() + service.slice(1) + ' saved');
  } catch (err) {
    console.error('saveIntegration error:', err);
    showToast('Failed to save integration');
  }
}

// ============================================================
//  INBOX
// ============================================================

var SOURCE_COLORS = { slack: 'var(--B)', jira: 'var(--Y)', loom: 'var(--P)', fireflies: 'var(--O)', document: 'var(--ink3)', email: 'var(--ink3)', meeting_notes: 'var(--O)', other: 'var(--ink4)' };

async function loadInbox(engId) {
  if (!engId) return;
  try {
    var res = await sb.from('inbox_items').select('*').eq('engagement_id', engId).order('created_at', { ascending: false });
    if (res.error) throw res.error;
    renderInboxList(res.data || []);
  } catch (err) {
    console.error('loadInbox error:', err);
    showToast('Failed to load inbox');
  }
}

function renderInboxList(items) {
  var list = document.getElementById('inbox-list');
  var empty = document.getElementById('inbox-empty');
  if (!list) return;

  if (items.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  var html = items.map(function(item) {
    var color = SOURCE_COLORS[item.source_label] || 'var(--ink3)';
    var sourceLabel = (item.source_label || 'document').replace('_', ' ');
    var excerpt = (item.body || '').slice(0, 140).trim();
    if (item.body && item.body.length > 140) excerpt += '...';
    var date = item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

    return [
      '<div class="inbox-item" id="inbox-item-' + item.id + '">',
      '  <div class="inbox-item-header">',
      '    <span class="inbox-source-badge" style="background:' + color + '">' + escHtml(sourceLabel) + '</span>',
      '    <span class="inbox-item-title">' + escHtml(item.title || 'Untitled') + '</span>',
      '    <span class="inbox-item-date">' + date + '</span>',
      '  </div>',
      '  <div class="inbox-excerpt">' + escHtml(excerpt) + '</div>',
      '  <div class="inbox-item-actions">',
      '    <button class="btn btn-orange inbox-extract-btn" onclick="extractToActivity(\'' + item.id + '\')">Extract to Activity</button>',
      '    <button class="btn inbox-delete-btn" onclick="deleteInboxItem(\'' + item.id + '\')">Remove</button>',
      '  </div>',
      '</div>'
    ].join('\n');
  }).join('\n');

  list.innerHTML = (document.getElementById('inbox-empty') ? '' : '') + html;
}

async function addToInbox() {
  if (!currentEngagementId) { showToast('No engagement open'); return; }

  var source = document.getElementById('inbox-source');
  var titleEl = document.getElementById('inbox-title');
  var bodyEl = document.getElementById('inbox-body');

  var body = bodyEl ? bodyEl.value.trim() : '';
  if (!body) { showToast('Paste some content first'); return; }

  try {
    var res = await sb.from('inbox_items').insert({
      engagement_id: currentEngagementId,
      title: titleEl ? titleEl.value.trim() : '',
      body: body,
      source_label: source ? source.value : 'document'
    });
    if (res.error) throw res.error;

    // Clear form
    if (bodyEl) bodyEl.value = '';
    if (titleEl) titleEl.value = '';

    showToast('Added to inbox');
    await loadInbox(currentEngagementId);
  } catch (err) {
    console.error('addToInbox error:', err);
    showToast('Failed to add item');
  }
}

async function extractToActivity(itemId) {
  try {
    var itemRes = await sb.from('inbox_items').select('*').eq('id', itemId).single();
    if (itemRes.error) throw itemRes.error;
    var item = itemRes.data;

    var engRes = await sb.from('engagements').select('name').eq('id', currentEngagementId).single();
    var engName = engRes.data ? engRes.data.name : '';

    var btn = document.querySelector('#inbox-item-' + itemId + ' .inbox-extract-btn');
    if (btn) { btn.textContent = 'Extracting...'; btn.disabled = true; }

    var resp = await fetch('http://localhost:3001/api/extract-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: item.title, body: item.body, source_label: item.source_label, engagementName: engName })
    });
    if (!resp.ok) throw new Error('Server returned ' + resp.status);
    var data = await resp.json();
    if (data.error) throw new Error(data.error);

    var items = data.items || [];
    if (items.length === 0) { showToast('No activity items found'); return; }

    // Insert extracted items into activities table
    var rows = items.map(function(a) {
      return {
        engagement_id: currentEngagementId,
        source: a.source || item.source_label || 'document',
        headline: a.headline || '',
        body_text: a.body_text || '',
        meta_text: a.meta_text || '',
        selected: true,
        activity_ts: new Date().toISOString()
      };
    });

    var ins = await sb.from('activities').insert(rows);
    if (ins.error) throw ins.error;

    showToast(items.length + ' item' + (items.length !== 1 ? 's' : '') + ' added to Activity');

    // Reload activities if on that tab
    if (currentEngagementId) await loadActivities(currentEngagementId);

  } catch (err) {
    console.error('extractToActivity error:', err);
    showToast('Extraction failed: ' + err.message);
    var btn = document.querySelector('#inbox-item-' + itemId + ' .inbox-extract-btn');
    if (btn) { btn.textContent = 'Extract to Activity'; btn.disabled = false; }
  }
}

async function deleteInboxItem(itemId) {
  try {
    var res = await sb.from('inbox_items').delete().eq('id', itemId);
    if (res.error) throw res.error;
    var el = document.getElementById('inbox-item-' + itemId);
    if (el) el.remove();
    var remaining = document.querySelectorAll('#inbox-list .inbox-item');
    if (remaining.length === 0) {
      var empty = document.getElementById('inbox-empty');
      if (empty) empty.style.display = 'block';
    }
  } catch (err) {
    console.error('deleteInboxItem error:', err);
    showToast('Failed to remove item');
  }
}

// ============================================================
//  USER CONTROL
// ============================================================

async function loadUserSettings() {
  try {
    var res = await sb.from('user_settings').select('*').limit(1).single();
    if (res.error && res.error.code !== 'PGRST116') throw res.error;
    var settings = res.data || {};

    var promptTa = document.getElementById('master-prompt-textarea');
    if (promptTa) promptTa.value = settings.master_prompt || '';

    var tmpl = document.getElementById('default-template');
    if (tmpl && settings.report_template) tmpl.value = settings.report_template;

    var delivery = document.getElementById('default-delivery');
    if (delivery && settings.delivery_method) delivery.value = settings.delivery_method;

    var cadence = document.getElementById('default-cadence');
    if (cadence && settings.cadence) cadence.value = settings.cadence;

    await Promise.all([loadTeamMembers(), loadIntegrations()]);
  } catch (err) {
    console.error('loadUserSettings error:', err);
    showToast('Failed to load settings');
  }
}

async function saveUserSettings() {
  try {
    var promptTa = document.getElementById('master-prompt-textarea');
    var tmpl = document.getElementById('default-template');
    var delivery = document.getElementById('default-delivery');
    var cadence = document.getElementById('default-cadence');

    var payload = {
      master_prompt: promptTa ? promptTa.value : '',
      report_template: tmpl ? tmpl.value : '',
      delivery_method: delivery ? delivery.value : '',
      cadence: cadence ? cadence.value : ''
    };

    var res = await sb.from('user_settings').upsert(payload);
    if (res.error) throw res.error;

    showToast('Settings saved');
  } catch (err) {
    console.error('saveUserSettings error:', err);
    showToast('Failed to save settings');
  }
}

async function loadTeamMembers() {
  try {
    var res = await sb.from('team_members').select('*').order('created_at');
    if (res.error) throw res.error;
    var members = res.data || [];
    var tbody = document.getElementById('team-members-tbody');
    if (!tbody) return;

    tbody.innerHTML = members.map(function(m) {
      var initials = m.avatar_initials || getInitials(m.name);
      var bgColor = m.avatar_color || '#ff5203';
      return [
        '<tr>',
        '  <td><div style="display:flex;align-items:center;gap:10px;">',
        '    <div class="team-badge" style="background:' + escHtml(bgColor) + ';">' + escHtml(initials) + '</div>',
        '    ' + escHtml(m.name || '') +
        '  </div></td>',
        '  <td>' + escHtml(m.email || '') + '</td>',
        '  <td>' + escHtml(m.role || '') + '</td>',
        '</tr>'
      ].join('\n');
    }).join('\n');
  } catch (err) {
    console.error('loadTeamMembers error:', err);
    showToast('Failed to load team members');
  }
}

async function saveTeamMember() {
  var nameEl = document.getElementById('new-member-name');
  var emailEl = document.getElementById('new-member-email');
  var roleEl = document.getElementById('new-member-role');

  var name = nameEl ? nameEl.value.trim() : '';
  var email = emailEl ? emailEl.value.trim() : '';
  var role = roleEl ? roleEl.value.trim() : '';

  if (!name || !email) {
    showToast('Name and email are required');
    return;
  }

  try {
    var res = await sb.from('team_members').insert({
      name: name,
      email: email,
      role: role,
      avatar_initials: getInitials(name)
    });
    if (res.error) throw res.error;

    if (nameEl) nameEl.value = '';
    if (emailEl) emailEl.value = '';
    if (roleEl) roleEl.value = '';

    await loadTeamMembers();
    showToast('Member added');
  } catch (err) {
    console.error('saveTeamMember error:', err);
    showToast('Failed to add member');
  }
}

async function loadIntegrations() {
  try {
    var res = await sb.from('integration_settings').select('*').order('service');
    if (res.error) throw res.error;
    var integrations = res.data || [];

    var grid = document.getElementById('integrations-grid');
    if (!grid) return;

    var serviceLabels = {
      'fireflies': 'Fireflies',
      'jira': 'Jira',
      'slack': 'Slack',
      'loom': 'Loom'
    };
    var serviceColors = {
      'fireflies': '#ff5203',
      'jira': '#f7d241',
      'slack': '#0364ff',
      'loom': '#ffc0f5'
    };

    grid.innerHTML = integrations.map(function(int) {
      var label = serviceLabels[int.service] || int.service;
      var color = serviceColors[int.service] || '#a89080';
      var isConnected = int.status === 'connected';
      var statusBadge = isConnected
        ? '<span style="font-family:Inter,sans-serif;font-size:9px;font-weight:600;letter-spacing:.08em;color:#2a7a2a;background:rgba(42,122,42,.1);border:1px solid rgba(42,122,42,.3);padding:2px 8px;">Connected</span>'
        : '<span style="font-family:Inter,sans-serif;font-size:9px;font-weight:600;letter-spacing:.08em;color:var(--ink4);border:1px solid var(--rule2);padding:2px 8px;">Not Connected</span>';
      var connectedSince = isConnected && int.connected_since
        ? '<div style="font-size:12px;color:var(--ink4);margin-top:4px;">Since ' + escHtml(new Date(int.connected_since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })) + '</div>'
        : '';
      return [
        '<div class="uc-int-card" style="border:1px solid var(--rule);padding:16px 18px;">',
        '  <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">',
        '    <svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="' + escHtml(color) + '"/></svg>',
        '    <span style="font-size:15px;font-weight:600;color:var(--ink);">' + escHtml(label) + '</span>',
        '  </div>',
        '  ' + statusBadge,
        '  ' + connectedSince,
        '</div>'
      ].join('\n');
    }).join('\n');
  } catch (err) {
    console.error('loadIntegrations error:', err);
    showToast('Failed to load integrations');
  }
}

async function saveEngagementDefaults() {
  try {
    var tmpl = document.getElementById('default-template');
    var delivery = document.getElementById('default-delivery');
    var cadence = document.getElementById('default-cadence');

    var payload = {
      report_template: tmpl ? tmpl.value : '',
      delivery_method: delivery ? delivery.value : '',
      cadence: cadence ? cadence.value : ''
    };

    var res = await sb.from('user_settings').upsert(payload);
    if (res.error) throw res.error;

    showToast('Defaults saved');
  } catch (err) {
    console.error('saveEngagementDefaults error:', err);
    showToast('Failed to save defaults');
  }
}

// ============================================================
//  INIT
// ============================================================

document.addEventListener('DOMContentLoaded', async function() {
  goTo('view-admin');
  await loadEngagements();

  // Filter chip toggle (visual)
  document.querySelectorAll('#view-comms .chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      document.querySelectorAll('#view-comms .chip').forEach(function(c) {
        c.classList.remove('active');
      });
      chip.classList.add('active');
    });
  });

  // Gear button -> user control
  var gear = document.querySelector('.gear-btn');
  if (gear) gear.onclick = function() { goTo('view-user-control'); };

  // Wire up BRD edit buttons if present
  document.querySelectorAll('.sec-edit-btn[data-section]').forEach(function(btn) {
    var section = btn.dataset.section;
    btn.onclick = function() { enableSectionEdit(section); };
  });

  // Wire up user control save buttons if present
  var saveSettingsBtn = document.getElementById('save-settings-btn');
  if (saveSettingsBtn) saveSettingsBtn.onclick = saveUserSettings;

  var saveDefaultsBtn = document.getElementById('save-defaults-btn');
  if (saveDefaultsBtn) saveDefaultsBtn.onclick = saveEngagementDefaults;

  var addMemberBtn = document.getElementById('add-member-btn');
  if (addMemberBtn) addMemberBtn.onclick = saveTeamMember;

  updateCommCounter();
});
