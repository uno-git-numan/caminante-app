// EL NAV DEL ALTA — qué se abre mientras la operadora no termina su alta.
//
// Lámina v5: las seis secciones cerradas; Experiencias al firmar el convenio;
// todo al poder cobrar. Y lo decidido el 24 sep 2026: lo vendido nunca se
// cierra, para que una salida pagada no se quede sin su lista.
import { describe, expect, it } from "vitest";
import { estadoNav, rutaCerrada, seccionDe } from "@/lib/operadores/nav-alta";

describe("estadoNav", () => {
  it("EL CASO KÉNTRO: sin convenio, sin cobrar y sin ventas ⇒ todo cerrado", () => {
    expect(estadoNav({ puedeArmar: false, puedeCobrar: false, tieneVentas: false })).toBe("cerrado");
  });
  it("firmó el convenio ⇒ se prende Experiencias", () => {
    expect(estadoNav({ puedeArmar: true, puedeCobrar: false, tieneVentas: false })).toBe("experiencias");
  });
  it("puede cobrar ⇒ todo abierto", () => {
    expect(estadoNav({ puedeArmar: true, puedeCobrar: true, tieneVentas: false })).toBe("abierto");
  });
  it("EL CASO NOMÁDIKA: sigue en su alta pero tiene ventas pagadas ⇒ NADA se le cierra", () => {
    // Sus salidas vivas no se pueden quedar sin lista ni sin deslindes.
    expect(estadoNav({ puedeArmar: false, puedeCobrar: false, tieneVentas: true })).toBe("abierto");
  });
});

describe("rutaCerrada", () => {
  it("Mi alta y sus pantallas NUNCA se cierran: son por donde se termina el alta", () => {
    for (const r of ["/caminante/admin/mi-alta", "/caminante/admin/mi-alta/expediente", "/caminante/admin/mi-alta/convenio", "/caminante/admin/mi-alta/cobrar", "/caminante/admin/mi-alta/marca"]) {
      expect(rutaCerrada(r, "cerrado")).toBe(false);
    }
  });
  it("Panorama es `/caminante/admin` EXACTO, no todo lo que empieza así", () => {
    expect(seccionDe("/caminante/admin")?.nombre).toBe("Panorama");
    expect(seccionDe("/caminante/admin/")?.nombre).toBe("Panorama");
    expect(seccionDe("/caminante/admin/mi-alta")).toBeNull();
  });
  it("cada sección se lleva sus sub-rutas", () => {
    expect(seccionDe("/caminante/admin/experiencias/nueva")?.nombre).toBe("Experiencias");
    expect(seccionDe("/caminante/admin/roster/abc")?.nombre).toBe("Salidas");
    expect(seccionDe("/caminante/admin/kit/hongos")?.nombre).toBe("Comunicación");
    expect(seccionDe("/caminante/admin/pagos?x=1")?.nombre).toBe("Pagos");
  });
  it("un prefijo no se come rutas vecinas", () => {
    expect(seccionDe("/caminante/admin/pagosviejos")).toBeNull();
  });
  it("con Experiencias prendida, sólo ella se abre", () => {
    expect(rutaCerrada("/caminante/admin/eventos", "experiencias")).toBe(false);
    expect(rutaCerrada("/caminante/admin/salidas", "experiencias")).toBe(true);
    expect(rutaCerrada("/caminante/admin", "experiencias")).toBe(true);
  });
  it("lo que no es de las seis no lo cierra el alta (la lista blanca es otra puerta)", () => {
    expect(rutaCerrada("/caminante/admin/operadores", "cerrado")).toBe(false);
    expect(rutaCerrada("/caminante/admin/recursos", "cerrado")).toBe(false);
  });
});

