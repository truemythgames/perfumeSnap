export const ADMIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PerfumeSnap Admin</title>
<style>
  :root { --bg: #0c0a08; --card: #161210; --border: #2a2420; --gold: #c8943c; --gold-dim: #8a6e30; --text: #f2ece4; --text2: #a49882; --green: #4ead4e; --red: #cf4444; --blue: #6a9fd4; --purple: #a67fd4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; background: var(--bg); color: var(--text); min-height: 100vh; }
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .login-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 32px; width: 100%; max-width: 400px; }
  .login-card h1 { color: var(--gold); font-size: 22px; margin-bottom: 8px; }
  .login-card p { color: var(--text2); font-size: 14px; margin-bottom: 24px; font-family: -apple-system, sans-serif; }
  .login-card input { width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border); background: #0c0a08; color: var(--text); font-size: 15px; margin-bottom: 16px; }
  .login-card button { width: 100%; padding: 14px; border: none; border-radius: 10px; background: linear-gradient(135deg, var(--gold), var(--gold-dim)); color: #fff; font-weight: 700; font-size: 15px; cursor: pointer; font-family: -apple-system, sans-serif; }
  .hidden { display: none !important; }
  .header { padding: 20px 32px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .header-left { display: flex; align-items: center; gap: 12px; }
  .header h1 { font-size: 20px; font-weight: 700; color: var(--gold); }
  .badge { font-size: 11px; background: var(--gold-dim); color: var(--text); padding: 3px 10px; border-radius: 99px; font-weight: 600; font-family: -apple-system, sans-serif; }
  .header-actions { display: flex; gap: 8px; font-family: -apple-system, sans-serif; }
  .btn-sm { padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: var(--text2); font-size: 12px; font-weight: 600; cursor: pointer; }
  .btn-sm:hover { border-color: var(--gold-dim); color: var(--gold); }
  .tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); padding: 0 32px; font-family: -apple-system, sans-serif; }
  .tab { padding: 14px 24px; font-size: 14px; font-weight: 600; color: var(--text2); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
  .tab:hover { color: var(--text); }
  .tab.active { color: var(--gold); border-bottom-color: var(--gold); }
  .content { padding: 32px; max-width: 1280px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 28px; }
  .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
  .stat-card .label { font-size: 11px; color: var(--text2); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .stat-card .value { font-size: 28px; font-weight: 800; color: var(--gold); }
  .stat-card .sub { font-size: 12px; color: var(--text2); margin-top: 4px; }
  .filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
  .filter-btn { padding: 8px 14px; border-radius: 99px; border: 1px solid var(--border); background: transparent; color: var(--text2); font-size: 12px; font-weight: 600; cursor: pointer; }
  .filter-btn.active { background: rgba(200,148,60,0.15); border-color: var(--gold-dim); color: var(--gold); }
  table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
  th { text-align: left; padding: 12px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text2); border-bottom: 1px solid var(--border); background: #12100c; }
  td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid var(--border); vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(200,148,60,0.04); }
  .cat { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
  .cat-accurate { background: rgba(78,173,78,0.15); color: var(--green); }
  .cat-pricing { background: rgba(46,168,138,0.15); color: #2ea88a; }
  .cat-like { background: rgba(212,175,55,0.15); color: var(--gold); }
  .cat-incorrect { background: rgba(207,68,68,0.15); color: var(--red); }
  .cat-feature { background: rgba(106,159,212,0.15); color: var(--blue); }
  .cat-suggestion { background: rgba(166,127,212,0.15); color: var(--purple); }
  .msg { color: var(--text2); font-size: 12px; line-height: 1.5; max-width: 320px; white-space: pre-wrap; word-break: break-word; }
  .perfume { font-weight: 600; color: var(--text); }
  .brand { color: var(--text2); font-size: 12px; }
  .img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
  .img-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; transition: border-color 0.2s, transform 0.15s; }
  .img-card:hover { border-color: var(--gold-dim); transform: translateY(-2px); }
  .img-card img { width: 100%; aspect-ratio: 1; object-fit: cover; background: #111; cursor: zoom-in; }
  .img-card .img-info { padding: 10px 12px; }
  .img-card .img-key { font-size: 10px; color: var(--text2); word-break: break-all; margin-bottom: 8px; }
  .img-actions { display: flex; gap: 6px; }
  .img-actions button { flex: 1; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--border); background: #0c0a08; color: var(--text2); font-size: 11px; font-weight: 600; cursor: pointer; }
  .img-actions button:hover { border-color: var(--gold-dim); color: var(--gold); }
  .load-more { display: block; margin: 24px auto; padding: 12px 32px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; color: var(--gold); font-weight: 600; cursor: pointer; font-size: 14px; }
  .load-more:hover { border-color: var(--gold-dim); }
  .empty { text-align: center; padding: 60px 20px; color: var(--text2); font-size: 15px; }
  .section-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 14px; font-family: Georgia, serif; }
  .toast { position: fixed; bottom: 24px; right: 24px; background: var(--gold); color: #000; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 100; }
  .toast.show { opacity: 1; }
  .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 24px; cursor: zoom-out; }
  .lightbox img { max-width: 95vw; max-height: 90vh; object-fit: contain; border-radius: 8px; }
  .lightbox-bar { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; }
  .lightbox-bar button { padding: 10px 20px; border-radius: 8px; border: none; background: var(--gold); color: #000; font-weight: 700; cursor: pointer; font-size: 13px; }
  .err { background: rgba(207,68,68,0.1); border: 1px solid var(--red); color: var(--red); padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; font-size: 13px; }
</style>
</head>
<body>
<div id="app">
  <div class="header">
    <div class="header-left">
      <h1>PerfumeSnap</h1>
      <span class="badge">CMS</span>
    </div>
    <div class="header-actions">
      <button class="btn-sm" onclick="load()">Refresh</button>
    </div>
  </div>
  <div class="tabs">
    <div class="tab active" data-tab="feedback">Feedback</div>
    <div class="tab" data-tab="images">Scan Photos</div>
  </div>
  <div class="content" id="content"></div>
</div>

<div class="toast" id="toast">Copied!</div>
<div id="lightbox" class="lightbox hidden" onclick="closeLightbox(event)">
  <img id="lightboxImg" src="" alt="">
  <div class="lightbox-bar" onclick="event.stopPropagation()">
    <button onclick="copyLightboxUrl()">Copy URL</button>
    <button onclick="openLightboxNewTab()">Open</button>
    <button onclick="closeLightbox()">Close</button>
  </div>
</div>

<script>
const BASE = location.origin;
let currentTab = 'feedback';
let feedbackFilter = '';
let imageCursor = null;
let lightboxUrl = '';

async function api(path) {
  const res = await fetch(BASE + path);
  if (res.status === 401) { location.reload(); throw new Error('Unauthorized'); }
  if (res.status === 503) throw new Error('Admin not configured on server');
  return res.json();
}

document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    currentTab = t.dataset.tab;
    imageCursor = null;
    load();
  });
});

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(ts) {
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function catLabel(c) {
  const map = { accurate: 'Satisfied', pricing: 'Accurate Pricing', like: 'Like Features', incorrect: 'Incorrect', feature: 'Feature', suggestion: 'Suggestion' };
  return map[c] || c || 'Unknown';
}

function catClass(c) {
  if (c === 'accurate') return 'cat-accurate';
  if (c === 'pricing') return 'cat-pricing';
  if (c === 'like') return 'cat-like';
  if (c === 'incorrect') return 'cat-incorrect';
  if (c === 'feature') return 'cat-feature';
  if (c === 'suggestion') return 'cat-suggestion';
  return 'cat-like';
}

function resolveCategory(f) {
  if (f.category) return f.category;
  return f.satisfied ? 'like' : 'incorrect';
}

async function loadFeedback() {
  const filterQ = feedbackFilter ? '&category=' + encodeURIComponent(feedbackFilter) : '';
  let stats, list;
  try {
    [stats, list] = await Promise.all([api('/admin/feedback/stats'), api('/admin/feedback?limit=100' + filterQ)]);
  } catch (e) {
    document.getElementById('content').innerHTML = '<div class="err">' + esc(e.message) + '</div>';
    return;
  }

  let html = '<div class="stats-grid">';
  html += '<div class="stat-card"><div class="label">Total</div><div class="value">' + stats.total + '</div></div>';
  if (stats.byCategory) {
    const colorMap = { accurate: 'var(--green)', pricing: '#2ea88a', like: 'var(--gold)', incorrect: 'var(--red)', feature: 'var(--blue)', suggestion: 'var(--purple)' };
    stats.byCategory.forEach(c => {
      const color = colorMap[c.category] || 'var(--gold)';
      html += '<div class="stat-card"><div class="label">' + catLabel(c.category) + '</div><div class="value" style="color:' + color + '">' + c.count + '</div></div>';
    });
  }
  html += '</div>';

  html += '<div class="section-title">Filter by type</div><div class="filters">';
  ['', 'accurate', 'pricing', 'like', 'incorrect', 'feature', 'suggestion'].forEach(c => {
    const label = c ? catLabel(c) : 'All';
    html += '<button class="filter-btn' + (feedbackFilter === c ? ' active' : '') + '" onclick="setFeedbackFilter(\\'' + c + '\\')">' + label + '</button>';
  });
  html += '</div>';

  html += '<div class="section-title">Recent feedback (' + (list.total ?? list.items?.length ?? 0) + ')</div>';
  if (!list.items || list.items.length === 0) {
    html += '<div class="empty">No feedback yet</div>';
  } else {
    html += '<table><tr><th>Date</th><th>Perfume</th><th>Type</th><th>Message</th><th>User</th></tr>';
    list.items.forEach(f => {
      const cat = resolveCategory(f);
      html += '<tr>';
      html += '<td style="white-space:nowrap;color:var(--text2)">' + fmtDate(f.created_at) + '</td>';
      html += '<td><div class="perfume">' + esc(f.perfume_name) + '</div><div class="brand">' + esc(f.perfume_brand) + '</div></td>';
      html += '<td><span class="cat ' + catClass(cat) + '">' + catLabel(cat) + '</span></td>';
      html += '<td><div class="msg">' + (f.message ? esc(f.message) : '<span style="opacity:0.5">—</span>') + '</div></td>';
      html += '<td style="font-size:11px;color:var(--text2);font-family:monospace">' + esc((f.user_id || '').slice(0, 8)) + '…</td>';
      html += '</tr>';
    });
    html += '</table>';
  }

  if (stats.byPerfume && stats.byPerfume.length > 0) {
    html += '<br><div class="section-title">Most reviewed perfumes</div>';
    html += '<table><tr><th>Perfume</th><th>Feedback count</th></tr>';
    stats.byPerfume.forEach(p => {
      html += '<tr><td>' + esc(p.perfume_brand) + ' ' + esc(p.perfume_name) + '</td><td>' + p.total + '</td></tr>';
    });
    html += '</table>';
  }

  document.getElementById('content').innerHTML = html;
}

function setFeedbackFilter(c) {
  feedbackFilter = c;
  loadFeedback();
}

async function loadImages(append) {
  const params = 'limit=48' + (imageCursor ? '&cursor=' + encodeURIComponent(imageCursor) : '');
  let data;
  try {
    data = await api('/admin/images?' + params);
  } catch (e) {
    document.getElementById('content').innerHTML = '<div class="err">' + esc(e.message) + '</div>';
    return;
  }

  let html = append ? document.getElementById('content').innerHTML.replace(/<button class="load-more"[\\s\\S]*?<\\/button>/, '') : '';

  if (!append) {
    html += '<div class="section-title">User scan photos — click to preview, copy URL for website</div>';
    html += '<p style="color:var(--text2);font-size:13px;margin-bottom:20px">Photos uploaded when users scan perfumes. Use Copy URL to add to blog or marketing pages.</p>';
  }

  if (!data.items || data.items.length === 0) {
    if (!append) html += '<div class="empty">No images found</div>';
  } else {
    if (!append) html += '<div class="img-grid" id="img-grid">';
    const cards = data.items.map((img, i) => {
      const isImage = (img.contentType || '').startsWith('image/');
      const safeUrl = esc(img.url);
      const safeKey = esc(img.key);
      return '<div class="img-card">'
        + (isImage
          ? '<img src="' + safeUrl + '" loading="lazy" alt="" onclick="openLightbox(\\'' + img.url.replace(/'/g, "\\\\'") + '\\')">'
          : '<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:#111;color:#555;font-size:12px;">No preview</div>')
        + '<div class="img-info">'
        + (img.perfume ? '<div style="font-weight:600;color:var(--gold);font-size:13px;margin-bottom:4px">' + esc(img.perfume) + '</div>' : '')
        + '<div style="font-size:10px;color:var(--text2);margin-bottom:8px">' + new Date(img.uploaded).toLocaleDateString() + ' · ' + (img.size/1024).toFixed(0) + ' KB</div>'
        + '<div class="img-actions">'
        + '<button onclick="copyUrl(\\'' + img.url.replace(/'/g, "\\\\'") + '\\')">Copy URL</button>'
        + '<button onclick="window.open(\\'' + img.url.replace(/'/g, "\\\\'") + '\\',\\'_blank\\')">Open</button>'
        + '<button onclick="deleteImage(\\'' + img.key.replace(/'/g, "\\\\'") + '\\', this)" style="color:var(--red)">Delete</button>'
        + '</div></div></div>';
    }).join('');

    if (append) {
      html = html.replace(/<\\/div>\\s*$/, cards + '</div>');
    } else {
      html += cards + '</div>';
    }
  }

  imageCursor = data.cursor;
  if (data.truncated && data.cursor) {
    html += '<button class="load-more" onclick="loadImages(true)">Load more</button>';
  }

  document.getElementById('content').innerHTML = html;
}

function copyUrl(url) {
  navigator.clipboard.writeText(url).then(() => showToast('URL copied — paste into website'));
}

async function deleteImage(key, btn) {
  if (!confirm('Delete this image permanently?')) return;
  btn.disabled = true;
  btn.textContent = '...';
  try {
    const res = await fetch(BASE + '/admin/images', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
    if (!res.ok) throw new Error('Failed');
    const card = btn.closest('.img-card');
    if (card) card.remove();
    showToast('Image deleted');
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Delete';
    showToast('Delete failed');
  }
}

function openLightbox(url) {
  lightboxUrl = url;
  document.getElementById('lightboxImg').src = url;
  document.getElementById('lightbox').classList.remove('hidden');
}

function closeLightbox(e) {
  if (e && e.target !== document.getElementById('lightbox') && e.target !== document.getElementById('lightboxImg')) return;
  document.getElementById('lightbox').classList.add('hidden');
  document.getElementById('lightboxImg').src = '';
}

function copyLightboxUrl() { copyUrl(lightboxUrl); }
function openLightboxNewTab() { window.open(lightboxUrl, '_blank'); }

function load() {
  if (currentTab === 'feedback') loadFeedback();
  else loadImages(false);
}

load();
</script>
</body>
</html>`;
