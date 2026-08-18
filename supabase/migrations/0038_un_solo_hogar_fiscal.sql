-- 0038 · Un solo hogar para el dato fiscal, y un CSD que sí cabe
--
-- ADITIVA en columnas. Mueve datos dentro de `operators.legal` (jsonb) — no borra
-- ninguna columna. Va acompañada de código: aplicarla sin promover el commit
-- dejaría el pie del portal del operador sin razón social.
--
-- ── Problema 1 · el RFC vivía en dos lugares ────────────────────────────────
--
-- `operators.legal` (jsonb, 0030) guardaba `rfc` y `razonSocial`, y la 0036
-- agregó las columnas planas `rfc` y `razon_social` para el emisor del CFDI.
-- Kéntro tenía su RFC en el jsonb y las planas en NULL: `operadorListo` lo
-- reportaba como faltante estando capturado. Es la misma forma de bug que
-- `platform_fee_pct` vs `commission_pct` (0037) — un dato con dos casas termina
-- con dos verdades.
--
-- Decisión: **las columnas PLANAS son la fuente**. Son las que lee el gate y las
-- que consume Facturapi, y admiten lo que el jsonb nunca tuvo (régimen fiscal y
-- CP fiscal, sin los cuales no se puede timbrar).
--
-- `legal` se queda con lo que SÍ es suyo y no cabe en las planas: el domicilio y
-- el responsable que aparecen en el deslinde. Son cosas distintas aunque hoy
-- coincidan: `legal` describe a quien RESPONDE por el viaje, las planas a quien
-- EMITE la factura.
--
-- ── Problema 2 · el CSD son dos archivos ────────────────────────────────────
--
-- El SAT entrega `.cer` (certificado) y `.key` (llave privada) y los dos hacen
-- falta para timbrar. La 0036 dejó una sola `csd_path`: guardar uno solo deja el
-- expediente inservible, y deducir el otro por convención de nombres sería un
-- parche. Se renombra a `csd_cer_path` y se agrega `csd_key_path`.
--
-- El rename es seguro: hoy `csd_path` está en NULL en los dos operadores (nadie
-- ha subido un CSD todavía), así que no se mueve un solo byte.
--
-- ⚠️ La CONTRASEÑA del CSD sigue sin tener columna, y es a propósito: va directo
-- a Facturapi al crear la organización y no se persiste de nuestro lado.

begin;

-- ── 1 · Migrar el dato antes de quitarlo de su casa vieja ───────────────────
-- `coalesce` con la plana primero: si alguien ya capturó el dato en el flujo
-- nuevo, ese gana. El jsonb solo rellena lo que está vacío — migrar no puede
-- pisar lo más reciente.
update public.operators
   set rfc          = coalesce(nullif(trim(rfc), ''),          nullif(trim(legal->>'rfc'), '')),
       razon_social = coalesce(nullif(trim(razon_social), ''), nullif(trim(legal->>'razonSocial'), ''))
 where legal is not null;

-- Ya migrado: se quitan del jsonb para que no puedan divergir. Esta es la parte
-- que hace que el bug no vuelva — mientras las dos casas existan, alguien va a
-- escribir en la equivocada.
update public.operators
   set legal = legal - 'rfc' - 'razonSocial'
 where legal is not null;

-- Un `legal` que se quedó sin nada útil es ruido: NULL dice la verdad.
update public.operators
   set legal = null
 where legal is not null
   and coalesce(nullif(trim(legal->>'domicilio'), ''), nullif(trim(legal->>'responsable'), '')) is null;

comment on column public.operators.legal is
  'Entidad que RESPONDE por el viaje en el deslinde: {domicilio, responsable}. NO guarda RFC ni razon social — esos viven en las columnas planas `rfc` y `razon_social`, que son la fuente para facturar (0038). Un dato fiscal con dos casas termina con dos verdades.';

-- ── 2 · El CSD, sus dos archivos ────────────────────────────────────────────
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'operators'
                and column_name = 'csd_path')
     and not exists (select 1 from information_schema.columns
                      where table_schema = 'public' and table_name = 'operators'
                        and column_name = 'csd_cer_path') then
    alter table public.operators rename column csd_path to csd_cer_path;
  end if;
end $$;

alter table public.operators
  add column if not exists csd_key_path text;

comment on column public.operators.csd_cer_path is
  'RUTA del .cer en el bucket privado `csd`. NUNCA una URL. Sin su pareja `csd_key_path` no se puede timbrar: el gate `operadorListo` exige los DOS.';
comment on column public.operators.csd_key_path is
  'RUTA del .key en el bucket privado `csd`. Es la LLAVE PRIVADA del operador: con ella y su contrasenia se puede timbrar a su nombre. La contrasenia NO se guarda en ninguna columna — va directo a Facturapi.';

commit;
