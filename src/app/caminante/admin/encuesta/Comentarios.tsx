// Los comentarios agrupados POR TIPO de pregunta, no por persona.
//
// «Por ranking» ya los muestra persona por persona. Esta vista sirve a la otra
// pregunta: ¿qué se repite? Leer los seis «por mejorar» seguidos es donde
// aparece el patrón — en hongos, tres personas distintas pidieron lo mismo
// (más contenido didáctico) y de una en una eso no se ve.
//
// Orden deliberado: primero lo accionable, al final lo que da gusto leer.

import type { EncuestaRespuesta } from "@/lib/admin/queries";

type Grupo = {
  key: "mejorar" | "esperaba" | "loved";
  titulo: string;
  nota: string;
  acento: boolean;
};

const GRUPOS: Grupo[] = [
  { key: "mejorar", titulo: "Por mejorar", nota: "lo que pidieron cambiar", acento: true },
  { key: "esperaba", titulo: "Esperaba y no pasó", nota: "la distancia entre lo prometido y lo vivido", acento: true },
  { key: "loved", titulo: "Lo que más marcó", nota: "de aquí salen los testimonios", acento: false },
];

export default function Comentarios({ respuestas }: { respuestas: EncuestaRespuesta[] }) {
  const grupos = GRUPOS.map((g) => ({
    ...g,
    items: respuestas.filter((r) => r[g.key]).map((r) => ({ r, texto: r[g.key] as string })),
  })).filter((g) => g.items.length);

  if (!grupos.length) return <div className="empty">Nadie escribió comentarios abiertos todavía.</div>;

  return (
    <div>
      {grupos.map((g) => (
        <div key={g.key} style={{ marginBottom: 20 }}>
          <div className="xh4" style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={g.acento ? { color: "var(--orange)" } : undefined}>{g.titulo}</span>
            <span
              className="mut"
              style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 12 }}
            >
              {g.items.length} · {g.nota}
            </span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {g.items.map(({ r, texto }, i) => (
              <div
                key={i}
                style={{
                  borderLeft: `2px solid ${g.acento ? "var(--orange)" : "var(--olive)"}`,
                  paddingLeft: 12,
                }}
              >
                <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--charcoal)" }}>“{texto}”</div>
                <div className="mut" style={{ fontSize: 11.5, marginTop: 3 }}>
                  {r.nombre}
                  {r.stars != null ? ` · ${r.stars}★` : ""}
                  {r.salidaLabel ? ` · ${r.salidaLabel}` : ""}
                  {r.via === "grupo" ? " · grupo" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
