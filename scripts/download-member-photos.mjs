/**
 * BODHI Capital — Member Photo Downloader
 * ─────────────────────────────────────────────────────────────────
 * Downloads all member photos from the Ashoka AMS portal using your
 * existing Chrome session (Chrome must be CLOSED before running).
 *
 * Usage:
 *   node scripts/download-member-photos.mjs
 *
 * What it does:
 *   1. Launches Chrome with your existing profile (picks up your login)
 *   2. For each member with an Ashoka photo URL, navigates to it
 *   3. Saves the image to /public/members/<id>.<ext>
 *   4. Updates data/members.json with the local path
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright-core";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const MEMBERS_PATH = join(ROOT, "data", "members.json");
const OUTPUT_DIR = join(ROOT, "public", "members");

// macOS Chrome Default profile path
const CHROME_EXEC = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CHROME_PROFILE = `${process.env.HOME}/Library/Application Support/Google/Chrome`;

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const members = JSON.parse(readFileSync(MEMBERS_PATH, "utf8"));
const ashokaMembers = members.filter(
  (m) => m.image.includes("ashoka") || m.image.includes("blobHandler")
);
const dicebearMembers = members.filter((m) => m.image.includes("dicebear"));

console.log(`\nBODHI Capital — Photo Downloader`);
console.log(`──────────────────────────────────────`);
console.log(`Ashoka portal photos : ${ashokaMembers.length}`);
console.log(`Dicebear SVGs        : ${dicebearMembers.length} (will fetch directly)\n`);

// ── Step 1: Download dicebear SVGs directly (no auth needed) ────────────────
let directOk = 0;
for (const member of dicebearMembers) {
  process.stdout.write(`  [dicebear] ${member.id} … `);
  try {
    const res = await fetch(member.image);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const dest = join(OUTPUT_DIR, `${member.id}.svg`);
    writeFileSync(dest, buf);
    const idx = members.findIndex((m) => m.id === member.id);
    members[idx] = { ...members[idx], image: `/members/${member.id}.svg` };
    directOk++;
    console.log(`OK (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.log(`FAILED — ${err.message}`);
  }
}

// ── Step 2: Use Chrome with existing session for Ashoka photos ───────────────
if (ashokaMembers.length > 0) {
  console.log(`\nLaunching Chrome with your existing session…`);
  console.log(`(Chrome must be fully closed before this step)\n`);

  let browser;
  try {
    browser = await chromium.launchPersistentContext(CHROME_PROFILE, {
      executablePath: CHROME_EXEC,
      headless: false, // keep visible so you can see progress
      args: [
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions-except",
        "--disable-default-apps",
      ],
      viewport: { width: 1024, height: 768 },
      acceptDownloads: true,
    });
  } catch (err) {
    console.error(`\n✗ Could not launch Chrome: ${err.message}`);
    console.error(`  Make sure Chrome is fully closed and try again.\n`);
    process.exit(1);
  }

  const page = await browser.newPage();
  let chromeOk = 0;
  let chromeFailed = 0;

  for (let i = 0; i < ashokaMembers.length; i++) {
    const member = ashokaMembers[i];
    process.stdout.write(`  [${i + 1}/${ashokaMembers.length}] ${member.id} … `);
    try {
      // Navigate to the image URL and wait for it to load
      const response = await page.goto(member.image, {
        waitUntil: "networkidle",
        timeout: 20000,
      });

      if (!response || !response.ok()) {
        throw new Error(`HTTP ${response?.status()}`);
      }

      const contentType = response.headers()["content-type"] ?? "";
      let ext = ".jpg";
      if (contentType.includes("png")) ext = ".png";
      else if (contentType.includes("webp")) ext = ".webp";
      else if (contentType.includes("svg")) ext = ".svg";
      else if (contentType.includes("gif")) ext = ".gif";

      const buf = await response.body();

      // Sanity check: must be a real image (> 2 KB, not HTML)
      if (buf.length < 2000 || buf.slice(0, 15).toString().includes("<!DOCTYPE")) {
        throw new Error("Got HTML instead of image (session may have expired)");
      }

      const filename = `${member.id}${ext}`;
      writeFileSync(join(OUTPUT_DIR, filename), buf);

      const idx = members.findIndex((m) => m.id === member.id);
      members[idx] = { ...members[idx], image: `/members/${filename}` };
      chromeOk++;
      console.log(`OK (${ext}, ${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      chromeFailed++;
      console.log(`FAILED — ${err.message}`);
    }
    // Small pause between requests
    await page.waitForTimeout(300);
  }

  await browser.close();
  console.log(`\nChrome session: ${chromeOk} OK, ${chromeFailed} failed.`);
}

// ── Step 3: Save updated members.json ───────────────────────────────────────
writeFileSync(MEMBERS_PATH, JSON.stringify(members, null, 2) + "\n");
console.log(`\nDone. members.json updated.`);
console.log(`All local photos are in /public/members/\n`);
