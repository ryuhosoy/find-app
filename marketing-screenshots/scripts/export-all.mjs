/**
 * Playwright でエディタから iPhone / iPad のスクリーンショットを一括エクスポートする。
 * 事前に `npm run dev` を起動しておくこと。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const EXPORTS = path.join(ROOT, "exports");
const BASE_URL = process.env.SCREENSHOTS_URL || "http://localhost:3000";

async function waitForServer(url, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Dev server not reachable at ${url}`);
}

async function selectDevice(page, deviceLabel) {
  const trigger = page.locator('[role="combobox"]').filter({ hasText: /iPhone|iPad|Android/ });
  const current = (await trigger.textContent())?.trim() ?? "";
  if (current.includes(deviceLabel)) return;
  await trigger.click();
  await page.getByRole("option", { name: deviceLabel, exact: true }).click();
  await page.waitForTimeout(1500);
}

async function exportDevice(page, deviceLabel) {
  console.log(`Exporting ${deviceLabel}…`);
  await selectDevice(page, deviceLabel);

  const downloadPromise = page.waitForEvent("download", { timeout: 180000 });
  await page.getByRole("button", { name: "Export bundle" }).click();
  const download = await downloadPromise;

  await page.waitForFunction(
    () => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        b.textContent?.includes("Export bundle"),
      );
      return btn && !btn.textContent?.includes("Exporting");
    },
    { timeout: 180000 },
  );

  const zipPath = path.join(EXPORTS, `buy-it-${deviceLabel.toLowerCase()}.zip`);
  await download.saveAs(zipPath);
  console.log(`  Saved ${zipPath}`);

  const extractDir = path.join(EXPORTS, deviceLabel.toLowerCase());
  fs.mkdirSync(extractDir, { recursive: true });
  execSync(`unzip -o "${zipPath}" -d "${extractDir}"`, { stdio: "inherit" });
  console.log(`  Extracted to ${extractDir}/`);
}

async function main() {
  fs.mkdirSync(EXPORTS, { recursive: true });
  await waitForServer(BASE_URL);

  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  await page.goto(BASE_URL);
  await page.waitForSelector("text=Export bundle", { timeout: 60000 });
  await page.waitForTimeout(2000);

  // Clear stale localStorage so file project loads
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("text=Export bundle", { timeout: 60000 });
  await page.waitForTimeout(2000);

  await exportDevice(page, "iPhone");
  await exportDevice(page, "iPad");

  await browser.close();
  console.log("\nAll exports complete → marketing-screenshots/exports/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
