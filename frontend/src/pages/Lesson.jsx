import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, ArrowLeft, Sparkles, MessageSquareText, BookOpen, Beaker,
  Lightbulb, CheckCircle2, XCircle, Trophy, ArrowRight, Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

export default function Lesson() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [phase, setPhase] = useState("lesson"); // lesson | quiz | result
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    setData(null);
    setQuiz(null);
    setResult(null);
    setPhase("lesson");
    setAnswers({});
    api.get(`/curriculum/lesson/${slug}`).then((r) => setData(r.data));
  }, [slug]);

  const startQuiz = async () => {
    setLoadingQuiz(true);
    try {
      const { data: q } = await api.get(`/curriculum/quiz/${slug}`);
      setQuiz(q);
      setPhase("quiz");
    } catch {
    } finally {
      setLoadingQuiz(false);
    }
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    const arr = quiz.questions.map((q, i) => (answers[i] ?? -1));
    const { data: res } = await api.post(`/curriculum/lesson/${slug}/complete`, { answers: arr });
    setResult(res);
    setPhase("result");
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const { lesson, content, completed } = data;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white" data-testid="lesson-page">
      <header className="border-b border-white/[0.06] sticky top-0 z-30 bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/library" className="text-white/60 hover:text-white flex items-center gap-2" data-testid="lesson-back-btn">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Library</span>
          </Link>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
            Grade {lesson.grade} · {lesson.subject_name}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-[0.2em] mb-4"
            style={{
              background: `${lesson.subject_color}15`,
              color: lesson.subject_color,
              border: `1px solid ${lesson.subject_color}40`,
            }}
          >
            <Sparkles className="w-3 h-3" /> {lesson.subject_name}
          </div>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.05]">
            {lesson.title}
          </h1>
          <p className="mt-3 text-white/55 text-sm max-w-2xl">
            {lesson.concept}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {phase === "lesson" && (
            <motion.div
              key="lesson"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-10 space-y-5"
            >
              {/* Intro */}
              <Card icon={BookOpen} color="#8B5CF6" label="The hook">
                <div className="text-white/85 leading-relaxed whitespace-pre-wrap text-base">
                  {content.intro}
                </div>
              </Card>

              {/* Key idea */}
              <Card icon={Lightbulb} color="#FBBF24" label="One core idea">
                <div className="font-heading text-xl text-white leading-snug">
                  {content.key_idea}
                </div>
              </Card>

              {/* Story */}
              {content.story && (
                <Card icon={BookOpen} color="#06B6D4" label="A short story">
                  <div className="text-white/85 leading-relaxed italic">"{content.story}"</div>
                </Card>
              )}

              {/* Experiment */}
              {content.tiny_experiment && (
                <Card icon={Beaker} color="#EC4899" label="5-minute experiment">
                  <div className="text-white/85 leading-relaxed">{content.tiny_experiment}</div>
                </Card>
              )}

              {/* Check questions */}
              {content.check_questions && content.check_questions.length > 0 && (
                <Card icon={MessageSquareText} color="#4F46E5" label="Think it through">
                  <ul className="space-y-3">
                    {content.check_questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-3 text-white/80">
                        <span className="text-indigo-300 font-mono text-xs mt-1">{String(i + 1).padStart(2, "0")}</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to={`/chat?lesson=${slug}&subject=${encodeURIComponent(lesson.subject_name)}`}
                  data-testid="lesson-discuss-btn"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass text-white/90 hover:bg-white/[0.06] transition-colors text-sm"
                >
                  <MessageSquareText className="w-4 h-4" /> Discuss with Mindora
                </Link>
                <button
                  onClick={startQuiz}
                  disabled={loadingQuiz}
                  data-testid="lesson-start-quiz-btn"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-black font-medium text-sm hover:scale-[1.03] transition-transform disabled:opacity-60"
                >
                  {loadingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                  {completed ? "Re-take quiz" : "Take the quiz"}
                </button>
              </div>
            </motion.div>
          )}

          {phase === "quiz" && quiz && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-10 space-y-5"
            >
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-300/80">
                Quiz · {quiz.questions.length} questions
              </div>
              {quiz.questions.map((q, i) => (
                <div key={i} className="glass rounded-3xl p-6" data-testid={`quiz-question-${i}`}>
                  <div className="font-heading text-lg text-white">
                    {i + 1}. {q.question}
                  </div>
                  <div className="mt-4 space-y-2">
                    {q.options.map((opt, j) => {
                      const selected = answers[i] === j;
                      return (
                        <button
                          key={j}
                          onClick={() => setAnswers({ ...answers, [i]: j })}
                          data-testid={`quiz-option-${i}-${j}`}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                            selected
                              ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-100"
                              : "bg-white/[0.02] border-white/[0.05] text-white/80 hover:bg-white/[0.04]"
                          }`}
                        >
                          <span className="text-xs font-mono text-white/40 mr-3">{String.fromCharCode(65 + j)}.</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <button
                  onClick={submitQuiz}
                  disabled={Object.keys(answers).length < quiz.questions.length}
                  data-testid="quiz-submit-btn"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium text-sm hover:scale-[1.03] transition-transform disabled:opacity-50"
                >
                  Submit answers <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {phase === "result" && result && quiz && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-10 space-y-6"
              data-testid="quiz-result"
            >
              <div className={`rounded-3xl p-8 text-center ${result.passed ? "glass-strong" : "glass"}`}>
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${result.passed ? "bg-green-500/20 border border-green-500/40" : "bg-orange-500/20 border border-orange-500/40"}`}>
                  {result.passed ? <Trophy className="w-7 h-7 text-green-300" /> : <Sparkles className="w-7 h-7 text-orange-300" />}
                </div>
                <h2 className="font-heading text-3xl tracking-tight">
                  {result.passed ? "Lesson mastered!" : "Great try — let's revisit"}
                </h2>
                <div className="mt-2 text-white/60">
                  {result.correct} / {result.total} correct · {result.score_pct}%
                </div>
                {result.passed && (
                  <div className="mt-3 text-xs font-mono uppercase tracking-[0.2em] text-indigo-300/80">
                    +50 XP earned
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {quiz.questions.map((q, i) => {
                  const picked = answers[i];
                  const right = picked === q.correct_index;
                  return (
                    <div key={i} className="glass rounded-2xl p-5">
                      <div className="flex items-start gap-3">
                        {right ? (
                          <CheckCircle2 className="w-5 h-5 text-green-300 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-300 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="font-heading text-white">{q.question}</div>
                          <div className="text-sm text-white/60 mt-1">
                            Your answer: <span className={right ? "text-green-300" : "text-red-300"}>{q.options[picked] ?? "—"}</span>
                          </div>
                          {!right && (
                            <div className="text-sm text-white/70 mt-1">
                              Correct: <span className="text-green-300">{q.options[q.correct_index]}</span>
                            </div>
                          )}
                          <div className="text-sm text-white/75 mt-2 leading-relaxed">
                            {q.explanation}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <button
                  onClick={() => { setPhase("lesson"); setAnswers({}); setResult(null); }}
                  data-testid="quiz-back-btn"
                  className="px-5 py-3 rounded-full glass text-white/80 hover:bg-white/[0.06] transition-colors text-sm"
                >
                  Back to lesson
                </button>
                <button
                  onClick={() => nav("/library")}
                  data-testid="quiz-library-btn"
                  className="px-5 py-3 rounded-full bg-white text-black font-medium text-sm hover:scale-[1.03] transition-transform"
                >
                  Next lesson
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Card({ icon: Icon, color, label, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl glass p-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}1A`, border: `1px solid ${color}40` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50">{label}</div>
      </div>
      {children}
    </motion.div>
  );
}
