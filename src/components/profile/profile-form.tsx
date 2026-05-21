"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Save, Loader2, ImagePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThaiDatePicker } from "@/components/ui/thai-date-picker";
import { updateProfile, updateAvatar } from "@/app/actions/profile";
import { compressImage } from "@/lib/compress-image";
import { getInitials, IMAGE_ACCEPT } from "@/lib/utils";

type Props = {
  user: {
    name: string;
    username: string;
    avatarUrl: string | null;
    phoneNumber: string | null;
    birthDate: Date | null;
    bloodType: string | null;
    allergies: string | null;
    emergencyContact: string | null;
  };
};

export function ProfileForm({ user }: Props) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isAvatarPending, startAvatarTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    startProfileTransition(async () => {
      const r = await updateProfile(formData);
      if (!r.ok) toast.error(r.error);
      else toast.success("บันทึกแล้ว");
    });
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("รองรับเฉพาะรูปภาพ");
      return;
    }
    const compressed = await compressImage(f, { maxDimension: 512, quality: 0.85 });
    const formData = new FormData();
    formData.set("file", compressed);

    startAvatarTransition(async () => {
      const r = await updateAvatar(formData);
      if (!r.ok) toast.error(r.error);
      else toast.success("อัพเดตรูปโปรไฟล์แล้ว");
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={isAvatarPending}
          className="relative size-20 overflow-hidden rounded-full bg-brand-100 text-2xl font-semibold text-brand-700 dark:bg-brand-700/20 dark:text-brand-300"
        >
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.name} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              {getInitials(user.name)}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white opacity-0 transition-opacity hover:opacity-100">
            {isAvatarPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ImagePlus className="size-5" />
            )}
          </div>
        </button>
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-xs text-stone-500">@{user.username}</p>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="mt-1 text-xs font-medium text-brand-600 hover:underline"
          >
            เปลี่ยนรูปโปรไฟล์
          </button>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          hidden
          onChange={onAvatarChange}
        />
      </section>

      <form action={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
            ชื่อเล่น (ที่แสดงในแอพ)
          </label>
          <Input name="name" required maxLength={60} defaultValue={user.name} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
            เบอร์โทร
          </label>
          <Input
            name="phoneNumber"
            type="tel"
            maxLength={20}
            defaultValue={user.phoneNumber ?? ""}
            placeholder="081-234-5678"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
            วันเกิด
          </label>
          <ThaiDatePicker
            name="birthDate"
            mode="date"
            defaultValue={user.birthDate ?? null}
            placeholder="เลือกวันเกิด"
          />
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900 dark:bg-rose-950/20">
          <h3 className="mb-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
            ข้อมูลสำหรับฉุกเฉิน
          </h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                กรุ๊ปเลือด
              </label>
              <Input
                name="bloodType"
                maxLength={10}
                defaultValue={user.bloodType ?? ""}
                placeholder="A / B / AB / O (Rh+ / Rh-)"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                ภูมิแพ้ / ยาที่ต้องระวัง
              </label>
              <textarea
                name="allergies"
                rows={2}
                maxLength={500}
                defaultValue={user.allergies ?? ""}
                placeholder="เช่น แพ้กุ้ง, แพ้ยา penicillin"
                className="w-full resize-y rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                ติดต่อฉุกเฉิน (ชื่อ + เบอร์)
              </label>
              <Input
                name="emergencyContact"
                maxLength={200}
                defaultValue={user.emergencyContact ?? ""}
                placeholder="เช่น พ่อ 081-234-5678"
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isProfilePending} className="w-full">
          <Save className="size-4" />
          {isProfilePending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </form>
    </div>
  );
}
