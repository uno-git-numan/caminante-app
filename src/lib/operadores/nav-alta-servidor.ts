import "server-only";

// A QUIÉN LE APLICA EL NAV DEL ALTA EN ESTA SESIÓN, y en qué estado.
//
// A dos: a la operadora que entra a su panel, y a la casa cuando trae puesto el
// sombrero de una operadora que tiene alta (Kéntro, hoy) — Luis recorre el alta
// «como operador que se está dando de alta», y eso incluye el candado. Para
// quitárselo, pica «numan» en la pastilla.
//
// ⚠️ SI NO SE PUEDE LEER, NO SE CIERRA NADA. Esto recorta qué secciones se
// pueden picar; no es un permiso —de qué filas ve cada quien se encarga
// `alcance.ts`—. Cerrar el panel entero porque Supabase tardó sería tumbar el
// sitio por un recorte de vista (invariante 16), y a Nomádika la dejaría sin
// las listas de sus salidas del fin de semana.

import { cache } from "react";
import { getCurrentRole } from "@/lib/auth/authorization";
import { alcanceActual, esOperador } from "@/lib/auth/alcance";
import { sombreroPuesto } from "@/lib/auth/sombrero";
import { fetchOperadorasPlataforma } from "@/lib/plataforma/operadoras";
import { estadoNav, rutaCerrada, type EstadoNav } from "./nav-alta";

export type CandadoAlta = {
  operatorId: string;
  estado: EstadoNav;
  puedeArmar: boolean;
  puedeCobrar: boolean;
};

/** El estado del nav para una operadora. Una sola lectura de candados por request. */
const estadoDe = cache(async (operatorId: string): Promise<CandadoAlta | null> => {
  try {
    const o = (await fetchOperadorasPlataforma()).find((x) => x.id === operatorId);
    if (!o || o.esLaCasa) return null;
    return {
      operatorId,
      puedeArmar: o.puedeArmar,
      puedeCobrar: o.puedeCobrar,
      // `vendidoHistorico` cuenta sólo lo PAGADO (desde el 24 sep 2026).
      estado: estadoNav({ puedeArmar: o.puedeArmar, puedeCobrar: o.puedeCobrar, tieneVentas: o.vendidoHistorico > 0 }),
    };
  } catch (e) {
    console.error("nav del alta:", e);
    return null;
  }
});

/** El candado de esta sesión, o null si a quien mira no le aplica. */
export const candadoDeAlta = cache(async (): Promise<CandadoAlta | null> => {
  const rol = await getCurrentRole();
  // El equipo de una operadora trae el mismo candado que ella (0070); el de
  // numan no tiene alta y `esOperador` lo deja fuera.
  if (rol === "operador" || rol === "equipo") {
    const a = await alcanceActual();
    return esOperador(a) ? estadoDe(a.operatorId) : null;
  }
  if (rol === "admin") {
    const p = await sombreroPuesto();
    return p && !p.esLaCasa ? estadoDe(p.id) : null;
  }
  return null;
});

/**
 * ¿Esta ruta rebota a Mi alta para quien la pide?
 *
 * La usan el layout (carga completa: alguien escribió la URL) y la cabecera
 * (navegación con clics, donde Next NO vuelve a correr el layout). Una sola
 * decisión en dos puertas: si cada una la calculara, un día dirían distinto.
 *
 * La vista de numan (`/plataforma`) nunca rebota: es la casa con su sombrero,
 * no una operadora en su alta.
 */
export async function rebotaDelAlta(ruta: string | null | undefined): Promise<boolean> {
  if (!ruta || ruta.startsWith("/caminante/admin/plataforma")) return false;
  const c = await candadoDeAlta();
  return !!c && c.estado !== "abierto" && rutaCerrada(ruta, c.estado);
}
