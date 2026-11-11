-- 0080 · La ficha de la operadora deja de leerse con la llave pública (11 nov 2026).
--
-- HALLAZGO (11 nov 2026, construyendo la retención): la política
-- «operators_public_read» de la 0020 deja leer la FILA COMPLETA de toda
-- operadora con perfil público (is_public = true) a cualquiera que tenga la
-- llave pública de Supabase, que viaja en el navegador. Probado con esa llave:
-- devuelve RFC, razón social, correo, WhatsApp y la cuenta de Stripe de
-- Nomádika. Son datos personales (LFPDPPP) expuestos sin necesidad.
--
-- Nadie la usa: el perfil público (/caminante/operador/<slug>, lib/operators/
-- public.ts), la marca (branding.ts), el alcance y el rol leen `operators` con
-- el cliente de servicio (createSupabaseAdminClient), que no pasa por RLS.
-- Verificado por grep el 11 nov 2026: ninguna lectura de `operators` usa el
-- cliente del usuario.
--
-- Se quita la política. La RLS sigue prendida: sin políticas, sólo el
-- service-role lee y escribe, que es la convención de la casa
-- (.claude/rules/migraciones.md). No borra datos ni columnas.

drop policy if exists "operators_public_read" on public.operators;

comment on table public.operators is
  'Operadoras. RLS prendida SIN políticas desde la 0080: sólo el service-role la lee (el perfil público se arma en el servidor). Guarda datos personales y fiscales: no se vuelve a abrir a anon/authenticated.';
