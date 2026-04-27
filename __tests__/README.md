# Tests

Five layers, run independently or all at once.

## Prereqs

- `supabase start` — Postgres on :54322, Functions API on :54321, Studio on :54323, Mailpit on :54324.
- `supabase functions serve --no-verify-jwt --env-file supabase/functions/.env` — required for `test:edge`.
- `npm start` — Metro on :8081. Required for `test:e2e` and `check:web`.

## Layers

| Layer | Command | Runner | Touches |
|---|---|---|---|
| Pure logic + components | `npm test` | Vitest + jsdom + RNTL | `lib/__tests__/`, `components/__tests__/` |
| SQL triggers + RLS | `npm run test:sql` | psql against local Supabase | `__tests__/sql/*.test.sql` |
| Edge functions | `npm run test:edge` | Deno against local Functions | `__tests__/edge-functions/*.test.ts` |
| E2E demo flow | `npm run test:e2e` | Playwright against web preview | `__tests__/e2e/*.spec.ts` |
| Web bundle parse-time | `npm run check:web` | Node script-mode parser | the running Metro bundle |
| Everything | `npm run test:all` | runs the four script layers in order | all of the above |

## Adding a test

- **Pure function or mapper** → `lib/__tests__/<module>.test.ts`. Vitest, no mocks. See `lib/__tests__/demo-dogs.test.ts`.
- **Component** → `components/__tests__/<Component>.test.tsx`. RNTL via vitest. Framework-boundary mocks (`expo-video`, `expo-image`, etc.) live in `vitest.setup.ts` — don't add new mocks for our own code.
- **Trigger or RLS policy** → `__tests__/sql/<feature>.test.sql`. Wrap in `begin; … rollback;`. Use `99999999-…` UUIDs for fixtures so seed dogs (`11111111-…`) stay isolated.
- **Edge function** → `__tests__/edge-functions/<name>.test.ts`. Hit the local Functions URL, assert status codes; never call paid third-party APIs.
- **End-to-end** → `__tests__/e2e/<flow>.spec.ts`. Read the OTP from Mailpit's REST API at `http://localhost:54324/api/v1/messages` to get past auth.

## Why these choices

- **Vitest, not Jest** — faster, ESM-native, no `import.meta` landmine. See `CLAUDE.md` "Web-bundle landmines."
- **`react-native` aliased to `react-native-web`** in `vitest.config.ts` so RN component imports resolve in jsdom. Same trick Metro uses internally.
- **No mocks in lib tests** — `mapDogRowToCard`, `pickScenario`, `haversineMiles` are pure. Mocked DB tests give false confidence.
- **Live Supabase for query-hook integration tests** — gated by `process.env.SUPABASE_URL`; tests skip cleanly when local Supabase isn't running, so `npm test` works in any environment.
