/**
 * js/portfolio.js — Public portfolio renderer
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- TYPEWRITER ---- */
  const tw = document.getElementById('typewriter');
  const text = '> Estadística Espacial · UNA Puno';
  let i = 0;
  function type() {
    if (i < text.length) { tw.textContent = text.slice(0, ++i) + '|'; setTimeout(type, 55); }
    else { tw.textContent = text; }
  }
  setTimeout(type, 800);

  /* ---- REVEAL ---- */
  const revealEls = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  revealEls.forEach(el => obs.observe(el));

  /* ---- RENDER PROJECTS ---- */
  renderPortfolio();
});

function renderPortfolio() {
  const container = document.getElementById('units-container');
  if (!container) return;

  const units = DB.getUnits();
  const tasks = DB.getTasks();

  // Update terminal
  const termUnits = document.getElementById('terminal-units');
  if (termUnits) {
    const folderNames = units.map(u => u.label.toLowerCase() + '/').join('  ');
    termUnits.textContent = folderNames || 'sin unidades';
  }

  if (units.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📂</span>
        <p>No hay contenido aún.</p>
        <p style="margin-top:.5rem;font-size:.65rem;color:var(--text-dim)">El administrador aún no ha subido trabajos.</p>
      </div>`;
    return;
  }

  container.innerHTML = units.map((unit, uidx) => {
    const unitTasks = tasks.filter(t => t.unitId === unit.id);
    const tasksHTML = unitTasks.length > 0
      ? unitTasks.map(task => renderTaskCard(task)).join('')
      : `<div class="empty-state" style="padding:1.5rem 0;">
          <span style="font-family:var(--font-mono);font-size:.75rem;color:var(--text-dim)">
            — Próximamente —
          </span>
         </div>`;

    return `
      <div class="unit-big" style="animation-delay:${uidx * 0.1}s">
        <div class="unit-big-header">
          <div class="unit-big-num">${unit.label}</div>
          <div class="unit-big-info">
            <p class="unit-big-label">${unit.name}</p>
            <p class="unit-big-desc">${escHtml(unit.desc || '')}</p>
          </div>
        </div>
        <div class="unit-big-body">
          <div class="trabajos-list">${tasksHTML}</div>
        </div>
      </div>`;
  }).join('');
}

function renderTaskCard(task) {
  const files = task.files || [];
  const links = task.links || [];
  const tagsHTML = (task.tags || []).map(t => `<span class="ttag">${escHtml(t)}</span>`).join('');
  const descHTML = task.desc ? `<div class="trabajo-desc">${escHtml(task.desc)}</div>` : '';
  const metaHTML = task.createdAt
    ? `<div class="trabajo-meta">Subido: ${new Date(task.createdAt).toLocaleDateString('es-PE')}</div>`
    : '';

  // Build action buttons for files
  const fileButtons = files.map(f => `
    <button class="btn-pdf" onclick="viewFile('${task.id}','${f.id}')" title="Ver ${f.name}">
      ${FileUtils.getIcon(f.name)} Ver
    </button>
    <button class="btn-view" onclick="downloadFile('${task.id}','${f.id}')" title="Descargar ${f.name}">
      ⬇ ${f.name.split('.').pop().toUpperCase()}
    </button>
  `).join('');

  // Build action buttons for links
  const linkButtons = links.map(l => `
    <a class="btn-link" href="${escHtml(l.url)}" target="_blank" rel="noopener" title="${escHtml(l.label || l.url)}">
      🔗 ${escHtml(l.label || 'Link')}
    </a>
  `).join('');

  const hasActions = files.length > 0 || links.length > 0;
  const actionsHTML = hasActions
    ? `<div class="trabajo-actions">${fileButtons}${linkButtons}</div>`
    : `<div style="font-family:var(--font-mono);font-size:.65rem;color:var(--text-dim);padding-top:4px;">Sin archivos adjuntos</div>`;

  // File badges
  const fileBadges = files.map(f => {
    const ext = f.name.split('.').pop().toUpperCase();
    return `<span class="file-type-badge ${FileUtils.getBadgeClass(f.name)}">${ext}</span>`;
  }).join('');
  const linkBadge = links.length > 0 ? `<span class="file-type-badge badge-link">${links.length} link${links.length>1?'s':''}</span>` : '';

  return `
    <div class="trabajo-item">
      <div class="trabajo-icon">${task.icon || '📄'}</div>
      <div class="trabajo-info">
        <div class="trabajo-title">${escHtml(task.title)}</div>
        ${descHTML}
        <div class="trabajo-tags">${tagsHTML} ${fileBadges} ${linkBadge}</div>
        ${metaHTML}
      </div>
      ${actionsHTML}
    </div>`;
}

function viewFile(taskId, fileId) {
  const task = DB.getTask(taskId);
  if (!task) return;
  const file = (task.files || []).find(f => f.id === fileId);
  if (!file || !file.data) { alert('Archivo no encontrado.'); return; }
  FileUtils.openDataURL(file.data, file.name);
}

function downloadFile(taskId, fileId) {
  const task = DB.getTask(taskId);
  if (!task) return;
  const file = (task.files || []).find(f => f.id === fileId);
  if (!file || !file.data) { alert('Archivo no encontrado.'); return; }
  FileUtils.downloadDataURL(file.data, file.name);
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
