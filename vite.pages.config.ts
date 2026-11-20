import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { copyFile, mkdir, writeFile } from "node:fs/promises";

const here = fileURLToPath(new URL(".", import.meta.url));

const blueMarbleTexture = {
  name: "publish-blue-marble-texture",
  // Cache the NASA satellite map with GitHub Pages when possible, so the
  // 3D globe does not depend on an external request for every page visit.
  async closeBundle() {
    const url = "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error("Earth texture HTTP " + response.status);
      const folder = here + "/dist-pages/assets/cockpit";
      await mkdir(folder, { recursive: true });
      await writeFile(folder + "/earth-blue-marble.jpg", new Uint8Array(await response.arrayBuffer()));
      try {
        const cloudUrl = "https://threejs.org/examples/textures/planets/earth_clouds_1024.png";
        const cloud = await fetch(cloudUrl, { signal: AbortSignal.timeout(20000) });
        if (!cloud.ok) throw new Error("Cloud texture HTTP " + cloud.status);
        await writeFile(folder + "/earth-clouds.png", new Uint8Array(await cloud.arrayBuffer()));
      } catch (error) {
        console.warn("Earth cloud texture unavailable during build:", error);
      }
    } catch (error) {
      // The renderer falls back to the original map URL, then the legacy SVG.
      console.warn("Local Earth texture unavailable during build:", error);
    }
  },
};

const pagesFallback = {
  name: "github-pages-history-fallback",
  // writeBundle runs after the HTML asset is emitted. closeBundle can execute
  // before Rolldown has finished writing it in Vite 8.
  async writeBundle() {
    await copyFile(`${here}/dist-pages/index.html`, `${here}/dist-pages/404.html`);
  },
};

export default defineConfig({
  root: `${here}/showcase`,
  base: "/shuomi/",
  plugins: [pagesFallback, blueMarbleTexture],
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
