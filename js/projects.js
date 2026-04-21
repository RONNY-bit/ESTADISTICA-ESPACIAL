/* =====================================================
   js/projects.js
   Project data management, rendering & filtering
   ===================================================== */

'use strict';

/* ════════════════════════════════════════════════════
   STORAGE
   Uses localStorage to persist across page loads.
   Compatible with GitHub Pages (no backend needed).
   ════════════════════════════════════════════════════ */
const ProjectStore = {
  KEY: 'crqc_portfolio_projects',

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  },

  save(projects) {
    try { localStorage.setItem(this.KEY, JSON.stringify(projects)); } catch (e) {}
  },

  add(project) {
    const list = this.load();
    list.unshift(project);
    this.save(list);
    return list;
  },

  remove(id) {
    const list = this.load().filter(p => p.id !== id);
    this.save(list);
    return list;
  },
};

/* ════════════════════════════════════════════════════
   PROJECT RENDERER
   ════════════════════════════════════════════════════ */
const ProjectRenderer = {
  /** Current filter ('all' | 'Unidad 1' | 'Unidad 2') */
  activeFilter: 'all',

  /**
   * Render all project cards to #projects-grid
   * @param {Array}   projects  - full project list
   * @param {boolean} isAdmin   - show delete buttons?
   */
  render(projects, isAdmin) {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    /* Filter */
    const filtered = this.activeFilter === 'all'
      ? projects
      : projects.filter(p => p.unit === this.activeFilter);

    if (filtered.length === 0) {
      grid.innerHTML = this._emptyState(isAdmin, projects.length === 0);
      return;
    }

    grid.innerHTML = filtered.map((p, idx) => this._cardHTML(p, isAdmin, idx)).join('');

    /* Staggered fade-in */
    grid.querySelectorAll('.project-card').forEach((card, i) => {
      card.style.animationDelay = `${i * 0.06}s`;
    });
  },

  /** Build a single project card */
  _cardHTML(p, isAdmin, idx) {
    const tags = (p.tags || [])
      .map(t => `<span class="pc-tag">${this._esc(t)}</span>`)
      .join('');

    const downloadBtn = this._buildDownloadBtn(p);
    const adminDel    = isAdmin
      ? `<button class="admin-del-btn" onclick="deleteProject('${p.id}')" title="Eliminar trabajo">✕</button>`
      : '';

    const footerContent = (p.pdfPath || p.link)
      ? `<div class="pc-footer">
           <span class="pc-filename">${this._esc(p.filename || (p.pdfPath ? p.pdfPath.split('/').pop() : 'Archivo adjunto'))}</span>
           ${adminDel}
         </div>`
      : (isAdmin && adminDel
          ? `<div class="pc-footer">${adminDel}</div>`
          : '');

    return `
      <div class="project-card" data-unit="${this._esc(p.unit)}">
        <div class="pc-top">
          <div class="pc-icon">${p.icon || '📄'}</div>
          <div class="pc-actions">${downloadBtn}</div>
        </div>
        <div class="pc-title">${this._esc(p.title)}</div>
        <div class="pc-desc">${this._esc(p.desc)}</div>
        <div class="pc-tags">
          <span class="pc-tag unit-tag">${this._esc(p.unit)}</span>
          ${tags}
        </div>
        ${footerContent}
      </div>`;
  },

  /**
   * Build the download/view button for a project.
   * Priority: local PDF path → external link
   */
  _buildDownloadBtn(p) {
    if (p.pdfPath) {
      return `<a href="${this._esc(p.pdfPath)}" download class="dl-link" title="Descargar PDF">↓ PDF</a>`;
    }
    if (p.link) {
      return `<a href="${this._esc(p.link)}" target="_blank" rel="noopener" class="dl-link" title="Ver / Descargar">↓ Ver</a>`;
    }
    return '';
  },

  _emptyState(isAdmin, noProjectsAtAll) {
    const msg = noProjectsAtAll
      ? (isAdmin
          ? 'Usa <strong>+ Publicar</strong> para agregar el primer trabajo.'
          : 'Aún no hay trabajos publicados.<br/>Vuelve pronto.')
      : `No hay trabajos en <strong>${this._esc(this.activeFilter)}</strong> todavía.`;
    return `
      <div class="empty-state">
        <div class="es-icon">📂</div>
        <p class="es-text">${msg}</p>
      </div>`;
  },

  /** Minimal HTML escape */
  _esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },
};

/* ════════════════════════════════════════════════════
   FILTER TABS — wire up at init time
   ════════════════════════════════════════════════════ */
function initFilterTabs() {
  const tabContainer = document.getElementById('filter-tabs');
  if (!tabContainer) return;

  tabContainer.addEventListener('click', e => {
    const btn = e.target.closest('.ftab');
    if (!btn) return;

    tabContainer.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    ProjectRenderer.activeFilter = btn.dataset.filter;
    ProjectRenderer.render(ProjectStore.load(), window._isAdmin || false);
  });
}

/* ════════════════════════════════════════════════════
   PUBLIC API — called from app.js
   ════════════════════════════════════════════════════ */

/** Re-render with current admin status */
function renderProjects(isAdmin) {
  ProjectRenderer.render(ProjectStore.load(), isAdmin);
}

/** Submit a new project (called from modal form) */
function submitProject() {
  if (!window._isAdmin) return;

  const title   = document.getElementById('p-title').value.trim();
  const desc    = document.getElementById('p-desc').value.trim();
  const pdfPath = document.getElementById('p-pdf-path').value.trim();
  const link    = document.getElementById('p-link').value.trim();
  const errEl   = document.getElementById('add-error');

  /* Validation */
  errEl.style.display = 'none';
  if (!title) { _showAddError(errEl, 'El título es obligatorio.'); return; }
  if (!desc)  { _showAddError(errEl, 'La descripción es obligatoria.'); return; }
  if (!pdfPath && !link) { _showAddError(errEl, 'Debes indicar la ruta del PDF o un enlace externo.'); return; }

  const tagsRaw = document.getElementById('p-tags').value.trim();
  const tags    = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  const project = {
    id      : Date.now().toString(36) + Math.random().toString(36).slice(2),
    title,
    desc,
    unit    : document.getElementById('p-unit').value,
    icon    : document.getElementById('p-icon').value,
    tags,
    pdfPath : pdfPath  || null,
    link    : (!pdfPath && link) ? link : null,
    filename: document.getElementById('p-filename') ? document.getElementById('p-filename').value.trim() : '',
    date    : new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' }),
  };

  ProjectStore.add(project);
  renderProjects(true);
  closeModal('modal-add');
  showToast('✓ Trabajo publicado correctamente', 'success');
}

/** Delete a project by id (called from card button) */
function deleteProject(id) {
  if (!window._isAdmin) return;
  if (!confirm('¿Eliminar este trabajo del portafolio?')) return;
  ProjectStore.remove(id);
  renderProjects(true);
  showToast('Trabajo eliminado.', '');
}

function _showAddError(el, msg) {
  el.textContent    = msg;
  el.style.display  = 'block';
}

/* Expose for inline onclick fallback */
window.submitProject  = submitProject;
window.deleteProject  = deleteProject;
window.renderProjects = renderProjects;
