import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Flame, Sparkles, MessageSquare, Trophy } from "lucide-react";

function useCount(target, duration, trigger) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const start = performance.now();
    let raf;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setV(Math.floor(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, trigger]);
  return v;
}

function StatCard({ s, i, trigger }) {
  const value = useCount(s.target, 1600, trigger);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1 }}
      className="glass rounded-3xl p-7 relative overflow-hidden group"
      data-testid={`metric-${s.label.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity"
        style={{ background: s.color }}
      />
      <div className="relative">
        <s.Icon className="w-5 h-5 mb-4" style={{ color: s.color }} strokeWidth={1.5} />
        <div className="font-heading text-4xl md:text-5xl tracking-tight text-white tabular-nums">
          {value.toLocaleString()}
          <span className="text-2xl text-white/40 ml-0.5">{s.suffix}</span>
        </div>
        <div className="mt-2 text-xs font-mono uppercase tracking-[0.18em] text-white/40">
          {s.label}
        </div>
      </div>
    </motion.div>
  );
}

const STATS = [
  { label: "Students Learning", target: 18420, suffix: "+", Icon: Sparkles, color: "#4F46E5" },
  { label: "Concepts Mastered", target: 286000, suffix: "+", Icon: Trophy, color: "#06B6D4" },
  { label: "Learning Hours", target: 412800, suffix: "h", Icon: Flame, color: "#EC4899" },
  { label: "Understanding Score", target: 94, suffix: "%", Icon: MessageSquare, color: "#8B5CF6" },
];

export default function Metrics() {
  const [trigger, setTrigger] = useState(false);
  return (
    <section className="relative py-24 sm:py-32" data-testid="metrics-section">
      <motion.div
        onViewportEnter={() => setTrigger(true)}
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-7xl mx-auto px-6 lg:px-8"
      >
        <div className="grid md:grid-cols-4 gap-5">
          {STATS.map((s, i) => (
            <StatCard key={s.label} s={s} i={i} trigger={trigger} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
