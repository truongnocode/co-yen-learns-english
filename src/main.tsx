import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const isBlockedFirebaseDevHost =
  window.location.port === "5173" &&
  ["127.0.0.1", "::1", "[::1]"].includes(window.location.hostname);

if (isBlockedFirebaseDevHost) {
  const url = new URL(window.location.href);
  url.hostname = "localhost";
  window.location.replace(url.toString());
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
