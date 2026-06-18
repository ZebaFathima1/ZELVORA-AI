import { motion } from "framer-motion";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500"
          data-testid="loading-spinner"
        />
      </div>
    );
  }

  if (user === false) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
