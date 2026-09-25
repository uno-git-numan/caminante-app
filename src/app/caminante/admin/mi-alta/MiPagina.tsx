"use client";

// «TU PÁGINA» — la bio y el Instagram, editables desde Mi perfil (lámina
// «Panel Operadora»: `.pf` con `.frm`, dos campos y ya). Guarda SÓLO esas dos
// columnas (`guardarMiPagina`); las fotos y el equipo siguen con la casa.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { guardarMiPagina } from "@/lib/operators/admin-actions";

const inp: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  background: "#fff",
  fontSize: 13.5,
  fontFamily: "inherit",
};

export default function MiPagina({
  operadorId,
  bio: bio0,
  instagram: ig0,
  porOtra,
}: {
  operadorId: string;
  bio: string;
  instagram: string;
  /** Cuando la casa edita por ella: se dice, no se esconde. */
  porOtra: string | null;
}) {
  const router = useRouter();
  const [bio, setBio] = useState(bio0);
  const [ig, setIg] = useState(ig0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, arranca] = useTransition();
  const cambio = bio !== bio0 || ig !== ig0;

  return (
    <div className="pf" style={{ padding: "14px 16px" }}>
      <div className="frm">
        <label style={{ display: "grid", gap: 5, fontSize: 12.5 }}>
          <span className="mut">Bio <span className="pill pub" style={{ marginLeft: 6 }}>Público</span></span>
          <textarea style={{ ...inp, minHeight: 84 }} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1200} />
          <span className="mut" style={{ fontSize: 11.5 }}>Público · lo lee el viajero en tu página</span>
        </label>
        <label style={{ display: "grid", gap: 5, fontSize: 12.5, marginTop: 12 }}>
          <span className="mut">Instagram <span className="pill pub" style={{ marginLeft: 6 }}>Público</span></span>
          <input style={inp} value={ig} onChange={(e) => setIg(e.target.value)} placeholder="tu.cuenta" maxLength={60} />
        </label>
        <div className="salfoot" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-orange btn-sm"
            disabled={!cambio || guardando}
            onClick={() =>
              arranca(async () => {
                setAviso(null);
                const r = await guardarMiPagina(operadorId, bio, ig);
                if (r.ok) {
                  setAviso(porOtra ? "Guardado a su nombre." : "Guardado.");
                  router.refresh();
                } else setAviso(r.error ?? "No se pudo guardar.");
              })
            }
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
          {aviso ? <span className="mut" style={{ fontSize: 12.5 }}>{aviso}</span> : null}
        </div>
      </div>
    </div>
  );
}
