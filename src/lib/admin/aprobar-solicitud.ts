import "server-only";

// APROBAR UNA SOLICITUD DE OPERADORA — el núcleo, sin guarda.
//
// Vive aparte de `operadores-app-actions.ts` porque ése es "use server": TODO
// lo que exporta es invocable desde el navegador, y un «aprobar» sin guarda
// ahí sería una puerta abierta. Aquí no se exporta nada al cliente.
//
// Lo llaman dos:
//   · `aprobarOperadorApp` — la casa, con su guarda (`puedeOnboarding`).
//   · `submitOperatorApplication` — el formulario público, SÓLO cuando la
//     llamada no es obligatoria (`llamadaObligatoria()`, ver llamada.ts).
//     Luis, 9 nov 2026: «por ahora sí haremos muchas llamadas, pero debería
//     poder pasar libre cuando escalemos».
//
// Sin sesión, `tomarSiLibre` y la atribución no hacen nada: una solicitud que
// se aprueba sola nace sin titular, que es la verdad.

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { atribuir, cerrarAtribucion, titularDe, tomarSiLibre } from "@/lib/equipo/atribucion";
import { correoEnSesion } from "@/lib/auth/authorization";
import { ensureOperador } from "@/lib/operators/alta";
import { sembrarPerfilDesdeSolicitud } from "@/lib/operadores/perfil";
import { marcaLista } from "@/lib/operators/marca";
import type { OperatorBranding } from "@/lib/operators/branding";
import { versionesConvenio, leerEstado, diasParaFirmar } from "@/lib/operadores/convenio";
import { emailConvenioPorFirmar, emailBienvenidaOperador } from "@/lib/operadores/emails";

export const PANEL = "/caminante/admin/plataforma/comunidad";

// `operatorId` solo lo llena la aprobación: la tarjeta lo necesita para
// ofrecer «Completar su expediente» sin esperar a que la página recargue.
export type Res = {
  ok: boolean;
  error?: string;
  operatorId?: string;
  /**
   * La acción sí ocurrió, pero el correo NO salió. Son dos cosas distintas y
   * juntarlas fue el defecto: agendar una llamada y avisarle a la operadora son
   * pasos separados, y el segundo puede fallar solo.
   */
  aviso?: string;
};

/**
 * ⚠️ EL CORREO SE ESPERA Y SE MIRA. Antes iba con `.catch(console.error)` y su
 * booleano se tiraba: `sendViaResend` devuelve `false` cuando Resend rechaza
 * —sin lanzar— así que un correo que nunca salió dejaba la pantalla diciendo
 * «invitación enviada». Es el mismo defecto de la encuesta: la marca era el
 * acuse del INTENTO, no del envío.
 */
export async function avisar(que: string, envio: Promise<boolean>): Promise<string | null> {
  try {
    return (await envio) ? null : `La ${que} NO salió. Revisa el correo y vuelve a intentar.`;
  } catch (e) {
    console.error(`${que}:`, e);
    return `La ${que} NO salió (error al enviar). Revisa el correo y vuelve a intentar.`;
  }
}

type App = {
  id: string;
  nombre_operadora: string;
  responsable: string;
  email: string;
  status: string;
  branding: OperatorBranding | null;
  operator_id: string | null;
  // Lo operativo que declaró: viaja a su perfil al aprobarlo.
  ciudad_estado: string | null;
  tipo_operacion: string | null;
  actividades: string[] | null;
  antiguedad: string | null;
  salidas_ano: string | null;
  personas_salida: string | null;
  rango_precio: string | null;
  seguro_rc: string | null;
  primeros_auxilios: string | null;
  ratio_guias: string | null;
  descripcion: string | null;
  instagram: string | null;
  whatsapp: string | null;
};

/** Carga la solicitud si está en alguno de los estados que permiten avanzar. */
export async function cargar(id: string, permitidos: string[]): Promise<App | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operator_applications")
    .select(
      "id, nombre_operadora, responsable, email, status, branding, operator_id, " +
        "ciudad_estado, tipo_operacion, actividades, antiguedad, salidas_ano, personas_salida, rango_precio, " +
        "seguro_rc, primeros_auxilios, ratio_guias, descripcion, instagram, whatsapp",
    )
    .eq("id", id)
    .maybeSingle();
  const app = data as App | null;
  return app && permitidos.includes(app.status) ? app : null;
}


