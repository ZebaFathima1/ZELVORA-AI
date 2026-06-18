import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import NeuralBrain from "@/components/NeuralBrain";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      const to = loc.state?.from?.pathname || "/dashboard";
      nav(to, { replace: true });
    } else {
      setErr(res.error);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#0A0A0F] text-white" data-testid="login-page">
      {/* Left form */}
      <div className="flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-12">
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
            Welcome back.
          </motion.h1>
          <p className="mt-2 text-white/55 text-sm">Sign in to continue your learning journey.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-[0.18em] text-white/40">Email</label>
              <div className="mt-2 relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="login-email-input"
                  placeholder="you@school.com"
                  className="w-full bg-[#13131A] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-[0.18em] text-white/40">Password</label>
              <div className="mt-2 relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="login-password-input"
                  placeholder="••••••••"
                  className="w-full bg-[#13131A] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {err && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3" data-testid="login-error">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              data-testid="login-submit-btn"
              className="w-full inline-flex items-center justify-center gap-2 bg-white text-black font-medium py-3.5 rounded-xl hover:bg-white/90 transition-all disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-8 text-sm text-white/55">
            New to Mindora?{" "}
            <Link to="/signup" className="text-indigo-300 hover:text-indigo-200" data-testid="login-to-signup-link">
              Create your account
            </Link>
          </div>

          <div className="mt-10 text-xs text-white/30 font-mono">
            Demo admin: <span className="text-white/50">admin@mindora.ai</span> / <span className="text-white/50">Admin@Mindora2026</span>
          </div>
        </div>
      </div>

      {/* Right brain visual */}
      <div className="hidden md:block relative overflow-hidden border-l border-white/[0.06]">
        <div className="absolute inset-0">
          <NeuralBrain />
        </div>
        <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-[#0A0A0F]/30 to-[#0A0A0F]/70" />
        <div className="relative h-full flex items-end p-12">
          <div className="max-w-md">
            <div className="text-xs font-mono uppercase tracking-[0.3em] text-indigo-300/80 mb-3">
              Mindora AI
            </div>
            <p className="font-heading text-2xl text-white/85 leading-snug">
              Every great mind started with a single question. Welcome back to yours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
