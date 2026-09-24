"use client";

// EL ALTA DE LA CUENTA DE COBRO, SIN SALIR DE AQUÍ.
//
// La operadora captura sus datos en esta pantalla y se envían a verificación.
// ⚠️ NADA DE LO QUE SE TECLEA AQUÍ PASA POR NUESTRO SERVIDOR: Stripe.js lo
// convierte en tokens en el navegador y la acción del servidor sólo recibe
// esos tokens (ver `completarAltaCobroAction`). Por eso este componente no
// tiene un `<form action>` normal: el envío es en dos tiempos, tokenizar y
// mandar.
//
// Qué pide, según persona (lo que Stripe exige para México, alta-cobro.ts):
//   física → la persona: nombre, nacimiento, domicilio, RFC, teléfono, correo
//   moral  → la empresa (razón social, RFC, domicilio, teléfono), el
//            representante legal y cada dueño de 25% o más
//   ambas  → la CLABE, y la identificación sólo si la verificación la pide
//
// Aquí no se nombra al procesador: decisión de Luis (24 sep 2026), vigilada
// por el invariante #25. Lo que la operadora acepta está en su convenio.

import { useState } from "react";
import Link from "next/link";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import type { TokenCreateParams } from "@stripe/stripe-js";
import {
  ESTADOS_MX, clabeValida, nacimientoDe, rfcValido, sinVacios, telefonoE164,
} from "@/lib/payments/alta-cobro";
import { completarAltaCobroAction, guardarTipoPersona } from "@/lib/payments/connect-actions";

export type OperadoraAlta = {
  id: string;
  nombre: string;
  email: string;
  tipoPersona: "fisica" | "moral" | "";
  rfc: string;
  razonSocial: string;
  cpFiscal: string;
  convenioFirmado: boolean;
  tieneCuenta: boolean;
  verificada: boolean;
  recibeDepositos: boolean;
  /** Lo que la verificación todavía pide, ya en palabras (traducirPendientes). */
  pendientes: string[];
  errores: { campo: string; mensaje: string }[];
};

type Persona = {
  nombre: string; apellidos: string; nacimiento: string; rfc: string; telefono: string;
  correo: string; calle: string; cp: string; ciudad: string; estado: string;
  cargo: string; porcentaje: string;
};
const PERSONA_VACIA: Persona = {
  nombre: "", apellidos: "", nacimiento: "", rfc: "", telefono: "", correo: "",
  calle: "", cp: "", ciudad: "", estado: "", cargo: "", porcentaje: "",
};

function domicilio(p: { calle: string; cp: string; ciudad: string; estado: string }) {
  return { line1: p.calle, postal_code: p.cp, city: p.ciudad, state: p.estado, country: "MX" };
}

/** Lo que una persona (física, representante o dueño) manda en su token. */
function datosDePersona(p: Persona, rel?: TokenCreateParams.Person.Relationship): TokenCreateParams.Person {
  const tel = telefonoE164(p.telefono);
  return {
    first_name: p.nombre,
    last_name: p.apellidos,
    dob: nacimientoDe(p.nacimiento) ?? undefined,
    address: domicilio(p),
    id_number: p.rfc.trim().toUpperCase(),
    phone: tel ?? "",
    email: p.correo,
    ...(rel ? { relationship: rel } : {}),
  };
}

/** Errores que se pueden decir ANTES de mandar nada. */
function revisarPersona(p: Persona, quien: string): string | null {
  if (p.rfc && !rfcValido(p.rfc)) return `El RFC ${quien} no tiene forma de RFC.`;
  if (p.telefono && !telefonoE164(p.telefono)) return `El teléfono ${quien} son 10 dígitos.`;
  if (p.nacimiento && !nacimientoDe(p.nacimiento)) return `La fecha de nacimiento ${quien} no es una fecha.`;
  if (p.cp && !/^\d{5}$/.test(p.cp)) return `El código postal ${quien} son 5 dígitos.`;
  return null;
}

async function subirIdentificacion(f: File, pk: string): Promise<string> {
  // La identificación se sube directo desde el navegador con la llave
  // publicable; el servidor de Caminante nunca la ve. Devuelve un `file_…`
  // que viaja dentro del token.
  const fd = new FormData();
  fd.append("file", f);
  fd.append("purpose", "identity_document");
  const r = await fetch("https://uploads.stripe.com/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${pk}` },
    body: fd,
  });
  const j = (await r.json()) as { id?: string; error?: { message?: string } };
  if (!r.ok || !j.id) throw new Error(j.error?.message ?? "No se pudo subir la identificación.");
  return j.id;
}

