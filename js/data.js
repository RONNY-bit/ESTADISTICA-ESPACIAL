/**
 * js/data.js — Portfolio Data Layer
 * Uses localStorage for persistence + base64 for file storage
 * Works 100% client-side — no server needed
 */

const DB = {
  KEY_UNITS:  'crqc_units',
  KEY_TASKS:  'crqc_tasks',
  KEY_AUTH:   'crqc_auth',
  KEY_CONFIG: 'crqc_config',

  /* ---- UNITS ---- */
  getUnits() {
    const raw = localStorage.getItem(this.KEY_UNITS);
    if (raw) return JSON.parse(raw);
    // Default units
    const defaults = [
      { id: 'u1', name: 'Unidad 1', label: 'U1', desc: 'Trabajos, prácticas y análisis realizados en la primera unidad del curso.' },
      { id: 'u2', name: 'Unidad 2', label: 'U2', desc: 'Trabajos y prácticas de la segunda unidad del curso.' },
    ];
    this.saveUnits(defaults);
    return defaults;
  },
  saveUnits(units) { localStorage.setItem(this.KEY_UNITS, JSON.stringify(units)); },
  addUnit(name, desc) {
    const units = this.getUnits();
    const id = 'u' + (units.length + 1) + '_' + Date.now();
    const label = 'U' + (units.length + 1);
    units.push({ id, name, label, desc: desc || '' });
    this.saveUnits(units);
    return id;
  },
  deleteUnit(id) {
    const units = this.getUnits().filter(u => u.id !== id);
    this.saveUnits(units);
    // also delete tasks of this unit
    const tasks = this.getTasks().filter(t => t.unitId !== id);
    this.saveTasks(tasks);
  },

  /* ---- TASKS ---- */
  getTasks() {
    const raw = localStorage.getItem(this.KEY_TASKS);
    if (raw) return JSON.parse(raw);
    // Seed with original ENA task (no files, just metadata)
    const seed = [{
      id: 'task_seed_1',
      unitId: 'u1',
      title: 'Análisis de la Encuesta Nacional Agropecuaria (ENA)',
      desc: 'Análisis estadístico espacial de la ENA utilizando R Studio.',
      tags: ['R Studio', 'Estadística Espacial', 'ENA'],
      icon: '📊',
      files: [],
      links: [],
      createdAt: new Date().toISOString(),
    }];
    this.saveTasks(seed);
    return seed;
  },
  saveTasks(tasks) { localStorage.setItem(this.KEY_TASKS, JSON.stringify(tasks)); },
  getTasksByUnit(unitId) { return this.getTasks().filter(t => t.unitId === unitId); },
  addTask(task) {
    const tasks = this.getTasks();
    task.id = 'task_' + Date.now();
    task.createdAt = new Date().toISOString();
    tasks.push(task);
    this.saveTasks(tasks);
    return task.id;
  },
  updateTask(id, updates) {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) { tasks[idx] = { ...tasks[idx], ...updates }; this.saveTasks(tasks); }
  },
  deleteTask(id) {
    const tasks = this.getTasks().filter(t => t.id !== id);
    this.saveTasks(tasks);
  },
  getTask(id) { return this.getTasks().find(t => t.id === id); },

  /* ---- AUTH ---- */
  getCredentials() {
    const raw = localStorage.getItem(this.KEY_AUTH);
    if (raw) return JSON.parse(raw);
    // Default credentials (change these after first login!)
    return { username: 'admin', password: 'crqc2026' };
  },
  saveCredentials(creds) { localStorage.setItem(this.KEY_AUTH, JSON.stringify(creds)); },
  checkLogin(user, pass) {
    const creds = this.getCredentials();
    return creds.username === user && creds.password === pass;
  },
  setSession()    { sessionStorage.setItem('crqc_session', '1'); },
  clearSession()  { sessionStorage.removeItem('crqc_session'); },
  isLoggedIn()    { return sessionStorage.getItem('crqc_session') === '1'; },

  /* ---- CONFIG ---- */
  getConfig() {
    const raw = localStorage.getItem(this.KEY_CONFIG);
    return raw ? JSON.parse(raw) : { name: 'Clever Ronny Quenta Chura', course: 'Estadística Espacial', year: '2026', uni: 'UNA Puno' };
  },

  /* ---- UTILS ---- */
  getStats() {
    const tasks  = this.getTasks();
    const units  = this.getUnits();
    const files  = tasks.flatMap(t => t.files || []);
    const links  = tasks.flatMap(t => t.links || []);
    return { tasks: tasks.length, units: units.length, files: files.length, links: links.length };
  },

  exportJSON() {
    return JSON.stringify({
      units: this.getUnits(),
      tasks: this.getTasks(),
    }, null, 2);
  },

  importJSON(jsonStr) {
    const data = JSON.parse(jsonStr);
    if (data.units) this.saveUnits(data.units);
    if (data.tasks) this.saveTasks(data.tasks);
  },

  clearAll() {
    localStorage.removeItem(this.KEY_UNITS);
    localStorage.removeItem(this.KEY_TASKS);
  }
};

/* ---- FILE UTILS ---- */
const FileUtils = {
  /**
   * Read a file as base64 data URL
   */
  readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Trigger download from base64 data URL
   */
  downloadDataURL(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  },

  /**
   * Open a base64 file in a new tab
   */
  openDataURL(dataUrl, filename) {
    const win = window.open();
    if (!win) { alert('Permite las ventanas emergentes para ver archivos.'); return; }
    if (dataUrl.startsWith('data:application/pdf') || filename.endsWith('.pdf')) {
      win.document.write(`
        <html><head><title>${filename}</title></head>
        <body style="margin:0;padding:0;background:#000;">
          <embed src="${dataUrl}" type="application/pdf" width="100%" height="100%" style="position:fixed;inset:0;" />
        </body></html>
      `);
    } else {
      win.document.write(`
        <html><head><title>${filename}</title>
        <style>body{background:#0a0b0f;color:#e8eaf0;font-family:'JetBrains Mono',monospace;padding:2rem;white-space:pre-wrap;font-size:0.85rem;line-height:1.7;}</style>
        </head><body id="c"></body></html>
      `);
      // Decode base64 to text for code files
      try {
        const b64 = dataUrl.split(',')[1];
        const text = atob(b64);
        win.document.getElementById('c').textContent = text;
      } catch(e) {
        win.location = dataUrl;
      }
    }
  },

  getIcon(filename, type) {
    if (!filename) return '🔗';
    const ext = filename.split('.').pop().toLowerCase();
    const icons = { pdf:'📄', r:'📊', rmd:'📋', rdata:'💾', csv:'📊', xlsx:'📗', docx:'📝', doc:'📝', zip:'🗜️', rar:'🗜️', png:'🖼️', jpg:'🖼️', jpeg:'🖼️', html:'🌐', py:'🐍', md:'📝' };
    return icons[ext] || '📁';
  },

  getBadgeClass(filename) {
    if (!filename) return 'badge-link';
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'badge-pdf';
    if (ext === 'r') return 'badge-r';
    if (ext === 'rmd') return 'badge-rmd';
    if (['doc','docx'].includes(ext)) return 'badge-doc';
    if (['zip','rar'].includes(ext)) return 'badge-zip';
    return 'badge-other';
  },

  formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/1024/1024).toFixed(1) + ' MB';
  }
};
