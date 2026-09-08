// COTIZADOR — armar la cuenta de una salida antes de venderla.
//
// Nació de San Andrés (nov 2026): el proveedor cobra una tarifa POR CABEZA que
// baja al llegar a 12 cabezas, los dos guías van al 50% y cuentan para ese
// tramo, y la mitad del grupo toma una caminata que la otra mitad no toma.
// Ninguna de esas tres cosas cabía en una hoja de cálculo sin volverla a
// escribir cada vez, ni en los cuatro modos de costo que existían (0057).
//
// Vive dentro de Recursos y no en «+ experiencia» a propósito: aquí es donde ya
// se responde «cuánto me queda», y la cotización es la misma pregunta hecha
// antes en lugar de después.

import type { Metadata } from "next";
import Link from "next/link";
import { fetchCotizables } from "@/lib/admin/cotizacion";
import Encabezado from "../Encabezado";
import Cotizador from "./Cotizador";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Cotizador · Recursos — Caminante",
  robots: { index: false, follow: false },
};

export default async function CotizadorPage() {
  const { salidas, operadores } = await fetchCotizables();

  return (
    <>
      <Encabezado />
      <div className="page">
        <header className="phead">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Recursos · antes de vender
            </span>
            <h1 className="display">
              Cuánto queda, <em className="ac">y con cuántos.</em>
            </h1>
          </div>
          <p className="note">
            la comisión de Caminante <b>es un costo</b> y aquí ya está restada ·{" "}
            <Link href="/caminante/admin/recursos">volver a la escalera</Link>
          </p>
        </header>

        <Cotizador salidas={salidas} operadores={operadores} />
      </div>
    </>
  );
}
