import { useEffect, useRef } from 'react';
import { motion as Motion, useMotionValue, useTransform, animate, useInView, useReducedMotion } from 'framer-motion';

export default function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1.5, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) => {
    const num = Math.round(latest);
    return prefix + num.toLocaleString() + suffix;
  });

  useEffect(() => {
    if (isInView) {
      const target = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      if (reduceMotion) {
        motionValue.set(target);
        return;
      }
      const controls = animate(motionValue, target, { duration, ease: 'easeOut' });
      return () => controls.stop();
    }
  }, [isInView, value, motionValue, duration, reduceMotion]);

  return <Motion.span ref={ref} className={className}>{display}</Motion.span>;
}
