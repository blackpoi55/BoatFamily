import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const BUCKETS: Array<{ name: string; public: boolean; description: string }> = [
  { name: "chat-attachments", public: true, description: "Images sent in chat" },
  { name: "note-attachments", public: true, description: "Images in notes and comments" },
  { name: "payment-slips", public: false, description: "Payment slip uploads" },
  { name: "photos", public: true, description: "Family photo albums" },
  { name: "avatars", public: true, description: "User avatars" },
];

async function main() {
  const { data: existing, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) throw listErr;
  const have = new Set(existing.map((b) => b.name));

  for (const bucket of BUCKETS) {
    if (have.has(bucket.name)) {
      console.log(`✓ Bucket "${bucket.name}" already exists`);
      continue;
    }
    const { error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: bucket.name === "payment-slips" ? null : ["image/*"],
    });
    if (error) {
      console.error(`✗ Failed to create "${bucket.name}":`, error.message);
    } else {
      console.log(`✓ Created bucket "${bucket.name}" (${bucket.public ? "public" : "private"})`);
    }
  }
}

main();
