"use client";

import { useRef, useState } from "react";

interface Props {
  kind: "health" | "parent_consent";
  registrationId: string;
  label: string;
  hint?: string;
  value?: string;
  onUploaded: (url: string) => void;
}

/** Upload widget that POSTs the file to /api/upload and returns a public URL. */
export function FileDrop({ kind, registrationId, label, hint, value, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      fd.append("registrationId", registrationId);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "upload failed");
      setName(file.name);
      onUploaded(json.url as string);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-white/90 mb-1">{label}</label>
      {hint && <div className="text-xs text-white/50 mb-2">{hint}</div>}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className="cursor-pointer rounded-xl border-2 border-dashed border-white/15 hover:border-electric-500/60 hover:bg-electric-500/5 transition px-5 py-6 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {busy ? (
          <span className="text-white/70 text-sm">מעלה...</span>
        ) : value ? (
          <span className="text-electric-400 text-sm">✓ הקובץ הועלה{name ? ` (${name})` : ""}. לחץ להחלפה</span>
        ) : (
          <span className="text-white/60 text-sm">לחץ או גרור קובץ (PDF / JPG / PNG)</span>
        )}
      </div>
      {err && <div className="mt-1 text-xs text-red-400">{err}</div>}
    </div>
  );
}
