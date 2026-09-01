// LAS SIETE ETAPAS y las formas que las acompañan.
//
// Viven APARTE de `operadoras.ts` por una razón de empaque, no de orden: ese
// módulo es `server-only` —abre el cliente de servicio de Supabase— y el
// tablero del pipeline es un componente de navegador. Importar las etapas
// desde allá arrastraba medio servidor al bundle y el build reventaba.
//
// Aquí no hay nada que consultar: son constantes y tipos. Se pueden leer de
// los dos lados sin abrir ninguna puerta.

export type Candado = {
  clave: string;
  nombre: string;
  cumplido: boolean;
  detalle: string;
  /** Quién lo destraba: la operadora o la casa. */
  toca: "operadora" | "casa";
};

export type Etapa =
  | "llego"
  | "en_llamada"
  | "expediente"
  | "listo"
  | "vendiendo"
  | "dormido"
  | "se_salieron";

export const ETAPAS: { clave: Etapa; num: string; nombre: string; como: string }[] = [
  { clave: "llego", num: "01", nombre: "Llegó", como: "Automática · cae la solicitud" },
  { clave: "en_llamada", num: "02", nombre: "En llamada", como: "A mano · se agenda" },
  { clave: "expediente", num: "03", nombre: "Expediente", como: "A mano · se juntan papeles" },
  { clave: "listo", num: "04", nombre: "Listo para vender", como: "Automática · seis candados" },
  { clave: "vendiendo", num: "05", nombre: "Vendiendo", como: "Automática · tiene ventas del mes" },
  { clave: "dormido", num: "06", nombre: "Dormido", como: "Automática · 60 días sin vender" },
  { clave: "se_salieron", num: "07", nombre: "Se salieron", como: "Con su motivo" },
];
