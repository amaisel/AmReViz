import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

function ParticleCanvas({ darkMode }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const count = 60;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const color = darkMode ? '200, 210, 230' : '10, 36, 74';

      particlesRef.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });

      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i];
          const b = particlesRef.current[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${color}, ${0.04 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [darkMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

const KEY_STATS = [
  { value: '18', label: 'Key Events' },
  { value: '10', label: 'Major Battles' },
  { value: '13', label: 'Colonies' },
  { value: '1773–83', label: 'Decade of Change' },
];

export default function WelcomeScreen({ onBegin, darkMode }) {
  const scrollThreshold = useRef(0);
  const hasTriggered = useRef(false);
  const contentRef = useRef(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    setMouseOffset({
      x: (e.clientX - cx) / cx * 5,
      y: (e.clientY - cy) / cy * 5,
    });
  }, []);

  useEffect(() => {
    const handleWheel = (e) => {
      if (hasTriggered.current) return;

      if (e.deltaY > 0) {
        scrollThreshold.current += e.deltaY;

        if (scrollThreshold.current > 100) {
          hasTriggered.current = true;
          onBegin();
        }
      } else {
        scrollThreshold.current = Math.max(0, scrollThreshold.current + e.deltaY);
      }
    };

    const handleKeyDown = (e) => {
      if (hasTriggered.current) return;

      if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter') {
        hasTriggered.current = true;
        onBegin();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [onBegin, handleMouseMove]);

  return (
    <motion.div
      className={`welcome-screen ${darkMode ? 'dark' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ParticleCanvas darkMode={darkMode} />

      <div
        className="welcome-content"
        ref={contentRef}
        style={{
          transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)`,
          transition: 'transform 0.15s ease-out',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <h1 className="welcome-title">The American Revolution</h1>

        <p className="welcome-subtitle">
          An Interactive Journey Through Independence
        </p>

        <div className="welcome-stat-strip">
          {KEY_STATS.map((stat) => (
            <div key={stat.label} className="welcome-stat">
              <span className="welcome-stat-value">{stat.value}</span>
              <span className="welcome-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="welcome-description">
          <p>
            Experience the birth of a nation through time and space. This visualization
            guides you through the key events of the Revolutionary War — from the Boston
            Tea Party to the British surrender at Yorktown — in both chronological and
            geospatial order.
          </p>
        </div>

        <div className="welcome-modes">
          <button className="welcome-mode-card" onClick={onBegin}>
            <span className="welcome-mode-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
            </span>
            <span className="welcome-mode-label">Explore</span>
            <span className="welcome-mode-desc">Navigate events on an interactive map with timeline playback</span>
          </button>
          <button className="welcome-mode-card" onClick={() => {
            window.location.hash = '#data';
          }}>
            <span className="welcome-mode-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </span>
            <span className="welcome-mode-label">Data</span>
            <span className="welcome-mode-desc">Dive into troop strength, trade, casualties, and campaigns</span>
          </button>
        </div>

        <motion.div
          className="welcome-scroll-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <span>or scroll to start exploring</span>
          <motion.div
            className="scroll-arrow"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ↓
          </motion.div>
        </motion.div>
      </div>

      <div
        className="welcome-years"
        style={{
          transform: `translate(${-mouseOffset.x * 0.5}px, 0)`,
          transition: 'transform 0.15s ease-out',
          position: 'absolute',
          zIndex: 1,
        }}
      >
        <span className="year-start">1773</span>
        <div className="year-line"></div>
        <span className="year-end">1783</span>
      </div>
    </motion.div>
  );
}
