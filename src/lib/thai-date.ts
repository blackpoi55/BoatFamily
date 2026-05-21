const TH_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const TH_MONTHS_FULL = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

export function buddhistYear(d: Date) {
  return d.getFullYear() + 543;
}

export function formatThaiDate(d: Date, opts: { withTime?: boolean; full?: boolean } = {}) {
  const day = d.getDate();
  const month = (opts.full ? TH_MONTHS_FULL : TH_MONTHS)[d.getMonth()];
  const year = buddhistYear(d);
  const base = `${day} ${month} ${year}`;
  if (!opts.withTime) return base;
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${base} · ${h}:${m}`;
}

export function formatThaiCaption(d: Date) {
  return `${TH_MONTHS_FULL[d.getMonth()]} ${buddhistYear(d)}`;
}

export function toLocalISO(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toLocalDate(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export { TH_MONTHS, TH_MONTHS_FULL };