let stripePromesa: Promise<Stripe | null> | null = null;
function stripeJs(pk: string) {
  if (!stripePromesa) stripePromesa = loadStripe(pk);
  return stripePromesa;
}

export default function AltaCobro({ operadora: o, llavePublica }: { operadora: OperadoraAlta; llavePublica: string }) {
  const [tipo, setTipo] = useState<"fisica" | "moral" | "">(o.tipoPersona);
  // Al crear, se pre-llena lo que ya sabemos; al completar, todo nace vacío:
  // el token de actualización sólo debe llevar lo que cambia.
  const [persona, setPersona] = useState<Persona>({
    ...PERSONA_VACIA,
    rfc: o.tieneCuenta ? "" : o.rfc,
    correo: o.tieneCuenta ? "" : o.email,
    cp: o.tieneCuenta ? "" : o.cpFiscal,
  });
  const [empresa, setEmpresa] = useState({
    razonSocial: o.tieneCuenta ? "" : o.razonSocial,
    rfc: o.tieneCuenta ? "" : o.rfc,
    telefono: "",
    calle: "", cp: o.tieneCuenta ? "" : o.cpFiscal, ciudad: "", estado: "",
  });
  const [representante, setRepresentante] = useState<Persona>({ ...PERSONA_VACIA, correo: o.tieneCuenta ? "" : o.email });
  const [repEsDueno, setRepEsDueno] = useState(true);
  const [duenos, setDuenos] = useState<Persona[]>([]);
  const [clabe, setClabe] = useState("");
  const [titular, setTitular] = useState(o.tieneCuenta ? "" : o.razonSocial || o.nombre);
  const [frente, setFrente] = useState<File | null>(null);
  const [reverso, setReverso] = useState<File | null>(null);
  const [acepto, setAcepto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");
  const [resultado, setResultado] = useState<{ verificada: boolean; pendientes: string[]; errores: { campo: string; mensaje: string }[] } | null>(null);

  const pideIdentificacion = o.pendientes.some((p) => p.startsWith("identificación oficial"));

  function campo<T extends object>(set: (f: (v: T) => T) => void, k: keyof T) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      set((v) => ({ ...v, [k]: e.target.value }));
  }
  const setDueno = (i: number, k: keyof Persona) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDuenos((ds) => ds.map((d, j) => (j === i ? { ...d, [k]: e.target.value } : d)));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setAviso("");
    setResultado(null);
    if (!tipo) return setAviso("Dinos si eres persona física o moral.");
    if (!acepto) return setAviso("Falta confirmar que los datos son tuyos.");
    if (clabe && !clabeValida(clabe)) return setAviso("Esa CLABE no cuadra: son 18 dígitos y el último los verifica.");
    if (!o.tieneCuenta && !clabe) return setAviso("Falta la CLABE donde quieres recibir tus ventas.");
    const malo =
      tipo === "fisica"
        ? revisarPersona(persona, "")
        : (empresa.rfc && !rfcValido(empresa.rfc) ? "El RFC de la empresa no tiene forma de RFC." : null) ??
          (empresa.telefono && !telefonoE164(empresa.telefono) ? "El teléfono de la empresa son 10 dígitos." : null) ??
          revisarPersona(representante, "del representante") ??
          duenos.map((d, i) => revisarPersona(d, `del dueño ${i + 1}`)).find(Boolean) ??
          null;
    if (malo) return setAviso(malo);

    setOcupado(true);
    try {
      const stripe = await stripeJs(llavePublica);
      if (!stripe) throw new Error("No se pudo abrir la verificación. Intenta de nuevo.");

      // Si el tipo de persona no estaba guardado, se guarda primero: la
      // pantalla del convenio y ésta tienen que decir lo mismo.
      if (o.tipoPersona !== tipo) {
        const r = await guardarTipoPersona(o.id, tipo);
        if (!r.ok) throw new Error(r.error ?? "No se pudo guardar el tipo de persona.");
      }

      const documento =
        frente ? { front: await subirIdentificacion(frente, llavePublica), ...(reverso ? { back: await subirIdentificacion(reverso, llavePublica) } : {}) } : undefined;

      let accountToken: string | undefined;
      const personTokens: string[] = [];

      if (tipo === "fisica") {
        const datos = sinVacios<TokenCreateParams.Account>({
          business_type: "individual",
          individual: { ...datosDePersona(persona), ...(documento ? { verification: { document: documento } } : {}) },
          tos_shown_and_accepted: true,
        });
        if (datos?.individual) {
          const r = await stripe.createToken("account", datos);
          if (r.error) throw new Error(r.error.message);
          accountToken = r.token?.id;
        }
      } else {
        const datos = sinVacios<TokenCreateParams.Account>({
          business_type: "company",
          company: {
            name: empresa.razonSocial,
            tax_id: empresa.rfc.trim().toUpperCase(),
            phone: telefonoE164(empresa.telefono) ?? "",
            address: domicilio(empresa),
            // Se declara que los dueños ya están completos con lo que se
            // manda abajo. Sin esta marca la verificación espera más dueños
            // para siempre.
            owners_provided: true,
          },
          tos_shown_and_accepted: true,
        });
        if (datos?.company) {
          const r = await stripe.createToken("account", datos);
          if (r.error) throw new Error(r.error.message);
          accountToken = r.token?.id;
        }
        const rep = sinVacios<TokenCreateParams.Person>({
          ...datosDePersona(representante, {
            representative: true,
            executive: true,
            title: representante.cargo,
            ...(repEsDueno ? { owner: true, percent_ownership: Number(representante.porcentaje) || undefined } : {}),
          }),
          ...(documento ? { verification: { document: documento } } : {}),
        });
        const personas = [rep, ...duenos.map((d) => sinVacios<TokenCreateParams.Person>(datosDePersona(d, { owner: true, percent_ownership: Number(d.porcentaje) || undefined })))];
        for (const p of personas) {
          if (!p || Object.keys(p).length <= 1) continue; // sólo la relación: no hay persona que mandar
          const r = await stripe.createToken("person", p);
          if (r.error) throw new Error(r.error.message);
          if (r.token) personTokens.push(r.token.id);
        }
      }

      let bankToken: string | undefined;
      if (clabe) {
        const r = await stripe.createToken("bank_account", {
          country: "MX",
          currency: "mxn",
          account_number: clabe.replace(/\s/g, ""),
          account_holder_name: titular,
          account_holder_type: tipo === "fisica" ? "individual" : "company",
        });
        if (r.error) throw new Error(r.error.message);
        bankToken = r.token?.id;
      }

      const res = await completarAltaCobroAction(o.id, { accountToken, personTokens, bankToken });
      if (!res.ok) throw new Error(res.error);
      setResultado({ verificada: res.verificada, pendientes: res.pendientes, errores: res.errores });
      // Lo tecleado ya viajó y no se guarda aquí: se limpia para que no quede en pantalla.
      setPersona(PERSONA_VACIA); setRepresentante(PERSONA_VACIA); setDuenos([]); setClabe(""); setFrente(null); setReverso(null);
    } catch (err) {
      setAviso(`No se enviaron los datos: ${(err as Error).message}`);
    } finally {
      setOcupado(false);
    }
  }

  if (!o.convenioFirmado) {
    return (
      <p className="mut" style={{ fontSize: 12.5, margin: "0 0 10px" }}>
        Primero firma tu convenio: ahí está lo que aceptas al abrir tu cuenta de cobro.{" "}
        <Link href="/caminante/admin/mi-alta">Ir a firmarlo</Link>
      </p>
    );
  }

  const pend = resultado?.pendientes ?? o.pendientes;
  const errs = resultado?.errores ?? o.errores;
  const verificada = resultado?.verificada ?? o.verificada;

  return (
    <div>
      {o.tieneCuenta || resultado ? (
        <div style={{ margin: "0 0 12px" }}>
          <p className="mut" style={{ fontSize: 12.5, margin: 0, ...(verificada ? { color: "var(--forest)" } : {}) }}>
            {verificada ? (
              <><b>Tu cuenta de cobro está verificada.</b> Tus ventas pueden entrar a tu nombre{o.recibeDepositos ? " y los depósitos ya llegan a tu CLABE." : "."}</>
            ) : resultado ? (
              <><b>Datos enviados.</b> La verificación tarda de minutos a un par de días; te avisamos por correo cuando quede.</>
            ) : (
              <><b>Tu cuenta de cobro está en verificación.</b></>
            )}
          </p>
          {pend.length > 0 ? (
            <>
              <p className="mut" style={{ fontSize: 12.5, margin: "6px 0 0" }}>Lo que todavía falta:</p>
              <ul style={{ fontSize: 12.5, margin: "4px 0 0", paddingLeft: 18 }}>
                {pend.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </>
          ) : null}
          {errs.length > 0 ? (
            <ul style={{ fontSize: 12.5, margin: "6px 0 0", paddingLeft: 18, color: "var(--terracotta, #b4532a)" }}>
              {errs.map((e, i) => <li key={i}><b>{e.campo}</b>: {e.mensaje}</li>)}
            </ul>
          ) : null}
        </div>
      ) : null}

      {verificada && pend.length === 0 ? null : (
        <form onSubmit={enviar}>
          <p className="mut" style={{ fontSize: 12.5, margin: "0 0 10px" }}>
            {o.tieneCuenta
              ? "Llena sólo lo que falta; lo demás déjalo en blanco. "
              : "Con esto abrimos tu cuenta de cobro. "}
            Lo que escribas aquí viaja cifrado a la verificación y <b>Caminante no lo guarda</b>.
          </p>

          {!o.tipoPersona ? (
            <div className="mini-form">
              <label>
                ¿Quién cobra?
                <select value={tipo} onChange={(e) => setTipo(e.target.value as "fisica" | "moral" | "")}>
                  <option value="">Elige</option>
                  <option value="fisica">Yo, persona física</option>
                  <option value="moral">Mi empresa (persona moral)</option>
                </select>
              </label>
            </div>
          ) : null}

          {tipo === "fisica" ? (
            <FormPersona titulo="Tú" p={persona} on={(k) => campo(setPersona, k)} />
          ) : tipo === "moral" ? (
            <>
              <h4 style={{ fontSize: 13, margin: "14px 0 4px" }}>La empresa</h4>
              <div className="mini-form" style={{ alignItems: "start" }}>
                <label>Razón social<input value={empresa.razonSocial} onChange={campo(setEmpresa, "razonSocial")} maxLength={200} /></label>
                <label>RFC<input value={empresa.rfc} onChange={campo(setEmpresa, "rfc")} maxLength={13} /></label>
                <label>Teléfono<input value={empresa.telefono} onChange={campo(setEmpresa, "telefono")} inputMode="tel" placeholder="10 dígitos" /></label>
              </div>
              <Domicilio p={empresa} on={(k) => campo(setEmpresa, k)} />
              <FormPersona titulo="El representante legal" p={representante} on={(k) => campo(setRepresentante, k)} conCargo />
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, margin: "8px 0" }}>
                <input type="checkbox" checked={repEsDueno} onChange={(e) => setRepEsDueno(e.target.checked)} />
                El representante también es dueño de 25% o más
              </label>
              {repEsDueno ? (
                <div className="mini-form">
                  <label>Su porcentaje<input value={representante.porcentaje} onChange={campo(setRepresentante, "porcentaje")} inputMode="numeric" placeholder="100" style={{ width: 80 }} /></label>
                </div>
              ) : null}
              {duenos.map((d, i) => (
                <div key={i}>
                  <FormPersona titulo={`Dueño ${i + 1} (25% o más)`} p={d} on={(k) => setDueno(i, k)} conPorcentaje />
                  <button type="button" className="btn btn-sm" onClick={() => setDuenos((ds) => ds.filter((_, j) => j !== i))}>Quitar este dueño</button>
                </div>
              ))}
              <button type="button" className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => setDuenos((ds) => [...ds, { ...PERSONA_VACIA }])}>
                + Otro dueño de 25% o más
              </button>
            </>
          ) : null}

          {tipo ? (
            <>
              <h4 style={{ fontSize: 13, margin: "14px 0 4px" }}>Dónde recibes tus ventas</h4>
              <div className="mini-form" style={{ alignItems: "start" }}>
                <label>CLABE<input value={clabe} onChange={(e) => setClabe(e.target.value)} inputMode="numeric" maxLength={22} placeholder="18 dígitos" /></label>
                <label>Titular de la cuenta<input value={titular} onChange={(e) => setTitular(e.target.value)} maxLength={120} /></label>
              </div>

              {pideIdentificacion || o.tieneCuenta ? (
                <>
                  <h4 style={{ fontSize: 13, margin: "14px 0 4px" }}>Identificación oficial{pideIdentificacion ? "" : " (sólo si te la pidieron)"}</h4>
                  <p className="mut" style={{ fontSize: 12, margin: "0 0 6px" }}>
                    {tipo === "moral" ? "La del representante legal. " : ""}INE por los dos lados, o pasaporte. Foto a color, JPG, PNG o PDF.
                  </p>
                  <div className="mini-form" style={{ alignItems: "start" }}>
                    <label>Frente<input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setFrente(e.target.files?.[0] ?? null)} /></label>
                    <label>Reverso<input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setReverso(e.target.files?.[0] ?? null)} /></label>
                  </div>
                </>
              ) : null}

              <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, margin: "14px 0 10px" }}>
                <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} style={{ marginTop: 3 }} />
                <span>
                  Confirmo que estos datos son míos y verdaderos, y que se usen para abrir y verificar mi cuenta de cobro
                  conforme a la cláusula Cuarta del <Link href="/caminante/admin/mi-alta/convenio">convenio que firmé</Link>.
                </span>
              </label>

              <button type="submit" className="btn btn-orange btn-sm" disabled={ocupado}>
                {ocupado ? "Enviando…" : o.tieneCuenta ? "Enviar lo que falta" : "Abrir mi cuenta de cobro"}
              </button>
            </>
          ) : null}
          {aviso ? <p className="mut" style={{ fontSize: 12.5, margin: "10px 0 0" }}>{aviso}</p> : null}
        </form>
      )}
    </div>
  );
}

