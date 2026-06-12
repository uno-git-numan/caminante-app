"use client";

// Implementación React del diseño "Registro y deslinde.html" (Claude Design,
// 11 jun 2026) — pixel-fiel, con la lógica real conectada: slots de la BD,
// prellenado para usuarios con sesión, y firma vía submitRegistration.

import { useMemo, useState } from "react";
import { submitRegistration } from "@/lib/registration/actions";
import type {
  MedicalProfileData,
  MinorEntry,
  RegistrationPrefill,
  SlotOption,
} from "@/lib/registration/types";

const FLABEL = "block text-xs font-semibold uppercase tracking-wider text-olive mb-1.5";
const FINPUT =
  "w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-lagoon placeholder-olive/40 focus:border-dune focus:outline-none focus:ring-2 focus:ring-dune/30 transition";
const FTEXTAREA = `${FINPUT} resize-y min-h-[64px]`;
const CARD = "rounded-2xl border border-sand bg-white p-5";
const NUMBADGE =
  "shrink-0 grid place-items-center w-9 h-9 rounded-full bg-lagoon text-cream text-sm font-semibold";
const EYEBROW = "text-[10px] font-semibold uppercase tracking-[0.25em] text-olive";
const CHECKROW = "flex items-start gap-3 cursor-pointer";
const CHECKBOX = "mt-0.5 h-5 w-5 shrink-0 rounded border-sand accent-dune";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-lagoon px-6 py-3.5 text-sm font-semibold text-cream transition hover:bg-lagoon-light focus:outline-none focus:ring-2 focus:ring-dune focus:ring-offset-2 focus:ring-offset-cream";

const emptyMedical: MedicalProfileData = {
  bloodType: "",
  conditions: "",
  medications: "",
  allergies: "",
  dietaryRestrictions: "",
  fitnessNotes: "",
  emergencyName: "",
  emergencyRelationship: "",
  emergencyPhone: "",
  gender: "",
  curp: "",
  nationality: "",
  governmentId: "",
  occupation: "",
  beneficiaryName: "",
  beneficiaryRelationship: "",
  beneficiaryPhone: "",
};

function timeAgoEs(iso: string | null): string {
  if (!iso) return "";
  const months = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / (30 * 24 * 3600 * 1000)),
  );
  if (months <= 0) return "este mes";
  if (months === 1) return "hace 1 mes";
  if (months < 12) return `hace ${months} meses`;
  const years = Math.round(months / 12);
  return years === 1 ? "hace 1 año" : `hace ${years} años`;
}

function SectionHead({
  num,
  eyebrow,
  title,
}: {
  num: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={NUMBADGE}>{num}</span>
      <div>
        <p className={EYEBROW}>{eyebrow}</p>
        <h2 className="text-lg font-semibold text-lagoon">{title}</h2>
      </div>
    </div>
  );
}