// ── Cuando el alta cierra, «Mi alta» se vuelve «Mi perfil» a la derecha ──────
import { ADMIN_NAV, ligaDeEquipo, MI_ALTA_NAV, MI_PERFIL_NAV, NAV_CASA_ESENCIAL, NAV_PLATAFORMA, NAV_PLATAFORMA_ESENCIAL, navConAltaCerrada, navPara, sinAdministrarEquipo } from "@/app/caminante/admin/ui/nav";
import { SECCIONES_GUARDADAS, SECCIONES_GUARDADAS_PLATAFORMA } from "@/app/caminante/admin/ui/mas";

describe("navConAltaCerrada", () => {
  it("quita «Mi alta» del frente y pone «Mi perfil» al final, con la misma ruta", () => {
    const antes = navPara("operador");
    expect(antes[0]).toBe(MI_ALTA_NAV);
    const despues = navConAltaCerrada(antes);
    expect(despues.some((i) => i.label === "Mi alta")).toBe(false);
    expect(despues[despues.length - 1]).toBe(MI_PERFIL_NAV);
    expect(MI_PERFIL_NAV.href).toBe(MI_ALTA_NAV.href);
    expect(despues.length).toBe(antes.length);
  });
});

describe("«Equipo» es una pestaña de cada operadora (27 sep 2026)", () => {
  it("la operadora la ve al final; su equipo no; la casa con sombrero de una propia la ve apuntando a ésa", () => {
    const op = navPara("operador");
    expect(op[op.length - 1]).toMatchObject({ key: "op-equipo", href: "/caminante/admin/mi-alta/equipo" });
    expect(sinAdministrarEquipo(op).some((i) => i.key === "op-equipo")).toBe(false);
    expect(navPara("admin").some((i) => i.key === "op-equipo")).toBe(false);
    // Desde el menú esencial (23 nov 2026) «Equipo» ya no va al frente de la
    // casa: está en «Más», con la liga apuntando a la operadora del sombrero.
    expect(navPara("admin", false, "66ed7510").some((i) => i.key === "op-equipo")).toBe(false);
    expect(ligaDeEquipo("66ed7510")).toBe("/caminante/admin/mi-alta/equipo?operadora=66ed7510");
  });
  it("«Mi perfil» sigue yendo al final, después de Equipo", () => {
    const n = navConAltaCerrada(navPara("operador"));
    expect(n[n.length - 1]).toBe(MI_PERFIL_NAV);
    expect(n[n.length - 2].key).toBe("op-equipo");
  });
});

describe("el menú esencial de la casa (23 nov 2026)", () => {
  it("con el sombrero de una operadora: Salidas, Experiencias, Pagos y Más", () => {
    expect(navPara("admin").map((i) => i.label)).toEqual(["Salidas", "Experiencias", "Pagos", "Más"]);
    expect(navPara("admin", true).map((i) => i.label)).toEqual(["Mi alta", "Salidas", "Experiencias", "Pagos", "Más"]);
  });

  it("con el sombrero de numan: Operadoras y Más", () => {
    expect(NAV_PLATAFORMA_ESENCIAL.map((i) => i.label)).toEqual(["Operadoras", "Más"]);
  });

  it("nada se perdió: toda sección que salió del frente está listada en «Más»", () => {
    const alFrente = new Set(NAV_CASA_ESENCIAL.map((i) => i.href));
    const guardadas = new Set(SECCIONES_GUARDADAS.map((x) => x.href));
    for (const it of ADMIN_NAV) expect(alFrente.has(it.href) || guardadas.has(it.href!)).toBe(true);
    const alFrentePl = new Set(NAV_PLATAFORMA_ESENCIAL.map((i) => i.href));
    const guardadasPl = new Set(SECCIONES_GUARDADAS_PLATAFORMA.map((x) => x.href));
    for (const it of NAV_PLATAFORMA) expect(alFrentePl.has(it.href) || guardadasPl.has(it.href!)).toBe(true);
  });

  it("el menú de la operadora externa no cambió", () => {
    expect(navPara("operador").map((i) => i.label)).toEqual(["Mi alta", "Panorama", "Experiencias", "Comunicación", "Comunidad", "Salidas", "Equipo"]);
  });
});
