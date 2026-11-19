"use client";

import { useEffect, useRef } from "react";
import styles from "./cockpit-preview.module.css";

const SIZE = 152;
const PERIOD_MS = 12000;
const FRAME_INTERVAL_MS = 48;

/** Keep the approved globe image as the source while turning it about a vertical axis.
 * The source is a single visible hemisphere, so its opposite side is an illustrative
 * mirrored projection rather than an astronomical reconstruction. */
export function CockpitRotatingEarth() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const context = canvas?.getContext("2d", { alpha: true, willReadFrequently: false });
    if (!canvas || !img || !context) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let alive = true;
    let firstTime: number | null = null;
    let lastDraw = -Infinity;
    let sourceData: Uint8ClampedArray | null = null;
    let sourceSize = 0;
    const frame = context.createImageData(SIZE, SIZE);
    const pixels = frame.data;

    function paint(now: number) {
      if (!alive || !sourceData || !canvas || !context) return;
      if (firstTime === null) firstTime = now;
      const shouldAnimate = !motionPreference.matches;
      if (now - lastDraw < FRAME_INTERVAL_MS && shouldAnimate) {
        frameId = window.requestAnimationFrame(paint);
        return;
      }
      lastDraw = now;
      const angle = shouldAnimate ? (now - firstTime) / PERIOD_MS * Math.PI * 2 : 0;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const half = SIZE / 2;
      const src = sourceData;

      for (let y = 0; y < SIZE; y++) {
        const ny = (y + 0.5 - half) / (half - 2);
        for (let x = 0; x < SIZE; x++) {
          const nx = (x + 0.5 - half) / (half - 2);
          const dst = (y * SIZE + x) * 4;
          const radiusSquared = nx * nx + ny * ny;
          if (radiusSquared >= 1) {
            pixels[dst + 3] = 0;
            continue;
          }

          const depth = Math.sqrt(1 - radiusSquared);
          let sourceX = nx * cos + depth * sin;
          let sourceY = ny;
          // Prevent an alpha hole when the original visible rim faces the viewer.
          const sourceRadius = Math.hypot(sourceX, sourceY);
          if (sourceRadius > 0.88) {
            const scale = 0.88 / sourceRadius;
            sourceX *= scale;
            sourceY *= scale;
          }

          const sx = Math.min(sourceSize - 1, Math.max(0, Math.round((sourceX + 1) * (sourceSize - 1) / 2)));
          const sy = Math.min(sourceSize - 1, Math.max(0, Math.round((sourceY + 1) * (sourceSize - 1) / 2)));
          const i = (sy * sourceSize + sx) * 4;
          const shade = 0.78 + 0.22 * depth;
          pixels[dst] = src[i] * shade;
          pixels[dst + 1] = src[i + 1] * shade;
          pixels[dst + 2] = src[i + 2] * shade;
          const feather = Math.min(1, (1 - Math.sqrt(radiusSquared)) * 120);
          pixels[dst + 3] = Math.min(255, Math.max(src[i + 3], 220)) * feather;
        }
      }
      context.putImageData(frame, 0, 0);
      if (shouldAnimate) frameId = window.requestAnimationFrame(paint);
    }

    function load() {
      if (!alive || !img) return;
      const offscreen = document.createElement("canvas");
      sourceSize = 128;
      offscreen.width = sourceSize;
      offscreen.height = sourceSize;
      const ctx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, sourceSize, sourceSize);
      sourceData = ctx.getImageData(0, 0, sourceSize, sourceSize).data;
      firstTime = null;
      frameId = window.requestAnimationFrame(paint);
    }

    function preferenceChanged() {
      window.cancelAnimationFrame(frameId);
      if (!alive || !sourceData) return;
      firstTime = null;
      lastDraw = -Infinity;
      frameId = window.requestAnimationFrame(paint);
    }

    img.addEventListener("load", load);
    motionPreference.addEventListener("change", preferenceChanged);
    if (img.complete && img.naturalWidth > 0) load();
    return () => {
      alive = false;
      window.cancelAnimationFrame(frameId);
      img.removeEventListener("load", load);
      motionPreference.removeEventListener("change", preferenceChanged);
    };
  }, []);

  const base = typeof window !== "undefined" && window.location.pathname.startsWith("/shuomi") ? "/shuomi" : "";
  return <span className={styles.earthDisplay} role="img" aria-label="正在缓慢自转的地球">
    <img ref={imgRef} src={`${base}/assets/cockpit-earth-reference.webp`} alt="" aria-hidden="true" decoding="async" width="128" height="128" />
    <canvas ref={canvasRef} width={SIZE} height={SIZE} aria-hidden="true" />
  </span>;
}
