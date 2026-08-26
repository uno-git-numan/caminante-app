"use client";

// Vista MÓVIL de /caminante/registro/[slug] — transcripción de `PubDeslinde`
// (design/publico-movil/pub-b.jsx:80) contra el registro real.
//
// La ruta YA tiene escritorio (RegistrationForm): `page.tsx` renderiza los DOS
// marcados y el CSS decide cuál se ve (corte en 700px). Aquí solo vive el móvil.
//
// ⚠️ ES LA PANTALLA DONDE EL MOCKUP CONTRADICE AL SISTEMA. El entregable
// escribe UNA cláusula genérica («…libero a NUMAN HUB S.A. de C.V. …») y NO
// enlaza el documento. Eso rompe `deslindeListo` (src/lib/experiences/
// flujo-venta.ts), la regla que bloquea publicar y cobrar y que nació del caso
// Enyd: **quien firma SIEMPRE debe poder leer el documento**, y las cláusulas
// son POR EXPERIENCIA. Luis aprobó (11 ago) agregar lo que falta en el mismo
// lenguaje visual del diseño (`.pub-fld`, `.pub-acts`, `.pub-cta`).
//
// Lo que se agregó sobre el mockup, todo porque `submitRegistration` ya lo
// captura y sin ello la firma valdría menos que la del escritorio:
//   · las cláusulas REALES (`Experience.registration.waiverClauses`) y el link
//     a `waiverDocUrl` (el documento legible vive en /caminante/deslinde/[slug]);
//   · identidad completa (nombre, nacimiento, ciudad, correo, WhatsApp) — el
//     server rebota sin ellos;
//   · la salida: fija si llega con `?reserva=` (`fetchReservationLock`), y si no
//     el selector de salidas abiertas;
//   · perfil médico completo y contacto de emergencia (el mockup pedía dos
//     inputs sueltos: «alergias» y «nombre · teléfono» en un solo campo);
//   · «Participantes (opcional)» con perfil reutilizable (0017: `dependents` +
//     `registrations.participants`) en vez de una lista de nombres sueltos —
//     el titular firma UN deslinde por el grupo y capturarlos NUNCA bloquea;
//   · los consentimientos que el snapshot legal congela: privacidad
//     (obligatorio), imagen y boletín (opcionales), y la firma con el nombre.
//
// El orden sí cambia respecto al mockup (allí el deslinde va primero y apaga el
// resto hasta aceptarlo): aquí se sigue el orden del formulario vivo — datos →
// médico → emergencia → participantes → deslinde → firma — porque con el
// prellenado de `fetchPrefillForUser` la mitad del expediente ya viene lleno y
// firmar antes de revisarlo sería firmar a ciegas.
//
// La lógica de guardado NO se toca: se llama al MISMO `submitRegistration`
// (`registrations` es APPEND-ONLY por trigger).

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { NavCream } from "@/app/caminante/ui/pub/atoms";
import { submitRegistration } from "@/lib/registration/actions";
import { trackPixel } from "@/lib/meta/pixel";
import type {
  DependentOption,
  MedicalProfileData,
  MinorEntry,
  RegistrationPrefill,
  SlotOption,
} from "@/lib/registration/types";
import type { Clausula } from "@/lib/legal/clausulas";

type ParticipantRow = {
  dependentId?: string;
  fullName: string;
  birthDate: string;
  relationship: string;
  bloodType: string;
  fitnessNotes: string;
  conditions: string;
  allergies: string;
  dietaryRestrictions: string;
  emergencyName: string;
  emergencyPhone: string;
};

const emptyParticipant: ParticipantRow = {
  fullName: "",
  birthDate: "",
  relationship: "",
  bloodType: "",
  fitnessNotes: "",
  conditions: "",
  allergies: "",
  dietaryRestrictions: "",
  emergencyName: "",
  emergencyPhone: "",
};

