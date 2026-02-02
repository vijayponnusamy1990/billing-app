import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 80,
    host: true, // Listen on all addresses, including LAN and public addresses
    allowedHosts: [
      "gokul.aaravicouture.in",
      "aaravi.aaravicouture.in",
      "gokul.com",
      "arravi.com"
    ],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
