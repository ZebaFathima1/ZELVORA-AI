import { motion } from "framer-motion";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Aanya R.",
    role: "Grade 9 · Mumbai",
    quote:
      "My maths grades went up, but the bigger thing is I finally see WHY equations work. Mindora doesn't tell me — it makes me figure it out.",
    color: "#4F46E5",
  },
  {
    name: "Diego M.",
    role: "Grade 11 · Madrid",
    quote:
      "I asked it about photosynthesis and it took me through a tiny story about a leaf cooking. I'll never forget it. School should be like this.",
    color: "#8B5CF6",
  },
  {
    name: "Mrs. Patel",
    role: "Parent · Grade 7",
    quote:
      "I love that I get a weekly digest with the questions my daughter actually thought about. Finally a learning tool I trust.",
    color: "#06B6D4",
  },
  {
    name: "Mr. Kowalski",
    role: "Science Teacher",
    quote:
      "Mindora doesn't replace teachers — it gives every student a patient tutor between classes. Class participation jumped overnight.",
    color: "#EC4899",
  },
];

export default function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32" data-testid="testimonials-section">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mb-16"
        >
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-violet-300/80 mb-4">
            Loved by students, parents & teachers
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.05]">
            Real <span className="text-gradient-brand">understanding</span>,
            <br />
            in their own words.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="relative rounded-3xl p-7 glass overflow-hidden"
            >
              <div
                className="absolute -top-20 -right-20 w-44 h-44 rounded-full blur-3xl opacity-30"
                style={{ background: t.color }}
              />
              <div className="relative">
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, k) => (
                    <Star key={k} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/85 text-lg leading-relaxed font-heading font-light">
                  "{t.quote}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                    style={{ background: `${t.color}40`, border: `1px solid ${t.color}80` }}
                  >
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-sm text-white">{t.name}</div>
                    <div className="text-xs text-white/40 font-mono">{t.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
