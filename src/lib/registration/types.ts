// Contratos del registro nativo (deslinde + firma en /caminante/registro/[slug]).
// El snapshot que se congela en `registrations` se construye de estos campos.

export type MinorEntry = {
  name: string;
  age: string;
  relationship: string;
};

// Un participante/acompañante que el titular agrega a su reserva (OPCIONAL).
// Se guarda como un `dependent` reutilizable bajo el contacto del titular y se
// congela en registrations.participants al firmar. Los campos médicos son opcionales.
export type ParticipantInput = {
  dependentId?: string; // si se reusa un dependiente ya guardado
  fullName: string;
  birthDate?: string;
  relationship?: string;
  bloodType?: string;
  conditions?: string;
  medications?: string;
  allergies?: string;
  dietaryRestrictions?: string;
  fitnessNotes?: string;
  emergencyName?: string;
  emergencyRelationship?: string;
  emergencyPhone?: string;
};

// Un dependiente ya guardado, para prellenar/reusar en el formulario.
export type DependentOption = {
  id: string;
  fullName: string;
  birthDate: string;
  relationship: string;
  bloodType: string;
  conditions: string;
  medications: string;
  allergies: string;
  dietaryRestrictions: string;
  fitnessNotes: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
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
  /** Domicilio: lo pide la aseguradora para el expediente (0043). */
  address: string;
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
  // participantes/acompañantes con perfil reutilizable (OPCIONAL)
  participants?: ParticipantInput[];
  // si el deslinde se firma sobre una reserva YA pagada (self-serve), su id
  reservationId?: string;
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
  dependents: DependentOption[]; // participantes guardados para reusar
};
