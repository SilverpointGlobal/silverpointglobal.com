/* ============================================================
   OZ INTELLIGENCE SYSTEM — NAVIGATION + SCROLL BEHAVIOR
   ============================================================ */

(function () {
  'use strict';

  // ── Scroll-driven nav opacity ──────────────────────────────
  const nav = document.querySelector('.oz-nav');
  if (nav) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 40) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
      lastScroll = y;
    }, { passive: true });
  }

  // ── Active link highlighting ──────────────────────────────
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ── Intersection Observer — animate-in elements ──────────
  const animEls = document.querySelectorAll('.animate-in-scroll');
  if (animEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    animEls.forEach(el => observer.observe(el));
  }

  // ── Smooth anchor scrolling ────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = nav ? nav.offsetHeight : 64;
        const top = target.getBoundingClientRect().top + window.scrollY - navH - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ── Subtle parallax for glass cards (desktop only) ────────
  if (window.matchMedia('(min-width: 900px)').matches) {
    const cards = document.querySelectorAll('.glass-card[data-parallax]');
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      cards.forEach(card => {
        const speed = parseFloat(card.dataset.parallax || '0.03');
        const rect = card.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const offset = (center - window.innerHeight / 2) * speed;
        card.style.transform = `translateY(${offset}px)`;
      });
    }, { passive: true });
  }

  // ── Background canvas starfield (pages without hero canvas)
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas) {
    initBgStarfield(bgCanvas);
  }

  function initBgStarfield(canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, stars = [], animId;
    const STAR_COUNT = 160;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function createStars() {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.2 + 0.2,
          alpha: Math.random() * 0.6 + 0.1,
          speed: Math.random() * 0.15 + 0.03,
          twinkleSpeed: Math.random() * 0.008 + 0.002,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        s.twinklePhase += s.twinkleSpeed;
        const alpha = s.alpha * (0.65 + 0.35 * Math.sin(s.twinklePhase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 218, 245, ${alpha})`;
        ctx.fill();
        // Slow upward drift
        s.y -= s.speed;
        if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W; }
      });
      animId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => { resize(); createStars(); }, { passive: true });
    resize();
    createStars();
    draw(0);
  }

})();
