"use client";

// Cableado de la app: qué pantalla vive en cada pestaña. El shell no sabe de
// datos y las pantallas no saben de navegación — se encuentran aquí.

import AppShell from "./AppShell";
import Panorama, { type PanoramaData } from "./Panorama";
import Recursos from "./Recursos";
import type { RecursosMovil } from "@/lib/admin/movil-datos";
import { Empty } from "./kit";

// Fases pendientes: en vez de una pestaña muerta, la pantalla dice qué falta y
// deja a la mano el panel de escritorio, que sí lo tiene. Se van borrando
// conforme cada fase aterriza.
function EnCamino({ que, ruta }: { que: string; ruta: string }) {
  return (
    <div className="adm-screen">
      <div className="adm-pad">
        <div className="adm-card">
          <Empty
            ic="◌"
            t={que}
            p="Todavía no vive en el teléfono. Está completa en el panel de computadora."
            btn={
              <a className="adm-btn adm-btn-ghost adm-btn-sm" href={ruta}>
                Abrir en el panel
              </a>
            }
          />
        </div>
      </div>
    </div>
  );
}

export default function MovilApp({
  panorama,
  recursos,
}: {
  panorama: PanoramaData;
  recursos: RecursosMovil;
}) {
  return (
    <AppShell
      roots={{
        panorama: ({ nav, ui }) => <Panorama d={panorama} nav={nav} ui={ui} />,
        eventos: () => <EnCamino que="Eventos" ruta="/caminante/admin/eventos" />,
        gente: () => <EnCamino que="Gente" ruta="/caminante/admin/reservas" />,
        recursos: () => <Recursos d={recursos} />,
        mas: () => <EnCamino que="Más" ruta="/caminante/admin" />,
      }}
      screens={{
        evento: () => <EnCamino que="Eventos" ruta="/caminante/admin/eventos" />,
        roster: () => <EnCamino que="Roster" ruta="/caminante/admin/reservas" />,
        encuesta: () => <EnCamino que="Encuesta" ruta="/caminante/admin/encuesta" />,
        cobro: () => <EnCamino que="Generar cobro" ruta="/caminante/admin/cobro" />,
      }}
    />
  );
}
