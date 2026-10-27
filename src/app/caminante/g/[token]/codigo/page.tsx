import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { fetchEspacio } from "@/lib/grupo/espacio";
import { celularOculto, fichaDelCodigo } from "@/lib/grupo/codigo";
import { pedirOtroCodigo, verificarYEntrar } from "@/lib/grupo/acciones";
import { EspShell, Nav } from "../ui";
import { CodigoInput, PedirOtro } from "../cliente";

// C2 · «Te mandamos un código». Seis casillas. El código llega por WhatsApp;
// si no se pudo, por correo (lib/grupo/codigo.ts dice por qué).

export const dynamic = "force-dynamic";

export default async function CodigoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; otro?: string }>;
}) {
  const { token } = await params;
  const { error, otro } = await searchParams;
  const e = await fetchEspacio(token);
  if (!e) notFound();

  const jar = await cookies();
  const id = jar.get("cam_codigo")?.value;
  const ficha = id && /^[0-9a-f-]{36}$/.test(id) ? await fichaDelCodigo(id) : null;
  if (!ficha || ficha.usado) redirect(`/caminante/g/${e.token}/entrar?error=${encodeURIComponent("Pide un código nuevo.")}`);

  const sub = `${e.anfitrion?.pila ? `Grupo de ${e.anfitrion.pila}` : "Salida privada"} · ${e.etiqueta}`;
  const porDonde = ficha.canal === "whatsapp" ? (
    <>
      Te mandamos un código por WhatsApp al <b>{celularOculto(ficha.celular)}</b>.
    </>
  ) : (
    <>
      No pudimos escribirte por WhatsApp al <b>{celularOculto(ficha.celular)}</b>, así que el código te llegó <b>por correo</b>. Revisa tu bandeja.
    </>
  );

  return (
    <EspShell>
      <div className="esp-authwrap">
        <Nav t="Verifica tu celular" sub={sub} backHref={`/caminante/g/${e.token}/entrar`} />
        <div className="esp-auth">
          <div className="pub-sec" style={{ paddingTop: 22 }}>
            <h2 style={{ marginTop: 0 }}>
              Te mandamos <em>un código.</em>
            </h2>
            <p>{porDonde}</p>
            {otro ? <p style={{ fontSize: 13.5, color: "var(--olive-d)", marginTop: 8 }}>Te mandamos otro código.</p> : null}
            {error ? (
              <p style={{ fontSize: 13.5, color: "var(--orange)", marginTop: 8 }} role="alert">
                {error}
              </p>
            ) : null}
            <form action={verificarYEntrar}>
              <input type="hidden" name="token" value={e.token} />
              <CodigoInput />
            </form>
            <div style={{ marginTop: 14 }}>
              <PedirOtro segundos={45} token={e.token} action={pedirOtroCodigo} />
            </div>
            <Link className="pub-cta pub-cta-ghost" style={{ width: "100%", marginTop: 10 }} href={`/caminante/g/${e.token}/entrar`}>
              Cambiar el número
            </Link>
          </div>
        </div>
      </div>
    </EspShell>
  );
}
