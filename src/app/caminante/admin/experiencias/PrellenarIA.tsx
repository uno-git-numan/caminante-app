"use client";

// Panel "Pre-llenar con IA" del formulario de experiencia (solo modo crear).
// Sube documentos → /caminante/api/admin/prellenar → entrega el resultado al
// form vía onResult (el form fusiona con merge no destructivo). Usa las clases
// del design system del propio form (.adminexp: startcard, btn, sd-hint…).
import { useRef, useState } from "react";
import type { SlotIA } from "@/lib/ai/prellenar";

type Props = {
  onResult: (data: Record<string, unknown>, slots: SlotIA[], notas: string) => void;
};

const MAX_MB = 4;

export default function PrellenarIA({ onResult }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [notas, setNotas] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notasIA, setNotasIA] = useState<string | null>(null);

  const totalMB = files.reduce((n, f) => n + f.size, 0) / (1024 * 1024);
  const pasado = totalMB > MAX_MB;
  // Vale con documentos O con texto pegado en indicaciones (o ambos).
  const hayEntrada = files.length > 0 || notas.trim().length > 0;

  async function enviar() {
    if (!hayEntrada || busy || pasado) return;
    setBusy(true);
    setError(null);
    setNotasIA(null);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      fd.append("notas", notas);
      const res = await fetch("/caminante/api/admin/prellenar", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Algo falló. Intenta de nuevo.");
        return;
      }
      onResult(json.data || {}, json.slots || [], json.notas || "");
      setNotasIA(json.notas || "");
    } catch {
      setError("No hubo respuesta (¿conexión?). Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="startcard" style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="chip-auto">IA</span>
        <strong>Pre-llenar con IA</strong>
        <span style={{ opacity: 0.6, fontSize: 13 }}>opcional</span>
      </div>
      <p className="sd-hint" style={{ marginTop: 6 }}>
        Sube el itinerario del operador (PDF, imágenes) <b>o pega el texto</b> abajo. La IA pre-llena
        el formulario en voz Caminante — tú revisas, subes las fotos y guardas. No inventa precios ni
        horarios: lo que no esté en el material queda vacío. Word → exportar a PDF. Máx {MAX_MB} MB.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 10 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()}>
          + Agregar documentos
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,application/pdf,image/*,text/plain"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
            e.target.value = "";
            setError(null);
          }}
        />
        {files.map((f, i) => (
          <span
            key={`${f.name}-${i}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5,
              padding: "5px 10px", borderRadius: 999, border: "1px solid rgba(32,33,28,.15)",
              background: "rgba(99,113,84,.06)",
            }}
          >
            {f.name}
            <button
              type="button"
              aria-label={`Quitar ${f.name}`}
              onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
              style={{ border: 0, background: "none", cursor: "pointer", opacity: 0.6 }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      {pasado ? (
        <p className="sd-hint" style={{ color: "#b33517", marginTop: 8 }}>
          {totalMB.toFixed(1)} MB — el límite es {MAX_MB} MB. Quita archivos o comprime el PDF.
        </p>
      ) : null}

      <textarea
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        placeholder="Pega aquí el itinerario o notas del operador, o da indicaciones. Ej: 'la salida es el domingo 24 de agosto, cupo 17, $2,550 por persona'"
        style={{ width: "100%", marginTop: 10 }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
        <button
          type="button"
          className="btn btn-orange btn-sm"
          disabled={!hayEntrada || busy || pasado}
          onClick={enviar}
        >
          {busy ? "Leyendo documentos…" : "Pre-llenar con IA"}
        </button>
        {busy ? <span className="sd-hint">Toma ~30–60 segundos. No cierres la página.</span> : null}
      </div>

      {error ? (
        <p className="sd-hint" style={{ color: "#b33517", marginTop: 10 }}>{error}</p>
      ) : null}
      {notasIA !== null ? (
        <div
          style={{
            marginTop: 10, padding: "10px 14px", borderRadius: 12, fontSize: 13,
            border: "1px solid rgba(99,113,84,.3)", background: "rgba(99,113,84,.08)",
          }}
        >
          <strong>Formulario pre-llenado ✓</strong> — revisa cada sección antes de guardar.
          {notasIA ? (
            <div style={{ marginTop: 4, whiteSpace: "pre-wrap", opacity: 0.8 }}>{notasIA}</div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