export async function aprobarSolicitud(id: string): Promise<Res> {
  const app = await cargar(id, ["pending", "calling", "docs"]);
  if (!app) return { ok: false, error: "La solicitud ya fue decidida." };

  const alta = await ensureOperador({
    name: app.nombre_operadora,
    email: app.email,
    notes: `Operador aprobado desde solicitud ${id.slice(0, 8)} · ${new Date().toISOString().slice(0, 10)}`,
  });
  if (!alta.ok) return { ok: false, error: alta.error };

  const sb = createSupabaseAdminClient();

  // ⚠️ ESTO ES LO QUE HACE QUE EL EMBUDO PÚBLICO TERMINE EN ALGÚN LADO.
  // Aprobar YA NO reparte llaves de la casa (ese upsert a `admin_whitelist` se
  // quitó, ver el encabezado), pero al quitarlo el camino se quedó sin salida:
  // el operador aplicaba, se le hacía la llamada, se le pedían papeles, se
  // aprobaba, le llegaba un correo que dice «Entrar a la plataforma»… y no
  // podía entrar, porque `panel_activo` seguía en false. Nada fallaba: la
  // puerta simplemente no existía.
  //
  // Aprobar a un operador ES la decisión de darle su panel — el podado a sus
  // experiencias. Va aquí y no en `ensureOperador` porque esa función también
  // la usa la aprobación de EMBAJADORES, y un embajador vende, no opera.
  const { error: panelErr } = await sb
    .from("operators")
    .update({ panel_activo: true })
    .eq("id", alta.operatorId);
  if (panelErr) {
    console.error("aprobarOperadorApp panel:", panelErr);
    return { ok: false, error: "Se creó el operador pero no se pudo abrir su panel." };
  }

  // LA CARTERA NACE AQUÍ (0071). Quien llevó la solicitud se queda con la
  // operadora: desde hoy, el 10% de la comisión que numan le cobre es suyo
  // mientras la tenga. La solicitud se cierra como resuelta: ya no hay qué
  // tomar. Si nadie la llevaba (la casa sola), la operadora nace sin titular.
  await tomarSiLibre("solicitud", id);
  const titular = await titularDe("solicitud", id);
  if (titular) {
    const her = await atribuir({ staffId: titular.staffId, objeto: "operadora", objetoId: alta.operatorId, como: "heredada", por: await correoEnSesion() });
    if (!her.ok) console.error("aprobarOperadorApp atribución:", her.error);
  }
  await cerrarAtribucion("solicitud", id, "resuelta");

  // LO QUE DECLARÓ SE VUELVE SU EXPEDIENTE. Hasta aquí las actividades eran
  // texto en la solicitud; a partir de aprobarla son filas con estado propio, y
  // son las que deciden qué puede publicar.
  //
  // Nacen en `incompleta`, nunca en `aprobada`: aprobar a la OPERADORA no es
  // aprobar su buceo. Ese permiso se gana documento por documento, y darlo aquí
  // por barrer sería exactamente el candado global que la 0058 evitó.
  //
  // `onConflict` porque reaprobar una solicitud reencauzada no debe borrar el
  // avance de una actividad que ya estaba en revisión.
  const declaradas = (app.actividades ?? []).filter(Boolean);
  if (declaradas.length) {
    const { error: actErr } = await sb
      .from("operator_activities")
      .upsert(
        declaradas.map((actividad) => ({ operator_id: alta.operatorId, actividad })),
        { onConflict: "operator_id,actividad", ignoreDuplicates: true },
      );
    if (actErr) {
      // No se aborta: la operadora ya existe y su panel ya está abierto. Pero se
      // AVISA, porque sin estas filas su expediente sale vacío y parecería que
      // no declaró nada — un silencio que costaría una llamada.
      console.error("aprobarOperadorApp actividades:", actErr);
      return {
        ok: true,
        aviso: "El operador quedó aprobado, pero no se sembraron sus actividades. Revísalas en su expediente.",
      };
    }
  }

  // Lo que nos dio para ser aprobado —desde cuándo opera, su seguro, su ratio de
  // guías— es justo lo que a un viajero le da confianza, y hasta ahora se
  // quedaba enterrado en la solicitud. Se copia a su perfil, que es suyo y él
  // edita; la solicitud no se toca.
  await sembrarPerfilDesdeSolicitud(alta.operatorId, {
    id: app.id,
    ciudad_estado: app.ciudad_estado ?? null,
    tipo_operacion: app.tipo_operacion ?? null,
    antiguedad: app.antiguedad ?? null,
    salidas_ano: app.salidas_ano ?? null,
    personas_salida: app.personas_salida ?? null,
    seguro_rc: app.seguro_rc ?? null,
    primeros_auxilios: app.primeros_auxilios ?? null,
    ratio_guias: app.ratio_guias ?? null,
    descripcion: app.descripcion ?? null,
    instagram: app.instagram ?? null,
    whatsapp: app.whatsapp ?? null,
  }).catch((e) => console.error("sembrar perfil:", e));

  // La marca declarada al aplicar se copia al operador — pero NUNCA pisa una
  // que ya exista: si alguien ya la configuró desde el panel, esa manda.
  if (marcaLista(app.branding)) {
    const { data: op } = await sb
      .from("operators")
      .select("branding")
      .eq("id", alta.operatorId)
      .maybeSingle();
    if (!(op as { branding: unknown } | null)?.branding) {
      await sb.from("operators").update({ branding: app.branding }).eq("id", alta.operatorId);
    }
  }

  // ⚠️ AQUÍ ESTABA EL AGUJERO. Este paso hacía `upsert` en `admin_whitelist`, y
  // esa tabla no tiene niveles: quien está ahí es LA CASA. O sea que aprobar a un
  // operador externo le abría las 31 pantallas del panel — el ledger completo, el
  // CRM, los payouts de los demás operadores y la columna «Alergias / condiciones
  // / dieta» de todos los caminantes de todas las salidas.
  //
  // Ya no hace falta y NO debe volver: desde el rol «operador», el acceso al
  // panel se deriva de tener una fila viva en `operators` con ese correo, que es
  // justo lo que acaba de hacer `ensureOperador` arriba. El panel que ve está
  // podado a lo suyo (ver `lib/auth/alcance.ts` y `lib/auth/panel-operador.ts`).
  //
  // El interruptor para quitarle el acceso es `operators.active = false`.

  const { error } = await sb
    .from("operator_applications")
    .update({ status: "approved", operator_id: alta.operatorId, decided_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["pending", "calling", "docs"]);
  if (error) {
    console.error("aprobarOperadorApp update:", error);
    return { ok: false, error: "No se pudo cerrar la solicitud." };
  }

  const avisoBien = await avisar("bienvenida", emailBienvenidaOperador(app.email, app.responsable));

  // ⚠️ Y SI YA HAY CONVENIO PUBLICADO, SE LO DECIMOS DE UNA VEZ. De los seis
  // candados, el del convenio es el único que ella no puede empujar sola: si la
  // casa no ha publicado texto, su panel dice «La casa no ha publicado el
  // convenio» y no hay nada que hacer. Cuando SÍ lo hay, enterarse no puede
  // depender de que se le ocurra entrar a la pantalla.
  //
  // Se le enseña la ÚLTIMA publicada, que es la que le va a pintar la pantalla
  // de firma (ver `leerEstado`). Si todavía no es exigible, el correo dice
  // cuántos días faltan en vez de sonar a urgencia falsa.
  //
  // Best-effort: un correo que no sale no debe deshacer un alta que sí quedó.
  await avisarConvenioSiLoHay(app.email, app.responsable).catch(() => {});

  revalidatePath(PANEL);
  return { ok: true, operatorId: alta.operatorId, ...(avisoBien ? { aviso: avisoBien } : {}) };
}

/**
 * Le avisa del convenio, si es que hay uno publicado.
 *
 * Calla cuando no hay nada que firmar — que es el estado de hoy, 23 sep 2026:
 * `operator_agreement_versions` está vacía porque el texto sigue con el
 * abogado. Un correo que dice «firma tu convenio» cuando no existe el convenio
 * es peor que el silencio.
 */
async function avisarConvenioSiLoHay(email: string, responsable: string | null): Promise<void> {
  const versiones = await versionesConvenio();
  const { ultima } = leerEstado(versiones);
  if (!ultima) return;
  await emailConvenioPorFirmar(email, responsable, {
    titulo: ultima.titulo,
    version: ultima.version,
    dias: new Date(ultima.vigenteDesde) <= new Date() ? 0 : diasParaFirmar(ultima),
  });
}
