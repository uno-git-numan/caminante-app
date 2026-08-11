"use client";

// GENERAR COBRO — transcrita de `ScrCobro` (adm-screens-c.jsx): el link de pago
// por WhatsApp, que es el cobro asistido (el otro canal, el de la web, es
// self-serve y no pasa por aquí).
//
// Reusa `generarCobro` (lib/payments/cobro.ts) tal cual: dedupe de contacto en
// cascada, reserva `requested` por WhatsApp que NO consume cupo, y Payment Link
// de Stripe. Cero lógica de escritura nueva.
//
// Dos desviaciones del entregable, las dos por no inventar:
//   · El mockup calcula el precio en el teléfono ($2,550 × personas). El monto
//     de verdad lo resuelve el servidor (precio de la salida → precio de la
//     experiencia → nivel), así que el botón no promete una cifra: la cifra
//     aparece cuando el link existe, y es la que se va a cobrar.
//   · Experiencia y salida son listas, no texto libre: teclear un slug a mano
//     ya ha costado errores en el panel de escritorio.

import { useState } from "react";
import { generarCobro } from "@/lib/payments/cobro";
import type { MasMovil } from "@/lib/admin/movil/mas";
import type { Nav, Ui } from "./AppShell";
import { CopyBox, Empty, Fld, Gap, NavBar, Sel, Sub } from "./kit";

type Generado = { nombre: string; salida: string; url: string; monto: number; msg: string };

const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export default function Cobro({ d, nav, ui }: { d: MasMovil; nav: Nav; ui: Ui }) {
  const [slug, setSlug] = useState(d.cobro[0]?.slug ?? "");
  const [slotId, setSlotId] = useState("");
  const [nombre, setNombre] = useState("");
  const [pax, setPax] = useState("1");
  const [mail, setMail] = useState("");
  const [tel, setTel] = useState("");
  const [gen, setGen] = useState<Generado[]>([]);

  const exp = d.cobro.find((e) => e.slug === slug);
  const ok = !!slug && mail.trim().includes("@");

  if (d.cobro.length === 0) {
    return (
      <div className="adm-screen">
        <NavBar onBack={nav.pop} t="Generar cobro" s="link de pago por WhatsApp" />
        <div className="adm-pad">
          <div className="adm-card">
            <Empty ic="◌" t="No hay experiencias publicadas" p="Solo se puede cobrar una experiencia publicada." />
          </div>
        </div>
      </div>
    );
  }

  async function generar() {
    const salidaLabel = exp?.salidas.find((s) => s.id === slotId)?.label ?? "sin salida elegida";
    await ui.run("Cobro generado", async () => {
      const r = await generarCobro({
        slug,
        email: mail.trim(),
        fullName: nombre.trim() || undefined,
        phone: tel.trim() || undefined,
        numPeople: parseInt(pax, 10) || 1,
        slotId: slotId || null,
      });
      if (!r.ok) return { ok: false, error: r.error };
      const nom = nombre.trim();
      const msg =
        `Hola${nom ? " " + nom.split(" ")[0] : ""} 🌊 Aquí está tu link para apartar ` +
        `${parseInt(pax, 10) > 1 ? `sus ${pax} lugares` : "tu lugar"} en Caminante (${money(r.amountMxn)}):\n${r.url}\n\n` +
        `En cuanto se confirme el pago te mando el registro. Cualquier duda, aquí estoy.`;
      setGen((g) => [
        { nombre: nom || mail.trim(), salida: `${exp?.nombre ?? slug} · ${salidaLabel}`, url: r.url, monto: r.amountMxn, msg },
        ...g,
      ]);
      return { ok: true };
    });
  }

  const ultimo = gen[0];

  return (
    <div className="adm-screen">
      <NavBar onBack={nav.pop} t="Generar cobro" s="link de pago por WhatsApp" />
      <div className="adm-pad">
        <div className="adm-card" style={{ padding: "4px 16px 14px" }}>
          <Sel
            l="Experiencia"
            val={slug}
            set={(v) => {
              setSlug(v);
              setSlotId("");
            }}
            opts={d.cobro.map((e) => ({ v: e.slug, t: e.nombre }))}
          />
          <Sel
            l="Salida"
            val={slotId}
            set={setSlotId}
            hint={
              exp && exp.salidas.length === 0
                ? "Esta experiencia no tiene salidas abiertas: se cobra el precio base."
                : "Opcional. Define el precio por persona de esa fecha."
            }
            opts={[
              { v: "", t: "Sin salida específica" },
              ...(exp?.salidas ?? []).map((s) => ({ v: s.id, t: s.privada ? `${s.label} · privada` : s.label })),
            ]}
          />
          <div className="adm-2col">
            <Fld l="Nombre" val={nombre} set={setNombre} ph="Nombre del cliente" />
            <Fld l="Personas" val={pax} set={(v) => setPax(v.replace(/\D/g, "") || "1")} mono />
          </div>
          <Fld l="Correo" val={mail} set={setMail} ph="correo@cliente.mx" type="email" />
          <Fld l="Teléfono" val={tel} set={setTel} ph="55 0000 0000" type="tel" />
          <div className="adm-acts">
            <button
              className="adm-btn adm-btn-orange adm-btn-block"
              disabled={!ok || ui.pendiente}
              onClick={generar}
            >
              {ui.pendiente ? "Generando…" : "Generar link de pago"}
            </button>
          </div>
          {ui.pendiente && (
            <div className="adm-load-note" style={{ paddingTop: 6 }}>
              <span className="adm-spin"></span>
              Generando el cobro… la primera vez tarda hasta 20 s. No cierres — te avisamos aquí.
            </div>
          )}
        </div>

        {ultimo && (
          <>
            <Gap />
            <Sub pad>Listo para mandar · {money(ultimo.monto)}</Sub>
            <div className="adm-card" style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <CopyBox v={ultimo.url} onCopy={ui.copy} />
                <CopyBox v={ultimo.msg} txt onCopy={ui.copy} />
              </div>
            </div>
          </>
        )}

        {gen.length > 1 && (
          <>
            <Gap />
            <Sub pad>Generados en esta sesión</Sub>
            <div className="adm-card">
              {gen.slice(1).map((c, i) => (
                <div className="adm-ros" key={i}>
                  <span className="adm-av">{c.nombre.slice(0, 2).toUpperCase()}</span>
                  <span className="nm">
                    {c.nombre}
                    <small>
                      {c.salida} · {money(c.monto)}
                    </small>
                  </span>
                  <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => ui.copy(c.url)}>
                    Copiar
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        <Gap />
      </div>
    </div>
  );
}
