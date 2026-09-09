/**
 * Buy it! アプリUIのモックスクリーンショットを生成する。
 * iPhone / iPad 向けに public/screenshots/apple/... へ PNG を出力する。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const COLORS = {
  bg: "#FAF7F2",
  bgAlt: "#F1ECE3",
  surface: "#FFFFFF",
  surfaceMuted: "#F5F1EA",
  border: "#E9E2D6",
  borderStrong: "#DCD2C0",
  ink: "#211A14",
  inkSoft: "#5B5248",
  inkFaint: "#9C927F",
  accent: "#FF6B3D",
  accentSoft: "#FFE3D3",
  accentDeep: "#E14E1F",
  good: "#2FA66A",
  overlay: "#FF3B30",
};

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shelfGradient(id) {
  return `
    <defs>
      <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8B7355"/>
        <stop offset="40%" style="stop-color:#A08968"/>
        <stop offset="100%" style="stop-color:#6B5744"/>
      </linearGradient>
    </defs>
  `;
}

function productBlock(x, y, w, h, colors, label) {
  const [c1, c2, c3] = colors;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${c1}" stroke="#ddd" stroke-width="1"/>
    <rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h * 0.55}" rx="6" fill="${c2}"/>
    <rect x="${x + 10}" y="${y + h * 0.68}" width="${w * 0.6}" height="6" rx="3" fill="${c3}" opacity="0.5"/>
    <rect x="${x + 10}" y="${y + h * 0.78}" width="${w * 0.4}" height="5" rx="2.5" fill="${c3}" opacity="0.35"/>
    ${label ? `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" font-size="11" fill="#fff" font-weight="700" opacity="0.9">${esc(label)}</text>` : ""}
  `;
}

function shelfProducts(w) {
  const pw = w * 0.18;
  const ph = w * 0.22;
  const gap = w * 0.025;
  const startX = w * 0.06;
  const y = w * 0.08;
  const items = [
    ["#4CAF50", "#81C784", "#2E7D32", "MON"],
    ["#2196F3", "#64B5F6", "#1565C0", ""],
    ["#FF9800", "#FFB74D", "#E65100", "JAGA"],
    ["#E91E63", "#F06292", "#AD1457", ""],
    ["#9C27B0", "#BA68C8", "#6A1B9A", ""],
    ["#00BCD4", "#4DD0E1", "#00838F", "MON"],
    ["#FFC107", "#FFD54F", "#FF8F00", ""],
    ["#795548", "#A1887F", "#4E342E", ""],
  ];
  return items
    .map(([c1, c2, c3, label], i) => {
      const x = startX + i * (pw + gap);
      return productBlock(x, y, pw, ph, [c1, c2, c3], label);
    })
    .join("");
}

function screenHome(w, h, withPhoto = false) {
  const pad = w * 0.06;
  return `
    <div class="screen" style="width:${w}px;height:${h}px;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans','Segoe UI',sans-serif;overflow:hidden;position:relative;">
      <div style="padding:${pad}px;padding-top:${pad * 1.8}px;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:${pad}px;">
          <div style="width:52px;height:52px;border-radius:16px;background:${COLORS.accent};display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:0 6px 14px rgba(225,78,31,0.28);">🛒</div>
          <div>
            <div style="font-size:${w * 0.065}px;font-weight:800;color:${COLORS.ink};letter-spacing:-0.5px;">Buy it!</div>
            <div style="font-size:${w * 0.032}px;color:${COLORS.inkSoft};margin-top:2px;">棚を撮って、買う一つを決める。</div>
          </div>
        </div>

        <div style="font-size:${w * 0.038}px;font-weight:600;color:${COLORS.inkSoft};margin-bottom:8px;">1. 棚の写真</div>
        ${
          withPhoto
            ? `
          <div style="border-radius:28px;overflow:hidden;background:${COLORS.surfaceMuted};box-shadow:0 6px 16px rgba(58,46,31,0.08);margin-bottom:8px;">
            <svg viewBox="0 0 400 300" style="width:100%;display:block;">
              ${shelfGradient("sg1")}
              <rect width="400" height="300" fill="url(#sg1)"/>
              <rect x="0" y="220" width="400" height="80" fill="#5D4E3A" opacity="0.6"/>
              ${shelfProducts(400)}
            </svg>
            <div style="display:flex;gap:8px;padding:12px;background:${COLORS.surface};">
              <div style="flex:1;background:${COLORS.surfaceMuted};border-radius:999px;padding:10px;text-align:center;font-size:13px;color:${COLORS.ink};">📷 撮り直す</div>
              <div style="flex:1;background:${COLORS.surfaceMuted};border-radius:999px;padding:10px;text-align:center;font-size:13px;color:${COLORS.ink};">🖼️ 選び直す</div>
            </div>
          </div>`
            : `
          <div style="border:2px dashed ${COLORS.borderStrong};border-radius:28px;padding:${pad}px;text-align:center;background:${COLORS.surface};">
            <div style="font-size:36px;margin-bottom:6px;">📸</div>
            <div style="font-size:17px;font-weight:800;color:${COLORS.ink};">棚の写真を用意しよう</div>
            <div style="font-size:13px;color:${COLORS.inkFaint};margin:6px 0 16px;">商品パッケージがはっきり写るように撮ってね</div>
            <div style="background:${COLORS.accent};color:#fff;border-radius:999px;padding:14px;font-weight:700;font-size:15px;box-shadow:0 6px 14px rgba(225,78,31,0.28);margin-bottom:8px;">写真を撮る</div>
            <div style="background:${COLORS.surfaceMuted};color:${COLORS.ink};border-radius:999px;padding:14px;font-weight:600;font-size:15px;">ライブラリから選ぶ</div>
          </div>`
        }

        <div style="font-size:${w * 0.038}px;font-weight:600;color:${COLORS.inkSoft};margin:16px 0 8px;">2. 要望</div>
        <div style="background:${COLORS.surface};border-radius:16px;border:1px solid ${COLORS.border};padding:16px;min-height:64px;">
          <div style="font-size:15px;color:${withPhoto ? COLORS.ink : COLORS.inkFaint};line-height:1.5;">${withPhoto ? "緑のモンスターはどこ？" : "例：緑のモンスターはどこ？ / 一番カロリーが低いお菓子は？"}</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;">
          ${["緑のモンスターはどこ？", "一番カロリーが低いお菓子は？", "眠い、一番効くのはどれ？"]
            .map(
              (c) =>
                `<div style="background:${COLORS.surfaceMuted};border:1px solid ${COLORS.border};border-radius:999px;padding:8px 12px;font-size:12px;color:${COLORS.inkSoft};">${esc(c)}</div>`
            )
            .join("")}
        </div>
        <div style="margin-top:20px;background:${withPhoto ? COLORS.accent : COLORS.borderStrong};color:#fff;border-radius:999px;padding:16px;text-align:center;font-weight:700;font-size:16px;${withPhoto ? "box-shadow:0 6px 14px rgba(225,78,31,0.28);" : "opacity:0.5;"}">答えを見る</div>
      </div>
    </div>`;
}

function screenResultFind(w, h) {
  const pad = w * 0.06;
  return `
    <div class="screen" style="width:${w}px;height:${h}px;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;overflow:hidden;">
      <div style="padding:${pad}px;padding-top:${pad * 1.6}px;">
        <div style="font-size:15px;font-weight:700;color:${COLORS.accentDeep};margin-bottom:12px;">← 戻る</div>
        <div style="font-size:19px;font-weight:800;color:${COLORS.ink};margin-bottom:12px;">「緑のモンスターはどこ？」</div>
        <div style="border-radius:28px;overflow:hidden;position:relative;box-shadow:0 6px 16px rgba(58,46,31,0.08);">
          <svg viewBox="0 0 400 300" style="width:100%;display:block;">
            ${shelfGradient("sg2")}
            <rect width="400" height="300" fill="url(#sg2)"/>
            <rect x="0" y="220" width="400" height="80" fill="#5D4E3A" opacity="0.6"/>
            ${shelfProducts(400)}
            <rect x="12" y="18" width="72" height="88" rx="8" fill="none" stroke="${COLORS.overlay}" stroke-width="3"/>
            <rect x="12" y="18" width="72" height="88" rx="8" fill="${COLORS.overlay}" opacity="0.12"/>
          </svg>
        </div>
        <div style="background:${COLORS.surface};border-radius:22px;border:1px solid ${COLORS.border};padding:16px;margin-top:12px;box-shadow:0 6px 16px rgba(58,46,31,0.08);">
          <div style="font-size:15px;color:${COLORS.ink};line-height:1.5;">左端の棚に、緑色のモンスターエナジーが見つかりました！</div>
        </div>
        <div style="font-size:15px;font-weight:600;color:${COLORS.inkSoft};margin:16px 0 8px;">見つかった商品</div>
        <div style="background:${COLORS.surface};border-radius:22px;border:1px solid ${COLORS.border};padding:16px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div style="font-size:17px;font-weight:800;color:${COLORS.ink};">モンスターエナジー</div>
            <div style="font-size:11px;background:${COLORS.surfaceMuted};padding:4px 8px;border-radius:999px;color:${COLORS.inkSoft};">🤖 AI判断</div>
          </div>
          <div style="font-size:13px;color:${COLORS.inkFaint};margin-top:6px;">確信度: 高</div>
        </div>
      </div>
    </div>`;
}

function screenResultRecommend(w, h) {
  const pad = w * 0.06;
  return `
    <div class="screen" style="width:${w}px;height:${h}px;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;overflow:hidden;">
      <div style="padding:${pad}px;padding-top:${pad * 1.6}px;">
        <div style="font-size:15px;font-weight:700;color:${COLORS.accentDeep};margin-bottom:12px;">← 戻る</div>
        <div style="font-size:19px;font-weight:800;color:${COLORS.ink};margin-bottom:12px;">「一番カロリーが低いお菓子は？」</div>
        <div style="border-radius:28px;overflow:hidden;position:relative;box-shadow:0 6px 16px rgba(58,46,31,0.08);">
          <svg viewBox="0 0 400 300" style="width:100%;display:block;">
            ${shelfGradient("sg3")}
            <rect width="400" height="300" fill="url(#sg3)"/>
            <rect x="0" y="220" width="400" height="80" fill="#5D4E3A" opacity="0.6"/>
            ${shelfProducts(400)}
            <rect x="88" y="22" width="72" height="88" rx="8" fill="none" stroke="${COLORS.accent}" stroke-width="3.5"/>
            <rect x="88" y="22" width="72" height="88" rx="8" fill="${COLORS.accent}" opacity="0.15"/>
          </svg>
        </div>
        <div style="font-size:15px;font-weight:600;color:${COLORS.inkSoft};margin:16px 0 8px;">🎯 イチオシ</div>
        <div style="background:${COLORS.surface};border-radius:22px;border:1.5px solid ${COLORS.accent};padding:16px;box-shadow:0 6px 16px rgba(58,46,31,0.08);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div style="font-size:17px;font-weight:800;color:${COLORS.ink};">じゃがりこ サラダ</div>
            <div style="font-size:11px;background:${COLORS.surfaceMuted};padding:4px 8px;border-radius:999px;color:${COLORS.inkSoft};">🤖 AI判断</div>
          </div>
          <div style="font-size:15px;color:${COLORS.inkSoft};margin-top:8px;line-height:1.45;">この棚の中ではカロリーが最も低く、サクサク食感も楽しめます。</div>
          <div style="font-size:11px;color:${COLORS.inkFaint};margin-top:8px;">確信度: 高</div>
        </div>
        <div style="font-size:15px;font-weight:600;color:${COLORS.inkSoft};margin:16px 0 8px;">比較した他の候補</div>
        <div style="background:${COLORS.surface};border-radius:22px;border:1px solid ${COLORS.border};padding:14px;margin-bottom:8px;">
          <div style="font-size:15px;font-weight:700;color:${COLORS.ink};">ポテトチップス</div>
          <div style="font-size:13px;color:${COLORS.inkSoft};margin-top:4px;">カロリーはやや高め</div>
        </div>
      </div>
    </div>`;
}

const SCREENS = {
  "01-home": (w, h) => screenHome(w, h, false),
  "02-query": (w, h) => screenHome(w, h, true),
  "03-find": screenResultFind,
  "04-recommend": screenResultRecommend,
  "05-detail": screenResultRecommend,
};

async function captureScreens(device, width, height, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const [name, render] of Object.entries(SCREENS)) {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}</style></head><body>${render(width, height)}</body></html>`;
    await page.setViewportSize({ width, height });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.locator(".screen").screenshot({
      path: path.join(outDir, `${name}.png`),
      type: "png",
    });
    console.log(`  ✓ ${device}/${name}.png (${width}×${height})`);
  }

  await browser.close();
}

async function main() {
  console.log("Generating mock app screenshots…");
  await captureScreens("iphone", 1179, 2556, path.join(ROOT, "public/screenshots/apple/iphone/ja"));
  await captureScreens("ipad", 1668, 2388, path.join(ROOT, "public/screenshots/apple/ipad/ja"));
  // English uses same visuals
  for (const device of ["iphone", "ipad"]) {
    const src = path.join(ROOT, `public/screenshots/apple/${device}/ja`);
    const dst = path.join(ROOT, `public/screenshots/apple/${device}/en`);
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src)) {
      fs.copyFileSync(path.join(src, f), path.join(dst, f));
    }
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
