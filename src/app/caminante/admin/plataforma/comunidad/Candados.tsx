import type { OperadoraPlataforma } from "@/lib/plataforma/operadoras";

// LOS SEIS CANDADOS — compartidos por la tabla de operadoras y el cajón del
// pipeline, porque son la MISMA respuesta a la misma pregunta. Si cada pantalla
// dibujara los suyos, tarde o temprano una diría 3 de 6 y la otra 4 de 6.
//
// Se quedan JUNTOS aunque crucen las tres secciones del panel (dos legales, uno
// de dinero, uno de catálogo, dos operativos). Partirlos por área rompería lo
// único que los hace útiles: ver de un jalón qué falta. Lo que sí se distingue
// es DE QUIÉN es cada uno — así deja de ser un diagnóstico y se vuelve una
// lista de pendientes con dueño.

const PALOMA = (
  <svg className="m" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12.6l5.2 5.2L20 6.6" />
  </svg>
);
const TACHE = (
  <svg className="m" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export default function Candados({ o }: { o: OperadoraPlataforma }) {
  return (
    <div className="locks">
      {o.candados.map((c) => (
        <span key={c.clave} className={c.cumplido ? "lk ok" : "lk no"}>
          {c.cumplido ? PALOMA : TACHE}
          <span className="g">
            {c.nombre}
            <small>{c.detalle}</small>
          </span>
          <span className={c.toca === "casa" ? "own yo" : "own el"}>
            {c.toca === "casa" ? "Yo" : "Él"}
          </span>
        </span>
      ))}
    </div>
  );
}

/** La leyenda de quién destraba qué. Va bajo los candados. */
export function LlaveDeDuenos() {
  return (
    <div className="ownkey">
      <span className="yo">
        <b>Yo</b>Lo hace la casa: definir comisión, prender el panel, publicarle su experiencia y
        habilitar Connect.
      </span>
      <span className="el">
        <b>Él</b>Se le pide al operador: convenio y CSD.
      </span>
    </div>
  );
}
