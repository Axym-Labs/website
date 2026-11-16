import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Self-hosted fonts: no requests to Google Fonts (see the privacy notice on /legal/).
import "@fontsource-variable/inter";
import "@fontsource-variable/source-serif-4/opsz.css";
import "@fontsource-variable/source-serif-4/opsz-italic.css";
import "@fontsource/jetbrains-mono/400.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
