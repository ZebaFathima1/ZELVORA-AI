import { motion } from "framer-motion";
import { HelpCircle, Globe, BookOpen, Eye, Beaker, Lightbulb, Trophy } from "lucide-react";

const STEPS = [
  { Icon: HelpCircle, title: "Question", desc: "Student wonders 'why' or 'how'", color: "#06B6D4" },
  { Icon: Globe, title: "Real-life Example", desc: "Connect to something tangible", color: "#8B5CF6" },
  { Icon: BookOpen, title: "Story", desc: "A short narrative makes it stick", color: "#A78BFA" },
  { Icon: Eye, title: "Visual Learning", desc: "Imagine what's actually happening", color: "#4F46E5" },
  { Icon: Beaker, title: "Interactive Activity", desc: "Try, observe, predict", color: "#EC4899" },
  { Icon: Lightbulb, title: "Understanding", desc: "Concept clicks — student knows it", color: "#FBBF24" },
  { Icon: Trophy, title: "Mastery", desc: "Can teach it to someone else", color: "#10B981" },
];

export default function LearningJourney() {
  return (
    <section className="relative py-24 sm:py-32" data-testid="learning-journey-section">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mb-16"
        >
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-300/80 mb-4">
            The Learning Journey
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.05]">
            Seven steps from <span className="text-white/40">"huh?"</span> to <span className="text-gradient-brand">mastery</span>.
          </h2>
        </motion.div>

        <div className="relative">
          {/* connector line */}
          <div className="absolute left-7 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/40 via-violet-500/40 to-emerald-500/40 hidden md:block" />

          <div className="space-y-5">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="relative flex items-start gap-5 group"
              >
                <div
                  className="shrink-0 relative w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-xl border z-10"
                  style={{
                    background: `${s.color}15`,
                    borderColor: `${s.color}30`,
                    boxShadow: `0 0 30px ${s.color}30`,
                  }}
                >
                  <s.Icon className="w-6 h-6" style={{ color: s.color }} strokeWidth={1.6} />
                </div>
                <div className="flex-1 glass rounded-2xl p-5 group-hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs font-mono uppercase tracking-[0.18em] text-white/40">
                      step {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-heading text-xl text-white">{s.title}</h3>
                  </div>
                  <p className="text-white/55 text-sm mt-1.5">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
