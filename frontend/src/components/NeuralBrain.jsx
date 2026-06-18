import { useEffect, useRef } from "react";

/**
 * Animated neural network brain visualization on HTML canvas.
 * Lightweight, no Three.js. ~60 nodes connected by proximity.
 */
export default function NeuralBrain({ className = "", intensity = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let dpr = window.devicePixelRatio || 1;
    let w = 0,
      h = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const NODE_COUNT = Math.max(28, Math.floor((w * h) / 22000));
    const colors = ["#4F46E5", "#06B6D4", "#8B5CF6", "#A78BFA"];
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: 1 + Math.random() * 2.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      phase: Math.random() * Math.PI * 2,
    }));

    const mouse = { x: w / 2, y: h / 2, active: false };
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = () => (mouse.active = false);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    const MAX_DIST = 130;
    const tick = (t) => {
      ctx.clearRect(0, 0, w, h);

      // soft radial backdrop
      const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.7);
      grad.addColorStop(0, "rgba(79,70,229,0.10)");
      grad.addColorStop(0.5, "rgba(139,92,246,0.05)");
      grad.addColorStop(1, "rgba(10,10,15,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // update
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        if (mouse.active) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 140 * 140) {
            const f = 0.0015;
            n.vx += dx * f * 0.02;
            n.vy += dy * f * 0.02;
          }
        }
        // gentle damping
        n.vx *= 0.995;
        n.vy *= 0.995;
      }

      // edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i],
            b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < MAX_DIST) {
            const alpha = (1 - d / MAX_DIST) * 0.5 * intensity;
            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // nodes (pulsing)
      for (const n of nodes) {
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.002 + n.phase);
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 12 * pulse;
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [intensity]);

  return <canvas ref={canvasRef} className={`block w-full h-full ${className}`} data-testid="neural-brain-canvas" />;
}
