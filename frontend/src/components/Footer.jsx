import { motion } from "framer-motion";
import { Brain, Twitter, Github, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] mt-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-7 h-7 text-indigo-400" />
              <span className="font-heading text-xl">
                Mindora <span className="text-indigo-400">AI</span>
              </span>
            </div>
            <p className="text-white/50 text-sm max-w-md leading-relaxed">
              The AI teacher that builds understanding instead of giving answers. Personalized
              learning for grades 6-12, powered by world-class large language models.
            </p>
            <div className="flex gap-3 mt-6">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <Icon className="w-4 h-4 text-white/60" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 mb-4">Product</div>
            <ul className="space-y-2 text-sm text-white/60">
              <li>Features</li>
              <li>AI Teacher</li>
              <li>LMS Dashboard</li>
              <li>For Parents</li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 mb-4">Company</div>
            <ul className="space-y-2 text-sm text-white/60">
              <li>About</li>
              <li>Manifesto</li>
              <li>Careers</li>
              <li>Contact</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs text-white/40 font-mono">© 2026 Mindora AI. Built for thinkers.</span>
          <span className="text-xs text-white/40 font-mono">v1.0 · The thinking engine</span>
        </div>
      </div>
    </footer>
  );
}
