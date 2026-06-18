import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain, ArrowLeft, Mail, Send, Loader2, Flame, Trophy, Sparkles, BookOpen, MessageSquareText,
} from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ParentDigest() {
  const { user, refresh } = useAuth();
  const [preview, setPreview] = useState(null);
  const [parentEmail, setParentEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/parent/preview").then((r) => {
      setPreview(r.data);
      if (r.data.parent_email) setParentEmail(r.data.parent_email);
    });
  }, []);

  const saveParentEmail = async () => {
    setSavingEmail(true);
    try {
      await api.patch("/auth/me", { parent_email: parentEmail });
      await refresh();
      const { data } = await api.get("/parent/preview");
      setPreview(data);
      toast.success("Parent email saved.");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Failed to save");
    }
    setSavingEmail(false);
  };

  const sendDigest = async () => {
    setSending(true);
    try {
      await api.post("/parent/send-digest");
      toast.success(`Digest sent to ${parentEmail}`);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Send failed");
    }
    setSending(false);
  };

  if (!preview) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const s = preview.student;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white" data-testid="parent-page">
      <header className="border-b border-white/[0.06] sticky top-0 z-30 bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="text-white/60 hover:text-white flex items-center gap-2" data-testid="parent-back-btn">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Dashboard</span>
          </Link>
          <Brain className="w-5 h-5 text-indigo-400" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-violet-300/80 mb-3">
            For parents · Weekly digest
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-medium tracking-tight leading-tight">
            Share <span className="text-gradient-brand">{s.name?.split(" ")[0]}'s</span> learning with home.
          </h1>
          <p className="mt-3 text-white/55 max-w-2xl">
            A beautifully crafted digest of mastered lessons, curious moments, and a dinner-table prompt — sent to your parent's inbox.
          </p>
        </motion.div>

        {/* Parent email form */}
        <div className="mt-10 glass rounded-3xl p-6">
          <div className="text-xs font-mono uppercase tracking-[0.18em] text-white/40 mb-3">
            Parent email
          </div>
          <div className="flex gap-3 items-center max-w-xl">
            <div className="flex-1 relative bg-[#13131A] border border-white/[0.08] rounded-xl px-4 py-3 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="parent@example.com"
                data-testid="parent-email-input"
                className="w-full bg-transparent outline-none pl-7 placeholder:text-white/30"
              />
            </div>
            <button
              onClick={saveParentEmail}
              disabled={savingEmail || !parentEmail}
              data-testid="parent-email-save-btn"
              className="px-5 py-3 rounded-xl bg-white text-black font-medium text-sm disabled:opacity-50 hover:scale-[1.03] transition-transform"
            >
              {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </button>
          </div>
          <div className="mt-3 text-xs text-white/40">
            We only use this email to send the digest you trigger. No spam, ever.
          </div>
        </div>

        {/* Preview + send */}
        <div className="mt-6 grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-3xl glass-strong p-6 relative overflow-hidden noise" data-testid="digest-preview">
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/30 blur-3xl rounded-full" />
              <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-violet-500/30 blur-3xl rounded-full" />
              <div className="relative">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-300/80 mb-3">
                  Email preview · Mindora · Weekly digest
                </div>
                <h2 className="font-heading text-2xl text-white">{s.name}'s week of learning</h2>
                <p className="text-white/55 text-sm mt-1">Built understanding — not just minutes logged.</p>

                <div className="grid grid-cols-3 gap-3 mt-5">
                  <Tile Icon={Sparkles} value={s.xp} label="XP earned" />
                  <Tile Icon={Flame} value={s.streak} label="Day streak" />
                  <Tile Icon={Trophy} value={s.level} label="Level" />
                </div>

                <div className="mt-6">
                  <div className="text-xs font-mono uppercase tracking-[0.18em] text-white/40 mb-2 flex items-center gap-2">
                    <BookOpen className="w-3 h-3" /> Lessons mastered
                  </div>
                  {preview.completed_lessons.length === 0 ? (
                    <div className="text-sm text-white/40 py-3">No completed lessons yet — but conversations counted.</div>
                  ) : (
                    <ul className="divide-y divide-white/[0.05]">
                      {preview.completed_lessons.slice(0, 5).map((l, i) => (
                        <li key={i} className="py-3 flex items-baseline justify-between">
                          <div>
                            <div className="text-sm text-white">{l.title}</div>
                            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 mt-0.5">
                              {l.subject} · Grade {l.grade}
                            </div>
                          </div>
                          <div className="text-xs text-white/50 font-mono">{l.score}%</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-6">
                  <div className="text-xs font-mono uppercase tracking-[0.18em] text-white/40 mb-2 flex items-center gap-2">
                    <MessageSquareText className="w-3 h-3" /> Curiosity moments
                  </div>
                  {preview.chat_sessions.length === 0 ? (
                    <div className="text-sm text-white/40 py-3">No chats yet.</div>
                  ) : (
                    <ul className="divide-y divide-white/[0.05]">
                      {preview.chat_sessions.slice(0, 4).map((c, i) => (
                        <li key={i} className="py-3 flex items-baseline justify-between">
                          <div className="text-sm text-white truncate pr-3">{c.title}</div>
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                            {(c.updated_at || "").slice(0, 10)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-6 rounded-xl p-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm">
                  <strong>Dinner-table prompt:</strong> Ask {s.name?.split(" ")[0]} — "What's one thing you discovered this week that surprised you?"
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl glass p-6">
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-white/40 mb-3">Send now</div>
              <p className="text-sm text-white/65 leading-relaxed">
                Email this digest to{" "}
                <span className="text-white">{preview.parent_email || "your parent"}</span>.
                One click. Beautiful HTML. Mobile friendly.
              </p>
              <button
                onClick={sendDigest}
                disabled={sending || !preview.parent_email}
                data-testid="parent-send-btn"
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black font-medium text-sm disabled:opacity-50 hover:scale-[1.02] transition-transform"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send digest</>}
              </button>
              {!preview.parent_email && (
                <div className="mt-3 text-xs text-orange-300/80">
                  Save your parent's email above first.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Tile({ Icon, value, label }) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 text-center">
      <Icon className="w-4 h-4 text-indigo-300 mx-auto mb-1.5" />
      <div className="font-heading text-2xl text-white tabular-nums">{value}</div>
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 mt-1">{label}</div>
    </div>
  );
}
