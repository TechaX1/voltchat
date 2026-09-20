import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// index.html brands itself via %VITE_*% placeholders. Vite leaves a placeholder
// as literal text when its key is undefined, which then crashes
// `vite:build-html` (decodeURI fails on `%...%` in the favicon href) — so
// building without a .env (fresh clone, CI) fails outright. These defaults are
// injected only for keys the user has NOT set via .env / process env, so user
// values always win. Keep the values in sync with the zod defaults in
// src/config.ts.
const HTML_ENV_DEFAULTS: Record<string, string> = {
  VITE_APP_NAME: "VoltChat",
  VITE_APP_DESCRIPTION:
    "A high-performance, developer-focused chat interface for custom AI backends.",
  VITE_APP_LOGO_URL: "",
  VITE_FAVICON_URL: "/favicon.svg",
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const htmlEnvDefaults: Record<string, string> = {};
  for (const [key, value] of Object.entries(HTML_ENV_DEFAULTS)) {
    if (!(key in env)) {
      htmlEnvDefaults[`import.meta.env.${key}`] = JSON.stringify(value);
    }
  }

  return {
    server: {
      host: "::",
      port: 8026,
      hmr: {
        overlay: false,
      },
    },
    define: htmlEnvDefaults,
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
