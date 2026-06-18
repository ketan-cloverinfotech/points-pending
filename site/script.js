const STORAGE_KEY = 'status-mail-builder-ai-v2';

const state = {
  subject: 'Application Status Update',
  heading: 'Application Status Update',
  greeting: 'Hi Team,',
  intro: 'Please find the current status below.',
  closing: 'Regards,\nKetan',
  aiEndpoint: '',
  aiModel: 'gpt-5.4-mini',
  aiEffort: 'medium',
  points: []
};

const samplePoints = [
  {
    status: 'completed',
    title: 'Certificate Status on Server',
    action: 'Status: Completed on both UAT and PROD server',
    details: 'Certificate status validation has been completed. Current backend services are communicating over HTTP as per existing setup.'
  },
  {
    status: 'hold',
    title: 'Actual K8s Cluster Overview',
    action: "Sandeep Pal did not explain the AKS cluster and configuration, which is required for the upgrade activity.",
    details: 'Cluster configuration details are required because the client has requested the Kubernetes version upgrade.'
  },
  {
    status: 'pending',
    title: 'VPN Access for Support Team (AMC)',
    action: 'Action Required: Provide VPN credentials. Pending from KBL team.',
    details: 'VPN access is required for the support team to perform AMC activities. Please arrange VPN credentials and connectivity for the designated support personnel.'
  }
];

