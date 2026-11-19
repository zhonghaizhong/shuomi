import { expect, test } from "@playwright/test";

const cockpit = "/shuomi/#/workbench";

test("real Earth image replaces wire globe and rotates in cockpit", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(cockpit);
  const earth = page.getByRole("img", { name: "正在缓慢自转的地球" });
  await expect(earth).toBeVisible();
  const photo = earth.locator("img");
  await expect.poll(async () => photo.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await expect(photo).toHaveAttribute("src", /cockpit-earth-reference\.webp$/);
  const canvas = earth.locator("canvas");
  const fingerprint = () => canvas.evaluate((el: HTMLCanvasElement) => {
    const context = el.getContext("2d");
    if (!context) return "no-context";
    const data = context.getImageData(0, 0, el.width, el.height).data;
    let checksum = 0;
    for (let i = 0; i < data.length; i += 13) checksum = (checksum * 33 + data[i]) >>> 0;
    return String(checksum);
  });
  await expect.poll(fingerprint).not.toBe("0");
  const before = await fingerprint();
  await page.waitForTimeout(950);
  const after = await fingerprint();
  expect(after).not.toEqual(before);
});

test("Earth stays inside purple overview card at desktop sizes", async ({ page }) => {
  for (const [width, height] of [[1440, 900], [1920, 1080], [2560, 1440]]) {
    await page.setViewportSize({ width, height });
    await page.goto(cockpit);
    const card = page.locator('[data-dashboard="operations"] article[data-tone="blue"]').first();
    const earth = page.getByRole("img", { name: "正在缓慢自转的地球" });
    await expect(card).toBeVisible();
    await expect(earth).toBeVisible();
    const a = await card.boundingBox(), b = await earth.boundingBox();
    expect(a && b).toBeTruthy();
    expect(b!.width).toBeLessThanOrEqual(201);
    expect(b!.x).toBeGreaterThanOrEqual(a!.x);
    expect(b!.y).toBeGreaterThanOrEqual(a!.y);
    expect(b!.x + b!.width).toBeLessThanOrEqual(a!.x + a!.width + 1);
    expect(b!.y + b!.height).toBeLessThanOrEqual(a!.y + a!.height + 1);
    const size = await page.evaluate(() => ({ screen: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(size.content, `horizontal overflow at ${width}`).toBeLessThanOrEqual(size.screen + 2);
  }
});

test("respects system preference for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(cockpit);
  const earth = page.getByRole("img", { name: "正在缓慢自转的地球" });
  await expect(earth).toBeVisible();
  const canvas = earth.locator("canvas");
  await expect.poll(async () => canvas.evaluate((el: HTMLCanvasElement) => el.getContext("2d")!.getImageData(76, 76, 1, 1).data[3])).toBeGreaterThan(0);
  const image = await canvas.evaluate((el: HTMLCanvasElement) => Array.from(el.getContext("2d")!.getImageData(0, 0, el.width, el.height).data).filter((_, i) => i % 300 === 0).join(","));
  await page.waitForTimeout(700);
  const image2 = await canvas.evaluate((el: HTMLCanvasElement) => Array.from(el.getContext("2d")!.getImageData(0, 0, el.width, el.height).data).filter((_, i) => i % 300 === 0).join(","));
  expect(image2).toBe(image);
});
