import { motion } from "framer-motion";
import {
  GraduationCap,
  Sparkles,
  Beaker,
  BookOpenText,
  LineChart,
  HeartHandshake,
  PieChart,
  MapPin,
} from "lucide-react";

const FEATURES = [
  { Icon: GraduationCap, title: "Smart AI Teacher", desc: "Personalized explanations tuned to your student's current level and curiosity.", color: "#4F46E5" },
  { Icon: Sparkles, title: "Adaptive Learning", desc: "Mindora senses confusion and reroutes the lesson in real time.", color: "#8B5CF6" },
  { Icon: Beaker, title: "Interactive Experiments", desc: "Virtual lab moments where students predict, test and observe.", color: "#06B6D4" },
  { Icon: BookOpenText, title: "Story-Based Teaching", desc: "Every concept arrives wrapped in a story your brain wants to remember.", color: "#A78BFA" },
  { Icon: LineChart, title: "Progress Tracking", desc: "Watch understanding compound, not just minutes logged.", color: "#10B981" },
  { Icon: HeartHandshake, title: "Parent Dashboard", desc: "A weekly digest so parents can ask the right questions at dinner.", color: "#EC4899" },
  { Icon: PieChart, title: "Teacher Analytics", desc: "Class-wide insight reports that show where intuition is forming.", color: "#FBBF24" },
  { Icon: MapPin, title: "Personalized Roadmaps", desc: "A custom path for each student, refreshed every week.", color: "#06B6D4" },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32" data-testid="features-section">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mb-16"
        >
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-300/80 mb-4">
            Features · Built for understanding
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.05]">
            A full learning operating system for the
            <br />
            <span className="text-gradient-brand">curious mind.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              whileHover={{ y: -6 }}
              className="relative group rounded-3xl p-6 glass overflow-hidden cursor-default"
              data-testid={`feature-card-${f.title.replace(/\s+/g, "-").toLowerCase()}`}
            >
              <div
                className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: f.color }}
              />
              <div className="relative">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 border"
                  style={{ background: `${f.color}1A`, borderColor: `${f.color}30` }}
                >
                  <f.Icon className="w-5 h-5" style={{ color: f.color }} strokeWidth={1.6} />
                </div>
                <h3 className="font-heading text-lg text-white mb-2">{f.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