function participantFromDependent(d: DependentOption): ParticipantRow {
  return {
    dependentId: d.id,
    fullName: d.fullName,
    birthDate: d.birthDate,
    relationship: d.relationship,
    bloodType: d.bloodType,
    fitnessNotes: d.fitnessNotes,
    conditions: d.conditions,
    allergies: d.allergies,
    dietaryRestrictions: d.dietaryRestrictions,
    emergencyName: d.emergencyName,
    emergencyPhone: d.emergencyPhone,
  };
}

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
  address: "",
  occupation: "",
  beneficiaryName: "",
  beneficiaryRelationship: "",
  beneficiaryPhone: "",
};

/** Casilla del diseño: cuadro grande, texto a 15px, nota opcional debajo. */
function Casilla({
  checked,
  onChange,
  children,
  nota,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  nota?: string;
}) {
  return (
    <label
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        marginTop: 14,
        fontSize: 15,
        lineHeight: 1.45,
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        style={{ width: 22, height: 22, accentColor: "var(--olive)", marginTop: 1, flex: "0 0 auto" }}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        {children}
        {nota ? (
          <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>
            {nota}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export default function DeslindeMovil({
  slug,
  title,
  datesBadge,
  slots,
  waiverClauses,
  conSeguro,
  waiverDocUrl,
  hasSession,
  sessionEmail,
  prefill,
  reservationId,
  lockedSlot,
}: {
  slug: string;
  title: string;
  datesBadge: string;
  slots: SlotOption[];
  waiverClauses: Clausula[];
  conSeguro: boolean;
  waiverDocUrl: string;
  hasSession: boolean;
  sessionEmail: string;
  prefill: RegistrationPrefill | null;
  reservationId?: string;
  lockedSlot?: { slotId: string; slotLabel: string } | null;
}) {
  const [fullName, setFullName] = useState(prefill?.fullName || "");
  const [birthDate, setBirthDate] = useState(prefill?.birthDate || "");
  const [email, setEmail] = useState(prefill?.email || sessionEmail || "");
  const [phone, setPhone] = useState(prefill?.phone || "");
  const [city, setCity] = useState(prefill?.city || "");
  const [slotId, setSlotId] = useState(lockedSlot?.slotId || "");
  const [m, setM] = useState<MedicalProfileData>(prefill?.medical || emptyMedical);
  const savedDependents = prefill?.dependents || [];
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
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
  } | null>(null);
  const arriba = useRef<HTMLSpanElement>(null);

  const hoy = useMemo(
    () => new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }),
    [],
  );

  const setMed = (k: keyof MedicalProfileData) => (v: string) => setM({ ...m, [k]: v });

  // El scroll vive en `.pub-scroll` (el contenedor del shell), no en la ventana.
  const alTope = () => {
    const cont = arriba.current?.closest(".pub-scroll");
    if (cont) cont.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!lockedSlot && slots.length > 0 && !slotId) {
      setError("Elige tu salida para continuar.");
      alTope();
      return;
    }
    setSubmitting(true);
    const selected = slots.find((s) => s.id === slotId);
    const cleanParticipants = participants.filter((p) => p.fullName.trim());
    // El titular firma por todo el grupo: los participantes quedan también en el
    // rastro legal `minors` (nombre/parentesco) además de guardarse como perfiles.
    const derivedMinors: MinorEntry[] = cleanParticipants.map((p) => ({
      name: p.fullName.trim(),
      age: "",
      relationship: p.relationship.trim(),
    }));
    const res = await submitRegistration({
      slug,
      fullName,
      birthDate,
      email,
      phone,
      city,
      slotId: slotId || null,
      slotLabel: lockedSlot?.slotLabel || selected?.label || datesBadge,
      medical: m,
      minors: derivedMinors,
      participants: cleanParticipants,
      reservationId,
      waiverAccepted,
      privacyConsent,
      imageConsent,
      newsletterOptIn,
      signatureName,
    });
    setSubmitting(false);
    if (res.ok) {
      trackPixel("CompleteRegistration", {
        content_ids: [slug],
        content_type: "product",
        num_items: 1 + cleanParticipants.length,
        status: "signed",
      });
      setSuccess({
        waiverVersion: res.waiverVersion,
        signedAt: res.signedAt,
        slotLabel: res.slotLabel,
      });
      alTope();
    } else {
      setError(res.error);
      alTope();
    }
  }

  // ── PANTALLA DE ÉXITO ───────────────────────────────────────────────
  if (success) {
    const firmadoEl = new Date(success.signedAt).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return (
      <div className="pub-screen" style={{ background: "var(--panel)", minHeight: "100%" }}>
        <span ref={arriba} hidden />
        <div className="pub-headpad"></div>
        <div className="pub-state" style={{ paddingTop: 30 }}>
          <span className="ic" style={{ background: "var(--forest)", color: "#fff", fontSize: 22 }}>
            ✓
          </span>
          <h3 style={{ fontSize: 22, fontWeight: 250, letterSpacing: "-.01em" }}>
            Estás dentro, caminante.
          </h3>
          <p>
            <b style={{ color: "var(--charcoal)" }}>
              {title}
              {success.slotLabel ? ` · ${success.slotLabel}` : ""}
            </b>
            <br />
            Deslinde {success.waiverVersion} firmado el {firmadoEl}. Tu expediente quedó guardado.
          </p>
        </div>
        <div style={{ padding: "0 20px" }}>
          <Link
            className="pub-cta pub-cta-orange"
            href={hasSession ? "/caminante/perfil" : "/caminante/login?next=%2Fcaminante%2Fbienvenida"}
          >
            {hasSession ? "Ver Mi espacio" : "Crear mi cuenta"}
          </Link>
        </div>
      </div>
    );
  }

  // ── FORMULARIO ──────────────────────────────────────────────────────
  return (
    <div className="pub-screen" style={{ background: "var(--panel)", minHeight: "100%" }}>
      <span ref={arriba} hidden />
      <NavCream t="Registro y deslinde" s={title} backHref={`/caminante/experiencias/${slug}`} />

      <form style={{ padding: "14px 20px 30px" }} noValidate onSubmit={onSubmit}>
        {error ? (
          <div
            className="pub-blk"
            style={{ borderColor: "rgba(255,93,54,.4)", borderWidth: 1.5, marginBottom: 14 }}
          >
            <span className="pub-lbl" style={{ color: "var(--orange)" }}>
              Revisa tu registro
            </span>
            <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>{error}</p>
          </div>
        ) : null}

        {hasSession && prefill ? (
          <div className="pub-blk" style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
              Hola <b style={{ color: "var(--olive)" }}>{prefill.fullName?.split(" ")[0] || "caminante"}</b> —
              prellenamos tu expediente. Confírmalo y firma.
            </p>
          </div>
        ) : null}

        {/* 1 · TUS DATOS + SALIDA */}
        <div className="pub-blk">
          <span className="pub-lbl">1 · Tus datos</span>
          <div className="pub-fld">
            <label htmlFor="d-nombre">Nombre completo</label>
            <input
              id="d-nombre"
              type="text"
              autoComplete="name"
              placeholder="Como aparece en tu identificación"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="pub-fld">
            <label htmlFor="d-nacimiento">Fecha de nacimiento</label>
            <input
              id="d-nacimiento"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="pub-fld">
            <label htmlFor="d-ciudad">Ciudad</label>
            <input
              id="d-ciudad"
              type="text"
              autoComplete="address-level2"
              placeholder="Ciudad de México"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="pub-fld">
            <label htmlFor="d-correo">Correo</label>
            <input
              id="d-correo"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.mx"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="pub-fld">
            <label htmlFor="d-whatsapp">WhatsApp</label>
            <input
              id="d-whatsapp"
              type="tel"
              autoComplete="tel"
              placeholder="+52 55 0000 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {lockedSlot ? (
            // La fecha ya se eligió al reservar: no se vuelve a preguntar.
            <div className="pub-fld">
              <label>Tu salida</label>
              <div className="pub-sel on" style={{ cursor: "default" }}>
                <span className="rd">
                  <i></i>
                </span>
                <div className="g">
                  <b>{lockedSlot.slotLabel || datesBadge}</b>
                  <small>Elegida al reservar</small>
                </div>
              </div>
            </div>
          ) : slots.length > 0 ? (
            <div style={{ paddingTop: 10 }}>
              <span className="pub-lbl">Elige tu salida</span>
              {slots.map((s) => {
                const sinTope = s.seatsAvailable === null;
                const llena = !sinTope && (s.seatsAvailable as number) <= 0;
                const disp = sinTope
                  ? "lugares disponibles"
                  : llena
                    ? "agotada"
                    : `${s.seatsAvailable} ${s.seatsAvailable === 1 ? "lugar" : "lugares"}`;
                return (
                  <button
                    type="button"
                    key={s.id}
                    className={"pub-sel" + (slotId === s.id ? " on" : "")}
                    disabled={llena}
                    onClick={() => setSlotId(s.id)}
                  >
                    <span className="rd">{slotId === s.id ? <i></i> : null}</span>
                    <div className="g">
                      <b>{s.label}</b>
                      <small>{disp}</small>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* 2 · PERFIL MÉDICO */}
        <div className="pub-blk">
          <span className="pub-lbl">2 · Perfil médico</span>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            Solo lo ve el equipo de guías para cuidarte en campo; nunca se comparte.
          </p>
          <div className="pub-fld">
            <label htmlFor="d-sangre">Tipo de sangre</label>
            <input
              id="d-sangre"
              type="text"
              placeholder="O+, A−, …"
              value={m.bloodType}
              onChange={(e) => setMed("bloodType")(e.target.value)}
            />
          </div>
          <div className="pub-fld">
            <label htmlFor="d-condicion">Nivel de nado / condición física</label>
            <input
              id="d-condicion"
              type="text"
              placeholder="Nado intermedio, corro 5k…"
              value={m.fitnessNotes}
              onChange={(e) => setMed("fitnessNotes")(e.target.value)}
            />
          </div>
          <div className="pub-fld">
            <label htmlFor="d-padecimientos">Padecimientos actuales</label>
            <textarea
              id="d-padecimientos"
              placeholder="Si no aplica, escribe “Ninguno”."
              value={m.conditions}
              onChange={(e) => setMed("conditions")(e.target.value)}
            />
          </div>
          <div className="pub-fld">
            <label htmlFor="d-medicamentos">Medicamentos de uso periódico</label>
            <textarea
              id="d-medicamentos"
              placeholder="Nombre y dosis. Si no aplica, “Ninguno”."
              value={m.medications}
              onChange={(e) => setMed("medications")(e.target.value)}
            />
          </div>
          <div className="pub-fld">
            <label htmlFor="d-alergias">Alergias</label>
            <textarea
              id="d-alergias"
              placeholder="Alimentos, medicamentos, picaduras… Si no aplica, “Ninguna”."
              value={m.allergies}
              onChange={(e) => setMed("allergies")(e.target.value)}
            />
          </div>
          <div className="pub-fld">
            <label htmlFor="d-dieta">Restricciones alimentarias</label>
            <textarea
              id="d-dieta"
              placeholder="Vegetariana, vegana, sin gluten… Si no aplica, “Ninguna”."
              value={m.dietaryRestrictions}
              onChange={(e) => setMed("dietaryRestrictions")(e.target.value)}
            />
          </div>
        </div>

        {/* 3 · CONTACTO DE EMERGENCIA */}
        <div className="pub-blk">
          <span className="pub-lbl">3 · Contacto de emergencia</span>
          <div className="pub-fld">
            <label htmlFor="d-em-nombre">Nombre</label>
            <input
              id="d-em-nombre"
              type="text"
              placeholder="Nombre completo"
              value={m.emergencyName}
              onChange={(e) => setMed("emergencyName")(e.target.value)}
            />
          </div>
          <div className="pub-fld">
            <label htmlFor="d-em-parentesco">Parentesco</label>
            <input
              id="d-em-parentesco"
              type="text"
              placeholder="Madre, pareja…"
              value={m.emergencyRelationship}
              onChange={(e) => setMed("emergencyRelationship")(e.target.value)}
            />
          </div>
          <div className="pub-fld">
            <label htmlFor="d-em-telefono">Teléfono</label>
            <input
              id="d-em-telefono"
              type="tel"
              placeholder="+52 55 0000 0000"
              value={m.emergencyPhone}
              onChange={(e) => setMed("emergencyPhone")(e.target.value)}
            />
          </div>
        </div>

        {/* 4 · PARTICIPANTES (OPCIONAL) */}
        <div className="pub-blk">
          <span className="pub-lbl">4 · Participantes (opcional)</span>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            ¿Reservaste para más personas? Agrega su perfil aquí: es opcional, queda guardado para
            tus próximas reservas y tú firmas el deslinde por todo el grupo.
          </p>

          {savedDependents.length > 0 ? (
            <div className="pub-glos" style={{ marginTop: 12 }}>
              {savedDependents.map((d) => {
                const puesto = participants.some((p) => p.dependentId === d.id);
                return (
                  <button
                    type="button"
                    key={d.id}
                    disabled={puesto}
                    style={{ opacity: puesto ? 0.42 : 1 }}
                    onClick={() => setParticipants([...participants, participantFromDependent(d)])}
                  >
                    <span>+ {d.fullName}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {participants.map((p, i) => {
            const setP = (key: keyof ParticipantRow) => (v: string) =>
              setParticipants(participants.map((x, j) => (j === i ? { ...x, [key]: v } : x)));
            return (
              <div
                key={i}
                style={{
                  border: "1px dashed var(--sand)",
                  borderRadius: 16,
                  padding: "8px 14px 14px",
                  marginTop: 14,
                }}
              >
                <div className="pub-fld">
                  <label>Nombre</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={p.fullName}
                    onChange={(e) => setP("fullName")(e.target.value)}
                  />
                </div>
                <div className="pub-fld">
                  <label>Fecha de nacimiento</label>
                  <input
                    type="date"
                    value={p.birthDate}
                    onChange={(e) => setP("birthDate")(e.target.value)}
                  />
                </div>
                <div className="pub-fld">
                  <label>Parentesco</label>
                  <input
                    type="text"
                    placeholder="Hijo, hija, sobrina…"
                    value={p.relationship}
                    onChange={(e) => setP("relationship")(e.target.value)}
                  />
                </div>
                <div className="pub-faq" style={{ marginTop: 4 }}>
                  <details>
                    <summary>
                      Datos de seguridad (opcional)
                      <span className="x">+</span>
                    </summary>
                    <div className="a">
                    <div className="pub-fld">
                      <label>Tipo de sangre</label>
                      <input
                        type="text"
                        placeholder="O+, A−…"
                        value={p.bloodType}
                        onChange={(e) => setP("bloodType")(e.target.value)}
                      />
                    </div>
                    <div className="pub-fld">
                      <label>Nivel físico / nado</label>
                      <input
                        type="text"
                        placeholder="Nado intermedio…"
                        value={p.fitnessNotes}
                        onChange={(e) => setP("fitnessNotes")(e.target.value)}
                      />
                    </div>
                    <div className="pub-fld">
                      <label>Padecimientos</label>
                      <textarea
                        placeholder="Si no aplica, “Ninguno”."
                        value={p.conditions}
                        onChange={(e) => setP("conditions")(e.target.value)}
                      />
                    </div>
                    <div className="pub-fld">
                      <label>Alergias</label>
                      <textarea
                        placeholder="Si no aplica, “Ninguna”."
                        value={p.allergies}
                        onChange={(e) => setP("allergies")(e.target.value)}
                      />
                    </div>
                    <div className="pub-fld">
                      <label>Restricciones alimentarias</label>
                      <textarea
                        placeholder="Vegetariana, sin gluten… Si no aplica, “Ninguna”."
                        value={p.dietaryRestrictions}
                        onChange={(e) => setP("dietaryRestrictions")(e.target.value)}
                      />
                    </div>
                    <div className="pub-fld">
                      <label>Contacto de emergencia</label>
                      <input
                        type="text"
                        placeholder="Nombre"
                        value={p.emergencyName}
                        onChange={(e) => setP("emergencyName")(e.target.value)}
                      />
                    </div>
                    <div className="pub-fld">
                      <label>Teléfono de emergencia</label>
                      <input
                        type="tel"
                        placeholder="+52 55 0000 0000"
                        value={p.emergencyPhone}
                        onChange={(e) => setP("emergencyPhone")(e.target.value)}
                      />
                      </div>
                    </div>
                  </details>
                </div>
                <div className="pub-acts">
                  <button
                    type="button"
                    className="pub-cta pub-cta-ghost pub-cta-sm"
                    onClick={() => setParticipants(participants.filter((_, j) => j !== i))}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pub-acts">
            <button
              type="button"
              className="pub-cta pub-cta-ghost pub-cta-sm"
              onClick={() => setParticipants([...participants, { ...emptyParticipant }])}
            >
              + Agregar participante
            </button>
          </div>
        </div>

        {/* 5 · PARA TU SEGURO — solo si la experiencia lleva póliza. Nace
            apagado: sin póliza detrás, pedir CURP y beneficiario es recolectar
            datos sensibles sin motivo. Ver el comentario en types.ts. */}
        {conSeguro ? (
        <div className="pub-blk">
          <span className="pub-lbl">5 · Para tu seguro</span>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            Esta experiencia incluye seguro. La aseguradora pide estos datos para darte de alta en
            la póliza. Lo que no tengas a la mano, déjalo en blanco.
          </p>
          <div className="pub-fld">
            <label htmlFor="s-sexo">Sexo</label>
            <input id="s-sexo" type="text" placeholder="Como aparece en tu identificación" value={m.gender} onChange={(e) => setMed("gender")(e.target.value)} />
          </div>
          <div className="pub-fld">
            <label htmlFor="s-nac">Nacionalidad</label>
            <input id="s-nac" type="text" placeholder="Mexicana" value={m.nationality} onChange={(e) => setMed("nationality")(e.target.value)} />
          </div>
          <div className="pub-fld">
            <label htmlFor="s-curp">CURP</label>
            <input id="s-curp" type="text" placeholder="18 caracteres" value={m.curp} onChange={(e) => setMed("curp")(e.target.value)} />
          </div>
          <div className="pub-fld">
            <label htmlFor="s-id">Identificación (INE o pasaporte)</label>
            <input id="s-id" type="text" placeholder="Número del documento" value={m.governmentId} onChange={(e) => setMed("governmentId")(e.target.value)} />
          </div>
          <div className="pub-fld">
            <label htmlFor="s-dom">Domicilio</label>
            <input id="s-dom" type="text" placeholder="Calle, número, colonia, C.P., ciudad" value={m.address} onChange={(e) => setMed("address")(e.target.value)} />
          </div>
          <div className="pub-fld">
            <label htmlFor="s-ocu">Ocupación</label>
            <input id="s-ocu" type="text" placeholder="A qué te dedicas" value={m.occupation} onChange={(e) => setMed("occupation")(e.target.value)} />
          </div>
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: 14 }}>
            <b>Beneficiario</b> — a quién designas en la póliza.
          </p>
          <div className="pub-fld">
            <label htmlFor="s-ben">Nombre</label>
            <input id="s-ben" type="text" placeholder="Nombre completo" value={m.beneficiaryName} onChange={(e) => setMed("beneficiaryName")(e.target.value)} />
          </div>
          <div className="pub-fld">
            <label htmlFor="s-ben-p">Parentesco</label>
            <input id="s-ben-p" type="text" placeholder="Madre, pareja…" value={m.beneficiaryRelationship} onChange={(e) => setMed("beneficiaryRelationship")(e.target.value)} />
          </div>
          <div className="pub-fld">
            <label htmlFor="s-ben-t">Teléfono</label>
            <input id="s-ben-t" type="tel" placeholder="+52 55 0000 0000" value={m.beneficiaryPhone} onChange={(e) => setMed("beneficiaryPhone")(e.target.value)} />
          </div>
        </div>
        ) : null}

        {/* EL DESLINDE — cláusulas reales + el documento, siempre legible */}
        <div className="pub-blk">
          <span className="pub-lbl">{conSeguro ? "6" : "5"} · El deslinde</span>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            La naturaleza es real y la expedición tiene riesgos reales. Esto es lo que aceptas al
            firmar.
          </p>
          {waiverClauses.length ? (
            <div className="pub-inc">
              {waiverClauses.map((c, i) => (
                <div className="row" key={i}>
                  <span className="sl">{"//"}</span>
                  <span>
                    {c.texto}
                    {!c.obligatoria ? (
                      <span style={{ marginLeft: 6, fontSize: "0.82em", fontStyle: "italic", opacity: 0.62 }}>
                        — opcional, tú eliges
                      </span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {waiverDocUrl ? (
            <div className="pub-acts">
              <a
                className="pub-cta pub-cta-ghost pub-cta-sm"
                href={waiverDocUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Leer el documento completo →
              </a>
            </div>
          ) : null}

          <Casilla checked={waiverAccepted} onChange={setWaiverAccepted}>
            He leído y acepto íntegramente la Carta de Responsabilidad Compartida y Deslinde de
            Responsabilidad.
          </Casilla>
          <Casilla checked={privacyConsent} onChange={setPrivacyConsent} nota="Obligatorio">
            He leído y acepto el Aviso de Privacidad. Declaro que la información médica y personal
            que proporcioné es verídica.
          </Casilla>
          <Casilla checked={imageConsent} onChange={setImageConsent} nota="Opcional">
            Autorizo el uso de mi imagen en redes y materiales de Caminante.
          </Casilla>
          <Casilla checked={newsletterOptIn} onChange={setNewsletterOptIn} nota="Opcional">
            Quiero recibir noticias y futuras experiencias.
          </Casilla>
        </div>

        {/* 6 · TU FIRMA */}
        <div className="pub-blk">
          <span className="pub-lbl">{conSeguro ? "7" : "6"} · Tu firma</span>
          <div className="pub-fld">
            <label htmlFor="d-firma">Escribe tu nombre completo como firma</label>
            <input
              id="d-firma"
              type="text"
              placeholder="Tu nombre completo"
              style={{ fontSize: 20, fontStyle: "italic", fontWeight: 300 }}
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
            />
            <span className="hint">
              Fecha: {hoy}. Tu nombre tecleado junto con la fecha constituye tu aceptación
              electrónica del documento.
            </span>
          </div>
          <button type="submit" className="pub-cta pub-cta-orange" style={{ marginTop: 8 }} disabled={submitting}>
            {submitting ? "Enviando…" : "Firmar y terminar"}
          </button>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-soft)",
              lineHeight: 1.5,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            Tus datos se tratan conforme al Aviso de Privacidad de Caminante. La información médica
            solo la ve el equipo de guías y nunca se comparte.
          </p>
        </div>
      </form>
    </div>
  );
}
