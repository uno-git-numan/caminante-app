// Módulo REUSABLE "Conectar cuenta de redes" — hoy Instagram. Vive dentro del
// Kit de Comunicación. Sin cuenta conectada → muestra el botón de conectar; con
// cuenta → muestra la cuenta + "Cambiar cuenta" / "Desconectar". El token JAMÁS
// llega aquí (fetchConnectedAccount devuelve una vista sin token).
//
// `returnTo` = a dónde volver tras el OAuth (la misma página del kit).
import { fetchConnectedAccount } from "@/lib/social/accounts";
import { instagramConfigured } from "@/lib/social/instagram";
import { conectarInstagram, desconectarInstagram } from "@/lib/social/actions";

function diasPara(iso: string | null): number | null {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

const card: React.CSSProperties = {
  border: "1px solid rgba(32,33,28,.12)",
  borderRadius: 16,
  padding: "16px 20px",
  margin: "18px 0 26px",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
};
const glyph: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 12,
  flex: "0 0 auto",
  background: "linear-gradient(45deg,#f9ce34,#ee2a7b 45%,#6228d7)",
  display: "inline-block",
};

export default async function ConexionRedes({ returnTo }: { returnTo: string }) {
  const cuenta = await fetchConnectedAccount("instagram");
  const configured = instagramConfigured();

  // ── Conectada ──────────────────────────────────────────────────────────────
  if (cuenta && cuenta.status === "connected") {
    const dias = diasPara(cuenta.tokenExpiresAt);
    const porVencer = dias !== null && dias <= 10;
    return (
      <div style={card}>
        <span style={glyph} aria-hidden />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: "#637154" }}>
            Instagram conectado
          </div>
          <div style={{ fontSize: 18, fontWeight: 500, marginTop: 2 }}>
            {cuenta.username ? `@${cuenta.username}` : cuenta.igUserId || "cuenta"}
          </div>
          <div style={{ fontSize: 13, color: porVencer ? "#c23c1c" : "rgba(32,33,28,.55)", marginTop: 2 }}>
            {dias === null ? "Token activo" : dias >= 0 ? `El acceso vence en ${dias} día${dias === 1 ? "" : "s"}${porVencer ? " — se renovará solo" : ""}` : "Acceso vencido — vuelve a conectar"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <form action={conectarInstagram}>
            <input type="hidden" name="returnTo" value={returnTo} />
            <button type="submit" className="btn btn-glass btn-sm">Cambiar cuenta</button>
          </form>
          <form action={desconectarInstagram}>
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="id" value={cuenta.id} />
            <button type="submit" className="btn btn-glass btn-sm">Desconectar</button>
          </form>
        </div>
      </div>
    );
  }

  // ── Sin conectar ─────────────────────────────────────────────────────────────
  return (
    <div style={card}>
      <span style={glyph} aria-hidden />
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: "#637154" }}>
          Publicar en redes
        </div>
        <div style={{ fontSize: 15, marginTop: 2, color: "#20211c" }}>
          Conecta la cuenta de Instagram para publicar el kit directo desde la plataforma (próximamente).
        </div>
        {!configured ? (
          <div style={{ fontSize: 12.5, color: "#8a6d3b", marginTop: 6 }}>
            ⏳ Falta que Luis pegue las llaves de la app de Meta (Instagram App ID/Secret) y registre el redirect_uri.
          </div>
        ) : null}
      </div>
      <form action={conectarInstagram}>
        <input type="hidden" name="returnTo" value={returnTo} />
        <button type="submit" className="btn btn-orange btn-sm" disabled={!configured}>
          Conectar Instagram
        </button>
      </form>
    </div>
  );
}
