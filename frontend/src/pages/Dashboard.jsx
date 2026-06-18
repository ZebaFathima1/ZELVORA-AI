import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain, Flame, Trophy, LogOut, Sparkles, MessageSquareText,
  Calculator, FlaskConical, BookOpen, Code2, TrendingUp, Target, ArrowRight,
} from "lucide-react";
import { LineChart as RLineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const ICONS = { Mathematics: Calculator, Science: FlaskConical, English: BookOpen, Coding: Code2 };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/lms/dashboard").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500"
        />
      </div>
    );
  }

  const u = data.user;
  const xpProgress = Math.min(100, (u.xp / u.next_level_xp) * 100);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white" data-testid="dashboard-page">
      {/* Top bar */}
      <header className="border-b border-white/[0.06] sticky top-0 z-30 bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-400" />
            <span className="font-heading text-lg">Mindora <span className="text-indigo-400">AI</span></span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs text-orange-300 font-medium tabular-nums">{u.streak} day streak</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-xs text-indigo-300 font-mono">XP</span>
              <span className="text-xs text-white font-medium tabular-nums">{u.xp}</span>
            </div>
            <button
              onClick={async () => { await logout(); nav("/"); }}
              data-testid="dashboard-logout-btn"
              className="px-3 py-1.5 rounded-full glass text-xs text-white/70 hover:text-white inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-300/80 mb-3">
            grade {u.grade ?? "—"} · level {u.level}
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-medium tracking-tight">
            Welcome back, <span className="text-gradient-brand">{u.name?.split(" ")[0]}</span>.
          </h1>
          <p className="mt-2 text-white/55 text-sm max-w-xl">
            Pick up where you left off. Today's focus: build deeper understanding, not just complete tasks.
          </p>
        </motion.div>

        {/* Stats row */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile Icon={Sparkles} label="XP earned" value={u.xp} color="#4F46E5" trail={`Level ${u.level}`} />
          <StatTile Icon={Flame} label="Day streak" value={u.streak} color="#EC4899" trail="Keep it alive" />
          <StatTile Icon={Trophy} label="Concepts mastered" value={data.concepts_mastered} color="#10B981" trail="lifetime" />
          <StatTile Icon={TrendingUp} label="Understanding" value={`${data.understanding_score}%`} color="#06B6D4" trail="+12% week" />
        </div>

        {/* Main grid */}
        <div className="mt-8 grid lg:grid-cols-3 gap-5">
          {/* Subjects */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-3xl glass p-6">
              <div className="flex items-baseline justify-between mb-5">
                <div>
                  <h2 className="font-heading text-xl">Active subjects</h2>
                  <div className="text-xs font-mono uppercase tracking-[0.18em] text-white/40 mt-1">
                    Pick a subject to ask Mindora
                  </div>
                </div>
                <span className="text-xs text-white/40 font-mono">{data.subjects.length} courses</span>
              </div>

              <div className="space-y-3">
                {data.subjects.map((s, i) => {
                  const Icon = ICONS[s.name] || BookOpen;
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05] flex items-center gap-4 hover:bg-white/[0.04] transition-colors"
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${s.color}1A`, border: `1px solid ${s.color}40` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: s.color }} strokeWidth={1.6} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <div className="text-sm text-white truncate">{s.name}</div>
                          <div className="text-xs text-white/40 font-mono">{s.completed}/{s.lessons}</div>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.progress}%` }}
                            transition={{ duration: 1, delay: i * 0.06 }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}80)` }}
                          />
                        </div>
                      </div>
                      <Link
                        to={`/chat?subject=${encodeURIComponent(s.name)}`}
                        className="text-xs text-indigo-300 hover:text-indigo-200 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 inline-flex items-center gap-1"
                        data-testid={`dashboard-subject-${s.id}-chat`}
                      >
                        Ask <ArrowRight className="w-3 h-3" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Weekly chart */}
            <div className="rounded-3xl glass p-6">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <h2 className="font-heading text-xl">Weekly learning</h2>
                  <div className="text-xs font-mono uppercase tracking-[0.18em] text-white/40 mt-1">
                    Minutes spent · last 7 days
                  </div>
                </div>
                <div className="text-xs text-green-300 font-mono">+18% vs last week</div>
              </div>
              <div className="h-56">
                <ResponsiveContainer>
                  <RLineChart data={data.weekly_activity}>
                    <defs>
                      <linearGradient id="ind" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4F46E5" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: "#13131A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Line type="monotone" dataKey="minutes" stroke="url(#ind)" strokeWidth={2.5} dot={{ r: 4, fill: "#8B5CF6" }} activeDot={{ r: 6 }} />
                  </RLineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Goals */}
            <div className="rounded-3xl glass p-6">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-heading text-xl">Weekly goals</h2>
                <Target className="w-4 h-4 text-white/40" />
              </div>
              <div className="space-y-3">
                {data.goals.map((g) => (
                  <div key={g.id} className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex items-baseline justify-between">
                      <div className="text-sm text-white">{g.title}</div>
                      <div className="text-xs text-white/40 font-mono">{g.progress}%</div>
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/30 mt-0.5">
                      {g.subject}
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${g.progress}%` }}
                        transition={{ duration: 1 }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - AI mentor */}
          <div className="space-y-5">
            <div className="relative rounded-3xl glass-strong p-6 overflow-hidden noise">
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/30 blur-3xl rounded-full" />
              <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-violet-500/30 blur-3xl rounded-full" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <div className="text-xs font-mono uppercase tracking-[0.18em] text-indigo-300/80">
                    Mindora · {data.mentor_status}
                  </div>
                </div>
                <h3 className="font-heading text-lg">Today's wonder</h3>
                <p className="mt-3 text-sm text-white/75 leading-relaxed">
                  Yesterday you got curious about <span className="text-indigo-300">photosynthesis</span>.
                  Want to do the next thought-experiment together?
                </p>
                <Link
                  to="/chat"
                  data-testid="dashboard-open-chat-btn"
                  className="mt-5 inline-flex items-center gap-2 bg-white text-black font-medium text-sm px-5 py-2.5 rounded-full hover:scale-105 transition-transform"
                >
                  <MessageSquareText className="w-4 h-4" /> Open AI Companion
                </Link>
              </div>
            </div>

            {/* XP bar */}
            <div className="rounded-3xl glass p-6">
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-white/40">Next level</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-heading text-2xl">Level {u.level + 1}</span>
                <span className="text-xs text-white/40">{u.xp} / {u.next_level_xp} XP</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1 }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500"
                />
              </div>
              <p className="mt-3 text-xs text-white/40">
                Every conversation with Mindora earns you XP — and one tiny step toward mastery.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatTile({ Icon, label, value, color, trail }) {
  return (
    <div className="rounded-3xl glass p-5 relative overflow-hidden" data-testid={`stat-${label.replace(/\s+/g, "-").toLowerCase()}`}>
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-25" style={{ background: color }} />
      <Icon className="w-4 h-4 mb-3" style={{ color }} />
      <div className="font-heading text-2xl text-white tabular-nums">{value}</div>
      <div className="text-xs font-mono uppercase tracking-[0.18em] text-white/40 mt-1">{label}</div>
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/30 mt-1">{trail}</div>
    </div>
  );
}
