#!/usr/bin/env node
// Delete a single user by email so you can demo the full first-time flow
// (sign-in → onboarding → swipe → match → chat) without wiping the seed data.
// Cascades through: profiles, dogs, swipes, matches, messages, video_jobs,
// blocks, reports, push_tokens. Demo seed users (11111111-…) are untouched.
//
// Usage:
//   node scripts/reset-user.mjs smoketest@example.com
//   node scripts/reset-user.mjs --all-non-demo

import { execSync } from 'node:child_process';

const DB_URL = 'postgres://postgres:postgres@localhost:54322/postgres';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/reset-user.mjs <email | --all-non-demo>');
  process.exit(1);
}

function psql(sql) {
  return execSync(`psql "${DB_URL}" -At -c ${JSON.stringify(sql)}`, {
    encoding: 'utf8',
  }).trim();
}

if (arg === '--all-non-demo') {
  const before = psql(
    `select count(*) from auth.users where id::text not like '11111111%';`
  );
  psql(
    `delete from auth.users where id::text not like '11111111%';`
  );
  console.log(`Deleted ${before} non-demo user(s). Demo seed (11111111-…) preserved.`);
} else {
  const email = arg;
  const id = psql(`select id from auth.users where email = '${email}';`);
  if (!id) {
    console.log(`No user with email ${email}. Nothing to do.`);
    process.exit(0);
  }
  if (id.startsWith('11111111')) {
    console.error(`Refusing to delete demo seed user ${email} (${id}).`);
    process.exit(1);
  }
  psql(`delete from auth.users where id = '${id}';`);
  console.log(`Deleted ${email} (${id}). Demo seed preserved.`);
}

console.log('\nNext: clear browser storage so the stale JWT is gone.');
console.log("  In preview console: localStorage.clear(); location.href = '/'");
