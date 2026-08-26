// LA ESTRUCTURA DEL FORMULARIO DE REGISTRO — una sola definición.
//
// El panel muestra una «Vista previa · Así lo verá el viajero» dentro de la
// sección Registro & deslinde. Esa vista previa era una LISTA APARTE, escrita a
// mano, que decía lo que alguien creyó que el formulario pedía. Y se separó:
// anunciaba un bloque «5 · Para tu seguro» que nunca se construyó, y llamaba
// «Acompañantes menores» a lo que en vivo es «Participantes». Alguien revisaba
// el formulario en el panel, lo daba por bueno, y descubría el hueco enfrente
// del cliente.
//
// Una vista previa que no es fiel es peor que no tener vista previa: da
// confianza falsa. Así que ya no se escribe dos veces. Aquí vive la estructura,
// la vista previa se DIBUJA de aquí, y el formulario real toma de aquí sus
// títulos y sus números.
//
// ⚠️ El guardián (invariante #12) compara esta lista contra los `htmlFor` reales
// de `RegistrationForm.tsx` y TUMBA EL BUILD si se separan. Agregar un campo al
// formulario sin agregarlo aquí no compila; quitarlo de aquí sin quitarlo del
// formulario, tampoco. Es la única forma de que la promesa se sostenga sola.

export type CampoRegistro = {
  /** El `id`/`htmlFor` del input real. Es lo que ata las dos superficies. */
  id: string;
  label: string;
  /**
   * `true` para lo que el viajero ve pero no es un <input> con label propio
   * (el selector de salida, las tarjetas de participante). El guardián los
   * salta; la vista previa sí los muestra, porque el viajero sí los vive.
   */
  sinInput?: boolean;
};

export type SeccionRegistro = {
  id: string;
  titulo: string;
  campos: CampoRegistro[];
  /** Solo aparece si la experiencia lleva póliza (`registration.insurance`). */
  soloConSeguro?: boolean;
  /** La sección no es una lista de campos (el deslinde, con sus casillas). */
  especial?: "deslinde";
};

export const SECCIONES_REGISTRO: SeccionRegistro[] = [
  {
    id: "datos",
    titulo: "Tus datos",
    campos: [
      { id: "nombre", label: "Nombre completo" },
      { id: "nacimiento", label: "Fecha de nacimiento" },
      { id: "ciudad", label: "Ciudad" },
      { id: "correo", label: "Correo" },
      { id: "whatsapp", label: "WhatsApp" },
      { id: "salida", label: "Elegir fecha de salida", sinInput: true },
    ],
  },
  {
    id: "medico",
    titulo: "Perfil médico",
    campos: [
      { id: "sangre", label: "Tipo de sangre" },
      { id: "condicion", label: "Nivel de nado / condición física" },
      { id: "padecimientos", label: "Padecimientos actuales" },
      { id: "medicamentos", label: "Medicamentos de uso periódico" },
      { id: "alergias", label: "Alergias" },
      { id: "dieta", label: "Restricciones alimentarias" },
    ],
  },
  {
    id: "emergencia",
    titulo: "Contacto de emergencia",
    campos: [
      { id: "em-nombre", label: "Nombre" },
      { id: "em-parentesco", label: "Parentesco" },
      { id: "em-telefono", label: "Teléfono" },
    ],
  },
  {
    id: "participantes",
    titulo: "Participantes (opcional)",
    campos: [
      { id: "part-nombre", label: "Nombre", sinInput: true },
      { id: "part-nacimiento", label: "Fecha de nacimiento", sinInput: true },
      { id: "part-parentesco", label: "Parentesco", sinInput: true },
      { id: "part-medico", label: "Su propio perfil médico", sinInput: true },
    ],
  },
  {
    id: "seguro",
    titulo: "Para tu seguro",
    soloConSeguro: true,
    campos: [
      { id: "sg-sexo", label: "Sexo" },
      { id: "sg-nac", label: "Nacionalidad" },
      { id: "sg-curp", label: "CURP" },
      { id: "sg-id", label: "Identificación (INE o pasaporte)" },
      { id: "sg-dom", label: "Domicilio" },
      { id: "sg-ocu", label: "Ocupación" },
      { id: "sg-ben", label: "Beneficiario — Nombre" },
      { id: "sg-ben-p", label: "Beneficiario — Parentesco" },
      { id: "sg-ben-t", label: "Beneficiario — Teléfono" },
    ],
  },
  {
    id: "deslinde",
    titulo: "El deslinde",
    especial: "deslinde",
    campos: [],
  },
  {
    id: "firma",
    titulo: "Tu firma",
    campos: [{ id: "firma", label: "Escribe tu nombre completo como firma" }],
  },
];

/** Las casillas del deslinde, en el orden en que las ve quien firma. */
export const CASILLAS_DESLINDE = [
  { label: "He leído y acepto el deslinde", obligatoria: true },
  { label: "Acepto el aviso de privacidad", obligatoria: true },
  { label: "Autorizo uso de imagen", obligatoria: false },
  { label: "Quiero recibir noticias", obligatoria: false },
];

const ORDINALES = ["uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho"];

export type SeccionNumerada = SeccionRegistro & { num: string; ordinal: string };

/**
 * Las secciones que ESTA experiencia muestra, ya numeradas.
 *
 * La numeración se calcula aquí y no se escribe a mano en ningún lado: con el
 * seguro prendido el deslinde es la 6 y la firma la 7; apagado, 5 y 6. Tres
 * superficies dependen de esto (la vista previa, el escritorio y el teléfono) y
 * numerarlas por separado es garantizar que un día no coincidan.
 */
export function seccionesVisibles(conSeguro: boolean): SeccionNumerada[] {
  return SECCIONES_REGISTRO.filter((s) => !s.soloConSeguro || conSeguro).map((s, i) => ({
    ...s,
    num: String(i + 1).padStart(2, "0"),
    ordinal: ORDINALES[i] ?? String(i + 1),
  }));
}

/** Busca una sección ya numerada por su id. Lanza si no existe: es un bug. */
export function seccion(conSeguro: boolean, id: string): SeccionNumerada {
  const s = seccionesVisibles(conSeguro).find((x) => x.id === id);
  if (!s) throw new Error(`Sección de registro desconocida: ${id}`);
  return s;
}
