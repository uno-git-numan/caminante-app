"use client";

// Cableado de la app: qué pantalla vive en cada pestaña. El shell no sabe de
// datos y las pantallas no saben de navegación — se encuentran aquí.
//
// ⚠️ Cada entrada es una FUNCIÓN que devuelve `<Pantalla … />`, nunca la
// pantalla llamada como función. AppShell hace `<Pantalla …/>` con lo que
// reciba: si aquí se pasara `Gente({...})`, sus hooks contarían como hooks del
// shell y al cambiar de pestaña React truena con «rendered fewer hooks than
// expected», señalando al shell y no a la pantalla culpable.

import AppShell from "./AppShell";
import Panorama, { type PanoramaData } from "./Panorama";
import Recursos from "./Recursos";
import Eventos from "./Eventos";
import Evento, {
  ShEditarSalida,
  ShOperador,
  DlgConfirmCancelarSalida,
  DlgRechazoCancelar,
  DlgCandado,
  DlgEliminarExp,
} from "./Evento";
import Contenido from "./Contenido";
import Gente, {
  Persona,
  Roster,
  Encuesta,
  SheetRegistrarPago,
  DialogCancelarReserva,
  DialogConfirmarLote,
  DialogRecordarFirma,
} from "./Gente";
import Mas from "./Mas";
import Comunicacion from "./Comunicacion";
import KitComunicacion from "./KitComunicacion";
import Solicitudes from "./Solicitudes";
import Operador from "./Operador";
import Cobro from "./Cobro";
import type { RecursosMovil } from "@/lib/admin/movil-datos";
import type { EventosMovil } from "@/lib/admin/movil/eventos";
import type { GenteMovil } from "@/lib/admin/movil/gente";
import type { MasMovil } from "@/lib/admin/movil/mas";

export default function MovilApp({
  panorama,
  recursos,
  eventos,
  gente,
  mas,
}: {
  panorama: PanoramaData;
  recursos: RecursosMovil;
  eventos: EventosMovil;
  gente: GenteMovil;
  mas: MasMovil;
}) {
  return (
    <AppShell
      roots={{
        panorama: ({ nav, ui }) => <Panorama d={panorama} nav={nav} ui={ui} />,
        eventos: ({ nav }) => <Eventos d={eventos} nav={nav} />,
        gente: ({ nav, ui }) => <Gente d={gente} nav={nav} ui={ui} />,
        recursos: () => <Recursos d={recursos} />,
        mas: ({ nav }) => <Mas d={mas} nav={nav} />,
      }}
      screens={{
        // Eventos
        evento: ({ nav, ui, params }) => <Evento d={eventos} nav={nav} ui={ui} params={params} />,
        contenido: ({ nav, params }) => <Contenido d={eventos} nav={nav} params={params} />,
        // Gente
        persona: ({ nav, params }) => <Persona d={gente} nav={nav} params={params} />,
        roster: ({ nav, ui, params }) => <Roster nav={nav} ui={ui} params={params} />,
        encuesta: ({ nav, ui }) => <Encuesta d={gente} nav={nav} ui={ui} />,
        // Más
        comunicacion: ({ nav, ui }) => <Comunicacion d={mas} nav={nav} ui={ui} />,
        kit: ({ nav, ui, params }) => <KitComunicacion nav={nav} ui={ui} params={params} />,
        solicitudes: ({ nav, ui }) => <Solicitudes d={mas} nav={nav} ui={ui} />,
        operador: ({ nav, params }) => <Operador d={mas} nav={nav} params={params} />,
        cobro: ({ nav, ui }) => <Cobro d={mas} nav={nav} ui={ui} />,
      }}
      sheets={{
        editarSalida: ({ ui, params }) => <ShEditarSalida d={eventos} ui={ui} params={params} />,
        operador: ({ ui, params }) => <ShOperador d={eventos} ui={ui} params={params} />,
        regPago: ({ ui, params }) => <SheetRegistrarPago d={gente} ui={ui} params={params} />,
      }}
      dialogs={{
        confirmCancelarSalida: ({ ui, params }) => (
          <DlgConfirmCancelarSalida d={eventos} ui={ui} params={params} />
        ),
        rechazoCancelar: ({ nav, ui, params }) => (
          <DlgRechazoCancelar d={eventos} nav={nav} ui={ui} params={params} />
        ),
        candado: ({ ui, params }) => <DlgCandado d={eventos} ui={ui} params={params} />,
        eliminarExp: ({ nav, ui, params }) => (
          <DlgEliminarExp d={eventos} nav={nav} ui={ui} params={params} />
        ),
        cancelarReserva: ({ ui, params }) => (
          <DialogCancelarReserva d={gente} ui={ui} params={params} />
        ),
        confirmLote: ({ ui, params }) => <DialogConfirmarLote ui={ui} params={params} />,
        recordarFirma: ({ ui, params }) => <DialogRecordarFirma ui={ui} params={params} />,
      }}
    />
  );
}
