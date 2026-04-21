/**
 * js/panel.js — Admin Panel Logic
 */

/* ---- AUTH GUARD ---- */
if (!DB.isLoggedIn()) window.location.href = 'login.html';

/* ---- STATE ---- */
let pendingFiles = [];    // { id, name, type, size, data (base64) }
let pendingLinks = [];    // { id, url, label }
let editingTaskId = null;
let manageFilterUnit = 'all';

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', () => {
  renderDashboard();
  populateUnitSelect();
  renderUnitsView();
  renderManageView();
});

/* ================================================================
   VIEWS
   ================================================================ */
function showView(name, linkEl) {
  document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  const target = document.getElementById('view-' + name);
  if (target) target.style.display = 'block';
  if (linkEl) linkEl.classList.add('active');

  if (name === 'dashboard') renderDashboard();
  if (name === 'manage')    renderManageView();
  if (name === 'units')     renderUnitsView();
  if (name === 'new-task')  {
    if (!editingTaskId) resetForm();
    populateUnitSelect();
  }
}

/* ================================================================
   DASHBOARD
   ================================================================ */
function renderDashboard() {
  const stats = DB.getStats();
  const statsGrid = document.getElementById('stats-grid');
  if (statsGrid) {
    statsGrid.innerHTML = [
      { num: stats.tasks,  label: 'Trabajos'   },
      { num: stats.units,  label: 'Unidades'   },
      { num: stats.files,  label: 'Archivos'   },
      { num: stats.links,  label: 'Enlaces'    },
    ].map(s => `
      <div class="stat-card">
        <div class="stat-num">${s.num}</div>
        <div class="stat-label">${s.label}</div>
      </div>`).join('');
  }

  // Recent tasks
  const recentEl = document.getElementById('recent-tasks');
  if (recentEl) {
    const tasks = DB.getTasks().slice(-5).reverse();
    if (tasks.length === 0) {
      recentEl.innerHTML = `<div class="empty-state"><span class="empty-icon">📂</span>No hay trabajos aún.</div>`;
    } else {
      recentEl.innerHTML = `
        <table class="tasks-table">
          <thead><tr><th>Trabajo</th><th>Unidad</th><th>Fecha</th></tr></thead>
          <tbody>
            ${tasks.map(t => {
              const unit = DB.getUnits().find(u => u.id === t.unitId);
              return `<tr>
                <td class="task-title-cell">${escHtml(t.icon || '📄')} ${escHtml(t.title)}</td>
                <td><span class="task-unit-badge">${escHtml(unit ? unit.label : '?')}</span></td>
                <td class="task-date">${new Date(t.createdAt).toLocaleDateString('es-PE')}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>`;
    }
  }
}

/* ================================================================
   UNIT SELECT POPULATE
   ================================================================ */
function populateUnitSelect() {
  const sel = document.getElementById('task-unit');
  if (!sel) return;
  const units = DB.getUnits();
  sel.innerHTML = units.map(u => `<option value="${u.id}">${u.label} — ${u.name}</option>`).join('');
}

/* ================================================================
   FILE HANDLING
   ================================================================ */
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.add('drag-over');
}
function handleDragLeave() {
  document.getElementById('upload-zone').classList.remove('drag-over');
}
function handleDrop(e) {
  e.preventDefault();
  handleDragLeave();
  handleFiles(e.dataTransfer.files);
}

async function handleFiles(fileList) {
  const zone = document.getElementById('upload-zone');
  zone.classList.remove('drag-over');

  for (const file of Array.from(fileList)) {
    // Check for duplicate
    if (pendingFiles.find(f => f.name === file.name && f.size === file.size)) continue;

    try {
      const data = await FileUtils.readAsDataURL(file);
      pendingFiles.push({
        id:   'f_' + Date.now() + '_' + Math.random().toString(36).slice(2),
        name: file.name,
        type: file.type,
        size: file.size,
        data,
      });
    } catch (err) {
      showToast('Error al leer: ' + file.name, 'error');
    }
  }
  renderFilesPreview();
}

function renderFilesPreview() {
  const container = document.getElementById('files-preview');
  if (!container) return;
  container.innerHTML = pendingFiles.map(f => `
    <div class="link-item">
      <span class="link-item-icon">${FileUtils.getIcon(f.name)}</span>
      <span class="link-item-text">
        <span class="file-type-badge ${FileUtils.getBadgeClass(f.name)}">${f.name.split('.').pop().toUpperCase()}</span>
        ${escHtml(f.name)}
      </span>
      <span class="link-item-label">${FileUtils.formatSize(f.size)}</span>
      <button class="btn-remove-link" onclick="removeFile('${f.id}')" title="Quitar">×</button>
    </div>`).join('');
}

function removeFile(id) {
  pendingFiles = pendingFiles.filter(f => f.id !== id);
  renderFilesPreview();
}

/* ================================================================
   LINKS
   ================================================================ */
function addLink() {
  const urlEl   = document.getElementById('link-url');
  const labelEl = document.getElementById('link-label');
  const url   = urlEl.value.trim();
  const label = labelEl.value.trim();
  if (!url) { showToast('Ingresa una URL', 'error'); urlEl.focus(); return; }
  pendingLinks.push({ id: 'l_' + Date.now(), url, label: label || url });
  urlEl.value   = '';
  labelEl.value = '';
  renderLinksPreview();
}

function renderLinksPreview() {
  const container = document.getElementById('links-preview');
  if (!container) return;
  container.innerHTML = pendingLinks.map(l => `
    <div class="link-item">
      <span class="link-item-icon">🔗</span>
      <span class="link-item-text">${escHtml(l.url)}</span>
      <span class="link-item-label">${escHtml(l.label)}</span>
      <button class="btn-remove-link" onclick="removeLink('${l.id}')" title="Quitar">×</button>
    </div>`).join('');
}

function removeLink(id) {
  pendingLinks = pendingLinks.filter(l => l.id !== id);
  renderLinksPreview();
}

/* ================================================================
   SAVE TASK
   ================================================================ */
function saveTask() {
  const title  = document.getElementById('task-title').value.trim();
  const unitId = document.getElementById('task-unit').value;
  const icon   = document.getElementById('task-icon').value.trim() || '📄';
  const desc   = document.getElementById('task-desc').value.trim();
  const tagsRaw= document.getElementById('task-tags').value.trim();
  const tags   = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  if (!title)  { showToast('El título es obligatorio', 'error'); document.getElementById('task-title').focus(); return; }
  if (!unitId) { showToast('Selecciona una unidad', 'error'); return; }

  const btn = document.getElementById('save-btn');
  const sp  = document.getElementById('save-spinner');
  btn.disabled = true;
  sp.style.display = 'block';

  setTimeout(() => {
    const task = { unitId, title, icon, desc, tags, files: pendingFiles, links: pendingLinks };

    if (editingTaskId) {
      DB.updateTask(editingTaskId, task);
      showToast('Trabajo actualizado ✓', 'success');
      editingTaskId = null;
    } else {
      DB.addTask(task);
      showToast('Trabajo guardado ✓', 'success');
    }

    btn.disabled = false;
    sp.style.display = 'none';
    resetForm();
    showView('manage', document.querySelector('[onclick*=manage]'));
  }, 300);
}

function resetForm() {
  editingTaskId = null;
  pendingFiles  = [];
  pendingLinks  = [];
  ['task-title','task-icon','task-desc','task-tags','link-url','link-label'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('task-icon').value = '📄';
  renderFilesPreview();
  renderLinksPreview();
  document.querySelector('.admin-card-title') && (document.querySelector('#view-new-task .admin-card-title').textContent = 'Datos del trabajo');
}

/* ================================================================
   MANAGE VIEW
   ================================================================ */
function renderManageView() {
  const units = DB.getUnits();
  const tasks = DB.getTasks();

  // Tabs
  const tabsEl = document.getElementById('manage-unit-tabs');
  if (tabsEl) {
    tabsEl.innerHTML = `<button class="unit-tab ${manageFilterUnit==='all'?'active':''}" onclick="filterManage('all')">Todos</button>` +
      units.map(u => `<button class="unit-tab ${manageFilterUnit===u.id?'active':''}" onclick="filterManage('${u.id}')">${u.label}</button>`).join('');
  }

  // Table
  const tbody = document.getElementById('tasks-tbody');
  if (!tbody) return;

  const filtered = manageFilterUnit === 'all' ? tasks : tasks.filter(t => t.unitId === manageFilterUnit);
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;font-family:var(--font-mono);font-size:.75rem;color:var(--text-dim);">Sin trabajos</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(task => {
    const unit = units.find(u => u.id === task.unitId);
    const fileCount = (task.files || []).length + (task.links || []).length;
    return `<tr>
      <td class="task-title-cell">${escHtml(task.icon || '📄')} ${escHtml(task.title)}</td>
      <td><span class="task-unit-badge">${escHtml(unit ? unit.label : '?')}</span></td>
      <td style="font-family:var(--font-mono);font-size:.7rem;">${fileCount} adjunto${fileCount!==1?'s':''}</td>
      <td class="task-date">${new Date(task.createdAt).toLocaleDateString('es-PE')}</td>
      <td>
        <div class="task-actions">
          <button class="btn-secondary" style="font-size:.6rem;padding:.35rem .7rem;" onclick="editTask('${task.id}')">Editar</button>
          <button class="btn-danger"    style="font-size:.6rem;padding:.35rem .7rem;" onclick="confirmDelete('${task.id}')">Borrar</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterManage(unitId) {
  manageFilterUnit = unitId;
  renderManageView();
}

function editTask(id) {
  const task = DB.getTask(id);
  if (!task) return;
  editingTaskId = id;
  pendingFiles  = [...(task.files || [])];
  pendingLinks  = [...(task.links || [])];

  populateUnitSelect();
  document.getElementById('task-unit').value  = task.unitId;
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-icon').value  = task.icon || '📄';
  document.getElementById('task-desc').value  = task.desc || '';
  document.getElementById('task-tags').value  = (task.tags || []).join(', ');

  renderFilesPreview();
  renderLinksPreview();
  showView('new-task', document.querySelector('[onclick*=new-task]'));
  document.getElementById('view-new-task').querySelector('.admin-card-title').textContent = 'Editando trabajo';
  window.scrollTo(0, 0);
}

function confirmDelete(id) {
  openModal(
    '¿Borrar trabajo?',
    'Esta acción no se puede deshacer. Se eliminarán todos los archivos adjuntos.',
    () => { DB.deleteTask(id); renderManageView(); renderDashboard(); showToast('Trabajo eliminado', 'success'); }
  );
}

/* ================================================================
   UNITS VIEW
   ================================================================ */
function renderUnitsView() {
  const el = document.getElementById('units-list');
  if (!el) return;
  const units = DB.getUnits();
  if (units.length === 0) {
    el.innerHTML = `<div class="empty-state">No hay unidades.</div>`; return;
  }
  el.innerHTML = units.map((u, i) => {
    const count = DB.getTasksByUnit(u.id).length;
    return `<div style="display:flex;align-items:center;gap:1rem;padding:.8rem 0;border-bottom:1px solid var(--border);">
      <div style="font-family:var(--font-display);font-size:1.8rem;color:var(--accent);line-height:1;min-width:40px;">${u.label}</div>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:.9rem;">${escHtml(u.name)}</div>
        <div style="font-family:var(--font-mono);font-size:.62rem;color:var(--text-dim);margin-top:.2rem;">${escHtml(u.desc || '')} · ${count} trabajo${count!==1?'s':''}</div>
      </div>
      ${i > 0 ? `<button class="btn-danger" style="font-size:.62rem;padding:.3rem .7rem;" onclick="confirmDeleteUnit('${u.id}')">Borrar</button>` : '<span style="font-family:var(--font-mono);font-size:.6rem;color:var(--text-dim);">default</span>'}
    </div>`;
  }).join('');
}

function addUnit() {
  const name = document.getElementById('unit-name').value.trim();
  const desc = document.getElementById('unit-desc').value.trim();
  if (!name) { showToast('El nombre es obligatorio', 'error'); return; }
  DB.addUnit(name, desc);
  document.getElementById('unit-name').value = '';
  document.getElementById('unit-desc').value = '';
  renderUnitsView();
  populateUnitSelect();
  showToast('Unidad creada ✓', 'success');
}

function confirmDeleteUnit(id) {
  const unit  = DB.getUnits().find(u => u.id === id);
  const count = DB.getTasksByUnit(id).length;
  openModal(
    `¿Borrar ${unit ? unit.name : 'unidad'}?`,
    `Se eliminarán también los ${count} trabajo${count!==1?'s':''} de esta unidad. No se puede deshacer.`,
    () => { DB.deleteUnit(id); renderUnitsView(); renderManageView(); showToast('Unidad eliminada', 'success'); }
  );
}

/* ================================================================
   SETTINGS
   ================================================================ */
function changePassword() {
  const np = document.getElementById('new-pass').value;
  const cp = document.getElementById('confirm-pass').value;
  if (!np || np.length < 4)  { showToast('La contraseña debe tener al menos 4 caracteres', 'error'); return; }
  if (np !== cp)              { showToast('Las contraseñas no coinciden', 'error'); return; }
  const creds = DB.getCredentials();
  DB.saveCredentials({ ...creds, password: np });
  document.getElementById('new-pass').value     = '';
  document.getElementById('confirm-pass').value = '';
  showToast('Contraseña actualizada ✓', 'success');
}

function exportData() {
  const json = DB.exportJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'crqc_portfolio_backup_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Datos exportados ✓', 'success');
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      DB.importJSON(e.target.result);
      showToast('Datos importados ✓', 'success');
      renderDashboard();
      renderManageView();
      renderUnitsView();
    } catch (err) {
      showToast('Error al importar: archivo inválido', 'error');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

function confirmClearAll() {
  openModal('¿Borrar todos los datos?', 'Se eliminarán todos los trabajos y unidades. Esta acción no se puede deshacer.',
    () => {
      DB.clearAll();
      renderDashboard();
      renderManageView();
      renderUnitsView();
      showToast('Todos los datos eliminados', 'success');
    }
  );
}

/* ================================================================
   MODAL
   ================================================================ */
let _modalCallback = null;
function openModal(title, body, onConfirm) {
  document.getElementById('modal-title').textContent     = title;
  document.getElementById('modal-body-text').textContent = body;
  document.getElementById('modal-overlay').classList.add('open');
  _modalCallback = onConfirm;
  document.getElementById('modal-confirm-btn').onclick = () => {
    _modalCallback && _modalCallback();
    closeModal();
  };
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  _modalCallback = null;
}

/* ================================================================
   TOAST
   ================================================================ */
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.style.opacity = '0', 2800);
  setTimeout(() => toast.remove(), 3200);
}

/* ================================================================
   LOGOUT
   ================================================================ */
function logout() {
  DB.clearSession();
  window.location.href = 'login.html';
}

/* ================================================================
   UTILS
   ================================================================ */
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

// Close modal on overlay click
document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
