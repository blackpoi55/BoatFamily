import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const db = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const dbUsers = await db.user.findMany();
  const { data: authData, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  console.log(`\nPrisma: ${dbUsers.length} users | Auth: ${authData.users.length} users`);

  const dbIds = new Set(dbUsers.map((u) => u.id));
  const orphans = authData.users.filter((u) => !dbIds.has(u.id));

  if (orphans.length === 0) {
    console.log("✓ No orphan auth users");
    return;
  }

  console.log(`\nDeleting ${orphans.length} orphan auth user(s):`);
  for (const u of orphans) {
    console.log(`  - ${u.email}`);
    const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
    if (delErr) console.error("    delete error:", delErr.message);
  }
}

main().finally(() => db.$disconnect());
