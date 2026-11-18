import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { copyFile } from "node:fs/promises";

const here = fileURLToPath(new URL(".", import.meta.url));

const pagesFallback = {
  name: "github-pages-history-fallback",
  async closeBundle() {
    await copyFile(`${here}/dist-pages/index.html`, `${here}/dist-pages/404.html`);
  },
};

export default defineConfig({
  root: `${here}/showcase`,
  base: "/shuomi/",
  plugins: [pagesFallback],
  resolve: {
    alias: [
      { find: "@", replacement: `${here}/src` },
      { find: "next/navigation", replacement: `${here}/showcase/next-navigation.tsx` },
      { find: "next/link", replacement: `${here}/showcase/next-link.tsx` },
    ],
  },
  build: {
    outDir: `${here}/dist-pages`,
    emptyOutDir: true,
  },
});
