import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on();
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);

  const navLinks = [
    { label: "Why Mindora", href: "#why" },
    { label: "Demo", href: "#demo" },
    { label: "Features", href: "#features" },
    { label: "Dashboard", href: "#dashboard-preview" },
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div
          className={`flex items-center justify-between rounded-2xl px-5 py-3 transition-all ${
            scrolled ? "glass-strong" : "bg-transparent"
          }`}
        >
          <Link to="/" className="flex items-center gap-2 group" data-testid="nav-logo">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/40 blur-lg group-hover:bg-violet-500/50 transition-colors" />
              <Brain className="relative w-7 h-7 text-indigo-400" strokeWidth={1.6} />
            </div>
            <span className="font-heading text-xl tracking-tight">
              Mindora <span className="text-indigo-400">AI</span>
            </span>
          </Link>

          {loc.pathname === "/" && (
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                  data-testid={`nav-link-${l.label.replace(/\s/g, "-").toLowerCase()}`}
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}

          <div className="hidden md:flex items-center gap-3">
            {user && user !== false ? (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-all hover:scale-[1.03]"
                data-testid="nav-dashboard-btn"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-white/70 hover:text-white px-4 py-2"
                  data-testid="nav-login-btn"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2.5 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-all hover:scale-[1.03]"
                  data-testid="nav-signup-btn"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-white/80"
            onClick={() => setOpen(!open)}
            data-testid="nav-mobile-toggle"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2 glass-strong rounded-2xl p-4 flex flex-col gap-2"
          >
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="py-2 text-white/80" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            {user && user !== false ? (
              <Link to="/dashboard" className="py-2 text-indigo-400" onClick={() => setOpen(false)}>
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="py-2 text-white/80" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
                <Link to="/signup" className="py-2 text-indigo-400" onClick={() => setOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
