"use client";

import Swal, { type SweetAlertIcon } from "sweetalert2";

const baseClasses = {
  popup: "!rounded-3xl !border !border-stone-200 dark:!bg-stone-900 dark:!border-stone-700 !shadow-2xl",
  title: "!text-stone-900 dark:!text-stone-100 !text-lg !font-bold",
  htmlContainer: "!text-stone-600 dark:!text-stone-300 !text-sm",
  confirmButton:
    "!rounded-full !bg-brand-600 hover:!bg-brand-700 !px-6 !py-2.5 !font-semibold !shadow-md",
  cancelButton:
    "!rounded-full !bg-stone-200 dark:!bg-stone-700 !text-stone-700 dark:!text-stone-200 hover:!bg-stone-300 dark:hover:!bg-stone-600 !px-6 !py-2.5 !font-semibold",
  denyButton: "!rounded-full !bg-rose-600 hover:!bg-rose-700 !px-6 !py-2.5 !font-semibold !shadow-md",
  actions: "!gap-2 !mt-4",
  icon: "!border-0",
};

export async function confirm(opts: {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: SweetAlertIcon;
  danger?: boolean;
}): Promise<boolean> {
  const result = await Swal.fire({
    title: opts.title,
    text: opts.text,
    icon: opts.icon ?? (opts.danger ? "warning" : "question"),
    showCancelButton: true,
    confirmButtonText: opts.confirmText ?? "ยืนยัน",
    cancelButtonText: opts.cancelText ?? "ยกเลิก",
    buttonsStyling: false,
    reverseButtons: true,
    customClass: {
      ...baseClasses,
      confirmButton: opts.danger
        ? baseClasses.denyButton
        : baseClasses.confirmButton,
    },
  });
  return result.isConfirmed;
}

export async function success(title: string, text?: string) {
  return Swal.fire({
    icon: "success",
    title,
    text,
    timer: 2200,
    showConfirmButton: false,
    buttonsStyling: false,
    customClass: baseClasses,
    toast: true,
    position: "top",
  });
}

export async function error(title: string, text?: string) {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "เข้าใจแล้ว",
    buttonsStyling: false,
    customClass: baseClasses,
  });
}

export async function prompt(opts: {
  title: string;
  inputLabel?: string;
  placeholder?: string;
  inputValue?: string;
  inputType?: "text" | "textarea" | "number" | "email";
  confirmText?: string;
}): Promise<string | null> {
  const result = await Swal.fire({
    title: opts.title,
    input: opts.inputType ?? "text",
    inputLabel: opts.inputLabel,
    inputPlaceholder: opts.placeholder,
    inputValue: opts.inputValue,
    showCancelButton: true,
    confirmButtonText: opts.confirmText ?? "ตกลง",
    cancelButtonText: "ยกเลิก",
    buttonsStyling: false,
    reverseButtons: true,
    customClass: {
      ...baseClasses,
      input:
        "!rounded-xl !border-stone-200 dark:!bg-stone-800 dark:!border-stone-700 dark:!text-stone-100 focus:!ring-brand-500 focus:!border-brand-500",
    },
  });
  return result.isConfirmed ? (result.value as string) : null;
}
