import { motion } from "framer-motion";
import AppNav from "./AppNav";

/** App page wrapper: unified nav (top bar + mobile bottom bar) + animated content.
 *  Bottom padding on mobile reserves space for the fixed bottom tab bar. */
const PageShell = ({ children, withNavbar = true }: { children: React.ReactNode; withNavbar?: boolean }) => (
  <div className={`relative min-h-svh bg-background ${withNavbar ? "pb-[76px] md:pb-0" : ""}`}>
    {withNavbar && <AppNav />}

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
