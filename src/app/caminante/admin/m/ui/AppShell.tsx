"use client";

// El caparazón de la app de admin en móvil. Transcrito del componente App de
// design/admin-movil/Caminante Admin App.html: barra de pestañas de 5 destinos,
// pila de pantallas con regreso propio, hojas, diálogos y toast con Deshacer.
//
// Diferencias con el prototipo, todas de integración (el markup no cambia):
//   · Los datos NO viven aquí. Llegan del servidor por props y las acciones son
//     server actions reales; tras cada una se refresca la ruta.
//   · La pila se refleja en el historial del navegador para que el gesto de
//     regreso del teléfono haga lo mismo que el botón ‹ de la pantalla (regla
//     app-first: el regreso vive en la pantalla, pero el del sistema no debe
//     sacarte de la app).

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Status, TabIcon } from "./kit";
import type { ReactNode } from "react";

export type ScreenId = string;
export type Frame = { id: ScreenId; params: Record<string, string> };

export type Nav = {
  tab: string;
  setTab: (t: string) => void;
  push: (id: ScreenId, params?: Record<string, string>) => void;
  pop: () => void;
};

export type Ui = {
  toastify: (t: string, s?: string, undo?: () => void) => void;
  copy: (v: string) => void;
  openSheet: (id: string, params?: Record<string, string>) => void;
  closeSheet: () => void;
  openDialog: (id: string, params?: Record<string, string>) => void;
  closeDialog: () => void;
  /** Corre una server action y refresca; muestra el resultado como toast. */
  run: (label: string, fn: () => Promise<{ ok: boolean; error?: string } | void>) => Promise<void>;
  pendiente: boolean;
};

export type RenderArgs = { nav: Nav; ui: Ui; params: Record<string, string> };

export type ShellProps = {
  /** Pantalla raíz de cada pestaña. */
  roots: Record<string, (a: RenderArgs) => ReactNode>;
  /** Pantallas que se apilan encima. */
  screens: Record<string, (a: RenderArgs) => ReactNode>;
  sheets?: Record<string, (a: RenderArgs) => ReactNode>;
  dialogs?: Record<string, (a: RenderArgs) => ReactNode>;
  /** Número del badge de «Más» (solicitudes pendientes). */
  badge?: number;
  tabInicial?: string;
};

const TABS: [string, string][] = [
  ["panorama", "Panorama"],
  ["eventos", "Eventos"],
  ["gente", "Gente"],
  // «Dinero» pasó a «Recursos», igual que en el panel de escritorio: es la
  // misma pregunta —qué entra y qué sale— y dos nombres para lo mismo confunden.
  ["recursos", "Recursos"],
  ["mas", "Más"],
];

