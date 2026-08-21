// LA MARCA DEL OPERADOR — normalización y fuente única.
//
// Tres superficies capturan marca y las tres pasan por aquí:
//   1. el paso 5 del formulario público (`/caminante/operadores/aplicar`),
//   2. el expediente por link privado que se manda tras la llamada,
//   3. «Configurar marca» en el panel (`/admin/operadores/[id]/marca`).
//
// Sin este módulo cada una validaría a su manera y acabaríamos con tres
// contratos distintos para la misma columna — que es justo lo que pasó con el
// RFC, capturado en dos lugares hasta que la 0038 lo aplanó.
//
// ⚠️ El color se valida DE VERDAD (hex de 3 o 6 dígitos). Un color inválido no
// rompe visiblemente: `color-mix()` con basura devuelve el valor heredado y la
// página se ve Caminante, así que el operador juraría que su marca no jaló sin
// que nada haya fallado. Mejor rechazarlo en la puerta.

import type { OperatorBranding } from "@/lib/operators/branding";

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Normaliza un color a hex en minúsculas. Devuelve null si no es válido. */
export function color(v: unknown): string | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return null;
  const con = s.startsWith("#") ? s : `#${s}`;
  return HEX.test(con) ? con : null;
}

/**
 * URL de imagen para logo. Solo https y solo si termina en formato de imagen.
 *
 * Se acepta URL además de subida porque en el formulario PÚBLICO no hay subida
 * de archivos: un endpoint de carga sin sesión es una puerta abierta a que
 * cualquiera nos llene el bucket. Quien aplica pega la liga de su logo (su
 * sitio, su Drive, su Instagram) y la subida real ocurre después, ya en
 * superficies con sesión: el expediente con token o el panel.
 */
export function logoUrl(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return null;
    if (!/\.(png|jpe?g|svg|webp)$/i.test(u.pathname)) return null;
    return u.toString().slice(0, 500);
  } catch {
    return null;
  }
}

export type MarcaCruda = {
  logoUrl?: unknown;
  logoDarkUrl?: unknown;
  primary?: unknown;
  accent?: unknown;
  footerLine?: unknown;
  fontFamily?: unknown;
};

/**
 * Arma un `OperatorBranding` válido, o null si no hay lo mínimo.
 *
 * El mínimo son LOS DOS COLORES. Sin ellos `themeCssFor` no tiene qué emitir y
 * la superficie se vería Caminante — o sea, marca a medias es peor que sin
 * marca: promete algo que no cumple. El logo sí es opcional: hay operadores que
 * solo tienen paleta al arrancar.
 */
export function armarMarca(c: MarcaCruda): OperatorBranding | null {
  const primary = color(c.primary);
  const accent = color(c.accent);
  if (!primary || !accent) return null;

  const b: OperatorBranding = { logoUrl: logoUrl(c.logoUrl) ?? "", colors: { primary, accent } };

  const dark = logoUrl(c.logoDarkUrl);
  if (dark) b.logoDarkUrl = dark;

  const pie = String(c.footerLine ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
  if (pie) b.footerLine = pie;

  const fam = String(c.fontFamily ?? "").replace(/[^\w\s-]/g, "").trim().slice(0, 60);
  if (fam) b.font = { family: fam };

  return b;
}

/** Lee la marca de un FormData con los nombres que usan los tres formularios. */
export function marcaDeFormData(fd: FormData): OperatorBranding | null {
  return armarMarca({
    logoUrl: fd.get("marcaLogo"),
    logoDarkUrl: fd.get("marcaLogoOscuro"),
    primary: fd.get("marcaPrimary"),
    accent: fd.get("marcaAccent"),
    footerLine: fd.get("marcaPie"),
    fontFamily: fd.get("marcaFuente"),
  });
}

/** ¿Está completa para vestir superficies? Lo consultan el panel y los correos. */
export function marcaLista(b: OperatorBranding | null | undefined): boolean {
  return !!(b && color(b.colors?.primary) && color(b.colors?.accent));
}
