"use client";

// El shell del sitio público móvil — transcrito del <App/> de
// design/publico-movil/Caminante Sitio Publico App.html.
//
// La demo era una pila de React (`push`/`pop`) sin URLs. Aquí la pila la lleva
// el router de Next: cada pantalla es una ruta con su dirección. Lo que SÍ se
// conserva del entregable, porque es lo que le da el comportamiento de app:
//
//   · `.pub-scroll` es un contenedor con overflow propio (no la ventana). De ahí
//     cuelga la cabecera flotante que se vuelve crema al scrollear.
//   · La barra de pestañas solo aparece en las cuatro raíces; en una pantalla
//     "empujada" desaparece y manda el botón de regreso.
//   · Las hojas (menú, avísame) y el toast viven aquí, no en cada pantalla.

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { TabIcons } from "./atoms";

export type PubTab = "inicio" | "experiencias" | "aprende" | "espacio";

const TABS: { id: PubTab; href: string; lbl: string }[] = [
  { id: "inicio", href: "/caminante", lbl: "Inicio" },
  { id: "experiencias", href: "/caminante/experiencias", lbl: "Experiencias" },
  { id: "aprende", href: "/caminante/aprende", lbl: "Aprende" },
  { id: "espacio", href: "/caminante/entrar", lbl: "Mi espacio" },
];

type Hoja = { id: "menu" | "avisame"; params?: Record<string, string> };

type PubUI = {
  abrirHoja: (id: Hoja["id"], params?: Record<string, string>) => void;
  cerrarHoja: () => void;
  toast: (t: string, s?: string) => void;
};

const Ctx = createContext<PubUI | null>(null);
export const usePubUI = (): PubUI =>
  useContext(Ctx) || { abrirHoja: () => {}, cerrarHoja: () => {}, toast: () => {} };

export default function PubShell({
  children,
  /** La pestaña activa. `null` = pantalla empujada: sin barra, con regreso. */
  tab = null,
  /** Hay sesión: la cuarta pestaña dice «Mi espacio» y lleva al perfil. */
  sesion = false,
  /** Punto naranja en la pestaña: tiene un viaje próximo sin deslinde firmado. */
  pendiente = false,
  /** Deja aire abajo para la barra de compra fija (pantallas de experiencia y reservar). */
  buypad = false,
}: {
  children: ReactNode;
  tab?: PubTab | null;
  sesion?: boolean;
  pendiente?: boolean;
  buypad?: boolean;
}) {
  const [hoja, setHoja] = useState<Hoja | null>(null);
  const [toast, setToast] = useState<{ t: string; s?: string } | null>(null);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ui: PubUI = {
    abrirHoja: (id, params) => setHoja({ id, params }),
    cerrarHoja: () => setHoja(null),
    toast: (t, s) => {
      if (tRef.current) clearTimeout(tRef.current);
      setToast({ t, s });
      tRef.current = setTimeout(() => setToast(null), 4000);
    },
  };

  return (
    <Ctx.Provider value={ui}>
      <div className="pub">
        <div className="pub-app">
          <div className={"pub-scroll" + (buypad ? " buypad" : "")}>{children}</div>

          {tab ? (
            <nav className="pub-tabbar">
              {TABS.map((t) => (
                <Link
                  key={t.id}
                  href={t.id === "espacio" && sesion ? "/caminante/perfil" : t.href}
                  className={"pub-tab" + (tab === t.id ? " on" : "")}
                >
                  {TabIcons[t.id]}
                  <span>{t.id === "espacio" && !sesion ? "Entrar" : t.lbl}</span>
                  {t.id === "espacio" && pendiente ? <span className="dot" /> : null}
                </Link>
              ))}
            </nav>
          ) : null}

          {hoja ? <div className="pub-dim" onClick={ui.cerrarHoja} /> : null}
          {hoja?.id === "menu" ? <HojaMenu cerrar={ui.cerrarHoja} /> : null}
          {hoja?.id === "avisame" ? (
            <HojaAvisame cerrar={ui.cerrarHoja} toast={ui.toast} exp={hoja.params?.exp || ""} slug={hoja.params?.slug || ""} />
          ) : null}

          {toast ? (
            <div className="pub-toast">
              <span className="ok">✓</span>
              <span className="tx">
                <b>{toast.t}</b>
                {toast.s}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </Ctx.Provider>
  );
}

function HojaMenu({ cerrar }: { cerrar: () => void }) {
  // ⚠️ El entregable ponía `hola@numanhub.com`, que no existe en ningún lado.
  // El correo real de contacto es uno@numanhub.com.
  return (
    <div className="pub-sheet">
      <div className="grab" />
      <h2>Menú</h2>
      <div className="pub-menu" style={{ marginTop: 6 }}>
        <Link href="/caminante/nosotros" onClick={cerrar}>
          Nosotros · por qué caminamos<span className="go">›</span>
        </Link>
        <Link href="/caminante/embajadores" onClick={cerrar}>
          Embajadores<span className="go">›</span>
        </Link>
        <Link href="/caminante/facturacion" onClick={cerrar}>
          Facturación<span className="go">›</span>
        </Link>
        <Link href="/caminante/privacidad" onClick={cerrar}>
          Aviso de privacidad<span className="go">›</span>
        </Link>
        <a href="mailto:uno@numanhub.com">
          Contacto · uno@numanhub.com<span className="go">›</span>
        </a>
      </div>
    </div>
  );
}

function HojaAvisame({
  cerrar,
  toast,
  exp,
  slug,
}: {
  cerrar: () => void;
  toast: (t: string, s?: string) => void;
  exp: string;
  slug: string;
}) {
  const [mail, setMail] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function avisame() {
    setEnviando(true);
    try {
      const r = await fetch("/caminante/api/avisame", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: mail, slug }),
      });
      if (!r.ok) throw new Error();
      cerrar();
      toast("Anotado", `${mail} · te avisamos al abrir fecha`);
    } catch {
      toast("No se pudo", "Intenta de nuevo en un momento");
      setEnviando(false);
    }
  }

  return (
    <div className="pub-sheet">
      <div className="grab" />
      <h2>Te avisamos</h2>
      <p className="sd">Cuando abra una fecha de {exp}, te llega un correo. Solo eso.</p>
      <div className="pub-fld">
        <label>Correo</label>
        <input type="email" value={mail} onChange={(e) => setMail(e.target.value)} placeholder="tu@correo.mx" />
      </div>
      <div className="pub-acts">
        <button className="pub-cta pub-cta-ghost" onClick={cerrar}>
          Cancelar
        </button>
        <button className="pub-cta pub-cta-orange" disabled={!mail || enviando} onClick={avisame}>
          {enviando ? "Anotando…" : "Avísame"}
        </button>
      </div>
    </div>
  );
}

/** El formato de precio del entregable: $16.500 (punto como separador de miles). */
export const pfmt = (n: number) =>
  "$" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
