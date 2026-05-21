# ครอบครัว · Family Remember

แอพ PWA สำหรับใช้ในครอบครัว — แชทรวม, บันทึก, แจ้งเตือน, จัดการค่าใช้จ่าย, ปฏิทิน, รายการซื้อของ, อัลบั้มรูป, สมุดข้อมูลฉุกเฉิน

## Tech stack
- Next.js 16 (App Router) · TypeScript · Tailwind CSS v4
- Server Actions
- Prisma 6 ORM
- Supabase (Postgres, Auth, Realtime, Storage)
- next-intl (ไทย / English)
- Web Push (VAPID) + PWA
- Vercel deploy + Vercel Cron Jobs

## Setup

### 1. ติดตั้ง dependency
```bash
npm install
```

### 2. สร้าง Supabase project
- ไปที่ [supabase.com](https://supabase.com) สร้าง project (region: Singapore แนะนำ)
- จาก **Project Settings → Database** คัดลอก connection strings
- จาก **Project Settings → API** คัดลอก URL และ keys

### 3. ตั้ง env vars
คัดลอก `.env.example` เป็น `.env` แล้วเติมค่า:
```
DATABASE_URL=...
DIRECT_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 4. รัน migration
```bash
npx prisma migrate dev --name init
```

### 5. รัน dev server
```bash
npm run dev
```

## Roadmap
- [x] Phase 1 — Scaffold, i18n, layout, navigation
- [ ] Phase 2 — Auth + admin approval flow
- [ ] Phase 3 — Realtime chat
- [ ] Phase 4 — Notes (private / shared / tagged) + comments
- [ ] Phase 5 — Reminders + Web Push + PWA + Vercel Cron
- [ ] Phase 6 — Bills + payment slip upload
- [ ] Phase 7 — Calendar, Shopping list, Photos, Emergency directory
