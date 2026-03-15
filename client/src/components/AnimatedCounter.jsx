import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';

export default function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1.5, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) => {
    const num = Math.round(latest);
    return prefix + num.toLocaleString() + suffix;
  });

  useEffect(() => {
    if (isInView) {
      const target = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      animate(motionValue, target, { duration, ease: 'easeOut' });
    }
  }, [isInView, value, motionValue, duration]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
