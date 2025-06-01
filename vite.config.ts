import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { Buffer } from 'buffer'; // Import Buffer

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis' // This helps some libraries expect 'global'
      },
      // Enable esbuild polyfill plugins
      plugins: [
        // You might need specific esbuild plugins if the issue is deep within a CJS dependency
        // that Vite's default conversion doesn't handle perfectly.
        // For 'Buffer', usually just making it available is enough.
      ],
    },
  },
}));
