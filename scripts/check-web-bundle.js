#!/usr/bin/env node
/*
 * Validates the Expo Router web bundle parses as a classic script — the same
 * mode the browser uses for <script src="entry.bundle">. Catches the class of
 * bug where an ESM-only package in node_modules (e.g. `zustand/middleware`'s
 * devtools) leaks `import.meta` into the bundle, which throws SyntaxError at
 * parse time and silently kills React mount with zero console output.
 *
 * Requires Metro to be running on :8081 (npm start).
 */
const http = require('http');

const BUNDLE_URL =
  'http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.routerRoot=app&transform.reactCompiler=true';

function fetchBundle(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`bundle HTTP ${res.statusCode}`));
        return;
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.setTimeout(180_000, () => req.destroy(new Error('bundle fetch timed out')));
  });
}

(async () => {
  console.log('→ fetching web bundle…');
  let bundle;
  try {
    bundle = await fetchBundle(BUNDLE_URL);
  } catch (e) {
    console.error(`✗ could not fetch bundle: ${e.message}`);
    console.error('  is Metro running? start it with: npm start');
    process.exit(2);
  }
  console.log(`→ got ${(bundle.length / 1024 / 1024).toFixed(1)} MB, parsing as classic script…`);

  try {
    // new Function() parses its body in script mode — identical to a browser
    // classic <script> tag. If this throws, the browser will too.
    new Function(bundle);
  } catch (e) {
    console.error(`✗ bundle fails to parse: ${e.message}`);
    if (e.message.includes('import.meta')) {
      console.error('');
      console.error('  An ESM-only dep leaked `import.meta` into the bundle.');
      console.error('  Most common cause: importing from `zustand/middleware`');
      console.error('  (pulls devtools which references import.meta.env).');
      console.error('  Fix: import only what you need, or hand-roll (see');
      console.error('  lib/notifications-store.ts for the persist pattern).');
    }
    process.exit(1);
  }

  console.log('✓ bundle parses cleanly');
})();
