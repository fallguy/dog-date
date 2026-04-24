# Supabase

Database schema and edge functions live here. The app connects via `lib/supabase.ts` using credentials from `.env`.

## Initial setup

1. Create a project at https://supabase.com/dashboard.
2. Copy the project URL and `anon` public key from Settings → API.
3. Copy `.env.example` → `.env` at the repo root and fill in those values.
4. Install the Supabase CLI: `brew install supabase/tap/supabase`.
5. Link this directory to the project: `supabase link --project-ref YOUR-REF`.

## Migrations

Create a new migration:

```bash
supabase migration new <slug>
```

Apply to the linked project:

```bash
supabase db push
```

Generate TypeScript types for the app (run after schema changes):

```bash
supabase gen types typescript --linked > ../lib/database.types.ts
```

## Directory layout

- `migrations/` — SQL migrations, committed to git, applied in order.
- `functions/` — edge functions (Deno). Deployed with `supabase functions deploy <name>`.
