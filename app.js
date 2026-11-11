/* ----------------------------------------------------------------
   Robin Lab — a corridor built out of flat polygons and walked
   with the scroll. No libraries: the projection, the fog and the
   little 3D scene are all here. Same result in Safari, Chrome,
   Firefox, because it is one canvas.
   ---------------------------------------------------------------- */
(() => {
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const deck = document.getElementById('deck');
  const cards = Array.from(deck.querySelectorAll('.card'));
  const spacer = document.getElementById('spacer');
  const rail = document.getElementById('rail');
  const back = document.getElementById('back');
  const noEl = document.getElementById('status-no');
  const nameEl = document.getElementById('status-name');
  const totEl = document.getElementById('status-total');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---- the room, in metres (reset on resize) ---- */
  let W = 2.05;            // half width
  let H = 1.32;            // half height
  let CARD_X = 1.24;       // where the paintings hang
  let CARD_M = 1.80;       // painting width
  let RW = 0.82;           // half width of the rug
  const GAP = 3.35;        // distance between paintings
  const SEG = 2.30;        // depth of one slice of wall
  const NEAR = 0.42;
  const BEYOND = 2.0;

  const CARD_W = 400;
  const CARD_H = 292;

  const totalLen = cards.length * GAP + BEYOND;
  const camEnd = (cards.length + 0.15) * GAP - 3.4;

  const accents = cards.map((c) => c.dataset.accent || '#e4572e');
  const sides = cards.map((c) => (c.dataset.side === 'left' ? -1 : 1));

  /* ---- palette ---- */
  const P = {
    ceil:   [0.83, 0.81, 0.88],
    wallHi: [0.98, 0.95, 0.89],
    wallLo: [0.87, 0.81, 0.73],
    rail:   [0.56, 0.43, 0.33],
    base:   [0.44, 0.33, 0.25],
    plankA: [0.83, 0.69, 0.53],
    plankB: [0.81, 0.67, 0.52],
    plankC: [0.79, 0.65, 0.50],
    rug:    [0.42, 0.54, 0.54],
    rugHi:  [0.87, 0.83, 0.72],
    wood:   [0.43, 0.30, 0.22],
    metal:  [0.34, 0.29, 0.27],
    glass:  [1.00, 0.88, 0.60],
    pot:    [0.70, 0.48, 0.38],
    leafA:  [0.37, 0.56, 0.41],
    leafB:  [0.50, 0.69, 0.52],
    fog:    [0.84, 0.82, 0.91]
  };
  const LIGHT = (() => {
    const v = [0.34, -0.90, -0.27];
    const l = Math.hypot(...v);
    return v.map((n) => n / l);
  })();

  /* ---- projection state ---- */
  let vw = 0, vh = 0, dpr = 1, f = 800, cx = 0, cy = 0;
  let pxPerM = 120, scrollRange = 1;
  let parX = 0, parY = 0, parXT = 0, parYT = 0;
  let portrait = false;

  /* ---- motion state ---- */
  let camZ = 0, camTo = 0, focusI = -1, focusT = 0, active = -1;

  /* ---- the scene ---- */
  const faces = [];        // { v:[[x,y,z]..], c:[r,g,b], lit:string, em:0..1, d:number }
  const sprites = [];      // { x,y,z,r,c,a,sq,glyph }
  const dust = [];

  /* ---------------------------------------------------------- sizing */

  function resize() {
    vw = innerWidth;
    vh = innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';

    portrait = vh > vw * 1.15;
    W = portrait ? 1.38 : 1.78;
    H = portrait ? 0.98 : 1.18;
    CARD_X = portrait ? 0.64 : 1.10;
    CARD_M = portrait ? 2.0 : 1.80;
    RW = clamp(W * 0.40, 0.45, 0.78);

    f = portrait ? clamp(vw * 1.15, 260, 900) : clamp(Math.min(vh * 1.02, vw * 0.62), 250, 1000);
    cx = vw * 0.5;
    cy = vh * (portrait ? 0.50 : 0.50);

    pxPerM = clamp(vh * 0.16, 95, 200);
    scrollRange = Math.max(1, camEnd * pxPerM);
    spacer.style.height = Math.round(scrollRange + vh) + 'px';

    buildScene();
  }

  const proj = (x, y, zr) => {
    const s = f / -zr;
    return [cx + x * s, cy + y * s, s];
  };
  const wproj = (x, y, zw) => proj(x, y, camZ - zw);

  /* -------------------------------------------------------- geometry */

  function shade(col, a, b, c) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const n = Math.hypot(nx, ny, nz) || 1;
    nx /= n; ny /= n; nz /= n;
    const d = Math.abs(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
    const k = 0.74 + 0.32 * d;
    return `rgb(${clamp(col[0] * k * 255, 0, 255) | 0},${clamp(col[1] * k * 255, 0, 255) | 0},${clamp(col[2] * k * 255, 0, 255) | 0})`;
  }

  function addPoly(v, col, em, alpha) {
    const lit = shade(col, v[0], v[1], v[2]);
    let z = 0;
    for (const p of v) z += p[2];
    faces.push({ v, c: col, lit, em: em || 0, a: alpha || 0, z: z / v.length });
  }

  /* axis aligned box: origin + size */
  function addBox(x, y, z, w, h, d, col, em) {
    const x2 = x + w, y2 = y + h, z2 = z + d;
    addPoly([[x, y, z], [x2, y, z], [x2, y2, z], [x, y2, z]], col, em);
    addPoly([[x, y, z2], [x2, y, z2], [x2, y2, z2], [x, y2, z2]], col, em);
    addPoly([[x, y, z], [x2, y, z], [x2, y, z2], [x, y, z2]], col, em);
    addPoly([[x, y2, z], [x2, y2, z], [x2, y2, z2], [x, y2, z2]], col, em);
    addPoly([[x, y, z], [x, y2, z], [x, y2, z2], [x, y, z2]], col, em);
    addPoly([[x2, y, z], [x2, y2, z], [x2, y2, z2], [x2, y, z2]], col, em);
  }

  function addLamp(z, side) {
    const top = -H;
    const lx = side * (W - 0.40);
    // chain
    addBox(lx - 0.014, top, z - 0.014, 0.028, 0.34, 0.028, P.metal);
    // cap + body + glass
    const by = top + 0.34;
    addBox(lx - 0.17, by, z - 0.17, 0.34, 0.06, 0.34, P.metal);
    addBox(lx - 0.13, by + 0.06, z - 0.13, 0.26, 0.30, 0.26, P.glass, 1);
    addBox(lx - 0.15, by + 0.06, z - 0.15, 0.30, 0.035, 0.30, P.metal);
    addBox(lx - 0.15, by + 0.33, z - 0.15, 0.30, 0.035, 0.30, P.metal);
    addBox(lx - 0.17, by + 0.36, z - 0.17, 0.34, 0.06, 0.34, P.metal);
    addBox(lx - 0.025, by + 0.42, z - 0.025, 0.05, 0.05, 0.05, P.metal);
    sprites.push({ x: lx, y: by + 0.21, z, r: 0.30, a: 0.26, c: [1, 0.82, 0.52] });
    sprites.push({ x: lx, y: H - 0.01, z, r: 0.80, a: 0.11, c: [1, 0.80, 0.50], sq: 0.30 });
  }

  function addSconce(side, z) {
    const x = side * W;
    const y = -H * 0.42;
    addBox(Math.min(x, x - side * 0.16), y, z - 0.04, 0.16, 0.06, 0.08, P.metal);
    addBox(Math.min(x, x - side * 0.10) - 0.0, y - 0.035, z - 0.10, 0.10, 0.07, 0.20, P.metal);
    addBox(Math.min(x, x - side * 0.13), y + 0.02, z - 0.075, 0.13, 0.20, 0.15, P.glass, 1);
    sprites.push({ x: x - side * 0.24, y: y + 0.12, z, r: 0.24, a: 0.22, c: [1, 0.84, 0.56] });
  }

  function addPlant(side, z) {
    const x = side * (W - 0.26);
    const yb = H;
    addBox(x - 0.12, yb - 0.28, z - 0.12, 0.24, 0.28, 0.24, P.pot);
    addBox(x - 0.14, yb - 0.32, z - 0.14, 0.28, 0.045, 0.28, P.rail);
    const top = yb - 0.32;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3;
      const reach = 0.20 + (i % 3) * 0.07;
      const h = 0.26 + (i % 4) * 0.08;
      const ca = Math.cos(a), sa = Math.sin(a);
      const px = -sa * 0.055, pz = ca * 0.055;
      addPoly([
        [x - px, top, z - pz],
        [x + ca * reach, top - h, z + sa * reach],
        [x + px, top, z + pz]
      ], i % 2 ? P.leafA : P.leafB);
    }
  }

  function buildScene() {
    faces.length = 0;
    sprites.length = 0;

    const L = totalLen;
    const eye = 0.34 * H;

    for (let z0 = 0; z0 < L - 0.01; z0 += SEG) {
      const z1 = Math.min(L, z0 + SEG);
      // ceiling + cornice
      addPoly([[-W, -H, z0], [W, -H, z0], [W, -H, z1], [-W, -H, z1]], P.ceil);
      // walls: plaster above, wainscot below
      for (const sd of [-1, 1]) {
        const x = sd * W;
        addPoly([[x, -H, z0], [x, -H, z1], [x, eye, z1], [x, eye, z0]], P.wallHi);
        addPoly([[x, eye, z0], [x, eye, z1], [x, H, z1], [x, H, z0]], P.wallLo);
        addBox(x - (sd > 0 ? 0.055 : 0), -H, z0, 0.055, 0.10, z1 - z0, P.rail);
        addBox(x - (sd > 0 ? 0.075 : 0), eye - 0.035, z0, 0.075, 0.07, z1 - z0, P.rail);
        addBox(x - (sd > 0 ? 0.07 : 0), H - 0.11, z0, 0.07, 0.11, z1 - z0, P.base);
      }
      // the rail every painting hangs from
      for (const sd of [-1, 1]) {
        addBox(sd * (W - 0.03) - 0.02, -0.05, z0, 0.04, 0.035, z1 - z0, P.rail);
      }
      // a wooden rib across the ceiling
      addBox(-W, -H, z0 - 0.08, 2 * W, 0.07, 0.16, P.rail);
      addBox(-W, -H, z0 + (z1 - z0) * 0.5 - 0.06, 2 * W, 0.055, 0.12, P.rail);
      // floor boards
      let i = 0;
      for (let x = -W; x < W - 0.02; x += 0.68, i++) {
        const x2 = Math.min(W, x + 0.68);
        addPoly([[x, H, z0], [x2, H, z0], [x2, H, z1], [x, H, z1]],
          i % 3 === 0 ? P.plankA : i % 3 === 1 ? P.plankB : P.plankC);
      }
      // soft shadow where the floor meets the walls
      for (const sd of [-1, 1]) {
        addPoly([[sd * W, H - 0.002, z0], [sd * (W - 0.5), H - 0.002, z0],
                 [sd * (W - 0.5), H - 0.002, z1], [sd * W, H - 0.002, z1]], P.base, 0, 0.14);
      }
      // the rug, slice by slice
      if (z1 > 0.6 && z0 < L - 1.4) {
        const a = Math.max(z0, 0.6), b = Math.min(z1, L - 1.4);
        addPoly([[-RW, H - 0.004, a], [RW, H - 0.004, a], [RW, H - 0.004, b], [-RW, H - 0.004, b]], P.rug);
        for (const e of [-RW, RW - 0.24]) {
          addPoly([[e, H - 0.007, a], [e + 0.24, H - 0.007, a], [e + 0.24, H - 0.007, b], [e, H - 0.007, b]], P.rugHi);
        }
      }
    }

    // lanterns between the paintings
    for (let k = 0; k <= cards.length; k++) addLamp(0.55 + k * GAP + 1.45, k % 2 ? 1 : -1);
    // clouds floating above the corridor
    for (let i = 0; i < 18; i++) {
      const a = i * 2.399;
      sprites.push({
        x: Math.cos(a) * (W * 0.9),
        y: -H + 0.03,
        z: 1.5 + ((i * 7.31) % 1) * 0 + (i / 18) * (L - 3),
        r: 0.75 + ((i * 0.37) % 1) * 1.1,
        a: 0.05 + ((i * 0.61) % 1) * 0.09,
        c: [1, 1, 1],
        sq: 0.5,
        wind: true,
        ph: i * 1.7
      });
    }

    // sconces between the paintings
    for (let k = 0; k < cards.length; k++) {
      addSconce(k % 2 ? 1 : -1, 1.6 + k * GAP + 1.35);
    }

    // plants in the corners
    for (let k = 0; k < cards.length - 1; k++) {
      addPlant(k % 2 ? 1 : -1, 1.6 + k * GAP + 1.3);
    }

    // dust
    dust.length = 0;
    for (let i = 0; i < 80; i++) {
      dust.push({
        z: 1 + Math.random() * (L - 2),
        x: (Math.random() * 2 - 1) * (W - 0.3),
        y: (Math.random() * 2 - 1) * (H - 0.2),
        r: 0.5 + Math.random() * 1.8,
        ph: Math.random() * 6.28
      });
    }
    // floating glyphs
    for (let i = 0; i < 12; i++) {
      sprites.push({
        x: (Math.random() * 2 - 1) * (W - 0.5),
        y: (Math.random() * 2 - 1) * (H - 0.35),
        z: 2 + Math.random() * (L - 3),
        r: 0.018 + Math.random() * 0.022,
        a: 0.34,
        c: [[0.98, 0.80, 0.55], [0.62, 0.74, 0.96], [0.72, 0.92, 0.78], [0.96, 0.74, 0.86]][i % 4],
        glyph: true,
        ph: Math.random() * 6.28,
        sp: 0.15 + Math.random() * 0.3
      });
    }
  }

  /* ----------------------------------------------------------- paint */

  /* keep only the part of a polygon that is in front of the near plane */
  function clipNear(v, zmin) {
    const out = [];
    for (let i = 0; i < v.length; i++) {
      const a = v[i], b = v[(i + 1) % v.length];
      const ain = a[2] >= zmin, bin = b[2] >= zmin;
      if (ain) out.push(a);
      if (ain !== bin) {
        const t = (zmin - a[2]) / (b[2] - a[2]);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, zmin]);
      }
    }
    return out;
  }

  const fogCol = `rgb(${(P.fog[0] * 255) | 0},${(P.fog[1] * 255) | 0},${(P.fog[2] * 255) | 0})`;

  function drawWorld(now) {
    const cam = camZ;
    const L = totalLen;

    /* the wall at the end of the corridor */
    const ez = cam - L;
    if (ez < -NEAR) {
      const [bx, by, bs] = proj(0, 0, ez);
      const bw = W * bs, bh = H * bs;
      const g = ctx.createLinearGradient(0, by - bh, 0, by + bh);
      g.addColorStop(0, '#b9b6e0');
      g.addColorStop(0.45, '#d8c4e2');
      g.addColorStop(0.78, '#f3c9b4');
      g.addColorStop(1, '#ffe0bd');
      ctx.fillStyle = g;
      ctx.fillRect(bx - bw, by - bh, bw * 2, bh * 2);

      // the glowing arch
      const aw = bw * 0.50, ah = bh * 0.92;
      const ax = bx, ay = by + bh * 0.98;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ax - aw / 2, ay);
      ctx.lineTo(ax - aw / 2, ay - ah * 0.62);
      ctx.arc(ax, ay - ah * 0.62, aw / 2, Math.PI, 0);
      ctx.lineTo(ax + aw / 2, ay);
      ctx.closePath();
      const ag = ctx.createLinearGradient(0, ay - ah, 0, ay);
      ag.addColorStop(0, 'rgba(255,252,240,.80)');
      ag.addColorStop(1, 'rgba(255,228,186,.38)');
      ctx.fillStyle = ag;
      ctx.fill();
      ctx.restore();

      ctx.globalCompositeOperation = 'lighter';
      const gl = ctx.createRadialGradient(ax, ay - ah * 0.5, 0, ax, ay - ah * 0.5, aw * 1.2);
      gl.addColorStop(0, 'rgba(255,246,222,.28)');
      gl.addColorStop(0.45, 'rgba(255,214,170,.10)');
      gl.addColorStop(1, 'rgba(255,200,160,0)');
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(ax, ay - ah * 0.5, aw * 1.2, 0, 6.2832);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    /* geometry: project, fog, sort, paint */
    const zmin = cam + NEAR;
    const list = [];
    for (let i = 0; i < faces.length; i++) {
      const fa = faces[i];
      if (fa.z < zmin - 2.6 || fa.z > L) continue;
      const poly = fa.v.some((p) => p[2] < zmin) ? clipNear(fa.v, zmin) : fa.v;
      if (poly.length < 3) continue;
      const pts = [];
      let dsum = 0;
      for (const p of poly) {
        const [sx, sy] = proj(p[0], p[1], cam - p[2]);
        pts.push(sx, sy);
        dsum += p[2] - cam;
      }
      const dist = dsum / poly.length;
      list.push({ pts, dist, fa });
    }
    list.sort((a, b) => b.dist - a.dist);

    const fogNear = 1.2, fogFar = L * 0.72;
    for (const it of list) {
      const fa = it.fa;
      const t = clamp((it.dist - fogNear) / (fogFar - fogNear), 0, 1);
      const a = t * t * (3 - 2 * t) * 0.92;
      if (fa.a) ctx.fillStyle = `rgba(24,12,4,${fa.a.toFixed(3)})`;
      else if (fa.em) ctx.fillStyle = `rgba(255,228,168,${(1 - a).toFixed(3)})`;
      else if (a < 0.02) ctx.fillStyle = fa.lit;
      else ctx.fillStyle = mix(fa.c, P.fog, a);
      ctx.beginPath();
      ctx.moveTo(it.pts[0], it.pts[1]);
      for (let i = 2; i < it.pts.length; i += 2) ctx.lineTo(it.pts[i], it.pts[i + 1]);
      ctx.closePath();
      ctx.fill();
    }

    /* additive light: lanterns, pools, glyphs, dust */
    ctx.globalCompositeOperation = 'lighter';
    for (const s of sprites) {
      const zr = cam - s.z;
      if (zr > -0.6 || zr < -L - 2) continue;
      const wx = s.wind && !reduced ? s.x + Math.sin(now / 9000 + s.ph) * 0.35 : s.x;
      const [sx, sy, ss] = proj(wx, s.y, zr);
      const fade = clamp(1 - (zr + 8) / (L * 0.9), 0.12, 1) * clamp((-zr - 0.7) / 1.6, 0, 1);
      let r = s.r * ss;
      if (r < 0.6) continue;
      r = Math.min(r, Math.max(vw, vh) * 0.9);
      if (s.glyph) {
        const bob = reduced ? 0 : Math.sin(now / 900 + s.ph) * 0.06;
        const spin = reduced ? 0.7 : now / 1400 + s.ph;
        const q = r * 1.9;
        ctx.save();
        ctx.translate(sx, sy + bob * ss);
        ctx.rotate(spin);
        ctx.fillStyle = `rgba(${(s.c[0] * 255) | 0},${(s.c[1] * 255) | 0},${(s.c[2] * 255) | 0},${(s.a * fade).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, -q); ctx.lineTo(q * 0.72, 0); ctx.lineTo(0, q); ctx.lineTo(-q * 0.72, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        continue;
      }
      const pulse = reduced ? 1 : 1 + Math.sin(now / 1300 + s.z) * 0.06;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * pulse);
      g.addColorStop(0, `rgba(${(s.c[0] * 255) | 0},${(s.c[1] * 255) | 0},${(s.c[2] * 255) | 0},${(s.a * fade).toFixed(3)})`);
      g.addColorStop(0.5, `rgba(${(s.c[0] * 255) | 0},${(s.c[1] * 255) | 0},${(s.c[2] * 255) | 0},${(s.a * fade * 0.25).toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,200,150,0)');
      ctx.save();
      if (s.sq) {
        ctx.translate(sx, sy);
        ctx.scale(1, s.sq);
        ctx.translate(-sx, -sy);
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, r * pulse, 0, 6.2832);
      ctx.fill();
      ctx.restore();
    }

    for (const p of dust) {
      const zr = cam - p.z;
      if (zr > -0.5) continue;
      const wob = reduced ? 0 : Math.sin(now / 1700 + p.ph) * 0.05;
      const [dx, dy, ds] = proj(p.x + wob, p.y + wob * 0.6, zr);
      const r = clamp(p.r * ds * 0.005, 0.5, 2.6);
      const a = clamp(1 - -zr / (L * 0.8), 0.05, 0.45);
      ctx.fillStyle = `rgba(255,246,224,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function mix(a, b, t) {
    return `rgb(${(a[0] + (b[0] - a[0]) * t) * 255 | 0},${(a[1] + (b[1] - a[1]) * t) * 255 | 0},${(a[2] + (b[2] - a[2]) * t) * 255 | 0})`;
  }

  function hexA(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  /* ----------------------------------------------------------- cards */

  function drawCards() {
    const t = focusT * focusT * (3 - 2 * focusT);
    const focusK = clamp(Math.min(vw * 0.82, 640) / CARD_W, 0.6, 1.7);

    for (let i = 0; i < cards.length; i++) {
      const el = cards[i];
      const z = -(i + 1.15) * GAP + camZ;
      const dist = -z;
      const s = f / Math.max(NEAR, dist);
      let x = cx + (el.dataset.center ? 0 : sides[i] * CARD_X * s);
      let y = cy - 0.02 * s;
      let k = (CARD_M * s) / CARD_W;
      let op = 1;
      let zIndex = Math.round(400 - dist * 4);

      if (dist < 0.95) op = 0;
      else if (dist < 1.4) op = (dist - 0.95) / 0.45;
      const cover = (CARD_M * s) / vw;
      if (cover > 0.85) op *= clamp((1.15 - cover) / 0.3, 0, 1);
      if (dist > 20) op *= clamp(1 - (dist - 20) / 6, 0, 1);

      if (focusI > -1 && i !== focusI) op *= 1 - 0.86 * focusT;

      if (i === focusI) {
        x = lerp(x, vw / 2, t);
        y = lerp(y, vh / 2 - 6, t);
        k = lerp(k, focusK, t);
        op = 1;
        zIndex = 900;
      }

      if (op < 0.02) {
        el.style.visibility = 'hidden';
        continue;
      }
      el.style.visibility = 'visible';
      el.style.opacity = op.toFixed(3);
      el.style.zIndex = zIndex;
      el.style.transform =
        `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${k.toFixed(4)})`;
      el.style.pointerEvents = (focusI === -1 || focusI === i) && op > 0.25 ? 'auto' : 'none';
      el.style.cursor = dist < 8 || focusI === i ? 'pointer' : 'default';
    }
  }

  /* ------------------------------------------------------ interaction */

  const railBtns = [];
  function buildRail() {
    cards.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rail__btn';
      b.innerHTML = `<span class="rail__label">${c.dataset.name}</span>`
        + `<span class="rail__dot" style="--dot:${accents[i]}"></span>`;
      b.addEventListener('click', () => walkTo(i));
      rail.appendChild(b);
      railBtns.push(b);
    });
    totEl.textContent = String(cards.length).padStart(2, '0');
  }

  const scrollAmount = () => Math.max(1, scrollRange);

  function walkTo(i) {
    unfocus();
    const target = clamp((i + 1.15) * GAP - 3.0, 0, camEnd);
    scrollTo({ top: (target / camEnd) * scrollAmount(), behavior: reduced ? 'auto' : 'smooth' });
  }

  function focusOn(i) {
    if (i === focusI) return;
    focusI = i;
    document.body.classList.add('is-focus');
    back.hidden = false;
    cards.forEach((c, j) => c.classList.toggle('is-lifted', j === i));
  }

  function unfocus() {
    if (focusI === -1) return;
    focusI = -1;
    document.body.classList.remove('is-focus');
    back.hidden = true;
    cards.forEach((c) => c.classList.remove('is-lifted'));
  }

  cards.forEach((c, i) => {
    c.tabIndex = 0;
    c.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      if (focusI === i) unfocus(); else focusOn(i);
    });
    c.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.closest('a')) return;
      e.preventDefault();
      if (focusI === i) unfocus(); else focusOn(i);
    });
  });
  back.addEventListener('click', unfocus);

  addEventListener('wheel', unfocus, { passive: true });
  addEventListener('touchstart', unfocus, { passive: true });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') unfocus();
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key)) unfocus();
  });
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || reduced) return;
    parXT = (e.clientX / vw - 0.5) * -30;
    parYT = (e.clientY / vh - 0.5) * -16;
  }, { passive: true });

  addEventListener('hashchange', () => {
    const i = indexFromHash();
    if (i > -1) walkTo(i);
  });

  function indexFromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return -1;
    const byName = cards.findIndex((c) => c.dataset.name === h);
    if (byName > -1) return byName;
    const n = parseInt(h, 10);
    return Number.isFinite(n) ? clamp(n - 1, 0, cards.length - 1) : -1;
  }

  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const p = scrollY / scrollAmount();
      resize();
      scrollTo({ top: p * scrollAmount(), behavior: 'auto' });
    }, 140);
  });

  /* ------------------------------------------------------------ loop */

  let last = performance.now();
  let bgGrad = null, bgH = 0;

  function tick(now) {
    const dt = Math.min(64, now - last);
    last = now;
    const k = reduced ? 1 : 1 - Math.pow(0.0016, Math.max(dt, 8) / 1000);

    camTo = clamp(scrollY / scrollAmount(), 0, 1) * camEnd;
    camZ += (camTo - camZ) * k;
    parX += (parXT - parX) * k;
    parY += (parYT - parY) * k;
    focusT += ((focusI > -1 ? 1 : 0) - focusT) * k;

    if (scrollY > 40 && !document.body.classList.contains('is-walking')) {
      document.body.classList.add('is-walking');
    }

    cx = vw * 0.5 + parX;
    cy = vh * 0.50 + parY;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!bgGrad || bgH !== vh) {
      bgGrad = ctx.createLinearGradient(0, 0, 0, vh);
      bgGrad.addColorStop(0, '#c3bee0');
      bgGrad.addColorStop(0.5, '#d9d2e6');
      bgGrad.addColorStop(1, '#efdfcb');
      bgH = vh;
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, vw, vh);

    if (!document.hidden) {
      drawWorld(now);

      if (focusT > 0.01) {
        ctx.fillStyle = `rgba(24,17,10,${(0.33 * focusT).toFixed(3)})`;
        ctx.fillRect(0, 0, vw, vh);
      }
      drawCards();

      let best = 0, bestD = Infinity;
      for (let i = 0; i < cards.length; i++) {
        const d = (i + 1.15) * GAP - camZ;
        const score = Math.abs(d - 3.1);
        if (score < bestD) { bestD = score; best = i; }
      }
      const shown = focusI > -1 ? focusI : best;
      if (shown !== active) {
        if (active > -1) railBtns[active].classList.remove('is-active');
        railBtns[shown].classList.add('is-active');
        noEl.textContent = String(shown + 1).padStart(2, '0');
        nameEl.textContent = cards[shown].dataset.name;
        active = shown;
      }
    }

    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------ boot */

  resize();
  buildRail();
  camZ = clamp(scrollY / scrollAmount(), 0, 1) * camEnd;
  const startAt = indexFromHash();
  if (startAt > -1) {
    camZ = clamp((startAt + 1.15) * GAP - 3.0, 0, camEnd);
    scrollTo({ top: (camZ / camEnd) * scrollAmount(), behavior: 'auto' });
  }
  requestAnimationFrame(tick);
})();
