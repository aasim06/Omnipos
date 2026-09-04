import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  root: "src/renderer",
  envDir: path.resolve(__dirname, "."),
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/renderer/src"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "./dist"),
    emptyOutDir: true,
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        if (
          warning.code === "INVALID_ANNOTATION" ||
          (warning.message && warning.message.includes("contains an annotation that Rollup cannot interpret"))
        ) {
          return;
        }
        defaultHandler(warning);
      },
    },
  },
});
