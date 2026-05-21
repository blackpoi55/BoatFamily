type CompressOptions = {
  maxDimension?: number;
  quality?: number;
  passthroughBytes?: number;
};

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 1920,
  quality: 0.85,
  passthroughBytes: 600 * 1024,
};

export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  const opts = { ...DEFAULTS, ...options };

  if (file.type === "image/gif") return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= opts.passthroughBytes) return file;

  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  if (width > opts.maxDimension || height > opts.maxDimension) {
    const scale = opts.maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  const targetType =
    file.type === "image/png" && hasAlpha(ctx, width, height) ? "image/png" : "image/jpeg";

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, targetType, opts.quality),
  );
  if (!blob || blob.size >= file.size) return file;

  const ext = targetType === "image/png" ? "png" : "jpg";
  const newName = file.name.replace(/\.[^.]+$/, "") + "." + ext;
  return new File([blob], newName, { type: targetType, lastModified: Date.now() });
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("ไม่สามารถอ่านรูปได้"));
    img.src = src;
  });
}

function hasAlpha(ctx: CanvasRenderingContext2D, w: number, h: number) {
  try {
    const sw = Math.min(w, 64);
    const sh = Math.min(h, 64);
    const data = ctx.getImageData(0, 0, sw, sh).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i]! < 255) return true;
    }
  } catch {
    return false;
  }
  return false;
}
