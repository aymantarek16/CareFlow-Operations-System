import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 4000,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (!normalizedId.includes("/node_modules/")) return undefined;

          if (normalizedId.includes("/react/") || normalizedId.includes("/react-dom/") || normalizedId.includes("/react-router")) {
            return "vendor-react";
          }
          if (normalizedId.includes("/@supabase/")) return "vendor-supabase";
          if (normalizedId.includes("/@radix-ui/")) return "vendor-radix";
          if (normalizedId.includes("/@tanstack/")) return "vendor-query";
          if (normalizedId.includes("/lucide-react/")) return "vendor-icons";
          if (normalizedId.includes("/recharts/")) return "vendor-charts";
          if (normalizedId.includes("/xlsx/")) return "vendor-xlsx";
          if (normalizedId.includes("/html2pdf.js/")) return "vendor-html2pdf";
          if (normalizedId.includes("/html2canvas/")) return "vendor-html2canvas";
          if (normalizedId.includes("/jspdf/")) return "vendor-jspdf";

          return undefined;
        },
      },
    },
  },
}));