function Domicilio({ p, on }: { p: { calle: string; cp: string; ciudad: string; estado: string }; on: (k: "calle" | "cp" | "ciudad" | "estado") => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void }) {
  return (
    <div className="mini-form" style={{ alignItems: "start" }}>
      <label>Calle y número<input value={p.calle} onChange={on("calle")} maxLength={200} /></label>
      <label>C.P.<input value={p.cp} onChange={on("cp")} inputMode="numeric" maxLength={5} style={{ width: 80 }} /></label>
      <label>Ciudad<input value={p.ciudad} onChange={on("ciudad")} maxLength={100} /></label>
      <label>
        Estado
        <select value={p.estado} onChange={on("estado")}>
          <option value="">Elige</option>
          {ESTADOS_MX.map((e) => <option key={e.clave} value={e.clave}>{e.nombre}</option>)}
        </select>
      </label>
    </div>
  );
}

function FormPersona({ titulo, p, on, conCargo, conPorcentaje }: {
  titulo: string;
  p: Persona;
  on: (k: keyof Persona) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  conCargo?: boolean;
  conPorcentaje?: boolean;
}) {
  return (
    <>
      <h4 style={{ fontSize: 13, margin: "14px 0 4px" }}>{titulo}</h4>
      <div className="mini-form" style={{ alignItems: "start" }}>
        <label>Nombre(s)<input value={p.nombre} onChange={on("nombre")} maxLength={100} placeholder="Como en tu RFC" /></label>
        <label>Apellidos<input value={p.apellidos} onChange={on("apellidos")} maxLength={100} /></label>
        <label>Fecha de nacimiento<input type="date" value={p.nacimiento} onChange={on("nacimiento")} /></label>
        <label>RFC<input value={p.rfc} onChange={on("rfc")} maxLength={13} /></label>
        <label>Teléfono<input value={p.telefono} onChange={on("telefono")} inputMode="tel" placeholder="10 dígitos" /></label>
        <label>Correo<input type="email" value={p.correo} onChange={on("correo")} maxLength={200} /></label>
        {conCargo ? <label>Cargo<input value={p.cargo} onChange={on("cargo")} maxLength={60} placeholder="Directora general" /></label> : null}
        {conPorcentaje ? <label>Porcentaje<input value={p.porcentaje} onChange={on("porcentaje")} inputMode="numeric" style={{ width: 80 }} /></label> : null}
      </div>
      <Domicilio p={p} on={on} />
    </>
  );
}
