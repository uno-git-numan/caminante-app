-- 0030 · WHITE-LABEL DE OPERADORES — branding + entidad legal (24 jul 2026)
--
-- Caminante como backend discreto: la web del funnel se viste con el branding
-- del operador («powered by NMN Caminante» chico). El tema es un override de
-- las CSS vars de la casa (~10 tokens) que emite themeCssFor() — ver
-- src/lib/operators/branding.ts, que define el CONTRATO del jsonb.
--
-- `legal` = la entidad que firma el deslinde en viajes del operador (decisión
-- de Luis 24 jul: el operador asume la responsabilidad operativa; NUMAN cobra
-- y factura como comercializador/plataforma).
--
-- SOLO ADITIVA. Namespace caminante. Sin policies nuevas: los SELECT públicos
-- existentes de operators (0020, is_public=true) ya exponen lo necesario; el
-- funnel lee con service-role de cualquier forma.

alter table public.operators
  add column if not exists branding jsonb,
  add column if not exists legal jsonb;

comment on column public.operators.branding is
  'Tema white-label: {logoUrl, logoDarkUrl?, colors:{primary,accent,bg,ink,panel?,forest?}, font:{display?{family,cssUrl?},body?}, favicon?, ogImageUrl?, footerLine?, poweredBy:"discreto"|"visible"} — contrato en src/lib/operators/branding.ts';
comment on column public.operators.legal is
  'Entidad legal del deslinde del operador: {razonSocial, rfc, domicilio, responsable?} — el deslinde de sus viajes se emite a su nombre; NUMAN aparece como comercializador/plataforma';
