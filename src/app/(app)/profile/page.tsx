import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const me = await requireUser();
  return (
    <div className="space-y-4 p-4">
      <Link
        href="/more"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
      >
        <ChevronLeft className="size-4" /> กลับ
      </Link>
      <h1 className="text-xl font-bold">โปรไฟล์</h1>
      <ProfileForm user={me} />
    </div>
  );
}
