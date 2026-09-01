import { redirect } from "next/navigation";
import AdminShell from "../../ui/AdminShell";
import { getCurrentRole } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchOperadorasPlataforma } from "@/lib/plataforma/operadoras";
import Operadoras from "./Operadoras";
import Pipeline from "./Pipeline";
import Vistas from "./Vistas";
import OperadorAppCard, { type OpAppView } from "./OperadorAppCard";
import AccesoCard from "./AccesoCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comunidad · Caminante plataforma" };

// COMUNIDAD DE LA PLATAFORMA — la gente de Caminante son las OPERADORAS.
//
// Es el paralelo exacto de Comunidad en el sombrero NUMAN, donde la gente son
// los clientes. Misma forma, misma posición en el nav, otra unidad: al cambiar
// de sombrero no hay que reaprender dónde vive nada.
//
// Tres vistas, que son tres momentos de la misma relación:
//   Solicitudes — quién está pidiendo entrar y espera un sí o un no.
//   Pipeline    — quién está en camino, por etapa.
//   Operadoras  — quién ya está, y si puede vender hoy.
//
// Las solicitudes de CLIENTE (pedir una fecha, un grupo privado) NO viven aquí:
// son de quien opera, y su lugar es el CRM del sombrero NUMAN.

const TZ = "America/Mexico_City";
const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: TZ });

type OpRow = {
  id: string; nombre_operadora: string; responsable: string; email: string; whatsapp: string;
  instagram: string | null; ciudad_estado: string; tipo_operacion: string; descripcion: string;
  antiguedad: string; salidas_ano: string | null; personas_salida: string | null;
  rango_precio: string | null; seguro_rc: string; primeros_auxilios: string; ratio_guias: string;
  incidentes: string; porque: string | null; conociste: string | null; status: string;
  llamada_meet_url: string | null; llamada_at: string | null; expediente: unknown;
  branding: unknown; branding_despues: boolean | null; created_at: string;
};
type WLRow = { email: string; is_active: boolean; note: string | null };

function nombreDeNota(note: string | null): string {
  const m = /solicitud operador:\s*(.+)/i.exec(note || "");
  return m ? m[1].trim() : "";
}

export default async function ComunidadPlataformaPage() {
  if ((await getCurrentRole()) !== "admin") redirect("/caminante/admin");

  const sb = createSupabaseAdminClient();
  const [ops, apps, wl] = await Promise.all([
    fetchOperadorasPlataforma(),
    sb
      .from("operator_applications")
      .select(
        "id, nombre_operadora, responsable, email, whatsapp, instagram, ciudad_estado, tipo_operacion, descripcion, antiguedad, salidas_ano, personas_salida, rango_precio, seguro_rc, primeros_auxilios, ratio_guias, incidentes, porque, conociste, status, llamada_meet_url, llamada_at, expediente, branding, branding_despues, created_at",
      )
      .in("status", ["pending", "calling", "docs"])
      .order("created_at", { ascending: false }),
    sb.from("admin_whitelist").select("email, is_active, note").eq("is_active", false),
  ]);

  const solicitudes = (apps.data ?? []) as unknown as OpRow[];
  const accesos = (wl.data ?? []) as WLRow[];
  const esperando = solicitudes.length + accesos.length;
  const enPipeline = ops.filter((o) => !o.esLaCasa && o.etapa !== "se_salieron").length;

  return (
    <AdminShell active="pl-comunidad">
      <div className="cmstick">
        <div className="sec-head">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Comunidad
            </span>
            <h1 className="display" style={{ marginTop: 10 }}>
              Aquí la gente <em className="ac">son las operadoras.</em>
            </h1>
            <p className="desc">
              El mismo lugar que en el sombrero NUMAN y la misma forma, con otra unidad. Lo que un
              cliente es allá, una operadora lo es aquí: alguien que llega, avanza y se queda.
            </p>
          </div>
        </div>
      </div>

      <Vistas
        solicitudes={esperando}
        pipeline={enPipeline}
        operadoras={ops.length}
        vistaPipeline={<Pipeline ops={ops} />}
        vistaOperadoras={<Operadoras ops={ops} />}
        vistaSolicitudes={
          <>
            <div className="sec-head" style={{ marginTop: 18 }}>
              <div>
                <span className="eyebrow">
                  <span className="sl">{"//"}</span> Solicitudes
                </span>
                <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
                  Alguien está <em className="ac">esperando respuesta.</em>
                </h2>
                <p className="desc">
                  Quien quiere <b>operar sus propias experiencias</b> sobre la plataforma, y quien ya
                  fue aprobado y espera que se le abra el panel. Aprobar aquí es de la casa: no es
                  algo que una operadora pueda hacer por otra.
                </p>
              </div>
            </div>

            {solicitudes.length === 0 ? (
              <div className="empty">Sin solicitudes de operadora abiertas.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {solicitudes.map((r) => (
                  <OperadorAppCard
                    key={r.id}
                    app={{
                      id: r.id,
                      nombreOperadora: r.nombre_operadora,
                      responsable: r.responsable,
                      email: r.email,
                      whatsapp: r.whatsapp,
                      instagram: r.instagram,
                      ciudadEstado: r.ciudad_estado,
                      tipo: r.tipo_operacion,
                      descripcion: r.descripcion,
                      antiguedad: r.antiguedad,
                      salidasAno: r.salidas_ano,
                      personasSalida: r.personas_salida,
                      rangoPrecio: r.rango_precio,
                      seguro: r.seguro_rc,
                      primerosAuxilios: r.primeros_auxilios,
                      ratioGuias: r.ratio_guias,
                      incidentes: r.incidentes,
                      porque: r.porque,
                      conociste: r.conociste,
                      status: r.status,
                      meetUrl: r.llamada_meet_url,
                      llamadaAt: r.llamada_at,
                      expediente: Array.isArray(r.expediente)
                        ? (r.expediente as OpAppView["expediente"])
                        : [],
                      marca: (r.branding as OpAppView["marca"]) ?? null,
                      marcaDespues: r.branding_despues === true,
                      fecha: fmt(r.created_at),
                    }}
                  />
                ))}
              </div>
            )}

            <div className="sec-head" style={{ marginTop: 24 }}>
              <span className="eyebrow">
                <span className="sl">{"//"}</span> Acceso al panel
              </span>
              <p className="subtitle">
                Quien se registró como operador y espera que se le abra el panel. El acceso{" "}
                <b>nunca</b> es automático.
              </p>
            </div>
            {accesos.length === 0 ? (
              <div className="empty">Sin solicitudes de acceso pendientes.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {accesos.map((r) => (
                  <AccesoCard key={r.email} email={r.email} nombre={nombreDeNota(r.note)} />
                ))}
              </div>
            )}
          </>
        }
      />
    </AdminShell>
  );
}
