# Dog Date — Project Instructions

See the engineering handoff at `/Users/bporter/.claude/plans/help-me-craft-a-radiant-haven.md` for full context on stack, build order, and known gotchas.

## Web-bundle landmines

Metro serves the Expo Router web bundle as a **classic `<script>`** (no `type="module"`). Any ESM-only construct — most commonly `import.meta.env` from Vite-style packages — throws `SyntaxError: Cannot use 'import.meta' outside a module` at parse time. The error fires before React mounts, before DevTools attaches, so the symptom is a stuck loading spinner with **zero console output**. This has burned us once (commit 2f4683d) and is a class bug, not a one-off.

### Rules

- **Never import from `zustand/middleware`.** The barrel re-exports `devtools`, which contains `import.meta.env.MODE`. The subpath `zustand/middleware/persist` is also broken in v5 — its `exports` field points at a non-existent `.mjs`. For persistence, hand-roll an AsyncStorage wrapper (pattern: [lib/notifications-store.ts](lib/notifications-store.ts)).
- **Before merging any PR that adds a new npm dep,** run the bundle check (below). Don't trust that "it works on my phone" — iOS Hermes tolerates `import.meta`, web does not.

### The check

```bash
# with Metro running (npm start):
npm run check:web
```

Fetches the running web bundle and parses it in Node's script-mode parser (`new Function(bundle)`) — the same parser the browser uses for a classic `<script>`. If the bundle has anything the browser would choke on at parse time, this catches it. Fast (~1 second once the bundle is built).

Add this to your pre-push routine or CI. If you add a dep and this fails, identify which barrel/file leaked the ESM construct and either import via a direct subpath, hand-roll the functionality, or `patch-package` the offender.

## Recovering from a stuck loading screen

Before chasing auth/JWT theories, **check the bundle parses** (`npm run check:web`). A silent parse error looks identical to an auth hang from the outside — black screen, spinner, no logs. The bundle check tells you which is which in one command.

If the bundle parses cleanly and the screen is still stuck, *then* suspect stale Supabase sessions, LAN IP drift in `.env`, or a hanging `supabase.auth.getSession()` call.
