import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
// No Node path imports to avoid TS Node type dependency

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const target = env.VITE_API_PROXY_TARGET || "http://localhost:3000";
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  };
});
