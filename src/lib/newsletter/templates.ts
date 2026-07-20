// PLANTILLAS DEL BOLETÍN — HTML de correo extraído VERBATIM del sistema de
// Claude Design («Caminante Newsletter - Sistema.html», 4 plantillas).
//
// ⚠️ NO "modernizar" esta maquetación. Es HTML de CORREO, no web: tablas
// role="presentation", CSS 100% inline, ancho fijo 600px, bgcolor en los <td>
// (Outlook ignora background en style), preheader oculto con &zwnj;&nbsp;, y
// meta color-scheme para que el modo oscuro no invierta los fondos. Cada correo
// pesa ~9KB — muy por debajo del corte de Gmail a 102KB (que trunca y mete el
// temido "[Mensaje recortado]").
//
// ⚠️ CORRECCIONES sobre el mockup (traía datos inventados — verificados contra
// la realidad antes de codificar):
//   · Firma: el mockup decía «— Andrea, guía Caminante». ANDREA NO EXISTE.
//     Las cartas las firma LUIS (decisión suya).
//   · Domicilio: decía «Av. de los Insurgentes Sur 1602, Crédito Constructor».
//     El real es el domicilio fiscal de NUMAN HUB S.A. de C.V., transcrito de
//     los PDFs de deslinde en public/legal/ (fuente legal resuelta), NO de
//     memoria.
//   · Salidas: listaba «Bosque de Ajusco» y «Nevado de Toluca», que no son
//     experiencias nuestras. El bloque es DATA-DRIVEN desde experience_slots.
//   · Baja: el mockup apuntaba a /baja fijo. Va el link HMAC firmado por
//     contacto (lib/email/unsubscribe) — el mismo que ya usa la encuesta.
import { unsubscribeUrl } from "@/lib/email/unsubscribe";

export type NewsletterTemplate = "carta" | "dato" | "guia" | "vivio";

export const TEMPLATE_NOMBRE: Record<NewsletterTemplate, string> = {
  carta: "La carta · la mensual",
  dato: "Un dato · corto y potente",
  guia: "Guía de campo · el editorial",
  vivio: "Así se vivió · post-viaje",
};

// Contenido EDITABLE de un boletín (lo que se guarda en newsletters.body).
// Todo opcional salvo lo mínimo: un bloque vacío simplemente no se renderiza —
// nunca se rellena con texto de muestra.
export type NewsletterBody = {
  kicker?: string; // "LA CARTA · JUL 2026"
  titulo?: string; // titular grande; **texto** → itálica naranja
  saludo?: string;
  intro?: string;
  apartados?: { t: string; b: string }[]; // subtítulo + párrafo
  dato?: { texto: string; fuente: string }; // SIEMPRE con su fuente
  numero?: { n: string; unidad?: string; frase?: string; parrafos?: string[]; fuente?: string };
  fichas?: { etiqueta?: string; nombre: string; alias?: string; texto: string; fotoUrl?: string }[];
  testimonio?: { texto: string; autor: string };
  galeria?: string[]; // urls de foto (Así se vivió)
  salidas?: { fecha: string; lugar: string; lugares: string; urgente?: boolean }[]; // data-driven
  salidaDestacada?: { titulo: string; detalle: string; url: string };
  pregunta?: string;
  cierre?: string;
  heroUrl?: string;
  ctaUrl?: string;
  ctaTexto?: string;
};

// ── Constantes de marca y datos legales ──────────────────────────────────────
const SITE = "https://caminante.numanhub.com";
const MARK_INK = `${SITE}/email/caminante-mark-ink.png`;
const MARK_CREMA = `${SITE}/email/caminante-mark-crema.png`;

// Domicilio fiscal REAL de NUMAN HUB S.A. de C.V. — transcrito de los PDFs de
// deslinde (public/legal/), no del mockup. Los correos comerciales deben llevar
// domicilio físico identificable del remitente.
const DOMICILIO =
  "NUMAN HUB, S.A. de C.V. · Prado Norte 525, Int. 204, Lomas de Chapultepec I Sección, Miguel Hidalgo, C.P. 11000, Ciudad de México.";
// Quien firma las cartas. (El mockup inventó a «Andrea»; no existe.)
const FIRMA = "Luis";

