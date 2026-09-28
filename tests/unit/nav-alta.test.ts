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
import { MI_ALTA_NAV, MI_PERFIL_NAV, navConAltaCerrada, navPara, sinAdministrarEquipo } from "@/app/caminante/admin/ui/nav";

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
    const casa = navPara("admin", false, "66ed7510");
    expect(casa[casa.length - 1]).toMatchObject({ key: "op-equipo", href: "/caminante/admin/mi-alta/equipo?operadora=66ed7510" });
  });
  it("«Mi perfil» sigue yendo al final, después de Equipo", () => {
    const n = navConAltaCerrada(navPara("operador"));
    expect(n[n.length - 1]).toBe(MI_PERFIL_NAV);
    expect(n[n.length - 2].key).toBe("op-equipo");
  });
});
