/* =====================================================
   js/app.js
   Main application: auth, UI interactions, animations
   ===================================================== */

'use strict';

/* ════════════════════════════════════════════════════
   CONFIG — Change before deploying
   ════════════════════════════════════════════════════ */
const ADMIN_PASSWORD = 'ronny2026';

/* ════════════════════════════════════════════════════
   STATE
   ════════════════════════════════════════════════════ */
window._isAdmin = false;

/* ════════════════════════════════════════════════════
   TYPEWRITER EFFECT
   ════════════════════════════════════════════════════ */
(function initTypewriter() {
  const el       = document.getElementById('typewriter');
  if (!el) return;

  const phrases  = [
    'Estadística Espacial — UNA Puno',
    'Análisis Espacial con R Studio',
    'Sistemas de Información Geográfica',
    'Modelamiento del territorio altiplánico',
  ];
  let pi = 0, ci = 0, deleting = false, pausing = false;

  function tick() {
    const phrase = phrases[pi];

    if (pausing) { pausing = false; setTimeout(tick, 1800); return; }

    if (!deleting) {
      el.textContent = phrase.slice(0, ++ci);
      if (ci === phrase.length) { deleting = true; pausing = true; }
      setTimeout(tick, 75);
    } else {
      el.textContent = phrase.slice(0, --ci);
      if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
      setTimeout(tick, 38);
    }
  }

  setTimeout(tick, 1200);
})();

/* ════════════════════════════════════════════════════
   NAVBAR SCROLL EFFECT
   ════════════════════════════════════════════════════ */
(function initNavScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();

/* ════════════════════════════════════════════════════
   SCROLL REVEAL
   ════════════════════════════════════════════════════ */
(function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal, .reveal-card').forEach(el => io.observe(el));

  /* Skill bars — animate when visible */
  const barIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.skb-fill').forEach(bar => bar.classList.add('animated'));
        barIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const skillsList = document.querySelector('.skills-bar-list');
  if (skillsList) barIO.observe(skillsList);
})();

/* ════════════════════════════════════════════════════
   AUTH
   ════════════════════════════════════════════════════ */
function openAdminLogin() {
  if (window._isAdmin) { logout(); return; }
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').style.display = 'none';
  openModal('modal-login');
  setTimeout(() => document.getElementById('login-password').focus(), 320);
}

function doLogin() {
  const pass  = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

  if (pass === ADMIN_PASSWORD) {
    window._isAdmin = true;
    closeModal('modal-login');

    document.getElementById('admin-banner').classList.add('visible');
    document.getElementById('admin-add-wrap').style.display = 'flex';

    const btn = document.getElementById('nav-admin-btn');
    btn.textContent = '// salir';
    btn.classList.add('logged');

    renderProjects(true);
    showToast('✓ Sesión iniciada como administrador', 'success');
  } else {
    errEl.style.display = 'block';
    document.getElementById('login-password').focus();
    document.getElementById('login-password').select();
  }
}

function logout() {
  window._isAdmin = false;
  document.getElementById('admin-banner').classList.remove('visible');
  document.getElementById('admin-add-wrap').style.display = 'none';

  const btn = document.getElementById('nav-admin-btn');
  btn.textContent = '// admin';
  btn.classList.remove('logged');

  renderProjects(false);
  showToast('Sesión cerrada.', '');
}

/* ════════════════════════════════════════════════════
   ADD PROJECT MODAL
   ════════════════════════════════════════════════════ */
function openAddProject() {
  if (!window._isAdmin) return;
  /* Reset form */
  ['p-title', 'p-desc', 'p-tags', 'p-pdf-path', 'p-link'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const filenameEl = document.getElementById('p-filename');
  if (filenameEl) filenameEl.value = '';
  document.getElementById('add-error').style.display = 'none';
  openModal('modal-add');
}

/* ════════════════════════════════════════════════════
   MODAL HELPERS
   ════════════════════════════════════════════════════ */
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  document.body.style.overflow = '';
}

/* Close on backdrop click */
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) closeModal(el.id); });
});

/* Close on Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(el => closeModal(el.id));
  }
});

/* Enter key in login form */
document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

/* ════════════════════════════════════════════════════
   TOAST
   ════════════════════════════════════════════════════ */
let _toastTimer = null;

function showToast(msg, type) {
  const el = document.getElementById('toast');
  if (!el) return;

  el.textContent  = msg;
  el.className    = `toast ${type || ''}`;
  void el.offsetWidth;          /* force reflow to re-trigger transition */
  el.classList.add('show');

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ════════════════════════════════════════════════════
   EXPOSE GLOBALS (called from inline HTML onclick attrs)
   ════════════════════════════════════════════════════ */
window.openAdminLogin  = openAdminLogin;
window.doLogin         = doLogin;
window.logout          = logout;
window.openAddProject  = openAddProject;
window.openModal       = openModal;
window.closeModal      = closeModal;
window.showToast       = showToast;

/* ════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  /* Init filter tabs (defined in projects.js) */
  if (typeof initFilterTabs === 'function') initFilterTabs();

  /* Initial project render (not logged in) */
  renderProjects(false);

  /* Smooth active nav link on scroll */
  const sections = document.querySelectorAll('section[id], header[id]');
  const links    = document.querySelectorAll('.nav-links a');

  const secIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => secIO.observe(s));
});
