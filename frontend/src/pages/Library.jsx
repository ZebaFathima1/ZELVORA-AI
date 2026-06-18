import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain, ArrowLeft, Calculator, FlaskConical, BookOpen, Code2, Check, ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";

const ICON_MAP = { Calculator, FlaskConical, BookOpen, Code2 };

export default function Library() {
  const [overview, setOverview] = useState(null);
  const [grade, setGrade] = useState(9);
  const [subject, setSubject] = useState("science");
  const [list, setList] = useState(null);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    api.get("/curriculum/overview").then((r) => setOverview(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingList(true);
    api
      .get(`/curriculum/${grade}/${subject}`)
      .then((r) => setList(r.data))
      .finally(() => setLoadingList(false));
  }, [grade, subject]);

  if (!overview) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }} className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white" data-testid="library-page">
      <header className="border-b border-white/[0.06] sticky top-0 z-30 bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-white/60 hover:text-white" data-testid="library-back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="text-sm">Lesson Library</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                  {overview.total_lessons} lessons · grades {overview.grades[0]}-{overview.grades.slice(-1)[0]}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-violet-300/80 mb-3">
            Browse curriculum
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-medium tracking-tight">
            Pick what you want to <span className="text-gradient-brand">understand next.</span>
          </h1>
        </motion.div>

        {/* Grade selector */}
        <div className="mt-8">
          <div className="text-xs font-mono uppercase tracking-[0.18em] text-white/40 mb-3">Grade</div>
          <div className="flex flex-wrap gap-2">
            {overview.grades.map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                data-testid={`grade-pill-${g}`}
                className={`px-4 py-2 rounded-full text-sm border transition-all ${
                  grade === g
                    ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-200"
                    : "bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white"
                }`}
              >
                Grade {g}
              </button>
            ))}
          </div>
        </div>

        {/* Subject selector */}
        <div className="mt-6">
          <div className="text-xs font-mono uppercase tracking-[0.18em] text-white/40 mb-3">Subject</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(overview.subjects).map(([key, s]) => {
              const Icon = ICON_MAP[s.icon] || BookOpen;
              const count = overview.lessons_per_grade_subject[grade][key];
              const active = subject === key;
              return (
                <button
                  key={key}
                  onClick={() => setSubject(key)}
                  data-testid={`subject-card-${key}`}
                  className={`text-left rounded-2xl p-4 border transition-all ${
                    active
                      ? "border-white/[0.12] bg-white/[0.04]"
                      : "border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03]"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${s.color}1A`, border: `1px solid ${s.color}40` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <div className="text-sm text-white">{s.name}</div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 mt-1">
                    {count} lessons
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lessons */}
        <div className="mt-10">
          <div className="text-xs font-mono uppercase tracking-[0.18em] text-white/40 mb-3">
            Lessons · Grade {grade} · {overview.subjects[subject].name}
          </div>
          {loadingList || !list ? (
            <div className="text-white/50 text-sm py-8">Loading lessons…</div>
          ) : list.lessons.length === 0 ? (
            <div className="text-white/40 text-sm py-8">No lessons yet for this combination.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {list.lessons.map((l, i) => (
                <motion.div
                  key={l.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={`/lesson/${l.slug}`}
                    data-testid={`lesson-card-${l.slug}`}
                    className="group block rounded-2xl glass p-5 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 flex flex-col items-center gap-1">
                        {l.completed ? (
                          <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-300" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-xs font-mono text-white/40">
                            {String(i + 1).padStart(2, "0")}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="font-heading text-lg text-white truncate">{l.title}</h3>
                          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/80 transition-colors shrink-0 mt-1" />
                        </div>
                        <p className="text-white/55 text-sm mt-1 leading-relaxed">
                          {l.concept}
                        </p>
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/30 mt-2">
                          Hook · {l.hook}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
