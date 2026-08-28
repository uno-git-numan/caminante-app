import { redirect } from "next/navigation";
import AdminShell from "../ui/AdminShell";
import Biblioteca from "./Biblioteca";
import TableroCRM from "./Tablero";
import Vistas from "./Vistas";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import { fetchBiblioteca } from "@/lib/comunidad/biblioteca";
import { fetchTablero } from "@/lib/comunidad/tablero";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comunidad · Admin — Caminante" };

// COMUNIDAD — quién es la gente, no cuántos son.
//
// Dos mitades que no se parecen y son dos VISTAS, no dos secciones apiladas:
//   · CRM   — quién está preguntando y todavía no paga. Es trabajo: se mueve.
//   · Gente — quién ya viajó. Es cuidado: se hojea.
//
// El tablero nace vacío a propósito. Una solicitud de fecha ahora CREA su
// tarjeta en «Llegó» (lib/experiences/solicitudes.ts), así que se llena solo en
// cuanto alguien pregunte. El vacío no es un pendiente: es el primer día, y la
// pantalla lo dice con esas palabras.
//
// Diseño de design/comunidad/dc/comunidad.dc.html.

// El título del entregable dice «Sesenta personas», no «60». La voz editorial
// escribe los números; el dígito se ve a cifra de reporte. Hasta 99, que es
// donde vive esta comunidad por ahora; arriba de eso, el dígito y ya.
const UNO = ["Cero","Una","Dos","Tres","Cuatro","Cinco","Seis","Siete","Ocho","Nueve","Diez",
  "Once","Doce","Trece","Catorce","Quince","Dieciséis","Diecisiete","Dieciocho","Diecinueve"];
const DIEZ = ["","","Veinte","Treinta","Cuarenta","Cincuenta","Sesenta","Setenta","Ochenta","Noventa"];
function letras(n: number): string {
  if (n < 20) return UNO[n];
  if (n > 99) return String(n);
  const d = Math.floor(n / 10), u = n % 10;
  if (u === 0) return DIEZ[d];
  if (d === 2) return "Veinti" + UNO[u].toLowerCase();
  return `${DIEZ[d]} y ${UNO[u].toLowerCase()}`;
}

export default async function ComunidadPage() {
  if (!(await puedeEntrarAlPanel())) redirect("/caminante/login?next=/caminante/admin/comunidad");
  const [d, tablero] = await Promise.all([fetchBiblioteca(), fetchTablero()]);

  return (
    <AdminShell active="personas">
      <div className="cmstick">
        <div className="sec-head">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Comunidad
            </span>
            <h1 className="display" style={{ marginTop: 10 }}>
              Quién es la gente, <em className="ac">no cuántos son.</em>
            </h1>
            <p className="desc">
              Aquí no hay nada que perseguir: ni pagos, ni deslindes, ni pendientes. Eso es operación
              y vive en Salidas. Esto se hojea, se busca y se lee para saber quién es alguien antes
              de escribirle.
            </p>
          </div>
        </div>

      </div>

      <Vistas
        crm={tablero.total}
        gente={d.conteos.todos}
        tablero={
          <>
            <div className="sec-head" style={{ marginTop: 18 }}>
              <div>
                <span className="eyebrow">
                  <span className="sl">{"//"}</span> El pipeline
                </span>
                <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
                  Persona <em className="ac">por salida.</em>
                </h2>
                <p className="desc">
                  La unidad no es la persona: es la persona y el viaje del que están hablando.
                  Alguien puede estar preguntando por Barrancas y ser ya viajero de Hongos.
                </p>
              </div>
            </div>
            <TableroCRM d={tablero} />
          </>
        }
        biblioteca={
          <>
            <div className="sec-head" style={{ marginTop: 18 }}>
              <div>
                <span className="eyebrow">
                  <span className="sl">{"//"}</span> Gente
                </span>
                <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
                  {letras(d.conteos.todos)} personas <em className="ac">que dejaron rastro.</em>
                </h2>
                <p className="desc">
                  {d.conteos.vinieron} ya viajaron y {d.conteos.todaviaNo} todavía no — ésos son a
                  quienes querrías invitar.
                </p>
              </div>
            </div>
            <Biblioteca d={d} />
          </>
        }
      />
    </AdminShell>
  );
}
