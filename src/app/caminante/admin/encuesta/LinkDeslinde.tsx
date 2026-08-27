"use client";

// COPIAR EL LINK de una persona, para mandárselo a mano — del DESLINDE antes
// del viaje, o de la ENCUESTA después.
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
// Sirve para las dos cosas porque el problema es el mismo: el correo no siempre
// llega, y tanto la firma como la respuesta hay que perseguirlas. Lo único que
// cambia es el mensaje — y por eso el mensaje vive aquí, en un solo lugar, en
// vez de duplicarse en cada pantalla que lo necesite.
//
// ⚠️ El de WhatsApp solo aparece si HAY teléfono. Un `wa.me/` sin número abre
// una pantalla vacía y se lee como que el sistema está roto.

import { useState } from "react";

export default function LinkDeslinde({
  link,
  telefono,
  nombre,
  experiencia,
  tipo = "deslinde",
}: {
  link: string;
  telefono: string | null;
  nombre: string;
  experiencia: string;
  /** Cambia el mensaje de WhatsApp, no el comportamiento. */
  tipo?: "deslinde" | "encuesta";
}) {
  const [copiado, setCopiado] = useState(false);

  // Solo el primer nombre: en WhatsApp el nombre completo suena a cobranza.
  const primerNombre = nombre.trim().split(/\s+/)[0] || "";
  const mensaje =
    tipo === "encuesta"
      ? // Después del viaje se pide un favor, no se cobra un trámite: el tono
        // cambia y se dice cuánto cuesta, que es lo que decide si lo abren.
        `Hola ${primerNombre}, ¿nos regalas dos minutos? Nos ayuda mucho saber cómo te fue en ${experiencia}, ` +
        `y de ahí sale lo que cambiamos para la próxima:\n${link}`
      : `Hola ${primerNombre}, te comparto el registro y la carta de deslinde de ${experiencia}. ` +
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