export default function RegistrationForm({
  slug,
  title,
  datesBadge,
  slots,
  waiverClauses,
  waiverDocUrl,
  hasSession,
  sessionEmail,
  prefill,
}: {
  slug: string;
  title: string;
  datesBadge: string;
  slots: SlotOption[];
  waiverClauses: string[];
  waiverDocUrl: string;
  hasSession: boolean;
  sessionEmail: string;
  prefill: RegistrationPrefill | null;
}) {
  const [fullName, setFullName] = useState(prefill?.fullName || "");
  const [birthDate, setBirthDate] = useState(prefill?.birthDate || "");
  const [email, setEmail] = useState(prefill?.email || sessionEmail || "");
  const [phone, setPhone] = useState(prefill?.phone || "");
  const [city, setCity] = useState(prefill?.city || "");
  const [slotId, setSlotId] = useState("");
  const [m, setM] = useState<MedicalProfileData>(prefill?.medical || emptyMedical);
  const [medicalCollapsed, setMedicalCollapsed] = useState(!!prefill?.medical);
  const [minors, setMinors] = useState<MinorEntry[]>([]);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [imageConsent, setImageConsent] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [signatureName, setSignatureName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    waiverVersion: string;
    signedAt: string;
    slotLabel: string;
    stripeLink: string | null;
  } | null>(null);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  const setMed = (k: keyof MedicalProfileData) => (v: string) => setM({ ...m, [k]: v });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (slots.length > 0 && !slotId) {
      setError("Elige tu salida para continuar.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    const selected = slots.find((s) => s.id === slotId);
    const res = await submitRegistration({
      slug,
      fullName,
      birthDate,
      email,
      phone,
      city,
      slotId: slotId || null,
      slotLabel: selected?.label || datesBadge,
      medical: m,
      minors,
      waiverAccepted,
      privacyConsent,
      imageConsent,
      newsletterOptIn,
      signatureName,
    });
    setSubmitting(false);
    if (res.ok) {
      setSuccess({
        waiverVersion: res.waiverVersion,
        signedAt: res.signedAt,
        slotLabel: res.slotLabel,
        stripeLink: res.stripeLink,
      });
      window.scrollTo({ top: 0 });
    } else {
      setError(res.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ── PANTALLA DE ÉXITO ─────────────────────────────────────────────
  if (success) {
    const signedDate = new Date(success.signedAt).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-4 py-16 text-center sm:px-6">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-forest text-cream">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-lagoon sm:text-4xl">
          Estás dentro, caminante
        </h1>
        <p className="mt-3 text-sm text-olive">
          {title} · {success.slotLabel} · Deslinde {success.waiverVersion} firmado el{" "}
          {signedDate}
        </p>

        {success.stripeLink ? (
          <div className="mt-8 w-full rounded-2xl border border-sand bg-white p-5 text-left">
            <p className={EYEBROW}>Aparta tu lugar</p>
            <p className="mt-2 text-sm text-olive">
              Tu registro queda confirmado al completar el anticipo de la expedición.
            </p>
            <a
              href={success.stripeLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BTN_PRIMARY} mt-4 w-full`}
            >
              Aparta tu lugar →
            </a>
          </div>
        ) : (
          <div className="mt-8 w-full rounded-2xl border border-sand bg-white p-5 text-left">
            <p className={EYEBROW}>Siguiente paso</p>
            <p className="mt-2 text-sm text-olive">
              Te contactamos por WhatsApp para confirmar tu anticipo y los detalles de la
              expedición.
            </p>
          </div>
        )}

        {hasSession ? (
          <a
            href="/caminante/perfil"
            className="mt-5 rounded-full border border-sand bg-transparent px-5 py-3 text-sm font-semibold text-lagoon transition hover:border-dune hover:text-dune"
          >
            Ver mi perfil
          </a>
        ) : (
          <a
            href="/caminante/login?next=%2Fcaminante%2Fbienvenida"
            className="mt-5 rounded-full border border-sand bg-transparent px-5 py-3 text-sm font-semibold text-lagoon transition hover:border-dune hover:text-dune"
          >
            Crear mi cuenta para la próxima
          </a>
        )}
      </div>
    );
  }

  // ── FORMULARIO ────────────────────────────────────────────────────
  return (
    <main className="mx-auto w-full max-w-[720px] px-4 py-8 sm:px-6 sm:py-12">
      <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
        {/* 1 · ENCABEZADO */}
        <header className="flex flex-col gap-3">
          <span className={EYEBROW}>Registro y deslinde</span>
          <h1 className="text-3xl font-semibold leading-[1.05] tracking-tight text-lagoon sm:text-4xl">
            {title}
          </h1>
          {datesBadge ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-sand bg-white px-3.5 py-1.5 text-xs font-semibold text-lagoon">
                <span className="h-1.5 w-1.5 rounded-full bg-dune"></span>
                {datesBadge}
              </span>
            </div>
          ) : null}
        </header>

        {/* BANNER DE ERROR GLOBAL */}
        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-clay bg-clay/[0.08] p-4">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-clay" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-clay">Revisa tu registro</p>
              <p className="text-sm text-olive">{error}</p>
            </div>
          </div>
        ) : null}

        {/* 2 · BANNER anónimo / reconocido */}
        {hasSession && prefill ? (
          <div className="flex items-center gap-3 rounded-2xl border border-forest/30 bg-forest/[0.06] p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest text-sm font-semibold text-cream">
              {(prefill.fullName || sessionEmail || "C").charAt(0).toUpperCase()}
            </span>
            <p className="text-sm text-olive">
              Hola{" "}
              <span className="font-semibold text-lagoon">
                {prefill.fullName?.split(" ")[0] || "caminante"}
              </span>{" "}
              — prellenamos tu expediente. <span className="text-lagoon">Confírmalo y firma.</span>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl border border-sand bg-[#EFE7D8] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-olive">
              ¿Ya viviste una experiencia Caminante?{" "}
              <span className="font-semibold text-lagoon">
                Inicia sesión y tus datos aparecen solos.
              </span>
            </p>
            <a
              href={`/caminante/login?next=${encodeURIComponent(`/caminante/registro/${slug}`)}`}
              className="shrink-0 text-xs font-semibold uppercase tracking-wider text-dune underline-offset-4 hover:underline"
            >
              Iniciar sesión →
            </a>
          </div>
        )}

        {/* SECCIÓN 1 · QUIÉN ERES */}
        <section className={`${CARD} flex flex-col gap-5`}>
          <SectionHead num="1" eyebrow="Sección uno" title="Quién eres" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={FLABEL} htmlFor="nombre">Nombre completo</label>
              <input className={FINPUT} id="nombre" type="text" placeholder="Como aparece en tu identificación" autoComplete="name" aria-required="true" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className={FLABEL} htmlFor="nacimiento">Fecha de nacimiento</label>
              <input className={FINPUT} id="nacimiento" type="date" aria-required="true" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div>
              <label className={FLABEL} htmlFor="ciudad">Ciudad</label>
              <input className={FINPUT} id="ciudad" type="text" placeholder="Ciudad de México" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label className={FLABEL} htmlFor="correo">Correo</label>
              <input className={FINPUT} id="correo" type="email" placeholder="tu@correo.com" autoComplete="email" aria-required="true" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className={FLABEL} htmlFor="whatsapp">WhatsApp</label>
              <input className={FINPUT} id="whatsapp" type="tel" placeholder="+52 55 0000 0000" autoComplete="tel" aria-required="true" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
        </section>

        {/* SECCIÓN 2 · TU SALIDA */}
        {slots.length > 0 ? (
          <section className={`${CARD} flex flex-col gap-5`}>
            <SectionHead num="2" eyebrow="Sección dos" title="Tu salida" />
            <div>
              <label className={FLABEL} htmlFor="fechas">Elige tus fechas</label>
              <select
                className={`${FINPUT} appearance-none pr-9`}
                id="fechas"
                aria-required="true"
                value={slotId}
                onChange={(e) => setSlotId(e.target.value)}
                style={{
                  backgroundImage:
                    "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%235F5F40%22 stroke-width=%222%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M19 9l-7 7-7-7%22/></svg>')",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "1.1em",
                }}
              >
                <option value="" disabled>Selecciona una salida</option>
                {slots.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.seatsAvailable <= 0}>
                    {s.label} ·{" "}
                    {s.seatsAvailable <= 0
                      ? "Agotado"
                      : `${s.seatsAvailable} ${s.seatsAvailable === 1 ? "lugar disponible" : "lugares disponibles"}`}
                  </option>
                ))}
              </select>
            </div>
          </section>
        ) : null}

        {/* SECCIÓN 3 · PERFIL DE SEGURIDAD */}
        <section className={`${CARD} flex flex-col gap-5`}>
          <div className="flex items-start justify-between gap-3">
            <SectionHead num="3" eyebrow="Sección tres" title="Perfil de seguridad" />
            <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-forest/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-forest">
              🔒 Confidencial
            </span>
          </div>
          <p className="-mt-1 text-sm text-olive">
            Solo lo ve el equipo de guías para cuidarte en campo, nunca se comparte.
          </p>

          {medicalCollapsed ? (
            <div className="rounded-xl border border-sand bg-cream p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-semibold text-lagoon">
                    Tu perfil de seguridad ya está guardado
                  </p>
                  <p className="text-xs leading-relaxed text-olive">
                    {[
                      m.bloodType,
                      m.fitnessNotes,
                      m.conditions || "Sin padecimientos",
                      m.medications || "Sin medicamentos",
                      m.allergies || "Sin alergias",
                      m.dietaryRestrictions || "Sin restricciones alimentarias",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {prefill?.medicalUpdatedAt ? (
                    <p className="text-[11px] uppercase tracking-wider text-olive/70">
                      Última actualización: {timeAgoEs(prefill.medicalUpdatedAt)}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setMedicalCollapsed(false)}
                  className="shrink-0 rounded-full border border-sand bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-lagoon transition hover:border-dune hover:text-dune"
                >
                  Editar
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={FLABEL} htmlFor="sangre">Tipo de sangre</label>
                <input className={FINPUT} id="sangre" type="text" placeholder="O+, A−, …" value={m.bloodType} onChange={(e) => setMed("bloodType")(e.target.value)} />
              </div>
              <div>
                <label className={FLABEL} htmlFor="condicion">Nivel de nado / condición física</label>
                <input className={FINPUT} id="condicion" type="text" placeholder="Nado intermedio, corro 5k…" value={m.fitnessNotes} onChange={(e) => setMed("fitnessNotes")(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={FLABEL} htmlFor="padecimientos">Padecimientos actuales</label>
                <textarea className={FTEXTAREA} id="padecimientos" placeholder="Asma, hipertensión, cirugías recientes…" value={m.conditions} onChange={(e) => setMed("conditions")(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={FLABEL} htmlFor="medicamentos">Medicamentos de uso periódico</label>
                <textarea className={FTEXTAREA} id="medicamentos" placeholder="Nombre, dosis y frecuencia" value={m.medications} onChange={(e) => setMed("medications")(e.target.value)} />
              </div>
              <div>
                <label className={FLABEL} htmlFor="alergias">Alergias</label>
                <textarea className={FTEXTAREA} id="alergias" placeholder="Medicamentos, picaduras, alimentos…" value={m.allergies} onChange={(e) => setMed("allergies")(e.target.value)} />
              </div>
              <div>
                <label className={FLABEL} htmlFor="restricciones">Restricciones alimentarias</label>
                <textarea className={FTEXTAREA} id="restricciones" placeholder="Vegetariana, sin gluten…" value={m.dietaryRestrictions} onChange={(e) => setMed("dietaryRestrictions")(e.target.value)} />
              </div>
            </div>
          )}
        </section>

        {/* SECCIÓN 4 · CONTACTO DE EMERGENCIA */}
        <section className={`${CARD} flex flex-col gap-5`}>
          <SectionHead num="4" eyebrow="Sección cuatro" title="Contacto de emergencia" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={FLABEL} htmlFor="ec-nombre">Nombre</label>
              <input className={FINPUT} id="ec-nombre" type="text" placeholder="Nombre completo" aria-required="true" value={m.emergencyName} onChange={(e) => setMed("emergencyName")(e.target.value)} />
            </div>
            <div>
              <label className={FLABEL} htmlFor="ec-parentesco">Parentesco</label>
              <input className={FINPUT} id="ec-parentesco" type="text" placeholder="Madre, pareja…" aria-required="true" value={m.emergencyRelationship} onChange={(e) => setMed("emergencyRelationship")(e.target.value)} />
            </div>
            <div>
              <label className={FLABEL} htmlFor="ec-telefono">Teléfono</label>
              <input className={FINPUT} id="ec-telefono" type="tel" placeholder="+52 55 0000 0000" aria-required="true" value={m.emergencyPhone} onChange={(e) => setMed("emergencyPhone")(e.target.value)} />
            </div>
          </div>
        </section>

        {/* SECCIÓN 5 · MENORES */}
        <section className={`${CARD} flex flex-col gap-5`}>
          <SectionHead num="5" eyebrow="Sección cinco · Opcional" title="Menores bajo tu tutela" />
          <div className="flex flex-col gap-3">
            {minors.map((minor, i) => (
              <div key={i} className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_88px_1fr_40px]">
                <div>
                  <label className={FLABEL} htmlFor={`menor-nombre-${i}`}>Nombre</label>
                  <input className={FINPUT} id={`menor-nombre-${i}`} type="text" placeholder="Nombre del menor" value={minor.name} onChange={(e) => setMinors(minors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                </div>
                <div>
                  <label className={FLABEL} htmlFor={`menor-edad-${i}`}>Edad</label>
                  <input className={FINPUT} id={`menor-edad-${i}`} type="number" min={0} max={17} placeholder="12" value={minor.age} onChange={(e) => setMinors(minors.map((x, j) => (j === i ? { ...x, age: e.target.value } : x)))} />
                </div>
                <div>
                  <label className={FLABEL} htmlFor={`menor-parentesco-${i}`}>Parentesco</label>
                  <input className={FINPUT} id={`menor-parentesco-${i}`} type="text" placeholder="Hijo, sobrina…" value={minor.relationship} onChange={(e) => setMinors(minors.map((x, j) => (j === i ? { ...x, relationship: e.target.value } : x)))} />
                </div>
                <button
                  type="button"
                  aria-label="Quitar menor"
                  onClick={() => setMinors(minors.filter((_, j) => j !== i))}
                  className="self-end rounded-lg border border-sand px-3 py-2 text-sm text-olive transition hover:border-clay hover:text-clay"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setMinors([...minors, { name: "", age: "", relationship: "" }])}
            className="self-start rounded-full border border-dashed border-sand px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-olive transition hover:border-dune hover:text-dune"
          >
            + Agregar menor
          </button>
        </section>

        {/* SECCIÓN 5b · PARA TU SEGURO */}
        <details className={`${CARD} group [&_summary::-webkit-details-marker]:hidden`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={NUMBADGE}>5b</span>
              <div>
                <p className={EYEBROW}>Opcional</p>
                <h2 className="text-lg font-semibold text-lagoon">Para tu seguro</h2>
              </div>
            </div>
            <svg className="h-5 w-5 shrink-0 text-olive transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="mt-5 flex flex-col gap-5 border-t border-sand pt-5">
            <p className="text-sm text-olive">
              Estos datos sirven para asegurarte en la expedición; el beneficiario es a quien
              protege tu seguro de accidentes.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={FLABEL} htmlFor="seg-sexo">Sexo</label>
                <input className={FINPUT} id="seg-sexo" type="text" placeholder="Como aparece en tu identificación" value={m.gender} onChange={(e) => setMed("gender")(e.target.value)} />
              </div>
              <div>
                <label className={FLABEL} htmlFor="seg-nacionalidad">Nacionalidad</label>
                <input className={FINPUT} id="seg-nacionalidad" type="text" placeholder="Mexicana" value={m.nationality} onChange={(e) => setMed("nationality")(e.target.value)} />
              </div>
              <div>
                <label className={FLABEL} htmlFor="seg-curp">CURP</label>
                <input className={FINPUT} id="seg-curp" type="text" placeholder="18 caracteres" value={m.curp} onChange={(e) => setMed("curp")(e.target.value)} />
              </div>
              <div>
                <label className={FLABEL} htmlFor="seg-doc">Pasaporte / INE</label>
                <input className={FINPUT} id="seg-doc" type="text" placeholder="Número de documento" value={m.governmentId} onChange={(e) => setMed("governmentId")(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={FLABEL} htmlFor="seg-ocupacion">Ocupación</label>
                <input className={FINPUT} id="seg-ocupacion" type="text" placeholder="A qué te dedicas" value={m.occupation} onChange={(e) => setMed("occupation")(e.target.value)} />
              </div>
            </div>
            <div className="rounded-xl border border-sand bg-cream p-4">
              <p className={FLABEL}>Beneficiario</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={FLABEL} htmlFor="ben-nombre">Nombre</label>
                  <input className={`${FINPUT}`} id="ben-nombre" type="text" placeholder="Nombre completo" value={m.beneficiaryName} onChange={(e) => setMed("beneficiaryName")(e.target.value)} />
                </div>
                <div>
                  <label className={FLABEL} htmlFor="ben-parentesco">Parentesco</label>
                  <input className={`${FINPUT}`} id="ben-parentesco" type="text" placeholder="Pareja, madre…" value={m.beneficiaryRelationship} onChange={(e) => setMed("beneficiaryRelationship")(e.target.value)} />
                </div>
                <div>
                  <label className={FLABEL} htmlFor="ben-telefono">Teléfono</label>
                  <input className={`${FINPUT}`} id="ben-telefono" type="tel" placeholder="+52 55 0000 0000" value={m.beneficiaryPhone} onChange={(e) => setMed("beneficiaryPhone")(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* SECCIÓN 6 · LA CARTA DE RESPONSABILIDAD */}
        <section className={`${CARD} flex flex-col gap-5`}>
          <SectionHead num="6" eyebrow="Sección seis" title="La Carta de Responsabilidad" />
          <p className="text-sm text-olive">
            La naturaleza es real y la expedición tiene riesgos reales. Esto es lo que aceptas
            al firmar:
          </p>
          <ul className="flex flex-col gap-3">
            {waiverClauses.map((clause, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-lagoon">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-dune"></span>
                {clause}
              </li>
            ))}
          </ul>
          {waiverDocUrl ? (
            <a
              href={waiverDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-dune underline-offset-4 hover:underline"
            >
              Leer el documento completo →
            </a>
          ) : null}
          <label className={`${CHECKROW} rounded-xl border border-sand bg-cream p-4`}>
            <input className={CHECKBOX} type="checkbox" aria-required="true" checked={waiverAccepted} onChange={(e) => setWaiverAccepted(e.target.checked)} />
            <span className="text-sm leading-relaxed text-lagoon">
              He leído y acepto íntegramente la{" "}
              <span className="font-semibold">
                Carta de Responsabilidad Compartida y Deslinde de Responsabilidad
              </span>
              .
            </span>
          </label>
        </section>

        {/* SECCIÓN 7 · TU FIRMA */}
        <section className="rounded-2xl border-2 border-dune bg-cream p-6">
          <SectionHead num="7" eyebrow="Sección siete" title="Tu firma" />
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className={FLABEL} htmlFor="firma">Escribe tu nombre completo como firma</label>
              <input
                className="w-full rounded-lg border border-dune bg-white px-4 py-3 text-xl italic text-lagoon placeholder-olive/40 focus:outline-none focus:ring-2 focus:ring-dune/40 transition"
                id="firma"
                type="text"
                placeholder="Tu nombre completo"
                aria-required="true"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
              />
            </div>
            <div className="shrink-0">
              <p className={FLABEL}>Fecha</p>
              <div className="rounded-lg border border-sand bg-white px-4 py-3 text-sm font-semibold text-lagoon">
                {today}
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-olive">
            Tu nombre tecleado junto con la fecha constituye tu aceptación electrónica del
            documento.
          </p>
        </section>

        {/* SECCIÓN 8 · CONSENTIMIENTOS */}
        <section className={`${CARD} flex flex-col gap-5`}>
          <SectionHead num="8" eyebrow="Sección ocho" title="Consentimientos" />
          <div className="flex flex-col gap-3">
            <label className={CHECKROW}>
              <input className={CHECKBOX} type="checkbox" checked={imageConsent} onChange={(e) => setImageConsent(e.target.checked)} />
              <span className="text-sm leading-relaxed text-lagoon">
                Autorizo el uso de mi imagen en redes y materiales de Caminante.
                <span className="block text-xs text-olive">Opcional</span>
              </span>
            </label>
            <label className={CHECKROW}>
              <input className={CHECKBOX} type="checkbox" aria-required="true" checked={privacyConsent} onChange={(e) => setPrivacyConsent(e.target.checked)} />
              <span className="text-sm leading-relaxed text-lagoon">
                He leído y acepto el{" "}
                {waiverDocUrl ? (
                  <a href={waiverDocUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-dune underline underline-offset-4">
                    Aviso de Privacidad
                  </a>
                ) : (
                  <span className="font-semibold">Aviso de Privacidad</span>
                )}
                .<span className="block text-xs text-olive">Obligatorio</span>
              </span>
            </label>
            <label className={CHECKROW}>
              <input className={CHECKBOX} type="checkbox" checked={newsletterOptIn} onChange={(e) => setNewsletterOptIn(e.target.checked)} />
              <span className="text-sm leading-relaxed text-lagoon">
                Quiero recibir noticias y futuras experiencias.
                <span className="block text-xs text-olive">Opcional</span>
              </span>
            </label>
          </div>
        </section>

        {/* CTA FINAL */}
        <div className="flex flex-col items-center gap-3 pt-1">
          <button type="submit" disabled={submitting} className={`${BTN_PRIMARY} w-full py-4 text-base ${submitting ? "cursor-not-allowed opacity-60" : ""}`}>
            {submitting ? (
              <>
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4z"></path>
                </svg>
                Enviando…
              </>
            ) : (
              "Firmar y registrarme"
            )}
          </button>
          <p className="text-center text-xs leading-relaxed text-olive">
            Tus datos se tratan conforme al Aviso de Privacidad de Caminante. La información
            médica solo la ve el equipo de guías y nunca se comparte.
          </p>
        </div>
      </form>
    </main>
  );
}
