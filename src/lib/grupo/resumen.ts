// EL RESUMEN DE UN ESPACIO PARA EL PANEL — lo que la tarjeta del CRM (D1), el
// panel lateral (D2) y la cápsula de la salida (D3) necesitan saber de una
// salida privada. Es un tipo PURO (lo importan componentes de cliente); el
// loader vive en resumen-server.ts.

export type GenteDelEspacio = {
  lugarId: string;
  contactId: string;
  nombre: string;
  iniciales: string;
  estado: "entro" | "pago" | "firmo";
  anfitrion: boolean;
  pagadoPor: string | null;
  lugaresPagados: number;
  listaEspera: boolean;
  entroEl: string;
};

export type ResumenDelEspacio = {
  slotId: string;
  token: string;
  liga: string;
  anfitrion: string | null;
  anfitrionContactId: string | null;
  pidioEl: string | null;
  fechaLimite: string | null;
  minimo: number | null;
  cupo: number | null;
  apartados: number;
  entraron: number;
  pagaron: number;
  gente: GenteDelEspacio[];
};
