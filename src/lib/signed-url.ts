import "server-only";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function signedUrl(
  bucket: string,
  path: string,
  expiresInSec = 60 * 60,
): Promise<string | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSec);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function signedUrls(
  bucket: string,
  paths: string[],
  expiresInSec = 60 * 60,
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, expiresInSec);
  if (error) return {};
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}
