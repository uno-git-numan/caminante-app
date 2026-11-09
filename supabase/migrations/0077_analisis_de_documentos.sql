-- 0077 · Lo que la plataforma LEYÓ de un documento del expediente (9 nov 2026).
--
-- Luis, haciendo el alta de una operadora en vivo: «La CSF no tiene
-- vencimiento. Podríamos hacer el chequeo de vencimiento internamente en
-- plataforma. Analizar el pdf con AI y ver su autenticidad.»
--
-- Al subir una Constancia de Situación Fiscal, la plataforma la lee (IA) y
-- confirma su idCIF contra el validador público del SAT. El resultado vive
-- aquí, junto al documento, para que quien revisa lo vea sin abrir el PDF:
--   { v, at, esConstancia, rfc, nombre, fechaEmision, codigoPostal, regimenes,
--     estatus, alertas[], sat: validada|no_emitida|sin_respuesta|sin_datos,
--     satUrl, coincideRfc, diasDeAntiguedad }
-- No guarda CURP ni domicilio: lo que no se usa para decidir no se copia.
--
-- ADITIVA: una columna nullable. Ninguna fila cambia al aplicarla.

alter table public.operator_documents
  add column if not exists analisis jsonb;

comment on column public.operator_documents.analisis is
  'Lo que la plataforma leyó del documento (hoy sólo la CSF: IA + validador del SAT). NULL = no se ha analizado. Ver src/lib/operadores/csf.ts.';
