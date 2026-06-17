// Contratos del registro nativo (deslinde + firma en /caminante/registro/[slug]).
// El snapshot que se congela en `registrations` se construye de estos campos.

export type MinorEntry = {
  name: string;
  age: string;
  relationship: string;
};

// El perfil "vivo" que la plataforma recuerda (tabla medical_profiles).
// Incluye el bloque de aseguradora (todo opcional hasta que haya póliza).
export type MedicalProfileData = {
  bloodType: string;
  conditions: string;
  medications: string;
  allergies: string;
  dietaryRestrictions: string;
  fitnessNotes: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  // seguro
  gender: string;
  curp: string;
  nationality: string;
  governmentId: string;
  occupation: string;
  beneficiaryName: string;
  beneficiaryRelationship: string;
  beneficiaryPhone: string;
};

export type RegistrationInput = {
  slug: string;
  // identidad
  fullName: string;
  birthDate: string; // ISO date
  email: string;
  phone: string;
  city: string;
  // salida
  slotId: string | null; // null cuando la experiencia no tiene slots en BD
  slotLabel: string; // etiqueta legible de la salida elegida
  // perfil de seguridad (médico + emergencia + seguro)
  medical: MedicalProfileData;
  // menores (el adulto firma por ellos; los menores NO se dan de alta como contacts)
  minors: MinorEntry[];
  // legal
  waiverAccepted: boolean;
  privacyConsent: boolean;
  imageConsent: boolean;
  newsletterOptIn: boolean;
  signatureName: string;
};

export type RegistrationResult =
  | {
      ok: true;
      hasSession: boolean;
      waiverVersion: string;
      signedAt: string; // ISO
      slotLabel: string;
      stripeLink: string | null;
    }
  | { ok: false; error: string };

export type SlotOption = {
  id: string;
  label: string;
  seatsAvailable: number | null; // null = sin tope (capacity_total NULL en BD)
  status: string;
};

// Prefill para usuarios con sesión: contact + perfil médico si existen.
export type RegistrationPrefill = {
  fullName: string;
  birthDate: string;
  email: string;
  phone: string;
  city: string;
  medical: MedicalProfileData | null;
  medicalUpdatedAt: string | null; // para "última actualización: hace X"
};
