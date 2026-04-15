import { motion } from "framer-motion";
import Navbar from "./Navbar";

/** Dopamine Candy Glass page wrapper */
const PageShell = ({ children, withNavbar = true }: { children: React.ReactNode; withNavbar?: boolean }) => (
  <div className="min-h-screen gradient-hero relative">
    {withNavbar && <Navbar />}

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
