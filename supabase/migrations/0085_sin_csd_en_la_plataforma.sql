-- 0085 · EL CSD YA NO VIVE EN LA PLATAFORMA (D20 bis)
--
-- ⚠️ SE APLICA DESPUÉS de promover el código de la 0084: el código anterior
-- todavía lee estas dos columnas en el gate de venta (COLUMNAS_GATE) y en
-- Cobrar, y quitarlas antes rompería esas pantallas en producción.
--
-- Hasta el 17 nov 2026 el .cer y el .key de la operadora se guardaban en el
-- bucket `csd` y aquí se apuntaba su ruta. Legal (D20 bis): nunca se
-- almacenan, ni de paso; viajan en memoria a Facturapi y de ellos sólo queda la
-- confirmación (`facturapi_csd_serial`, `csd_vence_at`). Las dos columnas
-- estaban vacías en todas las operadoras (medido el 12 y el 17 nov): no hay
-- dato que migrar. El bucket `csd`, vacío, se borra por la API de Storage.
--
-- Destructiva (dos `drop column`): requiere la aprobación explícita de Luis.

begin;

do $$
begin
  if exists (select 1 from public.operators where csd_cer_path is not null or csd_key_path is not null) then
    raise exception 'Hay operadoras con rutas de CSD: no se borra nada sin revisar.';
  end if;
end $$;

alter table public.operators drop column if exists csd_cer_path;
alter table public.operators drop column if exists csd_key_path;

commit;
