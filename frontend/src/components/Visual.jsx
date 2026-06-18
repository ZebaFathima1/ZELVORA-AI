import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Render either an inline SVG or a base64 image returned from /api/visual/generate.
 */
export default function Visual({ visual }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (visual) {
      const t = setTimeout(() => setShow(true), 80);
      return () => clearTimeout(t);
    }
  }, [visual]);

  if (!visual || visual.type === "none") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: show ? 1 : 0, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-3 rounded-2xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-transparent"
      data-testid="visual-block"
    >
      {visual.title && (
        <div className="px-4 py-2 border-b border-white/[0.05] flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-violet-300/80">
            {visual.title}
          </div>
        </div>
      )}
      {visual.type === "svg" && (
        <div
          className="p-4 flex items-center justify-center bg-[#0e0e14]"
          dangerouslySetInnerHTML={{ __html: visual.svg }}
          data-testid="visual-svg"
        />
      )}
      {visual.type === "image" && (
        <img
          src={`data:${visual.mime_type || "image/png"};base64,${visual.data}`}
          alt={visual.title || "Mindora illustration"}
          className="w-full h-auto object-contain block bg-[#0e0e14]"
          data-testid="visual-image"
        />
      )}
    </motion.div>
  );
}