const SANS = "'Geist',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "'Geist Mono','Courier New',monospace";

const esc = (s: string): string =>
  (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// **texto** → itálica naranja (el acento del sistema visual). Se escapa ANTES.
function acento(s: string, color = "#ff5d36"): string {
  return esc(s).replace(
    /\*\*([^*]+)\*\*/g,
    `<em style="font-style:italic;color:${color}">$1</em>`,
  );
}

// **texto** → negrita (para el cuerpo de los datos).
function negrita(s: string): string {
  return esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:600">$1</strong>');
}

// Cabecera con sello + wordmark. `oscuro` = fondo carbón (sello crema).
function header(kicker: string, oscuro: boolean): string {
  const bg = oscuro ? "#20211c" : "#f6f3ec";
  const tinta = oscuro ? "#f6f3ec" : "#20211c";
  const kickerColor = oscuro ? "#c9b79c" : "#637154";
  const borde = oscuro ? "" : ";border-bottom:1px solid #ddd8ca";
  const mark = oscuro ? MARK_CREMA : MARK_INK;
  return `<tr><td style="padding:20px 36px 18px${borde}" bgcolor="${bg}">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
<td align="left" valign="middle"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td valign="middle" style="padding-right:10px"><img src="${mark}" width="26" height="26" alt="" style="display:block;width:26px;height:26px;border:0"></td><td valign="middle" style="font-family:${SANS};font-size:16px;font-weight:600;letter-spacing:.28em;color:${tinta}">CAMINANTE</td></tr></table></td>
<td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:.14em;color:${kickerColor}"><span style="color:#ff5d36">//</span> ${esc(kicker)}</td>
</tr></table>
</td></tr>`;
}

// Foto a sangre. Sin URL no se renderiza NADA (el mockup traía un recuadro
// "[ FOTO A SANGRE 600×320 ]" que jamás debe salir en un correo real).
function foto(url: string | undefined, alto: number, alt = ""): string {
  if (!url) return "";
  return `<tr><td style="padding:0"><img src="${esc(url)}" width="600" alt="${esc(alt)}" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>`;
}

// Pie con domicilio real y baja firmada por contacto.
function footer(motivo: string, despedida: string, unsubUrl: string, fondo = "#20211c"): string {
  return `<tr><td style="padding:0" bgcolor="${fondo}">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${fondo}"><tr><td style="padding:30px 44px 34px">
<p style="margin:0 0 6px;font-family:${SANS};font-size:15px;font-weight:600;letter-spacing:.26em;color:#f6f3ec">CAMINANTE</p>
<p style="margin:0 0 20px;font-family:${MONO};font-size:11px;letter-spacing:.1em;color:#8a8b80">experiencias en naturaleza con ciencia real · numan</p>
<p style="margin:0 0 18px;font-family:${SANS};font-size:13px;line-height:1.6;color:#c9b79c">${esc(DOMICILIO)}</p>
<p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.6;color:#9aa08c">${esc(motivo)}<br>${esc(despedida)} <a href="${esc(unsubUrl)}" style="color:#c9b79c;text-decoration:underline">Aquí te das de baja</a> — sin rodeos, con gusto.</p>
</td></tr></table>
</td></tr>`;
}

// Preheader: lo que se ve en la bandeja junto al asunto. Los &zwnj;&nbsp;
// evitan que el cliente rellene con el principio del cuerpo.
function preheader(texto: string, bg: string): string {
  return `<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:${bg};font-size:1px;line-height:1px">${esc(texto)} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</span>`;
}

// Bloque de próximas salidas — DATA-DRIVEN (el mockup listaba experiencias que
// no son nuestras). Sin salidas abiertas, el bloque entero desaparece.
function salidas(items: NonNullable<NewsletterBody["salidas"]>): string {
  if (!items.length) return "";
  const filas = items
    .map(
      (s) => `<tr><td style="padding:14px 0;border-bottom:1px solid #ddd8ca">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
<td align="left" style="font-family:${SANS};font-size:15px;color:#20211c"><strong style="font-weight:600">${esc(s.fecha)}</strong> &nbsp;·&nbsp; ${esc(s.lugar)}</td>
<td align="right" style="font-family:${MONO};font-size:12px;color:${s.urgente ? "#ff5d36" : "#637154"}">${esc(s.lugares)}</td>
</tr></table></td></tr>`,
    )
    .join("");
  return `<tr><td style="padding:20px 44px 8px" bgcolor="#f6f3ec">
<p style="margin:0 0 4px;font-family:${MONO};font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#637154"><span style="color:#ff5d36">//</span> próximas salidas</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${filas}</table>
</td></tr>`;
}

function botonClaro(texto: string, url: string): string {
  return `<tr><td style="padding:26px 44px 4px" bgcolor="#f6f3ec">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border:1.5px solid #20211c;border-radius:26px" bgcolor="#f6f3ec">
<a href="${esc(url)}" style="display:block;padding:13px 30px;font-family:${SANS};font-size:14px;font-weight:500;letter-spacing:.02em;color:#20211c;text-decoration:none">${esc(texto)} &nbsp;→</a>
</td></tr></table>
</td></tr>`;
}

// Cierre con pregunta al lector (la técnica §1 del playbook: ahí viven las
// respuestas). En correo la pregunta pide RESPONDER, no comentar.
function preguntaClara(pregunta: string, cierre: string, firmar: boolean): string {
  if (!pregunta && !cierre) return "";
  const firma = firmar ? ` — <strong style="font-weight:600">${esc(FIRMA)}</strong>, Caminante.` : "";
  return `<tr><td style="padding:30px 44px 34px" bgcolor="#f6f3ec">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #ddd8ca"><tr><td style="padding:26px 0 0">
<p style="margin:0 0 10px;font-family:${SANS};font-size:18px;line-height:1.5;font-weight:400;color:#20211c;font-style:italic">${esc(pregunta)}</p>
<p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.6;color:#4a4b43">${esc(cierre)}${firma}</p>
</td></tr></table>
</td></tr>`;
}

function doc(bg: string, contenido: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"></head>
<body style="margin:0;padding:0;background:${bg}">
<div style="background:${bg};padding:0;margin:0">${contenido}</div>
</body></html>`;
}

// ══════════════════ 1 · LA CARTA ══════════════════
function carta(b: NewsletterBody, pre: string, unsub: string): string {
  const apartados = (b.apartados ?? [])
    .map(
      (a, i) => `<tr><td style="padding:${i === 0 ? "14px" : "22px"} 44px 8px" bgcolor="#f6f3ec">
<p style="margin:0 0 8px;font-family:${SANS};font-size:19px;font-weight:600;color:#20211c">${esc(a.t)}</p>
<p style="margin:0 0 18px;font-family:${SANS};font-size:16px;line-height:1.68;color:#33342d">${esc(a.b)}</p>
</td></tr>`,
    )
    .join("");
  const dato = b.dato
    ? `<tr><td style="padding:8px 44px 8px" bgcolor="#f6f3ec">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid #ff5d36;background:#efeade"><tr><td style="padding:20px 24px" bgcolor="#efeade">
<p style="margin:0 0 6px;font-family:${SANS};font-size:16px;line-height:1.6;color:#20211c">${negrita(b.dato.texto)}</p>
<p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:.06em;color:#637154">FUENTE — ${esc(b.dato.fuente)}</p>
</td></tr></table>
</td></tr>`
    : "";
  return doc(
    "#e6e3da",
    `${preheader(pre, "#e6e3da")}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#e6e3da"><tr><td align="center" style="padding:0">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#f6f3ec">
${header(b.kicker || "LA CARTA", false)}
${foto(b.heroUrl, 320)}
<tr><td style="padding:36px 44px 8px" bgcolor="#f6f3ec">
<p style="margin:0 0 22px;font-family:${MONO};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#637154"><span style="color:#ff5d36">//</span> desde el campo · caminante</p>
${b.titulo ? `<p style="margin:0 0 20px;font-family:${SANS};font-size:29px;line-height:1.18;font-weight:300;color:#20211c;letter-spacing:-.01em">${acento(b.titulo)}</p>` : ""}
${b.saludo ? `<p style="margin:0 0 18px;font-family:${SANS};font-size:16px;line-height:1.68;color:#33342d">${esc(b.saludo)}</p>` : ""}
${b.intro ? `<p style="margin:0 0 18px;font-family:${SANS};font-size:16px;line-height:1.68;color:#33342d">${esc(b.intro)}</p>` : ""}
</td></tr>
${apartados}
${dato}
${salidas(b.salidas ?? [])}
${b.ctaUrl ? botonClaro(b.ctaTexto || "Ver todas las salidas", b.ctaUrl) : ""}
${preguntaClara(b.pregunta || "", b.cierre || "Responde este correo y cuéntanos — leemos cada respuesta.", true)}
${footer(
  "Recibes esta carta porque caminaste con nosotros o te suscribiste en caminante.numanhub.com.",
  "¿Ya no quieres estas cartas?",
  unsub,
)}
</table>
</td></tr></table>`,
  );
}

// ══════════════════ 2 · UN DATO ══════════════════ (fondo oscuro)
function dato(b: NewsletterBody, pre: string, unsub: string): string {
  const n = b.numero;
  const parrafos = (n?.parrafos ?? [])
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.7;color:#d8d4c7">${esc(p)}</p>`,
    )
    .join("");
  return doc(
    "#20211c",
    `${preheader(pre, "#20211c")}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#20211c"><tr><td align="center" style="padding:0">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#20211c">
${header(b.kicker || "UN DATO", true)}
${foto(b.heroUrl, 300)}
<tr><td style="padding:46px 44px 6px" bgcolor="#20211c" align="left">
<p style="margin:0 0 8px;font-family:${MONO};font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#c9b79c"><span style="color:#ff5d36">//</span> el dato de esta semana</p>
${n?.n ? `<p style="margin:0;font-family:${SANS};font-size:92px;line-height:.92;font-weight:300;color:#f6f3ec;letter-spacing:-.03em">${esc(n.n)}${n.unidad ? `<span style="font-size:34px;font-weight:400;color:#ff5d36"> ${esc(n.unidad)}</span>` : ""}</p>` : ""}
</td></tr>
<tr><td style="padding:22px 44px 8px" bgcolor="#20211c">
${n?.frase ? `<p style="margin:0 0 18px;font-family:${SANS};font-size:22px;line-height:1.35;font-weight:300;color:#f6f3ec">${acento(n.frase)}</p>` : ""}
${parrafos}
</td></tr>
${n?.fuente ? `<tr><td style="padding:8px 44px 26px" bgcolor="#20211c"><p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:.06em;color:#8a8b80">FUENTE — ${esc(n.fuente)}</p></td></tr>` : ""}
<tr><td style="padding:6px 44px 32px" bgcolor="#20211c">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #3a3d31"><tr><td style="padding:26px 0 0">
<p style="margin:0 0 10px;font-family:${SANS};font-size:19px;line-height:1.45;font-style:italic;color:#f6f3ec">${esc(b.pregunta || "")}</p>
<p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.6;color:#c9b79c">${esc(b.cierre || "Responde este correo con lo primero que pensaste. Nos gusta leerlos.")}</p>
</td></tr></table>
</td></tr>
${footer("Recibes estos datos porque caminaste con nosotros o te suscribiste.", "¿Ya no quieres estos datos?", unsub, "#181913")}
</table>
</td></tr></table>`,
  );
}

// ══════════════════ 3 · GUÍA DE CAMPO ══════════════════
function guia(b: NewsletterBody, pre: string, unsub: string): string {
  const fichas = (b.fichas ?? [])
    .map((f, i, arr) => {
      const ultima = i === arr.length - 1;
      const fotoFicha = f.fotoUrl
        ? `<tr><td style="padding:0"><img src="${esc(f.fotoUrl)}" width="512" alt="${esc(f.nombre)}" style="display:block;width:100%;height:auto;border:0"></td></tr>`
        : "";
      return `<tr><td style="padding:0 44px${ultima ? " 8px" : ""}">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #ddd8ca">
${fotoFicha}
<tr><td style="padding:22px 26px 24px" bgcolor="#efeade">
${f.etiqueta ? `<p style="margin:0 0 4px;font-family:${MONO};font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#637154">${esc(f.etiqueta)}</p>` : ""}
<p style="margin:0 0 3px;font-family:${SANS};font-size:24px;font-weight:600;color:#20211c">${esc(f.nombre)}</p>
${f.alias ? `<p style="margin:0 0 12px;font-family:${SANS};font-size:14px;font-style:italic;color:#637154">${esc(f.alias)}</p>` : ""}
<p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.6;color:#33342d">${esc(f.texto)}</p>
</td></tr>
</table>
</td></tr>${ultima ? "" : `<tr><td style="height:18px;line-height:18px;font-size:0" bgcolor="#f6f3ec">&nbsp;</td></tr>`}`;
    })
    .join("");
  return doc(
    "#e6e3da",
    `${preheader(pre, "#e6e3da")}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#e6e3da"><tr><td align="center" style="padding:0">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#f6f3ec">
${header(b.kicker || "GUÍA DE CAMPO", false)}
<tr><td style="padding:34px 44px 24px" bgcolor="#f6f3ec">
${b.titulo ? `<p style="margin:0 0 12px;font-family:${SANS};font-size:27px;line-height:1.2;font-weight:300;color:#20211c;letter-spacing:-.01em">${acento(b.titulo)}</p>` : ""}
${b.intro ? `<p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.65;color:#4a4b43">${esc(b.intro)}</p>` : ""}
</td></tr>
${fichas}
${b.dato ? `<tr><td style="padding:22px 44px 8px" bgcolor="#f6f3ec"><p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:.06em;color:#637154">FUENTE — ${esc(b.dato.fuente)}</p></td></tr>` : ""}
${salidas(b.salidas ?? [])}
${preguntaClara(b.pregunta || "", b.cierre || "Respóndenos y lo sumamos a la próxima guía. Y si conoces a alguien que ama el bosque, reenvíale esta carta.", false)}
${footer("Recibes estas guías porque caminaste con nosotros o te suscribiste.", "¿Ya no quieres estas guías?", unsub)}
</table>
</td></tr></table>`,
  );
}

// ══════════════════ 4 · ASÍ SE VIVIÓ ══════════════════
function vivio(b: NewsletterBody, pre: string, unsub: string): string {
  const g = b.galeria ?? [];
  const par =
    g.length >= 2
      ? `<tr><td style="padding:8px 44px 0" bgcolor="#f6f3ec">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
<td width="48%" style="padding:0"><img src="${esc(g[0])}" width="245" alt="" style="display:block;width:100%;height:auto;border:0"></td>
<td width="4%" style="font-size:0;line-height:0">&nbsp;</td>
<td width="48%" style="padding:0"><img src="${esc(g[1])}" width="245" alt="" style="display:block;width:100%;height:auto;border:0"></td>
</tr></table>
</td></tr>`
      : "";
  const pano =
    g.length >= 3
      ? `<tr><td style="padding:10px 44px 0" bgcolor="#f6f3ec"><img src="${esc(g[2])}" width="512" alt="" style="display:block;width:100%;height:auto;border:0"></td></tr>`
      : "";
  const testi = b.testimonio
    ? `<tr><td style="padding:32px 44px 8px" bgcolor="#f6f3ec">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid #ff5d36"><tr><td style="padding:6px 0 6px 24px">
<p style="margin:0 0 12px;font-family:${SANS};font-size:21px;line-height:1.42;font-weight:300;font-style:italic;color:#20211c">«${esc(b.testimonio.texto)}»</p>
<p style="margin:0;font-family:${MONO};font-size:12px;letter-spacing:.06em;color:#637154">— ${esc(b.testimonio.autor)}</p>
</td></tr></table>
</td></tr>`
    : "";
  const datoBloque = b.dato
    ? `<tr><td style="padding:24px 44px 8px" bgcolor="#f6f3ec">
<p style="margin:0 0 6px;font-family:${SANS};font-size:16px;line-height:1.6;color:#33342d">${negrita(b.dato.texto)}</p>
<p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:.06em;color:#637154">FUENTE — ${esc(b.dato.fuente)}</p>
</td></tr>`
    : "";
  const proxima = b.salidaDestacada
    ? `<tr><td style="padding:28px 44px 4px" bgcolor="#f6f3ec">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#20211c" style="border-radius:12px"><tr><td style="padding:26px 28px" bgcolor="#20211c">
<p style="margin:0 0 6px;font-family:${MONO};font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#c9b79c"><span style="color:#ff5d36">//</span> la próxima vez puedes ir tú</p>
<p style="margin:0 0 4px;font-family:${SANS};font-size:20px;font-weight:500;color:#f6f3ec">${esc(b.salidaDestacada.titulo)}</p>
<p style="margin:0 0 20px;font-family:${SANS};font-size:14px;line-height:1.55;color:#c9b79c">${esc(b.salidaDestacada.detalle)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border:1.5px solid #c9b79c;border-radius:26px"><a href="${esc(b.salidaDestacada.url)}" style="display:block;padding:13px 30px;font-family:${SANS};font-size:14px;font-weight:500;color:#f6f3ec;text-decoration:none">Ver la salida &nbsp;→</a></td></tr></table>
</td></tr></table>
</td></tr>`
    : "";
  return doc(
    "#e6e3da",
    `${preheader(pre, "#e6e3da")}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#e6e3da"><tr><td align="center" style="padding:0">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#f6f3ec">
${header(b.kicker || "ASÍ SE VIVIÓ", false)}
${foto(b.heroUrl, 300)}
<tr><td style="padding:34px 44px 22px" bgcolor="#f6f3ec">
${b.titulo ? `<p style="margin:0 0 16px;font-family:${SANS};font-size:27px;line-height:1.2;font-weight:300;color:#20211c;letter-spacing:-.01em">${acento(b.titulo)}</p>` : ""}
${b.intro ? `<p style="margin:0;font-family:${SANS};font-size:16px;line-height:1.68;color:#33342d">${esc(b.intro)}</p>` : ""}
</td></tr>
${par}${pano}${testi}${datoBloque}${proxima}
${preguntaClara(b.pregunta || "", b.cierre || "Responde este correo — te contamos cómo es un día completo.", false)}
${footer("Recibes este correo porque viniste a una salida Caminante.", "¿Ya no quieres saber de futuras salidas?", unsub)}
</table>
</td></tr></table>`,
  );
}

// ── API pública ──────────────────────────────────────────────────────────────
// `contactId` firma el link de baja de ESE destinatario (HMAC, sin login).
// Sin contacto (vista previa del admin) el link apunta a la página genérica.
export function renderNewsletter(
  template: NewsletterTemplate,
  body: NewsletterBody,
  preheaderTexto: string,
  contactId?: string,
): string {
  const unsub = contactId ? unsubscribeUrl(contactId) : `${SITE}/caminante/api/unsubscribe`;
  switch (template) {
    case "carta":
      return carta(body, preheaderTexto, unsub);
    case "dato":
      return dato(body, preheaderTexto, unsub);
    case "guia":
      return guia(body, preheaderTexto, unsub);
    case "vivio":
      return vivio(body, preheaderTexto, unsub);
  }
}

// Versión en texto plano (multipart → mejor deliverability, menos spam).
export function newsletterText(body: NewsletterBody, unsubUrl: string): string {
  const p: string[] = [];
  if (body.titulo) p.push(body.titulo.replace(/\*\*/g, ""));
  if (body.saludo) p.push(body.saludo);
  if (body.intro) p.push(body.intro);
  for (const a of body.apartados ?? []) p.push(`${a.t}\n${a.b}`);
  if (body.numero?.frase) p.push(`${body.numero.n} ${body.numero.unidad || ""}\n${body.numero.frase.replace(/\*\*/g, "")}`);
  for (const x of body.numero?.parrafos ?? []) p.push(x);
  if (body.numero?.fuente) p.push(`Fuente: ${body.numero.fuente}`);
  for (const f of body.fichas ?? []) p.push(`${f.nombre}${f.alias ? ` (${f.alias})` : ""}\n${f.texto}`);
  if (body.dato) p.push(`${body.dato.texto.replace(/\*\*/g, "")}\nFuente: ${body.dato.fuente}`);
  if (body.testimonio) p.push(`«${body.testimonio.texto}» — ${body.testimonio.autor}`);
  if (body.salidas?.length) {
    p.push(`Próximas salidas:\n${body.salidas.map((s) => `- ${s.fecha} · ${s.lugar} · ${s.lugares}`).join("\n")}`);
  }
  if (body.pregunta) p.push(body.pregunta);
  if (body.cierre) p.push(body.cierre);
  p.push(`Caminante by NUMAN · uno@numanhub.com\nDarte de baja: ${unsubUrl}`);
  return p.join("\n\n");
}
