import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, User, GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import NeuralBrain from "@/components/NeuralBrain";
import { useAuth } from "@/contexts/AuthContext";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", grade: 9, parent_email: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const payload = { ...form, grade: Number(form.grade) };
    if (!payload.parent_email) delete payload.parent_email;
    const res = await register(payload);
    setLoading(false);
    if (res.ok) nav("/dashboard", { replace: true });
    else setErr(res.error);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#0A0A0F] text-white" data-testid="signup-page">
      <div className="flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <Brain className="w-6 h-6 text-indigo-400" />
            <span className="font-heading text-lg">
              Mindora <span className="text-indigo-400">AI</span>
            </span>
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl md:text-4xl tracking-tight font-medium"
          >
            Start thinking smarter.
          </motion.h1>
          <p className="mt-2 text-white/55 text-sm">
            Create your free account · 14-day trial · no card required.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Full name" Icon={User}>
              <input
                type="text" required value={form.name} onChange={set("name")}
                data-testid="signup-name-input" placeholder="Alex Chen"
                className="w-full bg-transparent outline-none placeholder:text-white/30"
              />
            </Field>
            <Field label="Email" Icon={Mail}>
              <input
                type="email" required value={form.email} onChange={set("email")}
                data-testid="signup-email-input" placeholder="you@school.com"
                className="w-full bg-transparent outline-none placeholder:text-white/30"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Password" Icon={Lock}>
                <input
                  type="password" required minLength={6} value={form.password} onChange={set("password")}
                  data-testid="signup-password-input" placeholder="6+ characters"
                  className="w-full bg-transparent outline-none placeholder:text-white/30"
                />
              </Field>
              <Field label="Grade" Icon={GraduationCap}>
                <select
                  value={form.grade}
                  onChange={set("grade")}
                  data-testid="signup-grade-select"
                  className="w-full bg-transparent outline-none text-white"
                >
                  {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g} className="bg-[#13131A]">Grade {g}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Parent email (optional)" Icon={Mail}>
              <input
                type="email" value={form.parent_email} onChange={set("parent_email")}
                data-testid="signup-parent-email-input" placeholder="parent@example.com"
                className="w-full bg-transparent outline-none placeholder:text-white/30"
              />
            </Field>

            {err && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3" data-testid="signup-error">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              data-testid="signup-submit-btn"
              className="w-full inline-flex items-center justify-center gap-2 bg-white text-black font-medium py-3.5 rounded-xl hover:bg-white/90 transition-all disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-8 text-sm text-white/55">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-300 hover:text-indigo-200" data-testid="signup-to-login-link">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden md:block relative overflow-hidden border-l border-white/[0.06]">
        <div className="absolute inset-0">
          <NeuralBrain />
        </div>
        <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-[#0A0A0F]/30 to-[#0A0A0F]/70" />
        <div className="relative h-full flex items-end p-12">
          <div className="max-w-md">
            <div className="text-xs font-mono uppercase tracking-[0.3em] text-violet-300/80 mb-3">Mindora AI</div>
            <p className="font-heading text-2xl text-white/85 leading-snug">
              "Imagine, observe, guess, then test." That's the loop we live in. Welcome.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, Icon, children }) {
  return (
    <div>
      <label className="text-xs font-mono uppercase tracking-[0.18em] text-white/40">{label}</label>
      <div className="mt-2 relative flex items-center bg-[#13131A] border border-white/[0.08] rounded-xl px-3.5 py-3 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
        <Icon className="w-4 h-4 text-white/40 mr-3" />
        {children}
      </div>
    </div>
  );
}
