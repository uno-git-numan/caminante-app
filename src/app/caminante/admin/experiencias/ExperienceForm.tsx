"use client";

import { useMemo, useState } from "react";
import { emptyExperience, slugify } from "@/lib/experiences/empty";
import { saveExperience, generateStripeLink } from "@/lib/experiences/actions";
import type { Experience } from "@/lib/experiences/types";

/* ---------- tiny field helpers ---------- */
function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-olive">{label}</span>
      <input
        className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-lagoon outline-none focus:border-dune"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <span className="mt-1 block text-[11px] text-olive/70">{hint}</span> : null}
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-olive">{label}</span>
      <textarea
        rows={rows}
        className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-lagoon outline-none focus:border-dune"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-sand bg-cream/40 p-5">
      <h3 className="text-lg font-semibold text-lagoon">{title}</h3>
      {desc ? <p className="mt-1 text-sm text-olive">{desc}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function SmallBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-sand bg-white px-2.5 py-1 text-xs font-medium text-olive hover:border-dune hover:text-lagoon"
    >
      {children}
    </button>
  );
}

function StringList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wider text-olive">{label}</span>
      <div className="mt-1 space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-lagoon outline-none focus:border-dune"
              value={it}
              placeholder={placeholder}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            />
            <SmallBtn onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</SmallBtn>
          </div>
        ))}
      </div>
      <div className="mt-2">
        <SmallBtn onClick={() => onChange([...items, ""])}>+ Agregar</SmallBtn>
      </div>
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/caminante/api/admin/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (j.url) onChange(j.url);
      else setErr(j.error || "Error al subir.");
    } catch {
      setErr("Error al subir.");
    }
    setBusy(false);
    e.target.value = "";
  }

  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wider text-olive">{label}</span>
      <div className="mt-1 flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-14 w-20 rounded-md border border-sand object-cover" />
        ) : (
          <div className="flex h-14 w-20 items-center justify-center rounded-md border border-dashed border-sand text-[10px] text-olive/60">
            sin foto
          </div>
        )}
        <label className="cursor-pointer rounded-md border border-sand bg-white px-3 py-1.5 text-xs font-medium text-olive hover:border-dune hover:text-lagoon">
          {busy ? "Subiendo…" : value ? "Cambiar" : "Subir foto"}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={busy} />
        </label>
      </div>
      <input
        className="mt-2 w-full rounded-lg border border-sand bg-white px-3 py-1.5 text-xs text-olive outline-none focus:border-dune"
        value={value}
        placeholder="o pega una URL"
        onChange={(e) => onChange(e.target.value)}
      />
      {err ? <span className="mt-1 block text-[11px] text-clay">{err}</span> : null}
    </div>
  );
}

