/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

async function resizeImage(file: File, max = 1400): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  ctx.drawImage(bitmap, 0, 0, w, h);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("No se pudo comprimir"))),
      "image/jpeg",
      0.82
    )
  );
}

export function ImageUpload({
  name,
  folder,
  defaultUrl = "",
  label = "Foto",
}: {
  name: string;
  folder: string;
  defaultUrl?: string;
  label?: string;
}) {
  const [url, setUrl] = useState(defaultUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Elige una imagen.");
      return;
    }

    setError("");
    setUploading(true);
    try {
      const blob = await resizeImage(file);
      const supabase = createClient();
      const path = `${folder}/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (err) {
      setError(
        "No se pudo subir la foto. " +
          (err instanceof Error ? err.message : "")
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs uppercase tracking-widest text-muted">{label}</p>
      <input type="hidden" name={name} value={url} />

      <div className="flex items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-bg">
          {url ? (
            <img
              src={url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <ImagePlus size={22} className="text-muted" />
          )}
        </div>

        <div className="space-y-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-fg disabled:opacity-60"
          >
            {uploading ? "Subiendo…" : url ? "Cambiar foto" : "Subir foto"}
          </button>
          {url && !uploading && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="ml-2 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
            >
              <X size={14} /> Quitar
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}