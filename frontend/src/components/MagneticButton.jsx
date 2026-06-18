import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Magnetic button: subtle hover translation that follows the cursor.
 */
export default function MagneticButton({ children, className = "", onClick, testId, as = "button", href }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18 });
  const sy = useSpring(y, { stiffness: 200, damping: 18 });
  const tx = useTransform(sx, (v) => v);
  const ty = useTransform(sy, (v) => v);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set(dx * 0.25);
    y.set(dy * 0.25);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Comp = motion[as] || motion.button;

  return (
    <Comp
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      href={href}
      data-testid={testId}
      style={{ x: tx, y: ty }}
      whileTap={{ scale: 0.96 }}
      className={className}
    >
      {children}
    </Comp>
  );
}
