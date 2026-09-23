// Correos del PROGRAMA DE EMBAJADORES. Todos por sendViaResend (reintento
// 429/5xx, multipart, remitente "Luis · Caminante" — el default de todo correo
// a cliente). Best-effort: quien los llama no debe caerse si el correo falla.
//
// ⚠️ EL MARCO NO VIVE AQUÍ: está en `lib/email/plantilla.ts`, compartido con
// los correos de operadoras. Hasta el 23 sep 2026 este archivo traía su propia
// copia del mismo cascarón, y eso costó lo que cuestan las copias: la
// divergencia entre el HTML y el texto plano se arregló allá y aquí siguió
// intacta. Tres de estos cuatro correos perdían en texto su último párrafo —y
// en dos de ellos ese párrafo era el que importaba.
//
// Lo propio de este archivo es el rótulo y el copy.
import { sendViaResend } from "@/lib/email/resend";
import {
  type Bloque,
  ARENA,
  CREMA,
  crudo,
  esc,
  h1,
  LAGOON,
  marco,
  OLIVO,
  p,
  saludo,
} from "@/lib/email/plantilla";

const SITE = "https://caminante.numanhub.com";
const ADMIN_EMAIL = "uno@numanhub.com";

const shell = (bloques: Bloque[]) => marco("Programa de embajadores", bloques);

const enviar = (to: string, subject: string, correo: { html: string; texto: string }) =>
  sendViaResend(to, subject, correo.html, { ua: "caminante-embajadores/1.0", text: correo.texto });

/** Una liga dentro de un párrafo, con el sitio escrito legible. */
const liga = (url: string, texto: string) =>
  `<a href="${url}" style="color:${LAGOON};">${texto}</a>`;

// 1 · Confirmación al aplicante (al enviar el formulario).
export async function emailConfirmacionAplicacion(to: string, nombre: string | null): Promise<boolean> {
  const n = saludo(nombre);
  const correo = shell([
    h1(`Recibimos tu aplicación${n}.`),
    p("Gracias por querer caminar con nosotros. El programa es curado: leemos cada aplicación con calma y con cuidado."),
    p("Si tu perfil hace clic, te escribimos para agendar una llamada de 30 minutos y platicar. Si no por ahora, también te lo decimos — no dejamos a nadie en visto."),
    // Este párrafo NO llegaba al texto plano. Ahora sale del mismo bloque.
    p(`Mientras tanto puedes conocer nuestras experiencias en ${liga(`${SITE}/caminante`, "caminante.numanhub.com")}.`),
  ]);
  return enviar(to, "Recibimos tu aplicación al programa de embajadores", correo);
}

// 2 · Bienvenida (al APROBAR).
export async function emailBienvenidaEmbajador(to: string, nombre: string | null): Promise<boolean> {
  const n = saludo(nombre);
  const correo = shell([
    h1(`Bienvenido al programa${n}.`),
    p("Tu aplicación nos hizo clic. <strong>Ya eres parte del programa de embajadores de Caminante.</strong>"),
    p("El siguiente paso: te escribimos por WhatsApp para agendar una llamada de 30 minutos — ahí platicamos cómo trabaja el programa, eliges tu primera experiencia y firmamos el convenio (con la hoja de costeo a la vista, como debe ser)."),
    // ⚠️ Esta línea se perdía entera en texto plano, y es la que dice de qué se
    // trata el programa.
    p("Tu comunidad ya quiere vivir esto. Tráela."),
  ]);
  return enviar(to, "Bienvenido al programa de embajadores de Caminante", correo);
}

// 3 · "Por ahora no" (al RECHAZAR) — amable, deja la puerta abierta.
export async function emailRechazoAplicacion(to: string, nombre: string | null): Promise<boolean> {
  const n = saludo(nombre);
  const correo = shell([
    h1(`Gracias por aplicar${n}.`),
    p("Leímos tu aplicación con cuidado. Por ahora no vamos a avanzar — el programa arranca con muy pocas manos y estamos eligiendo perfiles que empatan con las experiencias que tenemos abiertas hoy."),
    p("Esto no es un no definitivo: el catálogo crece y el programa también. Si tu comunidad o tu proyecto cambian, nos encantará leerte de nuevo."),
    // ⚠️ En un correo de rechazo, ÉSTA es la línea que deja la puerta abierta —
    // y era justo la que no recibía quien lee en texto plano.
    p(`Mientras tanto, las puertas de nuestras salidas están abiertas para ti en ${liga(`${SITE}/caminante`, "caminante.numanhub.com")}.`),
  ]);
  return enviar(to, "Sobre tu aplicación al programa de embajadores", correo);
}

// 4 · Aviso al ADMIN de aplicación nueva (para que ninguna se quede en visto).
export async function emailAvisoAdminAplicacion(info: {
  nombre: string;
  email: string;
  whatsapp: string | null;
  perfil: string;
  links: string;
}): Promise<boolean> {
  const datos: [string, string][] = [
    ["Nombre", info.nombre],
    ["Correo", info.email],
    ["WhatsApp", info.whatsapp || "—"],
    ["Perfil", info.perfil],
    ["Redes", info.links],
  ];
  const fila = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;font-size:13px;color:${OLIVO};white-space:nowrap;vertical-align:top;">${k}</td><td style="padding:6px 0 6px 18px;font-size:14px;color:${LAGOON};">${esc(v)}</td></tr>`;

  const correo = shell([
    h1("Aplicación nueva de embajador"),
    // Una tabla no se convierte sola en una frase legible, así que su texto se
    // escribe a mano — pero al lado del HTML y del mismo dato, no en otro
    // lugar del archivo donde se pueda quedar viejo.
    crudo(
      `<tr><td style="padding:0 36px 10px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREMA};border:1px solid ${ARENA};border-radius:12px;"><tr><td style="padding:14px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${datos.map(([k, v]) => fila(k, v)).join("")}</table></td></tr></table></td></tr>`,
      datos.map(([k, v]) => `${k}: ${v}`).join("\n"),
    ),
    crudo(
      `<tr><td align="center" style="padding:14px 36px 8px;"><a href="${SITE}/caminante/admin/comunidad" target="_blank" style="display:inline-block;background:${LAGOON};color:#fff;text-decoration:none;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;padding:12px 28px;border-radius:999px;">Revisar en el panel</a></td></tr>`,
      `Revisar en el panel:\n${SITE}/caminante/admin/comunidad`,
    ),
  ]);
  return enviar(ADMIN_EMAIL, `Embajador aplica: ${info.nombre}`, correo);
}
