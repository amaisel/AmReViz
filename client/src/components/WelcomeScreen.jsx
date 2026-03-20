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

    // Create particles
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

      // Draw faint connections between nearby particles
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

function TypewriterTitle({ text, delay = 0.3 }) {
  const words = text.split(' ');
  let charIndex = 0;

  return (
    <h1 className="welcome-title">
      {words.map((word, wi) => {
        const wordChars = word.split('').map((char, ci) => {
          const idx = charIndex++;
          return (
            <motion.span
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: delay + idx * 0.04,
                duration: 0.4,
                ease: [0.43, 0.13, 0.23, 0.96],
              }}
              style={{ display: 'inline-block' }}
            >
              {char}
            </motion.span>
          );
        });
        // Count the space between words
        if (wi < words.length - 1) charIndex++;
        return (
          <span key={wi} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {wordChars}
            {wi < words.length - 1 && (
              <span style={{ display: 'inline-block', width: '0.3em' }}>{' '}</span>
            )}
          </span>
        );
      })}
    </h1>
  );
}

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
      transition={{ duration: 0.8 }}
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
        <TypewriterTitle text="The American Revolution" delay={0.3} />

        <motion.p
          className="welcome-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.8 }}
        >
          An Interactive Journey Through Independence
        </motion.p>

        <motion.div
          className="welcome-description"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.8 }}
        >
          <p>
            Experience the birth of a nation through time and space. This visualization
            guides you through the key events of the Revolutionary War—from the Boston
            Tea Party to the British surrender at Yorktown—in both chronological and
            geospatial order.
          </p>
          <p className="welcome-credits">
            Inspired by data journalism from The Upshot, FiveThirtyEight, and the
            tradition of making complex stories clear through visualization.
          </p>
        </motion.div>

        <motion.button
          className="welcome-begin-btn"
          onClick={onBegin}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.6 }}
          whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(10, 36, 74, 0.35)' }}
          whileTap={{ scale: 0.97 }}
        >
          Begin the Journey
        </motion.button>

        <motion.div
          className="welcome-scroll-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 2.8, duration: 0.8 }}
        >
          <span>or scroll to start</span>
          <motion.div
            className="scroll-arrow"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ↓
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="welcome-years"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
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
      </motion.div>
    </motion.div>
  );
}
