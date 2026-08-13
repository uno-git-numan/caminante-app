"use server";

// APLICACIÓN de OPERADOR (formulario público de /caminante/operadores/aplicar).
// Mismo patrón que `submitAmbassadorApplication`: honeypot que finge éxito a los
// bots, validación server-side, y estado por query param — página pública
// dinámica, sin revalidatePath.
//
// ⚠️ Lo que separa esta aplicación de la de embajadores: aprobarla acaba dando
// ACCESO AL PANEL (reservas, datos médicos, dinero). Por eso el paso 3 —seguro,
// primeros auxilios, ratio de guías e incidentes— es obligatorio hasta la última
// pregunta, y las tres casillas de compromiso se exigen aquí también, no solo en
// el cliente: un POST directo no puede saltárselas.

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  emailConfirmacionOperador,
  emailAvisoAdminOperador,
} from "@/lib/operadores/emails";

const TIPOS = new Set(["montana", "mar", "cuevas", "naturaleza", "cultura", "mixta"]);
const ANTIGUEDAD = new Set(["menos-1", "1-3", "3-10", "mas-10"]);
const SEGURO = new Set(["vigente", "vence-pronto", "tramite", "no"]);
const PRIMEROS = new Set(["todos", "algunos", "botiquin", "no"]);

const back = (q: string): never => redirect(`/caminante/operadores/aplicar?${q}`);

const clean = (v: FormDataEntryValue | null, max = 400): string =>
  String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const cleanLargo = (v: FormDataEntryValue | null, max = 2000): string =>
  String(v ?? "").replace(/\r/g, "").trim().slice(0, max);

export async function submitOperatorApplication(formData: FormData): Promise<void> {
  if (clean(formData.get("web"))) back("ok=1");

  // Paso 1
  const nombreOperadora = clean(formData.get("nombreOperadora"), 160);
  const responsable = clean(formData.get("responsable"), 160);
  const email = clean(formData.get("correo"), 200).toLowerCase();
  const whatsapp = clean(formData.get("whatsapp"), 40);
  const instagram = clean(formData.get("instagram"), 200);
  const ciudadEstado = clean(formData.get("ciudadEstado"), 160);

  // Paso 2
  const tipo = clean(formData.get("tipo"), 20);
  const descripcion = cleanLargo(formData.get("descripcion"));
  const antiguedad = clean(formData.get("antiguedad"), 20);
  const salidasAno = clean(formData.get("salidasAno"), 40);
  const personasTipico = clean(formData.get("personasTipico"), 10);
  const personasMax = clean(formData.get("personasMax"), 10);
  const rangoPrecio = clean(formData.get("rangoPrecio"), 60);

  // Paso 3 — el que decide
  const seguro = clean(formData.get("seguro"), 20);
  const primerosAuxilios = clean(formData.get("primerosAuxilios"), 20);
  const ratioGuias = clean(formData.get("ratioGuias"), 200);
  const incidentes = cleanLargo(formData.get("incidentes"));

  // Paso 4
  const porque = cleanLargo(formData.get("porque"));
  const conociste = clean(formData.get("conociste"), 200);
  const aceptaCobro = formData.get("aceptaCobro") === "on";
  const aceptaDeslinde = formData.get("aceptaDeslinde") === "on";
  const aceptaEncuesta = formData.get("aceptaEncuesta") === "on";

  if (!nombreOperadora || !responsable || !email.includes("@") || !whatsapp || !ciudadEstado) {
    back("error=datos");
  }
  if (!TIPOS.has(tipo) || !ANTIGUEDAD.has(antiguedad) || !descripcion) back("error=operacion");
  if (!SEGURO.has(seguro) || !PRIMEROS.has(primerosAuxilios) || !ratioGuias || !incidentes) {
    back("error=seguridad");
  }
  // Las tres, o no hay solicitud. Son las reglas duras del sistema.
  if (!aceptaCobro || !aceptaDeslinde || !aceptaEncuesta) back("error=compromisos");

  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("operator_applications").insert({
    nombre_operadora: nombreOperadora,
    responsable,
    email,
    whatsapp,
    instagram: instagram || null,
    ciudad_estado: ciudadEstado,
    tipo_operacion: tipo,
    descripcion,
    antiguedad,
    salidas_ano: salidasAno || null,
    personas_salida:
      personasTipico || personasMax ? `${personasTipico || "?"} típico · ${personasMax || "?"} máximo` : null,
    rango_precio: rangoPrecio || null,
    seguro_rc: seguro,
    primeros_auxilios: primerosAuxilios,
    ratio_guias: ratioGuias,
    incidentes,
    porque: porque || null,
    conociste: conociste || null,
    acepta_cobro: aceptaCobro,
    acepta_deslinde: aceptaDeslinde,
    acepta_encuesta: aceptaEncuesta,
  });

  if (error) {
    // Único índice de la tabla: una aplicación PENDIENTE por correo.
    if (error.code === "23505") back("error=duplicada");
    console.error("submitOperatorApplication:", error);
    back("error=guardar");
  }

  // Best-effort: la solicitud YA está guardada; un fallo de correo jamás le
  // enseña un error a quien acaba de aplicar.
  const res = await Promise.allSettled([
    emailConfirmacionOperador(email, responsable),
    emailAvisoAdminOperador({
      nombreOperadora,
      responsable,
      email,
      whatsapp,
      ciudadEstado,
      tipo,
      seguro,
      primerosAuxilios,
      ratioGuias,
    }),
  ]);
  for (const r of res) if (r.status === "rejected") console.error("correo operador:", r.reason);

  back("ok=1");
}
