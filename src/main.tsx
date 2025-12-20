import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorMonitoring } from "@/services/error-monitoring";

// Render the app first, then initialize error monitoring
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Initialize error monitoring after React is mounted (deferred to avoid hook conflicts)
setTimeout(() => {
  initErrorMonitoring();
}, 0);
