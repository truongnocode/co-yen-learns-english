import { motion } from "framer-motion";
import Navbar from "./Navbar";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

/** Shared page wrapper with animated background, Navbar, and blur-in content */
const PageShell = ({ children, withNavbar = true }: { children: React.ReactNode; withNavbar?: boolean }) => (
  <div className="min-h-screen gradient-hero relative">
    {withNavbar && <Navbar />}

    {/* Animated background blobs */}
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ x: [0, 25, 0], y: [0, -15, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-20%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-[hsl(215,50%,92%)] blur-[180px] opacity-50"
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[hsl(175,50%,90%)] blur-[160px] opacity-40"
      />
    </div>

    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={smooth}
    >
      {children}
    </motion.div>
  </div>
);

export default PageShell;
