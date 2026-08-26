"use client";

// COPIAR EL LINK DEL DESLINDE de una persona, para mandárselo a mano.
//
// El recordatorio por correo existe y funciona, pero el correo no siempre
// llega: cae en promociones, el cliente puso mal su dirección, o simplemente no
// lo abre. Y el deslinde no es un trámite opcional — sin él la persona no
// debería subir al cerro. Cuando el correo falla, la salida es WhatsApp, que es
// por donde de todos modos se habla con los clientes.
//
// Dos botones y ninguno inventa nada: el link es el mismo que manda el correo
// (`/caminante/registro/<slug>?reserva=<id>`), ya trae la reserva, así que la
// persona llega con su lugar reconocido y no vuelve a elegir salida.
//
// ⚠️ El de WhatsApp solo aparece si HAY teléfono. Un `wa.me/` sin número abre
// una pantalla vacía y se lee como que el sistema está roto.

import { useState } from "react";

export default function LinkDeslinde({
  link,
  telefono,
  nombre,
  experiencia,
}: {
  link: string;
  telefono: string | null;
  nombre: string;
  experiencia: string;
}) {
  const [copiado, setCopiado] = useState(false);

  // Solo el primer nombre: en WhatsApp el nombre completo suena a cobranza.
  const primerNombre = nombre.trim().split(/\s+/)[0] || "";
  const mensaje =
    `Hola ${primerNombre}, te comparto el registro y la carta de deslinde de ${experiencia}. ` +
    `Es rápido y nos deja tus datos de emergencia por si algo pasa en el camino:\n${link}`;
  const wa = telefono ? `https://wa.me/${telefono.replace(/[^\d]/g, "")}?text=${encodeURIComponent(mensaje)}` : null;

  return (
    <>
      <button
        type="button"
        className="btn btn-glass btn-sm"
        style={{ padding: "3px 9px", fontSize: 11.5 }}
        title={link}
        onClick={async () => {
          await navigator.clipboard.writeText(link);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1600);
        }}
      >
        {copiado ? "✓ Copiado" : "Copiar link"}
      </button>
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-glass btn-sm"
          style={{ padding: "3px 9px", fontSize: 11.5 }}
          title={`Mandárselo por WhatsApp a ${telefono}`}
        >
          WhatsApp
        </a>
      ) : null}
    </>
  );
}
