/* =====================================================
   js/background.js
   Animated particle canvas background
   ===================================================== */

(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');

  let W, H;
  let particles = [];
  let mouseX = -9999, mouseY = -9999;
  let animFrame;

  /* ── CONFIG ── */
  const CONFIG = {
    particleCount : 90,
    particleMinR  : 0.5,
    particleMaxR  : 2,
    speed         : 0.35,
    connectDist   : 130,
    connectOpacity: 0.18,
    gridSize      : 70,
    mouseRadius   : 120,
    colors        : ['rgba(0,210,255,', 'rgba(0,255,157,', 'rgba(0,150,255,'],
  };

  /* ── RESIZE ── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* ── PARTICLE CLASS ── */
  class Particle {
    constructor() { this.reset(); }

    reset() {
      this.x   = Math.random() * W;
      this.y   = Math.random() * H;
      this.vx  = (Math.random() - 0.5) * CONFIG.speed;
      this.vy  = (Math.random() - 0.5) * CONFIG.speed;
      this.r   = CONFIG.particleMinR + Math.random() * (CONFIG.particleMaxR - CONFIG.particleMinR);
      this.a   = 0.1 + Math.random() * 0.45;
      this.col = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
    }

    update() {
      /* Mouse repulsion */
      const dx   = this.x - mouseX;
      const dy   = this.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.mouseRadius && dist > 0) {
        const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius;
        this.vx += (dx / dist) * force * 0.6;
        this.vy += (dy / dist) * force * 0.6;
      }

      /* Damping */
      this.vx *= 0.992;
      this.vy *= 0.992;

      /* Clamp speed */
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > CONFIG.speed * 3) {
        this.vx = (this.vx / speed) * CONFIG.speed * 3;
        this.vy = (this.vy / speed) * CONFIG.speed * 3;
      }

      this.x += this.vx;
      this.y += this.vy;

      /* Bounce off walls */
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;
      this.x = Math.max(0, Math.min(W, this.x));
      this.y = Math.max(0, Math.min(H, this.y));
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.col + this.a + ')';
      ctx.fill();
    }
  }

  /* ── INIT PARTICLES ── */
  function initParticles() {
    particles = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      particles.push(new Particle());
    }
  }

  /* ── DRAW GRID ── */
  function drawGrid() {
    ctx.strokeStyle = 'rgba(0,210,255,0.035)';
    ctx.lineWidth   = 0.5;
    for (let x = 0; x <= W; x += CONFIG.gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += CONFIG.gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  /* ── DRAW AMBIENT GLOW ── */
  function drawAmbient() {
    /* top-left glow */
    const g1 = ctx.createRadialGradient(W * 0.15, H * 0.25, 0, W * 0.15, H * 0.25, W * 0.45);
    g1.addColorStop(0, 'rgba(0,100,255,0.06)');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    /* bottom-right glow */
    const g2 = ctx.createRadialGradient(W * 0.85, H * 0.75, 0, W * 0.85, H * 0.75, W * 0.4);
    g2.addColorStop(0, 'rgba(0,210,255,0.05)');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    /* mouse glow */
    if (mouseX > 0) {
      const gm = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 120);
      gm.addColorStop(0, 'rgba(0,210,255,0.04)');
      gm.addColorStop(1, 'transparent');
      ctx.fillStyle = gm;
      ctx.fillRect(0, 0, W, H);
    }
  }

  /* ── DRAW CONNECTIONS ── */
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.connectDist) {
          const alpha = CONFIG.connectOpacity * (1 - dist / CONFIG.connectDist);
          ctx.strokeStyle = `rgba(0,210,255,${alpha})`;
          ctx.lineWidth   = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  /* ── MAIN LOOP ── */
  function animate() {
    ctx.clearRect(0, 0, W, H);

    drawGrid();
    drawAmbient();

    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();

    animFrame = requestAnimationFrame(animate);
  }

  /* ── EVENTS ── */
  window.addEventListener('resize', () => {
    resize();
    initParticles();
  });

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouseX = -9999;
    mouseY = -9999;
  });

  /* ── START ── */
  resize();
  initParticles();
  animate();

})();
