// LAS ETAPAS DEL TABLERO — puro, sin nada de servidor.
//
// ⚠️ Vive aparte de `tablero.ts` a propósito: ese módulo llega hasta
// next/headers por la cadena del alcance, y el tablero es un componente
// CLIENTE. Importar de ahí un valor —aunque sea esta lista de seis— rompe el
// build. Los tipos sí viajan gratis con `import type`.

export const ETAPAS = [
  { id: "llego", n: "01", titulo: "Llegó", como: "Se arrastra",
    pie: "Entró una solicitud. El trabajo es escribirle y agendarle llamada." },
  { id: "conversacion", n: "02", titulo: "En conversación", como: "Se arrastra",
    pie: "La llamada está agendada o ya ocurrió." },
  { id: "interesado", n: "03", titulo: "Interesado", como: "Pasa solo al pagar",
    pie: "Dijo que sí. Ahora se cobra." },
  { id: "pagado", n: "04", titulo: "Pagado", como: "Cae solo con el pago",
    pie: "Cayó el pago. No hay nada que perseguir." },
  { id: "preparando", n: "05", titulo: "Preparando", como: "Sale solo",
    pie: "Mensajes programados antes del viaje." },
  { id: "viajo", n: "06", titulo: "Viajó", como: "Cae sola al pasar la fecha",
    pie: "Pasa a la biblioteca." },
] as const;

export type EtapaId = (typeof ETAPAS)[number]["id"] | "caido";

/** Las únicas que se mueven a mano. El resto sólo RECIBE automático. */
export const A_MANO: ReadonlySet<string> = new Set(["llego", "conversacion", "interesado"]);
