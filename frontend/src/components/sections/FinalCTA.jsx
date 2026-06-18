import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import MagneticButton from "@/components/MagneticButton";
import NeuralBrain from "@/components/NeuralBrain";

export default function FinalCTA() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden" data-testid="final-cta-section">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="relative rounded-[2rem] overflow-hidden glass-strong border border-white/[0.08] noise">
          <div className="absolute inset-0 opacity-40">
            <NeuralBrain intensity={0.6} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0F]/30 to-[#0A0A0F]/70" />

          <div className="relative px-8 sm:px-14 py-20 md:py-28 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-mono uppercase tracking-[0.3em] text-indigo-300/80 mb-6"
            >
              The thinking engine
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="font-heading text-4xl md:text-5xl lg:text-6xl font-medium tracking-tighter max-w-4xl mx-auto leading-[1.05]"
            >
              <span className="text-white">Education should create </span>
              <span className="text-gradient-brand">thinkers</span>,
              <br />
              <span className="text-white/40">not answer machines.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-7 text-white/60 max-w-2xl mx-auto"
            >
              Join 18,000+ students who learn by understanding — not memorizing. First 14 days free.
              Cancel anytime. No credit card required.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
            >
              <MagneticButton
                as="div"
                testId="cta-start-learning-btn"
                className="cursor-pointer group inline-flex items-center gap-2 bg-white text-black font-medium px-8 py-4 rounded-full shadow-[0_0_60px_rgba(165,180,252,0.35)] hover:scale-105 transition-transform"
              >
                <Link to="/signup" className="flex items-center gap-2">
                  Start Learning Smarter
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </MagneticButton>
              <Link
                to="/login"
                className="px-6 py-4 rounded-full glass text-white/90 hover:bg-white/[0.06] transition-colors"
                data-testid="cta-sign-in-btn"
              >
                I have an account
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
