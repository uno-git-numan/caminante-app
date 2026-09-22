import "server-only";

// LOS CANDADOS DE VENTA — una sola puerta para las tres puertas.
//
// Publicar desde el formulario, publicar desde el tablero y COBRAR son tres
// caminos hacia lo mismo: que un viajero pueda pagarle a alguien por subir a
// una montaña. Cada uno preguntaba por su cuenta qué candados aplicaban, y así
// se separaron sin que nadie lo decidiera:
//
//   · El deslinde (`deslindeListo`) sí estaba en los tres.
//   · El candado por actividad (`actividadListaParaPublicar`) estaba en los dos
//     de publicar y NO en la caja: `correr-entre-volcanes` vendió con el
//     expediente de senderismo incompleto porque nadie preguntó al cobrar.
//   · El gate de Connect (`operadorListo`) prometía en su encabezado estar en
//     los tres y no estaba en ninguno.
//
// Medido el 22 sep 2026, design/mvp/MVP.md §5.2. Desde aquí los tres caminos
// llaman a ESTA función y sólo a ésta; el invariante #20 tumba el build si
// alguno vuelve a llamar a un candado suelto.
//
// Dos momentos, porque no piden lo mismo:
//   · PUBLICAR exige además la encuesta activa (regla de Luis, 3 ago 2026).
//   · VENDER no: una venta con la encuesta apagada no le hace daño al cliente.
//     Pero sí exige lo demás, aunque la experiencia esté publicada — el
//     expediente puede vencer o Stripe apagar los cobros DESPUÉS de publicar.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { deslindeListo, listaParaPublicar } from "./flujo-venta";
import {
  actividadListaParaPublicar,
  type CandadoActividad,
  type Dispensa,
} from "@/lib/operadores/candado-actividad";
import { COLUMNAS_GATE, operadorListo, type OperadorParaGate } from "@/lib/operators/listo-para-vender";
import type { Experience } from "./types";

export type Momento = "publicar" | "vender";

export type MotivoVenta = "flujo" | "actividad" | "operadora";

export type VeredictoVenta =
  | { ok: true; dispensa?: Dispensa }
  | {
      ok: false;
      motivo: MotivoVenta;
      /** Una frase para enseñar tal cual. */
      mensaje: string;
      /** Cada cosa que falta, en el orden en que se dice. */
      faltantes: string[];
      /** El veredicto completo del candado por actividad, cuando fue él. */
      candado?: Extract<CandadoActividad, { ok: false }>;
    };

export type ExperienciaParaCandados = {
  data: Experience | null | undefined;
  operator_id: string | null;
  actividad: string | null;
};

/**
 * ¿Puede publicarse (o venderse) esta experiencia?
 *
 * El orden es el de la conversación: primero lo que la propia experiencia
 * tiene mal (deslinde, encuesta), luego el expediente de su actividad, luego
 * si quien la opera está listo para cobrar. Se devuelve el PRIMER candado
 * cerrado: quien lo lee tiene una cosa que hacer, no tres.
 *
 * `operator_id` y `actividad` salen de la FILA, nunca del formulario: si
 * vinieran del cliente, cualquiera mandaría `null` y diría que es de la casa.
 */
export async function candadosDe(momento: Momento, exp: ExperienciaParaCandados): Promise<VeredictoVenta> {
  // 1 · La experiencia misma.
  const flujo = momento === "publicar" ? listaParaPublicar(exp.data) : deslindeListo(exp.data);
  if (!flujo.ok) {
    return { ok: false, motivo: "flujo", mensaje: flujo.faltantes.join(" "), faltantes: flujo.faltantes };
  }

  // 2 · El expediente de su actividad (la casa está exenta adentro).
  const actividad = await actividadListaParaPublicar(exp.operator_id, exp.actividad);
  if (!actividad.ok) {
    return { ok: false, motivo: "actividad", mensaje: actividad.mensaje, faltantes: [actividad.mensaje], candado: actividad };
  }

  // 3 · Quien la opera, si cobra por Connect. `operadorListo` deja pasar a
  //     quien no tiene cuenta conectada (vende por el camino de siempre) y a
  //     la casa, que nunca la tiene.
  if (exp.operator_id) {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("operators")
      .select(COLUMNAS_GATE)
      .eq("id", exp.operator_id)
      .maybeSingle();
    // ⚠️ ANTE LA DUDA, EL CANDADO MUERDE. Si no se pudo leer a la operadora, no
    // se sabe si está en Connect ni si está lista; vender a ciegas es peor que
    // pedir que reintenten.
    if (error) {
      return {
        ok: false,
        motivo: "operadora",
        mensaje: "No pudimos verificar a quien opera esta experiencia. Intenta de nuevo en un momento.",
        faltantes: ["No se pudo leer a la operadora."],
      };
    }
    const listo = operadorListo((data as OperadorParaGate | null) ?? null);
    if (!listo.ok) {
      return { ok: false, motivo: "operadora", mensaje: listo.faltantes.join(" "), faltantes: listo.faltantes };
    }
  }

  return actividad.dispensa ? { ok: true, dispensa: actividad.dispensa } : { ok: true };
}
