import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureContactLink } from "@/lib/crm/contacts";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

type ExperienceJoin = { data: { subtitle?: string; docTitle?: string } | null };
type SignatureRow = {
  id: string;
  waiver_version: string;
  waiver_doc_url: string | null;
  signed_at: string;
  identity_snapshot: { slot_label?: string } | null;
  experiences: ExperienceJoin | ExperienceJoin[] | null;
};

function expOf(s: SignatureRow): ExperienceJoin | null {
  if (!s.experiences) return null;
  return Array.isArray(s.experiences) ? s.experiences[0] ?? null : s.experiences;
}

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/caminante/login?next=%2Fcaminante%2Fperfil");
  }

  // Perfiles separados: el admin NO es viajero. Su "perfil" es el panel admin.
  if (await isCurrentUserAdmin()) {
    redirect("/caminante/admin");
  }

  // Refuerzo lazy de la liga user↔contact (cubre sesiones previas al deploy)
  try {
    await ensureContactLink(createSupabaseAdminClient(), user);
  } catch {
    // sin service-role local no hay liga, pero el perfil sigue leyendo vía RLS
  }

  // Lecturas vía RLS: las policies select_own existen exactamente para esto.
  const sb = await createSupabaseServerClient();
  const { data: contact } = await sb
    .from("contacts")
    .select("id, full_name, email, phone, city, birth_date, mailing_opt_in")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: medical } = contact
    ? await sb.from("medical_profiles").select("*").eq("contact_id", contact.id).maybeSingle()
    : { data: null };

  // Participantes guardados (hijos/acompañantes) — lectura vía RLS select_own.
  const { data: dependents } = contact
    ? await sb
        .from("dependents")
        .select("id, full_name, relationship, birth_date")
        .eq("guardian_contact_id", contact.id)
        .order("full_name", { ascending: true })
    : { data: null };

  const { data: signatures } = contact
    ? await sb
        .from("registrations")
        .select(
          "id, waiver_version, waiver_doc_url, signed_at, identity_snapshot, experiences ( data )",
        )
        .eq("contact_id", contact.id)
        .order("signed_at", { ascending: false })
    : { data: null };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <p className="text-[10px] uppercase tracking-[0.25em] text-olive">Tu expediente caminante</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-lagoon">Mi perfil</h1>
      <p className="mt-2 text-sm text-olive">
        Lo que guardes aquí se recuerda: en tu próxima experiencia solo confirmas y firmas.
      </p>

      <div className="mt-8">
        <ProfileForm
          email={user.email || ""}
          contact={
            contact
              ? {
                  fullName: (contact.full_name as string | null) || "",
                  phone: (contact.phone as string | null) || "",
                  city: (contact.city as string | null) || "",
                  birthDate: (contact.birth_date as string | null) || "",
                  mailingOptIn: !!contact.mailing_opt_in,
                }
              : null
          }
          medical={(medical as Record<string, string | null> | null) || null}
        />
      </div>

      {((dependents as { id: string; full_name: string; relationship: string | null; birth_date: string | null }[] | null) || []).length > 0 ? (
        <section className="mt-10 rounded-2xl border border-sand bg-white p-5">
          <h2 className="text-lg font-semibold text-lagoon">Mis participantes guardados</h2>
          <p className="mt-1 text-xs text-olive">
            Los perfiles de tus acompañantes (por ejemplo tus hijos). La próxima vez que reserves,
            los agregas con un toque sin volver a capturarlos.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(dependents as { id: string; full_name: string; relationship: string | null }[]).map((d) => (
              <span
                key={d.id}
                className="rounded-full border border-sand bg-cream/40 px-4 py-2 text-sm text-lagoon"
              >
                {d.full_name}
                {d.relationship ? <span className="text-olive"> · {d.relationship}</span> : null}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10 rounded-2xl border border-sand bg-white p-5">
        <h2 className="text-lg font-semibold text-lagoon">Mis registros firmados</h2>
        <p className="mt-1 text-xs text-olive">
          Cada firma es un documento congelado — refleja lo que declaraste ese día y no se puede
          editar. Si algo cambió, actualiza tu perfil arriba.
        </p>
        <div className="mt-4 space-y-3">
          {((signatures as unknown as SignatureRow[] | null) || []).map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sand bg-cream/40 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-lagoon">
                  {expOf(s)?.data?.subtitle || expOf(s)?.data?.docTitle || "Experiencia"}
                  {s.identity_snapshot?.slot_label ? ` · ${s.identity_snapshot.slot_label}` : ""}
                </p>
                <p className="text-xs text-olive">
                  Deslinde {s.waiver_version} · firmado el{" "}
                  {new Date(s.signed_at).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              {s.waiver_doc_url ? (
                <a
                  href={s.waiver_doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-forest underline"
                >
                  Ver documento
                </a>
              ) : null}
            </div>
          ))}
          {!signatures || (signatures as SignatureRow[]).length === 0 ? (
            <p className="text-sm text-olive">Aún no has firmado ningún registro.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
