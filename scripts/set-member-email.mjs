/**
 * Set a member's email in data/members.json
 * Usage:  node scripts/set-member-email.mjs <member-id> <email>
 * Example: node scripts/set-member-email.mjs arnav-goyal arnav.goyal_ug2023@ashoka.edu.in
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const [,, memberId, email] = process.argv;
if (!memberId || !email) {
  console.error("Usage: node scripts/set-member-email.mjs <member-id> <email>");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const path = join(__dirname, "../data/members.json");
const members = JSON.parse(readFileSync(path, "utf8"));

const idx = members.findIndex((m) => m.id === memberId);
if (idx === -1) {
  console.error(`Member "${memberId}" not found.`);
  console.log("Available IDs:", members.map((m) => m.id).join(", "));
  process.exit(1);
}

const old = members[idx].email;
members[idx].email = email;
writeFileSync(path, JSON.stringify(members, null, 2));
console.log(`✓ ${members[idx].name}: ${old} → ${email}`);
