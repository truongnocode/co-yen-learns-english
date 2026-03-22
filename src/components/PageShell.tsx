import { motion } from "framer-motion";
import Navbar from "./Navbar";

/** macOS 26 Liquid Glass page wrapper */
const PageShell = ({ children, withNavbar = true }: { children: React.ReactNode; withNavbar?: boolean }) => (
  <div className="min-h-screen gradient-hero relative">
    {withNavbar && <Navbar />}

    {/* Subtle ambient background blobs */}
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute top-[-25%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-[hsl(215,30%,92%)] dark:bg-[hsl(215,20%,12%)] blur-[200px] opacity-40" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[55vw] h-[55vw] rounded-full bg-[hsl(200,25%,93%)] dark:bg-[hsl(200,15%,11%)] blur-[180px] opacity-30" />
      <div className="absolute top-[30%] right-[5%] w-[30vw] h-[30vw] rounded-full bg-[hsl(14,20%,95%)] dark:bg-[hsl(14,10%,10%)] blur-[150px] opacity-20" />
    </div>

    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  </div>
);

export default PageShell;
