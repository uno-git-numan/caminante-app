// UNA DIRECCIÓN ESCRITA EN UN TEXTO, COMO LIGA.
//
// Luis, 24 nov 2026, subiendo sus documentos: el renglón del Registro Nacional
// de Turismo decía dónde se tramita y la dirección era texto muerto. «Que este
// texto sea un link a tramitar.»
//
// El porqué de cada documento es una cadena del catálogo (`actividades.ts`) y
// también entra a los anexos que se firman, así que NO se le mete HTML: aquí
// se reconoce la dirección al pintar. Sólo sitios de gobierno (`.gob.mx`): una
// regla más ancha convertiría en liga cualquier «p.ej.» con punto.

const DIRECCION = /((?:[a-z0-9-]+\.)+gob\.mx)/gi;

export default function ConLigas({ texto }: { texto: string }) {
  const partes = texto.split(DIRECCION);
  if (partes.length === 1) return <>{texto}</>;
  return (
    <>
      {partes.map((p, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={`https://${p.toLowerCase()}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--orange)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}
          >
            {p}
          </a>
        ) : (
          p
        ),
      )}
    </>
  );
}
