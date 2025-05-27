import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA, VitePWAOptions } from "vite-plugin-pwa";

const pwaOptions: Partial<VitePWAOptions> = {
  strategies: "generateSW",
  registerType: "autoUpdate",
  mode: "production",
  base: "/",
  includeAssets: ["favicon.svg"],
  minify: true,
  manifest: {
    name: "Malley",
    short_name: "Malley",
    description: "Malley is a X-like social media platform.",
    lang: "en",
    dir: "ltr",
    id: "/",
    orientation: "any",
    launch_handler: {
      client_mode: "navigate-existing",
    },
    protocol_handlers: [],
    categories: ["social"],
    scope_extensions: [{ origin: "https://malley.afcms.dev" }],
    related_applications: [],
    prefer_related_applications: false,
    theme_color: "#000000",
    icons: [
      {
        src: "favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "pwa-64x64.png",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [],
  },
};

export default defineConfig({
  plugins: [tailwindcss(), react(), VitePWA(pwaOptions)],
});
