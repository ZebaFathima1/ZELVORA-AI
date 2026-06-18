import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Sun, Droplet, Sprout, BookOpen, Send, X, Check, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";

const SAMPLE_QUESTIONS = ["What is photosynthesis?", "How do magnets work?", "Why is the sky blue?"];

export default function AIDemo() {
  const [question, setQuestion] = useState("What is photosynthesis?");
  const [boring] = useState(
    "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water. It involves the green pigment chlorophyll and generates oxygen as a byproduct."
  );
  const [mindora, setMindora] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    setLoading(true);
    setMindora("");
    try {
      const { data } = await api.post("/demo/teach", { question });
      setMindora(data.answer);
    } catch (e) {
      setMindora("Hmm, the AI brain hit a hiccup. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="demo" className="relative py-24 sm:py-32" data-testid="ai-demo-section">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-2xl mb-16"
        >
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-300/80 mb-4">
            Live AI Demo · Side by side
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight font-medium text-white leading-[1.05]">
            See the difference between an{" "}
            <span className="text-white/40">answer machine</span> and a{" "}
            <span className="text-gradient-brand">real teacher</span>.
          </h2>
        </motion.div>

        {/* Question selector */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {SAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => setQuestion(q)}
              data-testid={`demo-question-${q.replace(/\W+/g, "-").toLowerCase()}`}
              className={`px-4 py-2 rounded-full text-sm border transition-all ${
                question === q
                  ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-200"
                  : "bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white"
              }`}
            >
              {q}
            </button>
          ))}
          <button
            onClick={ask}
            disabled={loading}
            data-testid="demo-ask-btn"
            className="ml-auto px-5 py-2.5 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-all hover:scale-[1.03] disabled:opacity-60 inline-flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? "Teaching…" : "Ask Mindora"}
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Boring AI */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl p-7 border border-white/[0.06] bg-[#0e0e14] overflow-hidden"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-white/40">
                Traditional AI
              </div>
              <div className="flex items-center gap-2 text-xs text-red-300/70">
                <X className="w-3.5 h-3.5" />
                Spoon-feeds answers
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.02] p-4 mb-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/30 mb-1">
                Student asks
              </div>
              <div className="text-white/80 text-sm">{question}</div>
            </div>

            <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.04]">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/30 mb-2">
                AI replies
              </div>
              <p className="text-white/55 text-sm leading-relaxed font-mono">
                {boring}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-[10px] font-mono uppercase tracking-[0.15em] text-white/30">
              <div>· Memorization</div>
              <div>· No context</div>
              <div>· Forgotten in 24h</div>
            </div>
          </motion.div>

          {/* Mindora AI */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative rounded-3xl p-7 glass-strong overflow-hidden noise"
          >
            <div className="absolute -top-32 -right-32 w-72 h-72 bg-indigo-500/25 blur-3xl rounded-full" />
            <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-violet-500/25 blur-3xl rounded-full" />
            <div className="relative">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <div className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-300/90">
                    Mindora AI · Live
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-300/80">
                  <Check className="w-3.5 h-3.5" />
                  Builds understanding
                </div>
              </div>

              {/* Animated icons */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {[
                  { Icon: Sun, label: "Sunlight", c: "#FBBF24" },
                  { Icon: Droplet, label: "Water", c: "#06B6D4" },
                  { Icon: Sprout, label: "Plant", c: "#10B981" },
                  { Icon: BookOpen, label: "Story", c: "#A78BFA" },
                ].map(({ Icon, label, c }, i) => (
                  <motion.div
                    key={label}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2.5, delay: i * 0.2, repeat: Infinity }}
                    className="rounded-xl p-3 bg-white/[0.04] border border-white/[0.06] flex flex-col items-center gap-1"
                  >
                    <Icon className="w-5 h-5" style={{ color: c }} />
                    <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/40">{label}</span>
                  </motion.div>
                ))}
              </div>

              <div className="rounded-xl bg-black/30 p-4 border border-white/[0.06]">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-300/80 mb-1.5">
                  Mindora teaches
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mindora || "default"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap min-h-[160px]"
                  >
                    {loading && !mindora && (
                      <div className="flex items-center gap-2 text-white/50">
                        <MessageSquare className="w-4 h-4 animate-pulse" />
                        Mindora is composing a story for you…
                      </div>
                    )}
                    {!loading && !mindora && (
                      <>
                        Imagine a plant cooking its own breakfast using sunlight as the stove,
                        water as the recipe, and air as the secret ingredient.
                        {"\n\n"}
                        Now — if you were a leaf, what would you do all day to make sure your kitchen never runs out of energy?
                        {"\n\n"}
                        Press <span className="text-indigo-300">Ask Mindora</span> to start the real conversation.
                      </>
                    )}
                    {mindora && mindora}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
