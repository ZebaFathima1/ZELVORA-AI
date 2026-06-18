import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const ROWS = [
  { trad: "Gives answers instantly", mindora: "Builds understanding step-by-step" },
  { trad: "Encourages memorization", mindora: "Uses real-life examples and stories" },
  { trad: "Creates homework dependency", mindora: "Encourages curiosity & questioning" },
  { trad: "One-size-fits-all replies", mindora: "Adapts to each student's pace" },
  { trad: "Forgotten in 24 hours", mindora: "Remembered for life" },
];

export default function WhyDifferent() {
  return (
    <section id="why" className="relative py-24 sm:py-32" data-testid="why-different-section">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-3xl mb-16"
        >
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-violet-300/80 mb-4">
            Why we are different
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight font-medium leading-[1.05]">
            Built to <span className="text-gradient-brand">build thinkers</span>,
            <br />
            not to deliver answers.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Traditional */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl p-8 bg-[#0e0e14] border border-white/[0.05]"
          >
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 mb-4">
              Traditional AI
            </div>
            <h3 className="font-heading text-2xl text-white/80 mb-6">Answer machine</h3>
            <div className="space-y-3">
              {ROWS.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]"
                >
                  <div className="w-6 h-6 rounded-md bg-red-500/10 flex items-center justify-center mt-0.5">
                    <X className="w-3.5 h-3.5 text-red-300" />
                  </div>
                  <span className="text-white/55 text-sm">{r.trad}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Mindora */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative rounded-3xl p-8 glass-strong overflow-hidden noise"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/25 blur-3xl rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/25 blur-3xl rounded-full" />
            <div className="relative">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-300/80 mb-4">
                Mindora AI
              </div>
              <h3 className="font-heading text-2xl text-white mb-6">Thinking engine</h3>
              <div className="space-y-3">
                {ROWS.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-transparent border border-indigo-500/10"
                  >
                    <div className="w-6 h-6 rounded-md bg-green-500/10 flex items-center justify-center mt-0.5">
                      <Check className="w-3.5 h-3.5 text-green-300" />
                    </div>
                    <span className="text-white text-sm">{r.mindora}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
