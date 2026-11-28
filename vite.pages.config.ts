import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { cp, copyFile, mkdir, writeFile } from "node:fs/promises";

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

const bundledAgentExamples = {
  name: "bundle-agent-image-examples",
  async writeBundle() {
    // Vite's root is showcase/, so the main Next public/ folder is not copied by default.
    // Publish the 16 official-plan examples without changing showcase/public logo handling.
    await cp(
      `${here}/public/assets/agent-image-examples`,
      `${here}/dist-pages/assets/agent-image-examples`,
      { recursive: true }
    );
    // New POD inspiration gallery artwork lives in the root public folder too.
    await cp(
      `${here}/public/assets/pod-inspiration`,
      `${here}/dist-pages/assets/pod-inspiration`,
      { recursive: true }
    );
    // POD print lineage fixtures are stored in the repository public tree.
    // The Showcase uses a separate Vite root, so copy these assets explicitly.
    await cp(
      `${here}/public/assets/pod-prints`,
      `${here}/dist-pages/assets/pod-prints`,
      { recursive: true }
    );
    // Single composite POD preview images live outside the showcase Vite root.
    await cp(
      `${here}/public/assets/pod-previews`,
      `${here}/dist-pages/assets/pod-previews`,
      { recursive: true }
    );
    // Publish the committed original POD apparel supplier photos.
    await cp(
      `${here}/public/assets/pod-demo`,
      `${here}/dist-pages/assets/pod-demo`,
      { recursive: true }
    );
    // Own-product demo atlas is consumed directly by the browser after page load.
    // Vite's showcase/ root does not auto-copy the repository public/ folder.
    await cp(
      `${here}/public/assets/own-product-ai-demo`,
      `${here}/dist-pages/assets/own-product-ai-demo`,
      { recursive: true }
    );
    // Demo-only hosted products, if the verified image pack has been committed.
    // Do not fail earlier deployments when the binary assets are not yet present.
    try {
      await cp(
        `${here}/public/assets/demo-products`,
        `${here}/dist-pages/assets/demo-products`,
        { recursive: true }
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    // Publish selected-market SKU artwork from the main public tree.
    await cp(`${here}/public/assets/selected-market`,`${here}/dist-pages/assets/selected-market`,{recursive:true});
    // Store synchronization fixtures are also in the main public tree.
    await cp(`${here}/public/assets/store-sync-demo`,`${here}/dist-pages/assets/store-sync-demo`,{recursive:true});
    // Include the approved real-photography atlas; no external image host required.
    await cp(
      `${here}/public/assets/listing-ai-preview`,
      `${here}/dist-pages/assets/listing-ai-preview`,
      { recursive: true }
    );
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
  plugins: [pagesFallback, bundledAgentExamples, blueMarbleTexture],
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
