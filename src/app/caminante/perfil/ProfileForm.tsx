"use client";

import { useState } from "react";
import { updateContactProfile, updateMedicalProfile } from "@/lib/crm/actions";
import type { MedicalProfileData } from "@/lib/registration/types";

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

function rowToMedical(row: Record<string, string | null> | null): MedicalProfileData {
  if (!row) return emptyMedical;
  return {
    bloodType: row.blood_type || "",
    conditions: row.conditions || "",
    medications: row.medications || "",
    allergies: row.allergies || "",
    dietaryRestrictions: row.dietary_restrictions || "",
    fitnessNotes: row.fitness_notes || "",
    emergencyName: row.emergency_name || "",
    emergencyRelationship: row.emergency_relationship || "",
    emergencyPhone: row.emergency_phone || "",
    gender: row.gender || "",
    curp: row.curp || "",
    nationality: row.nationality || "",
    governmentId: row.government_id || "",
    occupation: row.occupation || "",
    beneficiaryName: row.beneficiary_name || "",
    beneficiaryRelationship: row.beneficiary_relationship || "",
    beneficiaryPhone: row.beneficiary_phone || "",
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-olive">{label}</span>
      <input
        type={type}
        className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-lagoon outline-none focus:border-dune"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-olive">{label}</span>
      <textarea
        rows={2}
        className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-lagoon outline-none focus:border-dune"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export default function ProfileForm({
  email,
  contact,
  medical,
}: {
  email: string;
  contact: {
    fullName: string;
    phone: string;
    city: string;
    birthDate: string;
    mailingOptIn: boolean;
  } | null;
  medical: Record<string, string | null> | null;
}) {
  const [fullName, setFullName] = useState(contact?.fullName || "");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [city, setCity] = useState(contact?.city || "");
  const [birthDate, setBirthDate] = useState(contact?.birthDate || "");
  const [mailingOptIn, setMailingOptIn] = useState(contact?.mailingOptIn ?? false);
  const [m, setM] = useState<MedicalProfileData>(rowToMedical(medical));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const setMed = (k: keyof MedicalProfileData) => (v: string) => setM({ ...m, [k]: v });

  async function onSave() {
    setBusy(true);
    setMsg(null);
    const r1 = await updateContactProfile({ fullName, phone, city, birthDate, mailingOptIn });
    const r2 = r1.ok ? await updateMedicalProfile(m) : r1;
    setBusy(false);
    if (r1.ok && r2.ok) {
      setMsg({ ok: true, text: "Perfil guardado. La próxima vez solo confirmas y firmas." });
    } else {
      setMsg({ ok: false, text: (!r1.ok && r1.error) || (!r2.ok && r2.error) || "Error" });
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-sand bg-white p-5">
        <h2 className="text-lg font-semibold text-lagoon">Datos personales</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" value={fullName} onChange={setFullName} />
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-olive">Correo</span>
            <input
              className="mt-1 w-full rounded-lg border border-sand bg-cream/60 px-3 py-2 text-sm text-olive"
              value={email}
              disabled
            />
          </label>
          <Field label="WhatsApp" value={phone} onChange={setPhone} placeholder="+52 55 1234 5678" />
          <Field label="Ciudad" value={city} onChange={setCity} />
          <Field label="Fecha de nacimiento" value={birthDate} onChange={setBirthDate} type="date" />
          <label className="flex items-end gap-2 pb-2">
            <input
              type="checkbox"
              checked={mailingOptIn}
              onChange={(e) => setMailingOptIn(e.target.checked)}
            />
            <span className="text-sm text-lagoon">Quiero recibir noticias y futuras experiencias</span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-sand bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-lagoon">Perfil de seguridad</h2>
          <span className="rounded-full bg-cream px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-olive">
            🔒 Confidencial
          </span>
        </div>
        <p className="mt-1 text-xs text-olive">
          Solo lo ve el equipo de guías para cuidarte en campo. Nunca se comparte ni se usa para
          marketing.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Tipo de sangre" value={m.bloodType} onChange={setMed("bloodType")} placeholder="O+" />
          <Field label="Nivel de nado / condición física" value={m.fitnessNotes} onChange={setMed("fitnessNotes")} />
        </div>
        <div className="mt-4 space-y-4">
          <Area label="Enfermedades o padecimientos" value={m.conditions} onChange={setMed("conditions")} />
          <Area label="Medicamentos de uso periódico" value={m.medications} onChange={setMed("medications")} />
          <Area label="Alergias" value={m.allergies} onChange={setMed("allergies")} />
          <Area label="Restricciones alimentarias" value={m.dietaryRestrictions} onChange={setMed("dietaryRestrictions")} />
        </div>
        <h3 className="mt-6 text-sm font-semibold text-lagoon">Contacto de emergencia</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Nombre" value={m.emergencyName} onChange={setMed("emergencyName")} />
          <Field label="Parentesco" value={m.emergencyRelationship} onChange={setMed("emergencyRelationship")} />
          <Field label="Teléfono" value={m.emergencyPhone} onChange={setMed("emergencyPhone")} />
        </div>
        <h3 className="mt-6 text-sm font-semibold text-lagoon">Para tu seguro (opcional)</h3>
        <p className="mt-1 text-xs text-olive">
          Estos datos se usan para asegurarte en la expedición. El beneficiario es a quien
          protege tu seguro de accidentes.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Sexo" value={m.gender} onChange={setMed("gender")} />
          <Field label="CURP" value={m.curp} onChange={setMed("curp")} />
          <Field label="Nacionalidad" value={m.nationality} onChange={setMed("nationality")} />
          <Field label="Pasaporte / INE" value={m.governmentId} onChange={setMed("governmentId")} />
          <Field label="Ocupación" value={m.occupation} onChange={setMed("occupation")} />
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Beneficiario (nombre)" value={m.beneficiaryName} onChange={setMed("beneficiaryName")} />
          <Field label="Parentesco" value={m.beneficiaryRelationship} onChange={setMed("beneficiaryRelationship")} />
          <Field label="Teléfono" value={m.beneficiaryPhone} onChange={setMed("beneficiaryPhone")} />
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="rounded-full bg-lagoon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-lagoon-light disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Guardar perfil"}
        </button>
        {msg ? (
          <span className={`text-sm ${msg.ok ? "text-forest" : "text-clay"}`}>{msg.text}</span>
        ) : null}
      </div>
    </div>
  );
}
