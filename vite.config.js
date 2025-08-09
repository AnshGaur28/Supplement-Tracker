import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Define the PWA manifest content here. The plugin will use this to generate manifest.json
const manifestForPWA = {
  name: "Supplement Tracker",
  short_name: "SuppTracker",
  start_url: ".",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#1976d2",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" , "purpose": "maskable" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" , "purpose": "maskable" }
  ],
};

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: manifestForPWA,
      // This will automatically inject the service worker registration code
      injectRegister: "auto",
      // List all your static assets that should be included in the PWA cache
      includeAssets: [
        "icons/favicon.ico",
        "icons/favicon.svg",
        "icons/icon-192.png",
        "icons/icon-512.png",
      ],
      // Use the generateSW strategy for a simple, pre-cached service worker
      strategies: "generateSW",
    }),
  ],
  // This tells Vite where to find your static assets
  publicDir: "public",
  // The base URL for your app, which is important for Vercel
  base: "/",
  build: {
    // The output directory for the build, which Vercel uses by default
    outDir: "dist",
  },
});
