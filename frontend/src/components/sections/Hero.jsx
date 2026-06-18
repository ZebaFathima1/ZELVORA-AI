import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import { Link } from "react-router-dom";
import NeuralBrain from "@/components/NeuralBrain";
import MagneticButton from "@/components/MagneticButton";

const FLOW = [
  { label: "Question", color: "#06B6D4", icon: "?" },
  { label: "Real-life Example", color: "#8B5CF6", icon: "◐" },
  { label: "Story", color: "#A78BFA", icon: "✦" },
  { label: "Visual Learning", color: "#4F46E5", icon: "▣" },
  { label: "Experiment", color: "#EC4899", icon: "◇" },
  { label: "Understanding", color: "#10B981", icon: "✓" },
];

export default function Hero() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % FLOW.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-24 overflow-hidden" data-testid="hero-section">
      {/* Background brain */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-bg opacity-[0.35]" />
        <div className="absolute inset-0 opacity-70">
          <NeuralBrain />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0F]/30 to-[#0A0A0F]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-mono uppercase tracking-[0.2em] text-indigo-300 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" /> Powered by Claude Sonnet 4.5
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-heading text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.02] tracking-tighter"
            data-testid="hero-headline"
          >
            <span className="text-gradient">The AI that teaches</span>
            <br />
            <span className="text-white">students how to </span>
            <span className="text-gradient-brand italic font-light">think.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-7 text-base md:text-lg text-white/60 max-w-xl leading-relaxed"
          >
            Mindora AI never gives answers. It teaches concepts through real-life examples,
            stories, experiments and guided discovery — building deep understanding that lasts.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <MagneticButton
              as="div"
              testId="hero-try-demo-btn"
              className="cursor-pointer group inline-flex items-center gap-2 bg-white text-black font-medium px-7 py-4 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(165,180,252,0.4)] transition-shadow"
            >
              <Link to="/signup" className="flex items-center gap-2">
                Try Live Demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </MagneticButton>

            <MagneticButton
              as="div"
              testId="hero-watch-btn"
              className="cursor-pointer inline-flex items-center gap-2 px-6 py-4 rounded-full glass text-white/90 hover:bg-white/[0.06] transition-colors"
            >
              <a href="#demo" className="flex items-center gap-2">
                <Play className="w-4 h-4" /> Watch How It Works
              </a>
            </MagneticButton>
          </motion.div>

          {/* Trust marker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3"
          >
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-white/40">
              Loved by 18,000+ students · Grades 6–12
            </div>
          </motion.div>
        </div>

        {/* Right: live "learning flow" card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="lg:col-span-5"
        >
          <div className="relative glass-strong rounded-3xl p-7 overflow-hidden noise">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/20 blur-3xl rounded-full" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2.5 h-2.5 bg-red-400/60 rounded-full" />
                <div className="w-2.5 h-2.5 bg-yellow-400/60 rounded-full" />
                <div className="w-2.5 h-2.5 bg-green-400/60 rounded-full" />
                <span className="ml-3 text-xs font-mono text-white/40 uppercase tracking-[0.18em]">
                  Mindora · Live Lesson
                </span>
              </div>

              <div className="rounded-2xl bg-black/30 p-5 border border-white/[0.05]">
                <div className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-300/70 mb-2">
                  Student asks
                </div>
                <div className="text-white text-lg font-medium">What is gravity?</div>
              </div>

              <div className="my-5 flex flex-col gap-2">
                {FLOW.map((step, i) => (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: i <= idx ? 1 : 0.25, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono font-bold"
                      style={{
                        background: `${step.color}1A`,
                        color: step.color,
                        boxShadow: i === idx ? `0 0 30px ${step.color}66` : "none",
                      }}
                    >
                      {step.icon}
                    </div>
                    <div className="text-sm text-white/90">{step.label}</div>
                    {i === idx && (
                      <motion.div
                        layoutId="active-step"
                        className="ml-auto text-[10px] font-mono uppercase tracking-[0.18em] text-white/40"
                      >
                        in progress
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent p-4"
                >
                  <div className="text-xs font-mono uppercase tracking-[0.18em] text-indigo-300/80 mb-1.5">
                    Mindora teaches
                  </div>
                  <div className="text-sm text-white/85 leading-relaxed">
                    {idx === 0 && "Let's start with what you already know — when you drop a ball, what happens?"}
                    {idx === 1 && "Think of jumping on a trampoline. You always come back down. Why?"}
                    {idx === 2 && "Imagine Earth as a giant magnet — but instead of metal, it pulls everything with mass."}
                    {idx === 3 && "Picture this: an apple, the Moon, and you — all being held in place by the same invisible string."}
                    {idx === 4 && "What if you dropped a feather and a hammer on the Moon? Astronauts actually tried this."}
                    {idx === 5 && "Now describe gravity in your own words — that's the proof you really get it."}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-[0.3em] text-white/30"
      >
        Scroll to explore
      </motion.div>
    </section>
  );
}
