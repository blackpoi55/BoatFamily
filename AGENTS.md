<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Family Remember — agent notes

แอพครอบครัว: chat, notes, reminders, bills, calendar, shopping, photos, directory

## Stack
- Next.js 16 App Router + TypeScript + Tailwind v4 + Turbopack
- Server Actions only (no REST handlers unless needed for webhooks/cron)
- Prisma 6 + Supabase Postgres (DATABASE_URL pooled, DIRECT_URL for migrations)
- Supabase Auth (`@supabase/ssr`) — email+password and magic link
- Supabase Realtime (chat) + Storage (slips/photos)
- next-intl (Thai default, English option)
- Web Push (VAPID) + next-pwa, fired via Vercel Cron

## Conventions
- All UI strings via `next-intl` keys in `messages/{th,en}.json`
- Use `@/` import alias rooted at `src/`
- Prisma singleton in `src/lib/db.ts`
- Mobile-first layout, bottom nav for primary routes
- Tailwind v4 — theme tokens in `src/app/globals.css` `@theme {}`
- Don't add comments unless explaining non-obvious *why*

## Phases (see TaskList)
1. ✅ Scaffold + i18n + layout + stubs
2. Auth (Supabase email+password + magic link + admin approval flow)
3. Realtime chat
4. Notes (private / shared / tagged) + comments
5. Reminders + Web Push + PWA + Vercel Cron
6. Bills + slip upload to Supabase Storage
7. Calendar + Shopping list + Photos + Emergency directory

## Env vars
See `.env.example`. The user must fill `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` before Phase 2 can run.
VAPID keys (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`) needed in Phase 5 — generate with `npx web-push generate-vapid-keys`.
