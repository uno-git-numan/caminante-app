"use client";

// «Programar campaña completa»: genera las láminas de TODAS las piezas listas de
// M1+M2 (posts 4:5), las sube al bucket y llama a programarCampana, que les calcula
// la fecha según la próxima salida (canon del playbook). Un clic = todo el arco de
// venta agendado. Reusa slidePng del KitClient (mismo serializador que la descarga).
import { useState } from "react";
import { slidePng } from "./KitClient";
import { programarCampana } from "@/lib/social/publish-actions";

export function CampanaButton({
  slug,
  orient,
  pieces,
}: {
  slug: string;
  orient: "post" | "story";
  pieces: { id: string; caption?: string }[];
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const base = slug.replace(/[^\w-]/g, "").toLowerCase();

  function fmt(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString("es-MX", { timeZone: "America/Mexico_City", day: "2-digit", month: "short" });
    } catch {
      return iso;
    }
  }

  async function run() {
    if (!pieces.length) {
      alert("No hay piezas listas de M1/M2 para programar (revisa que tengan sus insumos).");
      return;
    }
    if (!confirm(`¿Programar la campaña completa? Se generan y agendan ${pieces.length} pieza(s) (M1 anuncio + M2 venta) según la fecha de la salida. P7 «cupo» la dispara el robot; M3 se agenda al volver del viaje.`)) return;
    setBusy(true);
    setNote(null);
    try {
      const payload: { pieceId: string; format: "post" | "story"; caption?: string; imageUrls: string[] }[] = [];
      for (const p of pieces) {
        const slides = Array.from(document.querySelectorAll<HTMLElement>(`[data-piece="${p.id}"] .slide`));
        if (!slides.length) continue;
        const urls: string[] = [];
        for (let i = 0; i < slides.length; i++) {
          const dataUrl = await slidePng(slides[i]);
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], `${base}-${p.id.toLowerCase()}-${orient}-${String(i + 1).padStart(2, "0")}.png`, { type: "image/png" });
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/caminante/api/admin/upload", { method: "POST", body: fd });
          if (!res.ok) throw new Error(`No se pudo subir una imagen de ${p.id} (${res.status}).`);
          const j = await res.json();
          if (!j?.url) throw new Error(`La subida de ${p.id} no devolvió URL.`);
          urls.push(j.url as string);
        }
        payload.push({ pieceId: p.id, format: orient, caption: p.caption, imageUrls: urls });
      }
      const r = await programarCampana({ slug, pieces: payload });
      if (r.ok) {
        const lines = (r.scheduled || []).map((s) => `${s.pieceId} → ${fmt(s.date)}`).join(" · ");
        setNote({ ok: true, text: `Campaña programada (${r.scheduled?.length ?? payload.length} piezas): ${lines}. Míralas en «Cola de redes».` });
      } else {
        setNote({ ok: false, text: r.error || "No se pudo programar la campaña." });
      }
    } catch (e) {
      setNote({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={run} disabled={busy} className="btn btn-orange btn-sm" title="Agenda M1+M2 según la fecha de la salida">
        {busy ? "Programando campaña…" : "🎬 Programar campaña"}
      </button>
      {note ? (
        <span
          style={{
            flexBasis: "100%",
            fontSize: 13,
            marginTop: 6,
            color: note.ok ? "#4f5d44" : "#c23c1c",
            background: note.ok ? "rgba(99,113,84,.12)" : "rgba(255,93,54,.1)",
            borderRadius: 8,
            padding: "8px 12px",
            lineHeight: 1.5,
          }}
        >
          {note.ok ? "✅ " : "⚠️ "}
          {note.text}
        </span>
      ) : null}
    </>
  );
}
