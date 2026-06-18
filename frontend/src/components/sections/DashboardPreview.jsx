import { motion } from "framer-motion";
import { Flame, Sparkles, TrendingUp, BookOpen, Code2, FlaskConical, Calculator, MessageSquareText } from "lucide-react";
import { Link } from "react-router-dom";

const SUBJECTS = [
  { name: "Mathematics", Icon: Calculator, progress: 72, color: "#4F46E5", lessons: "17/24" },
  { name: "Science", Icon: FlaskConical, progress: 58, color: "#06B6D4", lessons: "16/28" },
  { name: "English", Icon: BookOpen, progress: 84, color: "#8B5CF6", lessons: "17/20" },
  { name: "Coding", Icon: Code2, progress: 41, color: "#EC4899", lessons: "12/30" },
];

export default function DashboardPreview() {
  return (
    <section id="dashboard-preview" className="relative py-24 sm:py-32" data-testid="dashboard-preview-section">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mb-16"
        >
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-300/80 mb-4">
            The Mindora LMS
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.05]">
            Your <span className="text-gradient-brand">learning command center</span>,
            <br />
            built for daily curiosity.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl glass-strong overflow-hidden border border-white/[0.08]"
        >
          {/* Top bar */}
          <div className="border-b border-white/[0.06] p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <div className="text-sm text-white">Welcome back, Alex</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">grade 9 · level 12</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs text-orange-300 font-medium tabular-nums">17 day streak</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-xs text-indigo-300 font-mono">XP</span>
                <span className="text-xs text-white font-medium tabular-nums">2,480</span>
              </div>
            </div>
          </div>

          <div className="p-6 grid lg:grid-cols-3 gap-5">
            {/* Subjects */}
            <div className="lg:col-span-2 space-y-3">
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-white/40 mb-2">Active subjects</div>
              {SUBJECTS.map((s, i) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05] flex items-center gap-4 hover:bg-white/[0.04] transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${s.color}1A`, border: `1px solid ${s.color}40` }}
                  >
                    <s.Icon className="w-5 h-5" style={{ color: s.color }} strokeWidth={1.6} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <div className="text-sm text-white">{s.name}</div>
                      <div className="text-xs text-white/40 font-mono">{s.lessons}</div>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${s.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}80)` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-white/80 tabular-nums">{s.progress}%</div>
                </motion.div>
              ))}
            </div>

            {/* AI companion preview */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent border border-indigo-500/15 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-violet-500/30 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <div className="text-xs font-mono uppercase tracking-[0.18em] text-indigo-300/80">
                    AI Companion · Online
                  </div>
                </div>
                <h4 className="font-heading text-lg text-white mb-3">Today's wonder</h4>
                <div className="text-sm text-white/70 leading-relaxed mb-5">
                  "If light has no mass, how does it bend around a black hole? Let's explore that together."
                </div>
                <Link
                  to="/chat"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-black font-medium text-xs hover:scale-105 transition-transform"
                  data-testid="dashboard-preview-chat-btn"
                >
                  <MessageSquareText className="w-3.5 h-3.5" /> Continue learning
                </Link>
              </div>
            </div>
          </div>

          {/* Footer strip */}
          <div className="border-t border-white/[0.06] px-6 py-4 flex items-center justify-between text-xs font-mono uppercase tracking-[0.18em] text-white/40">
            <span>Understanding score · 89%</span>
            <span className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-300">+12% this week</span>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
