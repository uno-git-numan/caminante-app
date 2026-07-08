import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { OP_INTENT_COOKIE } from "@/lib/auth/op-intent";
import { notifyAccesoOperador } from "@/lib/notifications/notify-admin";

export const dynamic = "force-dynamic";

// Si el usuario pidió cuenta de OPERADOR (cookie de intención), registra la
// solicitud: una fila en admin_whitelist con is_active=FALSE (pendiente). Eso
// NO da admin (roleForClient exige is_active=true) — solo queda a la espera de
// que Luis la apruebe en el panel. Idempotente por email (upsert que ignora si
// ya existe: jamás baja de admin activo a pendiente). Best-effort.
async function registrarSolicitudOperador(email: string, nombre: string): Promise<void> {
  try {
    const sb = createSupabaseAdminClient();
    const { data: existing } = await sb
      .from("admin_whitelist")
      .select("email, is_active")
      .eq("email", email)
      .maybeSingle();
    if (existing) return; // ya es admin activo o ya hay solicitud pendiente
    const { error } = await sb
      .from("admin_whitelist")
      .insert({ email, is_active: false, note: `solicitud operador: ${nombre || "sin nombre"}` });
    if (error) return;
    await notifyAccesoOperador({ email, nombre }).catch(() => {});
  } catch {
    /* nunca romper la bienvenida */
  }
}

// Aterrizaje post-auth para cuentas nuevas. Aún no existe un "home logueado":
// esta página da la bienvenida, confirma que el expediente quedó guardado y
// manda al sitio. Cuando exista el home de cuenta, este destino se actualiza.
export default async function BienvenidaPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/caminante/login?next=%2Fcaminante%2Fbienvenida");
  }

  // Nombre de pila si su contact ya existe (vía RLS)
  let firstName = "";
  let fullName = "";
  try {
    const sb = await createSupabaseServerClient();
    const { data: contact } = await sb
      .from("contacts")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();
    fullName = (contact?.full_name as string | null) || "";
    firstName = fullName.split(" ")[0] || "";
  } catch {
    // sin contact aún — saludo genérico
  }

  // ¿Pidió cuenta de operador? (cookie de intención puesta en el alta). Si sí,
  // registra la solicitud (whitelist is_active=false) y limpia la cookie.
  // Nota: un Server Component puede LEER cookies pero no borrarlas (Next 15). No
  // se borra: registrarSolicitudOperador es idempotente (ignora si ya existe la
  // fila) y la cookie expira sola en 1h.
  const jar = await cookies();
  const esOperador = jar.get(OP_INTENT_COOKIE)?.value === "1";
  if (esOperador && user.email) {
    await registrarSolicitudOperador(user.email.toLowerCase(), fullName || user.email);
  }

  if (esOperador) {
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-forest text-cream">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-olive">Solicitud recibida</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-lagoon sm:text-4xl">
          {firstName ? `Gracias, ${firstName}.` : "Gracias."}
        </h1>
        <p className="mt-5 max-w-[44ch] text-sm leading-relaxed text-olive">
          Tu cuenta ya está lista. Estamos revisando tu solicitud de <span className="font-semibold text-lagoon">operador</span>:
          en cuanto la aprobemos te damos acceso al panel para publicar y gestionar tus experiencias, y te avisamos
          por WhatsApp o correo.
        </p>
        <p className="mt-3 max-w-[44ch] text-sm leading-relaxed text-olive">
          Mientras tanto puedes explorar Caminante como viajero.
        </p>
        <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <a
            href="/caminante"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-lagoon px-7 py-3.5 text-sm font-semibold text-cream transition hover:bg-lagoon-light"
          >
            Explorar Caminante →
          </a>
          <a
            href="/caminante/perfil"
            className="inline-flex items-center justify-center rounded-full border border-sand bg-transparent px-7 py-3.5 text-sm font-semibold text-lagoon transition hover:border-dune hover:text-dune"
          >
            Ver mi espacio
          </a>
        </div>
        <p className="mt-8 text-xs text-olive/70">Caminante · Naturaleza en movimiento</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-forest text-cream">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
        </svg>
      </div>

      <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-olive">
        Tu cuenta está lista
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-lagoon sm:text-4xl">
        {firstName ? `Bienvenido, ${firstName}.` : "Bienvenido, caminante."}
      </h1>

      <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-olive">
        Gracias por registrarte. Tu expediente ya vive aquí: tus datos, tu perfil de
        seguridad y tus firmas te esperan para la próxima expedición —{" "}
        <span className="font-semibold text-lagoon">no tendrás que llenarlos de nuevo</span>.
      </p>
      <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-olive">
        La plataforma sigue creciendo, como todo lo vivo. Cada vez que vuelvas habrá algo
        nuevo esperándote.
      </p>

      <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <a
          href="/caminante"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-lagoon px-7 py-3.5 text-sm font-semibold text-cream transition hover:bg-lagoon-light"
        >
          Explorar Caminante →
        </a>
        <a
          href="/caminante/perfil"
          className="inline-flex items-center justify-center rounded-full border border-sand bg-transparent px-7 py-3.5 text-sm font-semibold text-lagoon transition hover:border-dune hover:text-dune"
        >
          Ver mi perfil
        </a>
      </div>

      <p className="mt-8 text-xs text-olive/70">
        Caminante · Naturaleza en movimiento
      </p>
    </div>
  );
}
