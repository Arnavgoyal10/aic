/**
 * BODHI Capital — Bulk Member Account Creator
 * ─────────────────────────────────────────────
 * Usage:
 *   node scripts/create-members.mjs
 *
 * Prerequisites:
 *   1. Download a Firebase service account key:
 *      Firebase Console → Project Settings → Service accounts → Generate new private key
 *      Save it as: scripts/serviceAccountKey.json
 *
 *   2. This script reads data/members.json, skips anyone with
 *      "placeholder@example.com", and creates a Firebase Auth account
 *      for everyone else with a temporary password.
 *
 * The password for each member is: <firstname>.bodhi  (e.g. arnav.bodhi)
 * The first name is taken from the member's name field (lowercase, first word only).
 * Members can reset it anytime via the "Forgot password?" link on the login page.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ── Load service account ────────────────────────────────────────────────────
const keyPath = join(__dirname, "aicbodhi-firebase-adminsdk-fbsvc-02e2b67081.json");
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
} catch {
  console.error(`
  ✗ Service account key not found at: scripts/serviceAccountKey.json

  How to get it:
    1. Go to Firebase Console (console.firebase.google.com)
    2. Click your project → Project Settings (gear icon)
    3. Click "Service accounts" tab
    4. Click "Generate new private key"
    5. Save the downloaded JSON as: scripts/serviceAccountKey.json
    6. Run this script again.
  `);
  process.exit(1);
}

// ── Init firebase-admin ─────────────────────────────────────────────────────
const admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();

// ── Load members ────────────────────────────────────────────────────────────
const members = JSON.parse(readFileSync(join(root, "data/members.json"), "utf8"));

/** Derives password from member name: "Arnav Goyal" → "arnav@bodhi" */
function memberPassword(name) {
  const firstName = name.trim().split(/\s+/)[0].toLowerCase();
  return `${firstName}@bodhi`;
}

const realMembers = members.filter(
  (m) => m.email && m.email !== "placeholder@example.com"
);

console.log(`\nBODHI Capital — Member Account Creator`);
console.log(`──────────────────────────────────────`);
console.log(`Found ${members.length} members total, ${realMembers.length} with real emails.\n`);

let created = 0;
let skipped = 0;
let failed = 0;

for (const member of realMembers) {
  process.stdout.write(`  ${member.name.padEnd(32)} (${member.email}) … `);
  const password = memberPassword(member.name);
  try {
    await auth.createUser({
      email: member.email,
      password,
      displayName: member.name,
    });
    console.log(`✓ Created (password: ${password})`);
    created++;
  } catch (e) {
    if (e.code === "auth/email-already-exists") {
      console.log("– Already exists (skipped)");
      skipped++;
    } else {
      console.log(`✗ Failed: ${e.message}`);
      failed++;
    }
  }
}

console.log(`
──────────────────────────────────────
  Created : ${created}
  Skipped : ${skipped} (already had accounts)
  Failed  : ${failed}

  Password convention: <firstname>.bodhi  (e.g. arnav.bodhi)
  Members can reset via "Forgot password?" on the login page.
`);

process.exit(0);
