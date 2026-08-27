import { redirect } from "next/navigation";
import AdminShell from "../ui/AdminShell";
import Biblioteca from "./Biblioteca";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import { fetchBiblioteca } from "@/lib/comunidad/biblioteca";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comunidad · Admin — Caminante" };

// COMUNIDAD — quién es la gente, no cuántos son.
//
// Dos mitades que no se parecen: el CRM (quién está preguntando y todavía no
// paga) y la Gente (quién ya viajó). Hoy sólo vive la segunda: el tablero
// necesita tarjetas, y `crm_cards` está vacía porque no ha entrado ninguna
// solicitud. Dibujarlo vacío con seis columnas y arrastre que no arrastra nada
// sería un control muerto — se construye cuando haya de dónde.
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
  const d = await fetchBiblioteca();

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

        {/* El segmentado del entregable. «CRM» todavía no existe y por eso NO se
            dibuja como botón muerto: aparece cuando haya tarjetas. */}
        <div className="cmseg">
          <button className="on" type="button">
            Gente<span className="ct">{d.conteos.todos}</span>
          </button>
        </div>
      </div>

      <div className="sec-head" style={{ marginTop: 18 }}>
        <div>
          <span className="eyebrow">
            <span className="sl">{"//"}</span> Gente
          </span>
          <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
            {letras(d.conteos.todos)} personas <em className="ac">que dejaron rastro.</em>
          </h2>
          <p className="desc">
            {d.conteos.vinieron} ya viajaron y {d.conteos.todaviaNo} todavía no — ésos son a quienes
            querrías invitar.
          </p>
        </div>
      </div>

      <Biblioteca d={d} />
    </AdminShell>
  );
}