export default function AppShell({
  roots,
  screens,
  sheets = {},
  dialogs = {},
  badge = 0,
  tabInicial = "panorama",
}: ShellProps) {
  const router = useRouter();
  const [tab, setTabState] = useState(tabInicial);
  const [stack, setStack] = useState<Frame[]>([]);
  const [sheet, setSheet] = useState<Frame | null>(null);
  const [dialog, setDialog] = useState<Frame | null>(null);
  const [toast, setToast] = useState<{ t: string; s?: string; undo?: () => void } | null>(null);
  const [pendiente, setPendiente] = useState(false);
  const [hora, setHora] = useState("");
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // La hora del status bar se pinta en el cliente: en el servidor sería la del
  // servidor y además reventaría la hidratación.
  useEffect(() => {
    const tick = () => setHora(new Date().toTimeString().slice(0, 5));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const toastify = useCallback((t: string, s?: string, undo?: () => void) => {
    if (toastT.current) clearTimeout(toastT.current);
    setToast({ t, s, undo });
    toastT.current = setTimeout(() => setToast(null), 4200);
  }, []);

  const copy = useCallback(
    (v: string) => {
      try {
        if (navigator.clipboard) navigator.clipboard.writeText(v);
      } catch {
        /* sin portapapeles: el valor sigue visible en pantalla */
      }
      toastify("Copiado", v.length > 52 ? v.slice(0, 52) + "…" : v);
    },
    [toastify],
  );

  const run = useCallback(
    async (label: string, fn: () => Promise<{ ok: boolean; error?: string } | void>) => {
      setPendiente(true);
      try {
        const res = await fn();
        if (res && res.ok === false) toastify("No se pudo", res.error || label);
        else toastify(label);
        router.refresh();
      } catch (e) {
        toastify("No se pudo", (e as Error).message);
      } finally {
        setPendiente(false);
      }
    },
    [router, toastify],
  );

  // ── Pila + historial ────────────────────────────────────────────────
  // Cada push agrega una entrada al historial; el gesto de regreso del sistema
  // desapila en vez de sacarte del panel.
  const pop = useCallback(() => {
    setStack((st) => st.slice(0, -1));
  }, []);

  useEffect(() => {
    const onPop = () => setStack((st) => (st.length ? st.slice(0, -1) : st));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const nav: Nav = {
    tab,
    setTab: (t) => {
      setTabState(t);
      setStack([]);
    },
    push: (id, params) => {
      setStack((st) => [...st, { id, params: params || {} }]);
      try {
        window.history.pushState({ adm: id }, "");
      } catch {
        /* historial no disponible: la pila sigue funcionando con el botón ‹ */
      }
    },
    pop: () => {
      pop();
      try {
        window.history.back();
      } catch {
        /* ya se desapiló arriba */
      }
    },
  };

  const ui: Ui = {
    toastify,
    copy,
    openSheet: (id, params) => setSheet({ id, params: params || {} }),
    closeSheet: () => setSheet(null),
    openDialog: (id, params) => setDialog({ id, params: params || {} }),
    closeDialog: () => setDialog(null),
    run,
    pendiente,
  };

  const top = stack[stack.length - 1];
  // ⚠️ Se montan como COMPONENTES (<Pantalla .../>), no llamando la función
  // (`Pantalla({...})`). Llamarla mete su cuerpo en el render de AppShell: sus
  // hooks pasarían a contar como hooks de este componente y al cambiar de
  // pestaña —que cambia cuántos se ejecutan— React truena con "rendered fewer
  // hooks than expected". Hoy ninguna pantalla usa hooks y por eso no ha
  // fallado; la primera que los use lo haría, y el error apuntaría aquí, no a
  // ella. Es también lo que marcaba el lint de React.
  const Pantalla = top ? screens[top.id] : roots[tab];
  const Sheet = sheet ? sheets[sheet.id] : null;
  const Dialog = dialog ? dialogs[dialog.id] : null;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [tab, stack.length]);

  return (
    <div className="adm-app">
      <Status hora={hora} warnTxt={top && top.id === "roster" ? "SIN SEÑAL" : null} />
      <div className={"adm-scroll" + (top ? " nopad" : "")} ref={scrollRef} key={tab + "/" + stack.length}>
        {Pantalla ? <Pantalla nav={nav} ui={ui} params={top ? top.params : {}} /> : null}
      </div>
      {!top && (
        <nav className="adm-tabbar">
          {TABS.map(([id, lbl]) => (
            <button
              key={id}
              className={"adm-tab" + (tab === id ? " on" : "")}
              onClick={() => nav.setTab(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <span style={{ color: "inherit" }}>{TabIcon[id]}</span>
              <span>{lbl}</span>
              {id === "mas" && badge > 0 && <span className="bdg">{badge}</span>}
            </button>
          ))}
        </nav>
      )}
      {(sheet || dialog) && (
        <div
          className="adm-dim"
          onClick={() => {
            ui.closeSheet();
            ui.closeDialog();
          }}
        ></div>
      )}
      {Sheet ? <Sheet nav={nav} ui={ui} params={sheet!.params} /> : null}
      {Dialog ? (
        <div className="adm-dlg-wrap">
          <Dialog nav={nav} ui={ui} params={dialog!.params} />
        </div>
      ) : null}
      {toast && (
        <div className="adm-toast">
          <span className="ok">✓</span>
          <span className="tx">
            <b>{toast.t}</b>
            {toast.s}
          </span>
          {toast.undo && <button onClick={toast.undo}>Deshacer</button>}
        </div>
      )}
    </div>
  );
}
