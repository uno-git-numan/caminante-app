import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
  try {
    const sb = await createSupabaseServerClient();
    const { data: contact } = await sb
      .from("contacts")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();
    firstName = ((contact?.full_name as string | null) || "").split(" ")[0] || "";
  } catch {
    // sin contact aún — saludo genérico
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