/* ---------- main form ---------- */
export default function ExperienceForm({ initial }: { initial?: Experience }) {
  const [exp, setExp] = useState<Experience>(initial ?? emptyExperience());
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; slug?: string } | null>(null);
  const [autoSlug, setAutoSlug] = useState(!initial);
  const [stripeBusy, setStripeBusy] = useState(false);
  const [stripeErr, setStripeErr] = useState<string | null>(null);

  function set<K extends keyof Experience>(k: K, v: Experience[K]) {
    setExp((p) => ({ ...p, [k]: v }));
  }

  async function onGenStripe() {
    setStripeBusy(true);
    setStripeErr(null);
    const res = await generateStripeLink({
      title: exp.cardTitle || exp.subtitle || `${exp.title} ${exp.titleAccent}`.trim(),
      subtitle: exp.subtitle,
      amount: exp.price?.amount ?? "",
      currency: exp.price?.currency ?? "",
    });
    setStripeBusy(false);
    if (res.ok) set("stripeLink", res.url);
    else setStripeErr(res.error);
  }

  const suggestedSlug = useMemo(
    () => slugify(`${exp.subtitle || exp.title} ${exp.titleAccent}`),
    [exp.subtitle, exp.title, exp.titleAccent],
  );
  const effectiveSlug = autoSlug ? suggestedSlug : exp.slug;

  async function onSubmit(status: Experience["status"]) {
    setSaving(true);
    setResult(null);
    const slug = (autoSlug ? suggestedSlug : exp.slug).trim();
    // Fill standard boilerplate if left empty.
    const filled: Experience = {
      ...exp,
      slug,
      status,
      docTitle: exp.docTitle || `Caminante · ${exp.title} ${exp.titleAccent} — ${exp.subtitle}`.trim(),
      edgeLabel: exp.edgeLabel || `Caminante · ${exp.brandSmall || exp.title}`.trim(),
      footerBrand: exp.footerBrand || `Caminante · ${exp.brandSmall || exp.title}`.trim(),
      footerSmall: exp.footerSmall || [exp.vol, exp.coords].filter(Boolean).join(" · "),
    };
    const res = await saveExperience(filled);
    setSaving(false);
    if (res.ok) {
      setExp(filled);
      setResult({
        ok: true,
        slug: res.slug,
        msg: status === "published" ? "¡Publicada!" : "Borrador guardado.",
      });
    } else {
      setResult({ ok: false, msg: res.error });
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {/* PORTADA */}
      <Section title="Portada" desc="El héroe de la página.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título" value={exp.title} onChange={(v) => set("title", v)} placeholder="OCEAN" />
          <Field
            label="Palabra acento (itálica)"
            value={exp.titleAccent}
            onChange={(v) => set("titleAccent", v)}
            placeholder="safari."
          />
        </div>
        <Field
          label="Subtítulo"
          value={exp.subtitle}
          onChange={(v) => set("subtitle", v)}
          placeholder="Ensenada de Muertos · Viaje con la ciencia"
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Marca (chip nav)" value={exp.brandSmall} onChange={(v) => set("brandSmall", v)} placeholder="Ocean Safari" />
          <Field label="Volumen / fecha" value={exp.vol} onChange={(v) => set("vol", v)} placeholder="Vol. 08 · 2026" />
          <Field label="Coordenadas" value={exp.coords} onChange={(v) => set("coords", v)} placeholder="23°59′N · 109°50′W" />
        </div>
        <ImageField label="Foto de portada" value={exp.heroImageUrl} onChange={(v) => set("heroImageUrl", v)} />
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-olive">Datos del héroe (4 columnas)</span>
          <div className="mt-1 space-y-2">
            {exp.heroMeta.map((m, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <input
                  className="rounded-lg border border-sand bg-white px-3 py-2 text-sm outline-none focus:border-dune"
                  value={m.k}
                  placeholder="Etiqueta (Duración)"
                  onChange={(e) => set("heroMeta", exp.heroMeta.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)))}
                />
                <input
                  className="rounded-lg border border-sand bg-white px-3 py-2 text-sm outline-none focus:border-dune"
                  value={m.v}
                  placeholder="Valor (4 días · 3 noches)"
                  onChange={(e) => set("heroMeta", exp.heroMeta.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))}
                />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* IDENTIDAD */}
      <Section title="Identificador & estado">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Field
              label="Slug (URL)"
              value={effectiveSlug}
              onChange={(v) => {
                setAutoSlug(false);
                set("slug", v);
              }}
              hint={autoSlug ? "Automático desde el subtítulo. Edítalo para fijarlo." : "Fijo."}
            />
            <span className="mt-1 block text-[11px] text-olive/70">/caminante/experiencias/{effectiveSlug || "…"}</span>
          </div>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-olive">Estado</span>
            <div className="mt-1 text-sm text-olive">
              Se guarda como <strong>borrador</strong> o <strong>publicada</strong> con los botones de abajo.
            </div>
          </label>
        </div>
      </Section>

      {/* PRECIO & CONTACTO */}
      <Section title="Precio & contacto">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Precio" value={exp.price?.amount ?? ""} onChange={(v) => set("price", { ...(exp.price ?? { amount: "", currency: "", desc: "" }), amount: v })} placeholder="$16,000" />
          <Field label="Moneda / nota" value={exp.price?.currency ?? ""} onChange={(v) => set("price", { ...(exp.price ?? { amount: "", currency: "", desc: "" }), currency: v })} placeholder="MXN · por persona" />
          <Field label="WhatsApp (dígitos)" value={exp.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="525512020565" />
        </div>
        <Area label="Qué cubre el precio" value={exp.price?.desc ?? ""} onChange={(v) => set("price", { ...(exp.price ?? { amount: "", currency: "", desc: "" }), desc: v })} />
        <div className="rounded-lg border border-sand bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-olive">Link de pago (Stripe)</span>
              <p className="text-[11px] text-olive/70">
                Genera un link de cobro por el precio. Aparece como &ldquo;Reservar tu lugar&rdquo; en la página.
              </p>
            </div>
            <button
              type="button"
              onClick={onGenStripe}
              disabled={stripeBusy}
              className="shrink-0 rounded-md bg-lagoon px-3 py-1.5 text-xs font-semibold text-cream hover:bg-dune disabled:opacity-50"
            >
              {stripeBusy ? "Generando…" : exp.stripeLink ? "Regenerar" : "Generar link"}
            </button>
          </div>
          {exp.stripeLink ? (
            <a href={exp.stripeLink} target="_blank" rel="noopener" className="mt-2 block truncate text-xs text-forest underline">
              {exp.stripeLink}
            </a>
          ) : null}
          {stripeErr ? <span className="mt-1 block text-[11px] text-clay">{stripeErr}</span> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Correo" value={exp.email} onChange={(v) => set("email", v)} />
          <Field label="Instagram (sin @)" value={exp.instagram} onChange={(v) => set("instagram", v)} />
        </div>
      </Section>

      {/* CONTEXTO */}
      <Section title="Capítulo 01 · El Contexto">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título" value={exp.contextTitle} onChange={(v) => set("contextTitle", v)} placeholder="La historia detrás del" />
          <Field label="Acento" value={exp.contextTitleAccent} onChange={(v) => set("contextTitleAccent", v)} placeholder="Mar de Cortés." />
        </div>
        <Area label="Intro" value={exp.contextLead} onChange={(v) => set("contextLead", v)} />
        <ImageField label="Foto de la banda" value={exp.contextBandImageUrl} onChange={(v) => set("contextBandImageUrl", v)} />
        <Field label="Pie de foto banda" value={exp.contextBandCaption} onChange={(v) => set("contextBandCaption", v)} />
        <div className="space-y-3">
          {exp.context.map((c, i) => (
            <div key={i} className="rounded-lg border border-sand bg-white p-3">
              <div className="mb-2 text-xs font-semibold text-dune">Punto {c.no}</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Título" value={c.title} onChange={(v) => set("context", exp.context.map((x, j) => (j === i ? { ...x, title: v } : x)))} />
                <Field label="Subtítulo" value={c.sub} onChange={(v) => set("context", exp.context.map((x, j) => (j === i ? { ...x, sub: v } : x)))} />
              </div>
              <Area label="Cuerpo" value={c.body} onChange={(v) => set("context", exp.context.map((x, j) => (j === i ? { ...x, body: v } : x)))} />
            </div>
          ))}
        </div>
      </Section>

      {/* CUATRO CARAS */}
      <Section title="Las cuatro caras" desc="Las 4 son fijas (Naturaleza, Conservación, Comunidades, Problemas). Usa **negrita** y *itálica* en el cuerpo.">
        {exp.lenses.map((l, i) => (
          <div key={l.key} className="rounded-lg border border-sand bg-white p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-dune">{l.caraNo} · {l.label}</div>
            <Field label="Título" value={l.title} onChange={(v) => set("lenses", exp.lenses.map((x, j) => (j === i ? { ...x, title: v } : x)))} />
            <Area label="Cuerpo" rows={4} value={l.body} onChange={(v) => set("lenses", exp.lenses.map((x, j) => (j === i ? { ...x, body: v } : x)))} />
            <ImageField label="Foto" value={l.imageUrl} onChange={(v) => set("lenses", exp.lenses.map((x, j) => (j === i ? { ...x, imageUrl: v } : x)))} />
            <div className="mt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-olive">Datos (número + etiqueta)</span>
              <div className="mt-1 space-y-2">
                {l.facts.map((f, k) => (
                  <div key={k} className="flex gap-2">
                    <input className="w-24 rounded-lg border border-sand bg-white px-2 py-1.5 text-sm outline-none focus:border-dune" value={f.n} placeholder="9" onChange={(e) => set("lenses", exp.lenses.map((x, j) => (j === i ? { ...x, facts: x.facts.map((ff, kk) => (kk === k ? { ...ff, n: e.target.value } : ff)) } : x)))} />
                    <input className="flex-1 rounded-lg border border-sand bg-white px-2 py-1.5 text-sm outline-none focus:border-dune" value={f.l} placeholder="especies de grandes ballenas" onChange={(e) => set("lenses", exp.lenses.map((x, j) => (j === i ? { ...x, facts: x.facts.map((ff, kk) => (kk === k ? { ...ff, l: e.target.value } : ff)) } : x)))} />
                    <SmallBtn onClick={() => set("lenses", exp.lenses.map((x, j) => (j === i ? { ...x, facts: x.facts.filter((_, kk) => kk !== k) } : x)))}>✕</SmallBtn>
                  </div>
                ))}
                <SmallBtn onClick={() => set("lenses", exp.lenses.map((x, j) => (j === i ? { ...x, facts: [...x.facts, { n: "", l: "" }] } : x)))}>+ Dato</SmallBtn>
              </div>
            </div>
          </div>
        ))}
      </Section>

      {/* QUÉ VAS A VIVIR */}
      <Section title="Capítulo 02 · Lo que vas a vivir">
        <Area label="Intro" value={exp.vivirLead} onChange={(v) => set("vivirLead", v)} />
        {exp.vivir.map((v, i) => (
          <div key={i} className="rounded-lg border border-sand bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-dune">Encuentro {v.num}</span>
              <SmallBtn onClick={() => set("vivir", exp.vivir.filter((_, j) => j !== i))}>✕ quitar</SmallBtn>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Número" value={v.num} onChange={(val) => set("vivir", exp.vivir.map((x, j) => (j === i ? { ...x, num: val } : x)))} />
              <Field label="Etiqueta (pill)" value={v.pill} onChange={(val) => set("vivir", exp.vivir.map((x, j) => (j === i ? { ...x, pill: val } : x)))} />
            </div>
            <Field label="Título" value={v.title} onChange={(val) => set("vivir", exp.vivir.map((x, j) => (j === i ? { ...x, title: val } : x)))} />
            <Area label="Cuerpo" value={v.body} onChange={(val) => set("vivir", exp.vivir.map((x, j) => (j === i ? { ...x, body: val } : x)))} />
            <ImageField label="Foto" value={v.imageUrl} onChange={(val) => set("vivir", exp.vivir.map((x, j) => (j === i ? { ...x, imageUrl: val } : x)))} />
          </div>
        ))}
        <SmallBtn onClick={() => set("vivir", [...exp.vivir, { num: String(exp.vivir.length + 1).padStart(2, "0"), pill: "", title: "", body: "", imageUrl: "" }])}>+ Encuentro</SmallBtn>
      </Section>

      {/* ALIADOS */}
      <Section title="Capítulo 03 · Los Aliados">
        <Area label="Intro" value={exp.aliadosLead} onChange={(v) => set("aliadosLead", v)} />
        {exp.aliados.map((a, i) => (
          <div key={i} className="rounded-lg border border-sand bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-dune">Aliado {i + 1}</span>
              <SmallBtn onClick={() => set("aliados", exp.aliados.filter((_, j) => j !== i))}>✕ quitar</SmallBtn>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Rol" value={a.role} onChange={(val) => set("aliados", exp.aliados.map((x, j) => (j === i ? { ...x, role: val } : x)))} />
              <Field label="Nombre" value={a.name} onChange={(val) => set("aliados", exp.aliados.map((x, j) => (j === i ? { ...x, name: val } : x)))} />
            </div>
            <Area label="Descripción" value={a.body} onChange={(val) => set("aliados", exp.aliados.map((x, j) => (j === i ? { ...x, body: val } : x)))} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Etiqueta de personas" value={a.peopleLabel} onChange={(val) => set("aliados", exp.aliados.map((x, j) => (j === i ? { ...x, peopleLabel: val } : x)))} />
              <Field label="Personas" value={a.people} onChange={(val) => set("aliados", exp.aliados.map((x, j) => (j === i ? { ...x, people: val } : x)))} />
            </div>
          </div>
        ))}
        <SmallBtn onClick={() => set("aliados", [...exp.aliados, { role: "", name: "", body: "", peopleLabel: "", people: "" }])}>+ Aliado</SmallBtn>
      </Section>

      {/* ITINERARIO */}
      <Section title="Capítulo 04 · Itinerario">
        <Area label="Intro" value={exp.itinerarioLead} onChange={(v) => set("itinerarioLead", v)} />
        {exp.itinerario.map((d, i) => (
          <div key={i} className="rounded-lg border border-sand bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-dune">{d.dno || `Día ${i + 1}`}</span>
              <SmallBtn onClick={() => set("itinerario", exp.itinerario.filter((_, j) => j !== i))}>✕ quitar día</SmallBtn>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Día" value={d.dno} onChange={(val) => set("itinerario", exp.itinerario.map((x, j) => (j === i ? { ...x, dno: val } : x)))} />
              <Field label="Nombre del día" value={d.dname} onChange={(val) => set("itinerario", exp.itinerario.map((x, j) => (j === i ? { ...x, dname: val } : x)))} />
            </div>
            <div className="mt-2 space-y-2">
              {d.beats.map((b, k) => (
                <div key={k} className="flex gap-2">
                  <input className="w-32 rounded-lg border border-sand bg-white px-2 py-1.5 text-sm outline-none focus:border-dune" value={b.t} placeholder="Amanecer" onChange={(e) => set("itinerario", exp.itinerario.map((x, j) => (j === i ? { ...x, beats: x.beats.map((bb, kk) => (kk === k ? { ...bb, t: e.target.value } : bb)) } : x)))} />
                  <input className="flex-1 rounded-lg border border-sand bg-white px-2 py-1.5 text-sm outline-none focus:border-dune" value={b.d} placeholder="Meditación y breathwork." onChange={(e) => set("itinerario", exp.itinerario.map((x, j) => (j === i ? { ...x, beats: x.beats.map((bb, kk) => (kk === k ? { ...bb, d: e.target.value } : bb)) } : x)))} />
                  <SmallBtn onClick={() => set("itinerario", exp.itinerario.map((x, j) => (j === i ? { ...x, beats: x.beats.filter((_, kk) => kk !== k) } : x)))}>✕</SmallBtn>
                </div>
              ))}
              <SmallBtn onClick={() => set("itinerario", exp.itinerario.map((x, j) => (j === i ? { ...x, beats: [...x.beats, { t: "", d: "" }] } : x)))}>+ Momento</SmallBtn>
            </div>
          </div>
        ))}
        <SmallBtn onClick={() => set("itinerario", [...exp.itinerario, { dno: `Día 0${exp.itinerario.length + 1}`, dname: "", beats: [{ t: "", d: "" }] }])}>+ Día</SmallBtn>
      </Section>

      {/* IMPACTO */}
      <Section title="Capítulo 05 · El Impacto">
        <StringList label="Párrafos" items={exp.impactoBody} onChange={(v) => set("impactoBody", v)} />
        <Field label="Etiqueta" value={exp.impactoLabel} onChange={(v) => set("impactoLabel", v)} placeholder="Proyecto Dos Mares · Mar de Cortés" />
        <ImageField label="Foto de fondo" value={exp.impactoImageUrl} onChange={(v) => set("impactoImageUrl", v)} />
      </Section>

      {/* PAQUETE */}
      <Section title="Capítulo 06 · El Paquete">
        <StringList label="Qué incluye" items={exp.incluye} onChange={(v) => set("incluye", v)} />
        <StringList label="Qué no incluye" items={exp.noIncluye} onChange={(v) => set("noIncluye", v)} />
      </Section>

      {/* MOCHILA */}
      <Section title="Capítulo 07 · Tu Mochila">
        {exp.mochila.map((cat, i) => (
          <div key={i} className="rounded-lg border border-sand bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <Field label="Categoría" value={cat.title} onChange={(v) => set("mochila", exp.mochila.map((x, j) => (j === i ? { ...x, title: v } : x)))} />
              <SmallBtn onClick={() => set("mochila", exp.mochila.filter((_, j) => j !== i))}>✕</SmallBtn>
            </div>
            <div className="mt-2 space-y-2">
              {cat.items.map((it, k) => (
                <div key={k} className="flex items-center gap-2">
                  <input className="flex-1 rounded-lg border border-sand bg-white px-2 py-1.5 text-sm outline-none focus:border-dune" value={it.text} placeholder="Botella reusable" onChange={(e) => set("mochila", exp.mochila.map((x, j) => (j === i ? { ...x, items: x.items.map((ii, kk) => (kk === k ? { ...ii, text: e.target.value } : ii)) } : x)))} />
                  <input className="w-40 rounded-lg border border-sand bg-white px-2 py-1.5 text-sm outline-none focus:border-dune" value={it.req ?? ""} placeholder="Nota (mín. 1 L)" onChange={(e) => set("mochila", exp.mochila.map((x, j) => (j === i ? { ...x, items: x.items.map((ii, kk) => (kk === k ? { ...ii, req: e.target.value } : ii)) } : x)))} />
                  <label className="flex items-center gap-1 text-xs text-olive">
                    <input type="checkbox" checked={!!it.must} onChange={(e) => set("mochila", exp.mochila.map((x, j) => (j === i ? { ...x, items: x.items.map((ii, kk) => (kk === k ? { ...ii, must: e.target.checked } : ii)) } : x)))} />
                    oblig.
                  </label>
                  <SmallBtn onClick={() => set("mochila", exp.mochila.map((x, j) => (j === i ? { ...x, items: x.items.filter((_, kk) => kk !== k) } : x)))}>✕</SmallBtn>
                </div>
              ))}
              <SmallBtn onClick={() => set("mochila", exp.mochila.map((x, j) => (j === i ? { ...x, items: [...x.items, { text: "", req: "", must: false }] } : x)))}>+ Ítem</SmallBtn>
            </div>
          </div>
        ))}
        <SmallBtn onClick={() => set("mochila", [...exp.mochila, { title: "", items: [{ text: "", req: "", must: false }] }])}>+ Categoría</SmallBtn>
        <Area label="Nota importante" value={exp.mochilaNote} onChange={(v) => set("mochilaNote", v)} />
      </Section>

      {/* PRÁCTICO / FAQ */}
      <Section title="Capítulo 08 · FAQ & cancelación">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-olive">Políticas de cancelación</span>
          {exp.cancelacion.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input className="flex-1 rounded-lg border border-sand bg-white px-2 py-1.5 text-sm outline-none focus:border-dune" value={c.label} onChange={(e) => set("cancelacion", exp.cancelacion.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input className="w-32 rounded-lg border border-sand bg-white px-2 py-1.5 text-sm outline-none focus:border-dune" value={c.val} onChange={(e) => set("cancelacion", exp.cancelacion.map((x, j) => (j === i ? { ...x, val: e.target.value } : x)))} />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-olive">Preguntas frecuentes</span>
          {exp.faq.map((f, i) => (
            <div key={i} className="rounded-lg border border-sand bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-dune">Pregunta {i + 1}</span>
                <SmallBtn onClick={() => set("faq", exp.faq.filter((_, j) => j !== i))}>✕</SmallBtn>
              </div>
              <Field label="Pregunta" value={f.q} onChange={(v) => set("faq", exp.faq.map((x, j) => (j === i ? { ...x, q: v } : x)))} />
              <Area label="Respuesta" value={f.a} onChange={(v) => set("faq", exp.faq.map((x, j) => (j === i ? { ...x, a: v } : x)))} />
            </div>
          ))}
          <SmallBtn onClick={() => set("faq", [...exp.faq, { q: "", a: "" }])}>+ Pregunta</SmallBtn>
        </div>
      </Section>

      {/* RESERVA */}
      <Section title="Capítulo 09 · Reserva">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Badge etiqueta" value={exp.datesBadge.label} onChange={(v) => set("datesBadge", { ...exp.datesBadge, label: v })} placeholder="Junio 2026" />
          <Field label="Badge grande" value={exp.datesBadge.big} onChange={(v) => set("datesBadge", { ...exp.datesBadge, big: v })} placeholder="12–15" />
          <Field label="Badge resto" value={exp.datesBadge.rest} onChange={(v) => set("datesBadge", { ...exp.datesBadge, rest: v })} placeholder="ó 18–21" />
        </div>
        <ImageField label="Foto de fondo" value={exp.reservaImageUrl} onChange={(v) => set("reservaImageUrl", v)} />
        <Area label="Nota de reserva" value={exp.reservaNote} onChange={(v) => set("reservaNote", v)} />
        <Area label="Pie de página (footer)" value={exp.footerRight} onChange={(v) => set("footerRight", v)} />
      </Section>

      {/* ACTIONS */}
      <div className="sticky bottom-0 -mx-2 flex items-center gap-3 border-t border-sand bg-cream/95 px-2 py-3 backdrop-blur">
        <button
          type="button"
          disabled={saving}
          onClick={() => onSubmit("draft")}
          className="rounded-lg border border-sand bg-white px-5 py-2.5 text-sm font-semibold text-lagoon hover:border-dune disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar borrador"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSubmit("published")}
          className="rounded-lg bg-dune px-5 py-2.5 text-sm font-semibold text-white hover:bg-dune-light disabled:opacity-50"
        >
          {saving ? "Publicando…" : "Publicar"}
        </button>
        {result ? (
          <span className={`text-sm ${result.ok ? "text-forest" : "text-clay"}`}>
            {result.ok ? (
              <>
                {result.msg}{" "}
                <a className="underline" href={`/caminante/experiencias/${result.slug}`} target="_blank" rel="noopener">
                  ver página →
                </a>
              </>
            ) : (
              result.msg
            )}
          </span>
        ) : null}
      </div>
    </div>
  );
}