const els = {
  subject: document.getElementById('mailSubject'),
  heading: document.getElementById('mailHeading'),
  greeting: document.getElementById('greeting'),
  intro: document.getElementById('introText'),
  closing: document.getElementById('closingText'),
  aiEndpoint: document.getElementById('aiEndpoint'),
  aiModel: document.getElementById('aiModel'),
  aiEffort: document.getElementById('aiEffort'),
  pointsEditor: document.getElementById('pointsEditor'),
  preview: document.getElementById('mailPreview'),
  addPointBtn: document.getElementById('addPointBtn'),
  copyHtmlBtn: document.getElementById('copyHtmlBtn'),
  copyTextBtn: document.getElementById('copyTextBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  openMailBtn: document.getElementById('openMailBtn'),
  loadSampleBtn: document.getElementById('loadSampleBtn'),
  clearBtn: document.getElementById('clearBtn'),
  saveAiSettingsBtn: document.getElementById('saveAiSettingsBtn'),
  enhanceAllBtn: document.getElementById('enhanceAllBtn'),
  copyStatus: document.getElementById('copyStatus'),
  pointTemplate: document.getElementById('pointTemplate')
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function nl2br(value = '') {
  return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    state.points = structuredClone(samplePoints);
    return;
  }

  try {
    const parsed = JSON.parse(stored);
    Object.assign(state, parsed);
    if (!Array.isArray(state.points) || state.points.length === 0) {
      state.points = structuredClone(samplePoints);
    }
    if (!state.aiModel) state.aiModel = 'gpt-5.4-mini';
    if (!['none', 'low', 'medium', 'high', 'xhigh'].includes(state.aiEffort)) state.aiEffort = 'medium';
  } catch {
    state.points = structuredClone(samplePoints);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function syncInputsFromState() {
  els.subject.value = state.subject || '';
  els.heading.value = state.heading || '';
  els.greeting.value = state.greeting || '';
  els.intro.value = state.intro || '';
  els.closing.value = state.closing || '';
  els.aiEndpoint.value = state.aiEndpoint || '';
  els.aiModel.value = state.aiModel || 'gpt-5.4-mini';
  els.aiEffort.value = state.aiEffort || 'medium';
}

function syncStateFromInputs() {
  state.subject = els.subject.value.trim();
  state.heading = els.heading.value.trim();
  state.greeting = els.greeting.value.trim();
  state.intro = els.intro.value.trim();
  state.closing = els.closing.value.trim();
  state.aiEndpoint = els.aiEndpoint.value.trim();
  state.aiModel = els.aiModel.value.trim() || 'gpt-5.4-mini';
  state.aiEffort = els.aiEffort.value.trim() || 'medium';
}

function addPoint(point = { status: 'completed', title: '', action: '', details: '' }) {
  state.points.push(point);
  renderEditor();
  renderPreview();
  saveState();
}

function removePoint(index) {
  state.points.splice(index, 1);
  renderEditor();
  renderPreview();
  saveState();
}

function setButtonsLoading(isLoading, label = 'Enhancing...') {
  document.querySelectorAll('.enhance-point').forEach(btn => {
    btn.disabled = isLoading;
    btn.textContent = isLoading ? label : '✨ Enhance from AI';
  });
  els.enhanceAllBtn.disabled = isLoading;
  els.enhanceAllBtn.textContent = isLoading ? label : 'Enhance all points with AI';
}

function renderEditor() {
  els.pointsEditor.innerHTML = '';

  state.points.forEach((point, index) => {
    const node = els.pointTemplate.content.cloneNode(true);
    const card = node.querySelector('.point-card');
    const status = node.querySelector('.status-select');
    const title = node.querySelector('.point-title');
    const action = node.querySelector('.point-action');
    const details = node.querySelector('.point-details');
    const remove = node.querySelector('.remove-point');
    const enhance = node.querySelector('.enhance-point');

    card.dataset.index = index;
    status.value = point.status || 'completed';
    title.value = point.title || '';
    action.value = point.action || '';
    details.value = point.details || '';

    status.addEventListener('change', () => {
      state.points[index].status = status.value;
      renderPreview();
      saveState();
    });

    title.addEventListener('input', () => {
      state.points[index].title = title.value;
      renderPreview();
      saveState();
    });

    action.addEventListener('input', () => {
      state.points[index].action = action.value;
      renderPreview();
      saveState();
    });

    details.addEventListener('input', () => {
      state.points[index].details = details.value;
      renderPreview();
      saveState();
    });

    enhance.addEventListener('click', () => enhancePoint(index));
    remove.addEventListener('click', () => removePoint(index));
    els.pointsEditor.appendChild(node);
  });

  if (state.points.length === 0) {
    els.pointsEditor.innerHTML = '<p class="empty-message">No points added yet. Click “Add Point”.</p>';
  }
}

function groupPoints() {
  return {
    completed: state.points.filter(item => item.status === 'completed'),
    hold: state.points.filter(item => item.status === 'hold'),
    pending: state.points.filter(item => item.status === 'pending')
  };
}

function sectionLabel(status) {
  const labels = {
    completed: 'Completed Points',
    hold: 'On Hold Points',
    pending: 'Pending Points'
  };
  return labels[status];
}

function sectionIcon(status) {
  const icons = {
    completed: '✓',
    hold: '⏸',
    pending: '!'
  };
  return icons[status];
}

function sectionColors(status) {
  const colors = {
    completed: {
      main: '#0f8a3b',
      dark: '#087333',
      bg: '#eaf8ef',
      headerBg: '#d9f2e3',
      border: '#1f9d4c'
    },
    hold: {
      main: '#b7791f',
      dark: '#8a5a10',
      bg: '#fff7df',
      headerBg: '#ffefbf',
      border: '#d99a1e'
    },
    pending: {
      main: '#c62828',
      dark: '#9f1f1f',
      bg: '#fff0f0',
      headerBg: '#ffdede',
      border: '#d93025'
    }
  };
  return colors[status];
}

function buildSection(status, points) {
  if (!points.length) return '';

  const c = sectionColors(status);
  const rows = points.map(point => `
    <tr>
      <td style="width:24%;padding:11px 12px;border:1px solid #d9cde0;border-left:4px solid ${c.border};background:${c.bg};color:${c.dark};font-weight:700;font-size:13px;line-height:1.45;vertical-align:top;word-break:break-word;">
        ${nl2br(point.title || sectionLabel(status))}
      </td>
      <td style="width:32%;padding:11px 12px;border:1px solid #d9cde0;background:${c.bg};color:#24112f;font-size:13px;line-height:1.45;vertical-align:top;word-break:break-word;">
        ${point.action ? nl2br(point.action) : '&nbsp;'}
      </td>
      <td style="width:44%;padding:11px 12px;border:1px solid #d9cde0;background:${c.bg};color:#24112f;font-size:13px;line-height:1.45;vertical-align:top;word-break:break-word;">
        ${point.details ? nl2br(point.details) : '&nbsp;'}
      </td>
    </tr>
  `).join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:22px 0 0;font-family:Aptos, Calibri, Arial, sans-serif;">
      <tr>
        <td style="padding:0 0 8px 0;border-bottom:2px solid #4b0f58;">
          <span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:50%;background:${c.main};color:#ffffff;font-size:13px;font-weight:700;margin-right:8px;">${sectionIcon(status)}</span>
          <span style="color:#370641;font-size:16px;font-weight:700;vertical-align:middle;">${sectionLabel(status)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding-top:10px;">
          <table role="table" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #d9cde0;font-family:Aptos, Calibri, Arial, sans-serif;table-layout:fixed;">
            <thead>
              <tr>
                <th align="left" style="width:24%;padding:9px 12px;border:1px solid #d9cde0;background:${c.headerBg};color:${c.dark};font-size:12px;line-height:1.35;font-weight:700;">Point Title</th>
                <th align="left" style="width:32%;padding:9px 12px;border:1px solid #d9cde0;background:${c.headerBg};color:${c.dark};font-size:12px;line-height:1.35;font-weight:700;">Action / Owner</th>
                <th align="left" style="width:44%;padding:9px 12px;border:1px solid #d9cde0;background:${c.headerBg};color:${c.dark};font-size:12px;line-height:1.35;font-weight:700;">Details</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function buildEmailHtml() {
  const grouped = groupPoints();
  const heading = state.heading || 'Status Update';

  return `
    <table role="presentation" align="center" width="760" cellpadding="0" cellspacing="0" style="width:760px;min-width:760px;max-width:760px;border-collapse:collapse;background:#ffffff;font-family:Aptos, Calibri, Arial, sans-serif;color:#24112f;margin:0 auto;table-layout:fixed;">
      <tr>
        <td width="712" style="width:712px;padding:22px 24px 8px 24px;">
          <div style="margin:0 0 14px 0;color:#370641;font-size:22px;line-height:1.25;font-weight:700;">${escapeHtml(heading)}</div>
          ${state.greeting ? `<div style="margin:0 0 12px 0;color:#222222;font-size:13px;line-height:1.45;">${nl2br(state.greeting)}</div>` : ''}
          ${state.intro ? `<div style="margin:0 0 12px 0;color:#222222;font-size:13px;line-height:1.45;">${nl2br(state.intro)}</div>` : ''}
          ${buildSection('completed', grouped.completed)}
          ${buildSection('hold', grouped.hold)}
          ${buildSection('pending', grouped.pending)}
          ${state.closing ? `<div style="margin:18px 0 0 0;color:#222222;font-size:13px;line-height:1.45;">${nl2br(state.closing)}</div>` : ''}
        </td>
      </tr>
    </table>
  `;
}

function buildStandaloneHtml() {
  const css = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
      } catch {
        return '';
      }
    })
    .join('\n');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(state.subject || 'Status Update')}</title>
  <style>${css}</style>
</head>
<body style="background:#ffffff;padding:20px;">
${buildEmailHtml()}
</body>
</html>`;
}

function buildPlainText() {
  const grouped = groupPoints();
  const lines = [];
  if (state.heading) lines.push(state.heading, '');
  if (state.greeting) lines.push(state.greeting, '');
  if (state.intro) lines.push(state.intro, '');

  ['completed', 'hold', 'pending'].forEach(status => {
    if (!grouped[status].length) return;
    lines.push(sectionLabel(status));
    lines.push('-'.repeat(sectionLabel(status).length));
    grouped[status].forEach((point, index) => {
      lines.push(`${index + 1}. ${point.title || sectionLabel(status)}`);
      if (point.action) lines.push(`   ${point.action}`);
      if (point.details) lines.push(`   ${point.details}`);
      lines.push('');
    });
  });

  if (state.closing) lines.push(state.closing);
  return lines.join('\n');
}

function renderPreview() {
  syncStateFromInputs();
  els.preview.innerHTML = buildEmailHtml();
  saveState();
}

function legacyCopyHtml(html) {
  const holder = document.createElement('div');
  holder.setAttribute('contenteditable', 'true');
  holder.style.position = 'fixed';
  holder.style.left = '-9999px';
  holder.style.top = '0';
  holder.style.width = '1px';
  holder.style.height = '1px';
  holder.style.overflow = 'hidden';
  holder.innerHTML = html;
  document.body.appendChild(holder);

  const range = document.createRange();
  range.selectNodeContents(holder);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    selection.removeAllRanges();
    holder.remove();
  }
  return copied;
}

async function copyRichHtml() {
  const html = buildEmailHtml();
  const plain = buildPlainText();

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' })
        })
      ]);
      showStatus('Exact-width formatted table copied. Paste it directly in Gmail or Outlook compose.');
      return;
    }

    if (legacyCopyHtml(html)) {
      showStatus('Exact-width formatted table copied. Paste it directly in Gmail or Outlook compose.');
      return;
    }

    throw new Error('Rich clipboard copy is not available.');
  } catch {
    if (legacyCopyHtml(html)) {
      showStatus('Formatted mail table copied using browser fallback. Paste it directly in Gmail or Outlook compose.');
      return;
    }

    await navigator.clipboard.writeText(plain);
    showStatus('Plain text copied. Use Chrome/Edge over HTTPS for formatted table copy.', true);
  }
}

async function copyPlainText() {
  await navigator.clipboard.writeText(buildPlainText());
  showStatus('Plain text copied.');
}

function downloadHtml() {
  const blob = new Blob([buildStandaloneHtml()], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(state.subject || 'status-update').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showStatus('HTML file downloaded.');
}

function openMailApp() {
  const subject = encodeURIComponent(state.subject || 'Status Update');
  const body = encodeURIComponent(buildPlainText());
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function showStatus(message, isError = false) {
  els.copyStatus.textContent = message;
  els.copyStatus.classList.toggle('error', isError);
  setTimeout(() => {
    els.copyStatus.textContent = '';
    els.copyStatus.classList.remove('error');
  }, 6500);
}

function getAiEndpoint() {
  syncStateFromInputs();
  return state.aiEndpoint.replace(/\/$/, '');
}

async function callAiEnhancer(point) {
  const endpoint = getAiEndpoint();
  if (!endpoint) {
    throw new Error('Add AI Proxy URL first. GitHub Pages cannot keep an OpenAI API key safe.');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: state.aiModel || 'gpt-5.4-mini',
      effort: state.aiEffort || 'medium',
      point
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `AI request failed with HTTP ${response.status}`);
  }

  if (!data.enhanced || typeof data.enhanced !== 'object') {
    throw new Error('AI response was not in expected format.');
  }

  return data.enhanced;
}

function cleanEnhancedPoint(oldPoint, enhanced) {
  return {
    status: oldPoint.status || 'completed',
    title: String(enhanced.title || oldPoint.title || '').trim(),
    action: String(enhanced.action || oldPoint.action || '').trim(),
    details: String(enhanced.details || oldPoint.details || '').trim()
  };
}

async function enhancePoint(index) {
  try {
    setButtonsLoading(true, 'Enhancing...');
    const enhanced = await callAiEnhancer(state.points[index]);
    state.points[index] = cleanEnhancedPoint(state.points[index], enhanced);
    renderEditor();
    renderPreview();
    showStatus('Point improved by AI. Review once before sending.');
  } catch (error) {
    showStatus(error.message || 'AI enhancement failed.', true);
  } finally {
    setButtonsLoading(false);
  }
}

async function enhanceAllPoints() {
  if (!state.points.length) {
    showStatus('No points available to enhance.', true);
    return;
  }

  try {
    setButtonsLoading(true, 'Enhancing all...');
    for (let index = 0; index < state.points.length; index += 1) {
      const enhanced = await callAiEnhancer(state.points[index]);
      state.points[index] = cleanEnhancedPoint(state.points[index], enhanced);
    }
    renderEditor();
    renderPreview();
    showStatus('All points improved by AI. Review once before sending.');
  } catch (error) {
    showStatus(error.message || 'AI enhancement failed.', true);
  } finally {
    setButtonsLoading(false);
  }
}

function bindEvents() {
  [els.subject, els.heading, els.greeting, els.intro, els.closing, els.aiEndpoint, els.aiModel, els.aiEffort].forEach(input => {
    input.addEventListener('input', renderPreview);
    input.addEventListener('change', renderPreview);
  });

  els.addPointBtn.addEventListener('click', () => addPoint());
  els.copyHtmlBtn.addEventListener('click', copyRichHtml);
  els.copyTextBtn.addEventListener('click', copyPlainText);
  els.downloadBtn.addEventListener('click', downloadHtml);
  els.openMailBtn.addEventListener('click', openMailApp);
  els.enhanceAllBtn.addEventListener('click', enhanceAllPoints);

  els.saveAiSettingsBtn.addEventListener('click', () => {
    syncStateFromInputs();
    saveState();
    showStatus('AI settings saved in this browser.');
  });

  els.loadSampleBtn.addEventListener('click', () => {
    state.subject = 'Application Status Update';
    state.heading = 'Application Status Update';
    state.greeting = 'Hi Team,';
    state.intro = 'Please find the current status below.';
    state.closing = 'Regards,\nKetan';
    state.points = structuredClone(samplePoints);
    syncInputsFromState();
    renderEditor();
    renderPreview();
    showStatus('Sample data loaded.');
  });

  els.clearBtn.addEventListener('click', () => {
    if (!confirm('Clear all fields and points?')) return;
    state.subject = '';
    state.heading = '';
    state.greeting = 'Hi Team,';
    state.intro = '';
    state.closing = 'Regards,';
    state.points = [];
    syncInputsFromState();
    renderEditor();
    renderPreview();
    showStatus('Cleared.');
  });
}

loadState();
syncInputsFromState();
renderEditor();
renderPreview();
bindEvents();
