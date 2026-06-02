import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
    },
    dedupe: ["three"],
  },
  build: {
    // Raises the limit to stop the warning
    chunkSizeWarningLimit: 2000, 
    rollupOptions: {
      output: {
      },
    },
  },
});