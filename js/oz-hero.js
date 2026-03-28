/* ============================================================
   OZ INTELLIGENCE SYSTEM — CINEMATIC HERO CANVAS
   Scroll-driven planetary intelligence sequence
   Silverpoint Global / Wolfe Vision Group
   ============================================================ */

(function () {
  'use strict';

  const canvas  = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');
  const overlay = document.getElementById('hero-overlay');

  /* ── Viewport ──────────────────────────────────────────── */
  let W, H, CX, CY, DPR;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W   = window.innerWidth;
    H   = window.innerHeight;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);
    CX = W / 2;
    CY = H / 2;
  }

  /* ── Scroll Progress ───────────────────────────────────── */
  // The hero section is 600vh tall; progress 0→1 over that
  const HERO_SECTION = document.getElementById('hero-section');
  let progress = 0;

  function getProgress() {
    if (!HERO_SECTION) return 0;
    const scrollH = HERO_SECTION.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(1, window.scrollY / scrollH));
  }

  /* ── Math helpers ──────────────────────────────────────── */
  const PI  = Math.PI;
  const TAU = Math.PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const map   = (v, a, b, c, d) => c + (d - c) * ((v - a) / (b - a));
  const mapC  = (v, a, b, c, d) => clamp(map(v, a, b, c, d), Math.min(c,d), Math.max(c,d));
  const ease  = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;

  /* ── Stars ─────────────────────────────────────────────── */
  const STAR_COUNT = 280;
  let   stars      = [];

  function buildStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const layer = Math.floor(Math.random() * 3);   // 0=far,1=mid,2=near
      stars.push({
        x:      Math.random() * W,
        y:      Math.random() * H,
        baseX:  0,
        baseY:  0,
        r:      [0.35, 0.65, 1.1][layer] + Math.random() * 0.4,
        alpha:  [0.25, 0.45, 0.70][layer] * (0.6 + Math.random() * 0.4),
        layer,
        twinkle: Math.random() * TAU,
        twinkleS: Math.random() * 0.008 + 0.003,
      });
      stars[i].baseX = stars[i].x;
      stars[i].baseY = stars[i].y;
    }
  }

  /* ── Neural Fog Particles ──────────────────────────────── */
  const FOG_COUNT = 55;
  let   fogParts  = [];

  function buildFog() {
    fogParts = [];
    for (let i = 0; i < FOG_COUNT; i++) {
      fogParts.push({
        x:    Math.random() * W,
        y:    Math.random() * H,
        r:    80 + Math.random() * 180,
        alpha: 0.015 + Math.random() * 0.025,
        dx:   (Math.random() - 0.5) * 0.18,
        dy:   (Math.random() - 0.5) * 0.12,
        hue:  200 + Math.random() * 30,
      });
    }
  }

  /* ── Globe Data ─────────────────────────────────────────── */
  const GLOBE_DOTS   = 800;
  let   globePoints  = [];     // [{lat, lng, x3,y3,z3}]

  function buildGlobe() {
    globePoints = [];
    // Fibonacci sphere distribution
    const phi = Math.acos(-1 + 2 / GLOBE_DOTS);
    const theta_step = TAU * (1 - 1 / 1.618033988);
    for (let i = 0; i < GLOBE_DOTS; i++) {
      const lat   = Math.acos(1 - 2 * i / GLOBE_DOTS) - PI / 2;
      const lng   = (theta_step * i) % TAU;
      globePoints.push({
        lat, lng,
        // precompute unit sphere coords
        x3: Math.cos(lat) * Math.cos(lng),
        y3: Math.sin(lat),
        z3: Math.cos(lat) * Math.sin(lng),
        size: 0.8 + Math.random() * 1.0,
        alpha: 0.35 + Math.random() * 0.45,
      });
    }
  }

  /* ── Agents ─────────────────────────────────────────────── */
  const AGENT_DEFS = [
    { name: 'SIGNAL',    color: 'rgba(180,215,255,0.85)',  aRad: 0.50, bRad: 0.24, speed: 0.0007, phase: 0      },
    { name: 'RESEARCH',  color: 'rgba(160,200,245,0.75)',  aRad: 0.52, bRad: 0.20, speed: 0.0005, phase: PI/3   },
    { name: 'CAMPAIGN',  color: 'rgba(200,225,255,0.80)',  aRad: 0.48, bRad: 0.26, speed: 0.0009, phase: 2*PI/3 },
    { name: 'ENRICHMENT',color: 'rgba(150,190,235,0.70)',  aRad: 0.54, bRad: 0.18, speed: 0.0006, phase: PI     },
    { name: 'OUTREACH',  color: 'rgba(175,210,250,0.75)',  aRad: 0.46, bRad: 0.22, speed: 0.0008, phase: 4*PI/3 },
    { name: 'ANALYTICS', color: 'rgba(195,220,255,0.80)',  aRad: 0.56, bRad: 0.16, speed: 0.0004, phase: 5*PI/3 },
  ];

  /* ── Neural Filaments ──────────────────────────────────── */
  const FILAMENT_COUNT = 28;
  let   filaments      = [];

  function buildFilaments() {
    filaments = [];
    for (let i = 0; i < FILAMENT_COUNT; i++) {
      const angle = (TAU / FILAMENT_COUNT) * i + Math.random() * 0.3;
      const dist  = 0.12 + Math.random() * 0.32;
      filaments.push({
        angle, dist,
        speed:  (Math.random() - 0.5) * 0.0006,
        alpha:  0.12 + Math.random() * 0.18,
        length: 0.05 + Math.random() * 0.12,
        phase:  Math.random() * TAU,
        phaseS: 0.004 + Math.random() * 0.006,
        particles: Array.from({ length: 5 }, (_, k) => ({
          t:      Math.random(),
          speed:  0.0015 + Math.random() * 0.002,
          bright: Math.random() > 0.7,
        })),
      });
    }
  }

  /* ── Resonance Rings ───────────────────────────────────── */
  let rings = [];
  let lastRingTime = 0;

  function spawnRing() {
    rings.push({ r: 0, alpha: 0.55, speed: 0.9 });
  }

  /* ── Opportunity Signals ───────────────────────────────── */
  const SIG_COUNT = 18;
  let   signals   = [];

  function buildSignals() {
    signals = [];
    for (let i = 0; i < SIG_COUNT; i++) {
      const angle = Math.random() * TAU;
      const dist  = (0.5 + Math.random() * 0.45);
      signals.push({
        angle,
        dist,
        speed:  (Math.random() - 0.5) * 0.0005,
        alpha:  0.4 + Math.random() * 0.5,
        r:      1.5 + Math.random() * 2.5,
        phase:  Math.random() * TAU,
        phaseS: 0.02 + Math.random() * 0.03,
        converging: false,
        cx: 0, cy: 0,
        convergeDist: dist,
      });
    }
  }

  /* ── Hex / Sacred Geometry Core ─────────────────────────── */
  function drawHexagram(x, y, r, alpha, t) {
    ctx.save();
    ctx.translate(x, y);
    // Outer rings
    for (let ring = 3; ring >= 1; ring--) {
      ctx.beginPath();
      ctx.arc(0, 0, r * ring * 0.38, 0, TAU);
      ctx.strokeStyle = `rgba(180,210,245,${alpha * 0.15 * (4 - ring)})`;
      ctx.lineWidth   = 0.5;
      ctx.stroke();
    }
    // Two triangles (hexagram)
    for (let tri = 0; tri < 2; tri++) {
      const rot = (PI / 6) * (tri * 2) + t * (tri === 0 ? 0.0003 : -0.0004);
      ctx.beginPath();
      for (let v = 0; v < 3; v++) {
        const a = rot + (TAU / 3) * v;
        const px = Math.cos(a) * r * 0.68;
        const py = Math.sin(a) * r * 0.68;
        if (v === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(190,215,250,${alpha * 0.35})`;
      ctx.lineWidth   = 0.8;
      ctx.stroke();
    }
    // Inner diamond
    ctx.beginPath();
    for (let v = 0; v < 6; v++) {
      const a = (TAU / 6) * v + t * 0.0002;
      const px = Math.cos(a) * r * 0.34;
      const py = Math.sin(a) * r * 0.34;
      if (v === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(210,228,255,${alpha * 0.50})`;
    ctx.lineWidth   = 0.7;
    ctx.stroke();
    // Center dot
    const grd = ctx.createRadialGradient(0,0,0, 0,0,r*0.14);
    grd.addColorStop(0, `rgba(220,235,255,${alpha * 0.9})`);
    grd.addColorStop(1, `rgba(180,210,245,0)`);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.14, 0, TAU);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.restore();
  }

  /* ── Globe Rotation ─────────────────────────────────────── */
  let globeRotY = 0;

  function projectGlobe(pt, rotY, scale) {
    // Rotate around Y
    const cos = Math.cos(rotY), sin = Math.sin(rotY);
    const x3  = pt.x3 * cos - pt.z3 * sin;
    const y3  = pt.y3;
    const z3  = pt.x3 * sin + pt.z3 * cos;
    // Orthographic project
    const px = CX + x3 * scale;
    const py = CY + y3 * scale;
    const visible = z3 > -0.15;
    return { px, py, z3, visible };
  }

  /* ── Text Overlay ───────────────────────────────────────── */
  const textLines = [
    { el: document.getElementById('hero-text-1'), start: 0.00, end: 0.22 },
    { el: document.getElementById('hero-text-2'), start: 0.18, end: 0.42 },
    { el: document.getElementById('hero-text-3'), start: 0.38, end: 0.58 },
    { el: document.getElementById('hero-text-4'), start: 0.54, end: 0.72 },
    { el: document.getElementById('hero-text-5'), start: 0.68, end: 0.87 },
    { el: document.getElementById('hero-text-6'), start: 0.83, end: 1.00 },
  ];

  function updateText(p) {
    textLines.forEach(({ el, start, end }) => {
      if (!el) return;
      const dur   = end - start;
      const mid   = start + dur * 0.4;
      let alpha;
      if (p < start)        alpha = 0;
      else if (p < mid)     alpha = ease(mapC(p, start, mid, 0, 1));
      else if (p < end)     alpha = ease(mapC(p, mid, end, 1, 0));
      else                  alpha = 0;
      el.style.opacity   = alpha;
      const yOff = (1 - alpha) * 18;
      el.style.transform = `translateY(${yOff}px)`;
    });
  }

  /* ── Main Draw ──────────────────────────────────────────── */
  let t = 0;
  let raf;

  function draw(ts) {
    t++;
    progress = getProgress();

    ctx.clearRect(0, 0, W, H);

    // ── Bg gradient
    const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(W, H) * 0.75);
    bg.addColorStop(0,   `rgba(8, 16, 34, ${0.55 + progress * 0.25})`);
    bg.addColorStop(0.5, 'rgba(4,  8, 18, 0.85)');
    bg.addColorStop(1,   'rgba(0,  0,  8, 1.00)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── Stars
    const starAlpha = mapC(progress, 0, 0.08, 0, 1);
    const parallaxX = CX / W - 0.5;
    stars.forEach(s => {
      s.twinkle += s.twinkleS;
      const tw   = 0.7 + 0.3 * Math.sin(s.twinkle);
      const pShift = s.layer * 6 * (window.scrollY / (document.body.scrollHeight - window.innerHeight));
      ctx.beginPath();
      ctx.arc(s.x, s.y - pShift, s.r, 0, TAU);
      ctx.fillStyle = `rgba(205,218,245,${s.alpha * tw * starAlpha})`;
      ctx.fill();
    });

    // ── Neural fog
    const fogAlpha = mapC(progress, 0, 0.15, 0, 1);
    fogParts.forEach(f => {
      f.x += f.dx; f.y += f.dy;
      if (f.x < -f.r) f.x = W + f.r;
      if (f.x > W+f.r) f.x = -f.r;
      if (f.y < -f.r) f.y = H + f.r;
      if (f.y > H+f.r) f.y = -f.r;
      const grd = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grd.addColorStop(0,   `hsla(${f.hue},50%,60%,${f.alpha * fogAlpha})`);
      grd.addColorStop(1,   'hsla(215,50%,50%,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, TAU);
      ctx.fill();
    });

    // ── Globe
    const globeScale    = ease(mapC(progress, 0.18, 0.42, 0, 1)) * Math.min(W, H) * 0.30;
    const globeAlpha    = mapC(progress, 0.18, 0.38, 0, 1);
    globeRotY          += 0.0008;

    if (globeAlpha > 0.01 && globeScale > 2) {
      // Atmosphere glow
      const atmR = globeScale * 1.18;
      const atm  = ctx.createRadialGradient(CX, CY, globeScale * 0.85, CX, CY, atmR);
      atm.addColorStop(0,   `rgba(80,140,220,${0.12 * globeAlpha})`);
      atm.addColorStop(0.5, `rgba(60,110,190,${0.07 * globeAlpha})`);
      atm.addColorStop(1,   'rgba(40,80,160,0)');
      ctx.beginPath();
      ctx.arc(CX, CY, atmR, 0, TAU);
      ctx.fillStyle = atm;
      ctx.fill();

      // Globe core shadow
      const shadow = ctx.createRadialGradient(CX - globeScale*0.2, CY - globeScale*0.15, 0, CX, CY, globeScale);
      shadow.addColorStop(0,   `rgba(15,35,70,${0.0 * globeAlpha})`);
      shadow.addColorStop(0.6, `rgba(6,12,28,${0.45 * globeAlpha})`);
      shadow.addColorStop(1,   `rgba(2,5,15,${0.75 * globeAlpha})`);
      ctx.beginPath();
      ctx.arc(CX, CY, globeScale, 0, TAU);
      ctx.fillStyle = shadow;
      ctx.fill();

      // Terrain dots
      globePoints.forEach(pt => {
        const { px, py, z3, visible } = projectGlobe(pt, globeRotY, globeScale);
        if (!visible) return;
        const depthAlpha = clamp((z3 + 0.15) / 1.15, 0, 1);
        const finalAlpha = pt.alpha * depthAlpha * globeAlpha * 0.85;
        const r          = pt.size * depthAlpha * 0.85;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, TAU);
        // Color based on position — subtle terrain variation
        const latC = Math.abs(pt.lat) / (PI / 2);
        const h    = lerp(210, 230, latC);
        const s    = lerp(40, 60, latC);
        const l    = lerp(62, 80, depthAlpha);
        ctx.fillStyle = `hsla(${h},${s}%,${l}%,${finalAlpha})`;
        ctx.fill();
      });

      // Equator ring
      ctx.beginPath();
      ctx.ellipse(CX, CY, globeScale, globeScale * 0.08, 0, 0, TAU);
      ctx.strokeStyle = `rgba(150,190,230,${0.10 * globeAlpha})`;
      ctx.lineWidth   = 0.5;
      ctx.stroke();
    }

    // ── Agents
    const agentAlpha = ease(mapC(progress, 0.38, 0.56, 0, 1));
    const agentPositions = [];

    if (agentAlpha > 0.01) {
      AGENT_DEFS.forEach((def, i) => {
        const aR    = def.aRad * Math.min(W, H) * 0.52;
        const bR    = def.bRad * Math.min(W, H) * 0.52;
        const angle = def.phase + t * def.speed;
        const ax    = CX + Math.cos(angle) * aR;
        const ay    = CY + Math.sin(angle) * bR;

        agentPositions.push({ x: ax, y: ay, color: def.color, name: def.name });

        // Connection line to globe center
        const connAlpha = 0.12 * agentAlpha;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(CX, CY);
        ctx.strokeStyle = `rgba(180,210,245,${connAlpha})`;
        ctx.lineWidth   = 0.5;
        ctx.stroke();

        // Energy pulse along line
        const pulseT = ((t * def.speed * 3 + i / 6) % 1);
        const px2    = lerp(ax, CX, pulseT);
        const py2    = lerp(ay, CY, pulseT);
        ctx.beginPath();
        ctx.arc(px2, py2, 2, 0, TAU);
        ctx.fillStyle = `rgba(200,225,255,${agentAlpha * 0.6})`;
        ctx.fill();

        // Agent dot
        const grd = ctx.createRadialGradient(ax, ay, 0, ax, ay, 14);
        grd.addColorStop(0,   def.color.replace('0.85', `${agentAlpha}`).replace('0.80',`${agentAlpha}`).replace('0.75',`${agentAlpha}`).replace('0.70',`${agentAlpha}`));
        grd.addColorStop(0.4, def.color.replace(/[\d.]+\)$/, `${agentAlpha * 0.4})`));
        grd.addColorStop(1,   'rgba(180,210,245,0)');
        ctx.beginPath();
        ctx.arc(ax, ay, 14, 0, TAU);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(ax, ay, 3, 0, TAU);
        ctx.fillStyle = `rgba(220,235,255,${agentAlpha * 0.95})`;
        ctx.fill();

        // Agent label
        if (agentAlpha > 0.3) {
          ctx.font        = `${Math.floor(9 * DPR) / DPR}px SF Mono, Fira Code, monospace`;
          ctx.fillStyle   = `rgba(160,190,230,${agentAlpha * 0.65})`;
          ctx.textAlign   = 'center';
          ctx.fillText(def.name, ax, ay + 22);
        }
      });

      // Cross-agent connections (sparse)
      for (let i = 0; i < agentPositions.length; i++) {
        for (let j = i + 2; j < agentPositions.length; j += 2) {
          const a = agentPositions[i], b = agentPositions[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < Math.min(W, H) * 0.35) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(170,205,240,${0.06 * agentAlpha})`;
            ctx.lineWidth   = 0.4;
            ctx.stroke();
          }
        }
      }
    }

    // ── Intelligence Core (sacred geometry)
    const coreAlpha = ease(mapC(progress, 0.53, 0.70, 0, 1));
    if (coreAlpha > 0.01) {
      drawHexagram(CX, CY, globeScale * 0.55 + 30, coreAlpha, t);
    }

    // ── Neural Filaments
    const filAlpha = ease(mapC(progress, 0.53, 0.72, 0, 1));
    if (filAlpha > 0.01) {
      filaments.forEach(f => {
        f.angle  += f.speed;
        f.phase  += f.phaseS;
        const wave   = 0.7 + 0.3 * Math.sin(f.phase);
        const r0     = f.dist * Math.min(W, H) * 0.5;
        const r1     = (f.dist + f.length) * Math.min(W, H) * 0.5;
        const sx     = CX + Math.cos(f.angle) * r0;
        const sy     = CY + Math.sin(f.angle) * r0;
        const ex     = CX + Math.cos(f.angle + 0.15) * r1;
        const ey     = CY + Math.sin(f.angle + 0.15) * r1;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = `rgba(190,215,250,${f.alpha * wave * filAlpha * 0.7})`;
        ctx.lineWidth   = 0.6;
        ctx.stroke();

        // Particles along filament
        f.particles.forEach(p => {
          p.t = (p.t + p.speed) % 1;
          const px2 = lerp(sx, ex, p.t);
          const py2 = lerp(sy, ey, p.t);
          ctx.beginPath();
          ctx.arc(px2, py2, p.bright ? 1.5 : 0.8, 0, TAU);
          ctx.fillStyle = `rgba(210,230,255,${(p.bright ? 0.8 : 0.4) * filAlpha})`;
          ctx.fill();
        });
      });
    }

    // ── Opportunity Signals
    const sigAlpha = ease(mapC(progress, 0.68, 0.82, 0, 1));
    if (sigAlpha > 0.01) {
      signals.forEach(s => {
        s.angle  += s.speed;
        s.phase  += s.phaseS;
        // Signals converge toward globe center
        s.convergeDist = lerp(s.dist, 0.12, ease(sigAlpha * 0.7));
        const r   = s.convergeDist * Math.min(W, H) * 0.5;
        s.cx      = CX + Math.cos(s.angle) * r;
        s.cy      = CY + Math.sin(s.angle) * r;
        const tw  = 0.6 + 0.4 * Math.sin(s.phase);

        ctx.beginPath();
        ctx.arc(s.cx, s.cy, s.r * tw, 0, TAU);
        ctx.fillStyle = `rgba(200,222,255,${s.alpha * tw * sigAlpha * 0.9})`;
        ctx.fill();

        // Trailing line toward center
        ctx.beginPath();
        ctx.moveTo(s.cx, s.cy);
        ctx.lineTo(CX, CY);
        ctx.strokeStyle = `rgba(180,210,245,${0.08 * sigAlpha})`;
        ctx.lineWidth   = 0.4;
        ctx.stroke();
      });
    }

    // ── Resonance Rings
    const ringTrigger = progress > 0.68;
    if (ringTrigger && t - lastRingTime > 90) {
      spawnRing();
      lastRingTime = t;
    }
    rings = rings.filter(r => r.alpha > 0.005);
    rings.forEach(r => {
      r.r     += r.speed * (1 + globeScale / 400);
      r.alpha *= 0.982;
      const maxR = globeScale * 2.2;
      ctx.beginPath();
      ctx.arc(CX, CY, globeScale + r.r * 3, 0, TAU);
      ctx.strokeStyle = `rgba(170,210,245,${r.alpha * mapC(progress, 0.68, 0.82, 0, 1)})`;
      ctx.lineWidth   = 0.8;
      ctx.stroke();
    });

    // ── Command Interface Frame (final section)
    const frameAlpha = ease(mapC(progress, 0.84, 0.97, 0, 1));
    if (frameAlpha > 0.01) {
      const pad  = 40;
      const bw   = Math.min(W - 80, 900);
      const bh   = Math.min(H - 80, 560);
      const bx   = CX - bw / 2;
      const by   = CY - bh / 2;

      // Corner brackets
      const corners = [[bx, by], [bx+bw, by], [bx+bw, by+bh], [bx, by+bh]];
      const cLen   = 28;
      ctx.strokeStyle = `rgba(200,220,248,${frameAlpha * 0.55})`;
      ctx.lineWidth   = 1.2;
      corners.forEach(([cx2, cy2], ci) => {
        const dx = ci === 0 || ci === 3 ? 1 : -1;
        const dy = ci === 0 || ci === 1 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(cx2 + dx * cLen, cy2);
        ctx.lineTo(cx2, cy2);
        ctx.lineTo(cx2, cy2 + dy * cLen);
        ctx.stroke();
      });

      // Top status bar
      ctx.font      = `${11}px SF Mono, Fira Code, monospace`;
      ctx.fillStyle = `rgba(150,185,230,${frameAlpha * 0.60})`;
      ctx.textAlign = 'left';
      ctx.fillText('OZ INTELLIGENCE SYSTEM  //  NETWORK ONLINE  //  SIGNAL ACQUISITION: ACTIVE', bx + 16, by - 12);

      // Side data columns
      const leftData = ['AGENTS: 6 ACTIVE', 'SIGNALS: LIVE', 'FORECAST: ENGAGED', 'MEMORY: INDEXED'];
      leftData.forEach((ln, i) => {
        ctx.fillStyle = `rgba(140,175,220,${frameAlpha * 0.45})`;
        ctx.font      = `${10}px SF Mono, Fira Code, monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(ln, bx + 16, by + 30 + i * 18);
      });

      // Bottom bar
      ctx.beginPath();
      ctx.moveTo(bx, by + bh + 16);
      ctx.lineTo(bx + bw * frameAlpha, by + bh + 16);
      ctx.strokeStyle = `rgba(180,210,245,${frameAlpha * 0.30})`;
      ctx.lineWidth   = 0.7;
      ctx.stroke();

      ctx.fillStyle = `rgba(120,165,215,${frameAlpha * 0.45})`;
      ctx.font      = `${10}px SF Mono, Fira Code, monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(`SILVERPOINT GLOBAL  //  WOLFE VISION GROUP`, bx + bw - 16, by + bh + 30);
    }

    // ── Update text overlay
    updateText(progress);

    raf = requestAnimationFrame(draw);
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    resize();
    buildStars();
    buildFog();
    buildGlobe();
    buildFilaments();
    buildSignals();
    window.addEventListener('resize', () => {
      resize();
      buildStars();
      buildFog();
    }, { passive: true });
    raf = requestAnimationFrame(draw);
  }

  init();

})();
