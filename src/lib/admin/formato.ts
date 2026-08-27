// FORMATEADORES PUROS del panel — fecha, dinero, iniciales.
//
// ⚠️ Este módulo NO importa nada del servidor, y así se queda. Vive aparte de
// `lib/admin/queries.ts` precisamente por eso: queries llega hasta next/headers
// por la cadena del alcance, y un componente CLIENTE que importe de ahí
// —aunque sea una función de una línea que formatea pesos— rompe el build con
// «You're importing a component that needs next/headers».
//
// Ya pasó dos veces: Capsula.tsx se copió `iniciales` local para esquivarlo, y
// el catálogo de Experiencias tumbó el build por traer `formatMXN`. Para el
// panel, la definición única es ésta.
//
// Queda una tercera copia en lib/kit/queries.ts. NO es la misma: devuelve «—»
// con nombre vacío donde ésta devuelve «?». Unificarlas cambia lo que ve el
// Kit, así que se hace a propósito y no de pasada.

// Zona horaria de negocio: cortes de mes y «próximas salidas» se calculan aquí.
const TZ = "America/Mexico_City";

/** "YYYY-MM-DD" del instante dado EN CDMX (en-CA da ISO-like). */
export function cdmxDay(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function formatMXN(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatFechaCorta(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-MX", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatDiaMes(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", { timeZone: TZ, day: "numeric", month: "short" });
}

const METODOS: Record<string, string> = {
  stripe: "Stripe",
  transfer: "Transferencia",
  cash: "Efectivo",
};
export function metodoLabel(m: string | null): string {
  return m ? METODOS[m] || m : "—";
}

export function iniciales(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}
