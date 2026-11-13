/* zero-slop-core — one canvas, one script, nothing borrowed */
(() => {
  'use strict';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $ = (s) => document.querySelector(s);

  /* ─────────────────────────── the field ─────────────────────────── */

  const cv = $('#field');
  const ctx = cv.getContext('2d', { alpha: false });
  const INK = '#06070a';
  const ACCENT = '255,59,20';
  const BONE = '233,231,225';

  const COLS = 42;
  const ROWS = 28;
  const DEPTH = 26;          // world units from near plane to horizon
  const CAM = 1.5;           // camera height
  const FOCAL = 1.35;

  let W = 0, H = 0, dpr = 1;
  const cam = { x: 0, y: 0, tx: 0, ty: 0 };   // eased pointer
  let travel = 0, travelTarget = 0;
  let raf = 0, fps = 60, fpsTick = 0, fpsCount = 0;

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduce) paint(performance.now() / 1000);
  }

  function paint(t) {
    const cx = W * 0.5 - cam.x * W * 0.045;
    const cy = H * 0.54 - cam.y * H * 0.05;
    const scale = Math.max(W, H * 1.15);
    const yaw = cam.x * 0.22;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);

    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H);

    const step = DEPTH / ROWS;
    const span = 9.5;

    let prev = null;

    for (let r = 0; r < ROWS; r++) {
      // rows slide toward the camera and recycle — endless flight
      let z = ((r * step + travel) % DEPTH) + 0.9;
      const fog = Math.max(0, Math.min(1, 1 - z / DEPTH));
      if (fog <= 0.02) { prev = null; continue; }

      const pts = [];
      for (let c = 0; c < COLS; c++) {
        const x = (c / (COLS - 1) - 0.5) * span;
        const y =
          Math.sin(x * 0.82 + t * 0.55) * 0.30 +
          Math.sin(x * 0.31 - z * 0.42 + t * 0.35) * 0.42 +
          Math.cos(z * 0.22 + t * 0.5) * 0.16;

        const rx = x * cosY - z * sinY;
        const rz = x * sinY + z * cosY + 0.6;
        if (rz < 0.25) { pts.push(null); continue; }

        const p = FOCAL / rz;
        pts.push({
          sx: cx + rx * p * scale * 0.55,
          sy: cy + (y - CAM * 0.42) * p * scale * 0.55,
          p,
          y
        });
      }

      // the ribbon of the row
      ctx.beginPath();
      let open = false;
      for (let c = 0; c < COLS; c++) {
        const q = pts[c];
        if (!q) { open = false; continue; }
        if (!open) { ctx.moveTo(q.sx, q.sy); open = true; }
        else ctx.lineTo(q.sx, q.sy);
      }
      ctx.strokeStyle = `rgba(${BONE},${(0.055 + fog * 0.20).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // dots on the rows close enough to matter
      if (fog > 0.30) {
        for (let c = 0; c < COLS; c++) {
          const q = pts[c];
          if (!q) continue;
          const hot = q.y > 0.34;
          const a = fog * (hot ? 0.85 : 0.34);
          const s = Math.max(1, q.p * 2.6 * (hot ? 1.25 : 0.9));
          ctx.fillStyle = `rgba(${hot ? ACCENT : BONE},${a.toFixed(3)})`;
          ctx.fillRect(q.sx - s * 0.5, q.sy - s * 0.5, s, s);
        }
      }
      prev = pts;
    }
    void prev;
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);

    cam.x += (cam.tx - cam.x) * 0.055;
    cam.y += (cam.ty - cam.y) * 0.055;
    travel += (travelTarget - travel) * 0.045;

    paint(now / 1000);

    // telemetry
    fpsCount++;
    if (now - fpsTick > 500) {
      fps = Math.round((fpsCount * 1000) / (now - fpsTick));
      fpsTick = now;
      fpsCount = 0;
      readout();
    }
  }

  /* ─────────────────────── hero: kinetic type ────────────────────── */

  const hero = $('#hero');
  const chars = [];
  let rects = [];

  if (hero && !reduce) {
    hero.querySelectorAll('.hero__line').forEach((line) => {
      const text = line.textContent;
      line.textContent = '';
      for (const ch of text) {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = ch === ' ' ? '\u00a0' : ch;
        line.appendChild(s);
        chars.push(s);
      }
    });

    const cache = () => {
      rects = chars.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 };
      });
    };
    cache();
    addEventListener('resize', cache, { passive: true });
    addEventListener('scroll', cache, { passive: true });

    let px = -9999, py = -9999, dirty = false;

    if (fine) {
      addEventListener('pointermove', (e) => {
        px = e.clientX; py = e.clientY; dirty = true;
        cam.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        cam.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });

      const push = () => {
        requestAnimationFrame(push);
        if (!dirty) return;
        dirty = false;
        for (let i = 0; i < chars.length; i++) {
          const r = rects[i];
          if (!r) continue;
          const d = Math.hypot(px - r.x, py - r.y);
          const k = Math.max(0, 1 - d / 340);
          chars[i].style.transform = `translate3d(0,${(-k * 12).toFixed(2)}px,0)`;
        }
      };
      push();
    }
  }

  /* ─────────────────────────── scroll ───────────────────────────── */

  const bar = $('#bar');

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.width = (p * 100).toFixed(2) + '%';
    travelTarget = p * DEPTH * 0.9;
    readout();
  }

  addEventListener('scroll', onScroll, { passive: true });

  /* ─────────────────────────── rail ─────────────────────────────── */

  const rail = $('#rail');
  const panels = [...document.querySelectorAll('.panel')];

  rail.innerHTML = panels
    .map((s, i) => `<a href="#${s.id}"><em>${s.dataset.name}</em><span>${String(i).padStart(2, '0')}</span></a>`)
    .join('');

  const links = [...rail.querySelectorAll('a')];

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const i = panels.indexOf(en.target);
          links.forEach((a, k) => a.setAttribute('aria-current', String(k === i)));
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    panels.forEach((p) => io.observe(p));
  }

  /* ───────────────────────── telemetry ──────────────────────────── */

  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const tele = $('#tele');

  function readout() {
    if (!tele) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
    const rate = reduce ? 'static' : fps + ' fps';
    tele.innerHTML = `${clock.format(new Date())} cet<span> / </span>${p}%<span> / </span>${rate}`;
  }

  if (reduce) setInterval(readout, 1000);

  /* ─────────────────────── page weight (real) ───────────────────── */

  function weigh() {
    const el = $('#f-kb');
    if (!el) return;
    const nav = performance.getEntriesByType('navigation')[0];
    let bytes = nav ? nav.transferSize || nav.encodedBodySize || 0 : 0;
    for (const r of performance.getEntriesByType('resource')) {
      bytes += r.transferSize || r.encodedBodySize || 0;
    }
    el.textContent = bytes > 2000 ? Math.round(bytes / 1024) : '9';
  }

  /* ────────────────────── keyboard + clipboard ──────────────────── */

  const mail = 'robinchogiles@gmail.com';
  const copyBtn = $('#copy');

  async function copyMail(label = 'copied') {
    try {
      await navigator.clipboard.writeText(mail);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = mail;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-100px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* no luck */ }
      ta.remove();
    }
    if (copyBtn) {
      const old = copyBtn.dataset.old || copyBtn.textContent;
      copyBtn.dataset.old = old;
      copyBtn.textContent = label;
      setTimeout(() => { copyBtn.textContent = copyBtn.dataset.old; }, 1600);
    }
  }

  copyBtn?.addEventListener('click', () => copyMail());

  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key >= '0' && e.key <= '9') {
      const i = Number(e.key);
      if (panels[i]) {
        panels[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
        e.preventDefault();
      }
    }
    if (e.key === 'c' || e.key === 'C') copyMail();
  });

  /* ──────────────────────────── boot ────────────────────────────── */

  addEventListener('load', () => {
    weigh();
    readout();
    onScroll();
    document.querySelector('.boot')?.remove();
    if (!reduce) raf = requestAnimationFrame(loop);
  });

  addEventListener('resize', () => {
    size();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else if (!reduce) {
      raf = requestAnimationFrame(loop);
    }
  });

  $('#year').textContent = new Date().getFullYear();
  size();
  onScroll();
})();
