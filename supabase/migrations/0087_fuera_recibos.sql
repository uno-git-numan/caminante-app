-- 0087 · FUERA LAS COLUMNAS DE RECIBOS
--
-- ⚠️ SE APLICA DESPUÉS de promover el código de la 0086: el código anterior
-- todavía lee `facturapi_receipt_id` y `recibo_neto_de_mxn` en Mi espacio, en
-- la autofactura y en las devoluciones.
--
-- La plataforma ya no crea recibos en Facturapi (0086). Estas columnas nunca
-- tuvieron un dato (medido el 17 nov 2026) y la migración se detiene sola si
-- encuentra alguno.
--
-- Destructiva (`drop column`): requiere la aprobación explícita de Luis.

begin;

do $$
begin
  if exists (
    select 1 from public.payments
     where facturapi_receipt_id is not null or facturapi_receipt_key is not null
        or recibo_expira_at is not null or recibo_enviado_at is not null
        or recibo_neto_de_mxn is not null or cardinality(recibos_cancelados) > 0
  ) then
    raise exception 'Hay pagos con datos de recibos: no se borra nada sin revisar.';
  end if;
  if exists (select 1 from public.cfdi_invoices where facturapi_receipt_id is not null) then
    raise exception 'Hay facturas ligadas a un recibo: no se borra nada sin revisar.';
  end if;
  if exists (select 1 from public.cfdi_globales where recibos <> 0) then
    raise exception 'Hay globales con recibos contados: no se borra nada sin revisar.';
  end if;
end $$;

-- El check de la 0083 nombraba `facturapi_receipt_id` («un pago con recibo no
-- se marca externo»). Sin recibos, queda la regla que importa: externo ⇔ UUID.
alter table public.payments drop constraint if exists payments_cfdi_externo_sano;

alter table public.payments
  drop column if exists facturapi_receipt_id,
  drop column if exists facturapi_receipt_key,
  drop column if exists recibo_expira_at,
  drop column if exists recibo_enviado_at,
  drop column if exists recibo_neto_de_mxn,
  drop column if exists recibos_cancelados;

alter table public.payments add constraint payments_cfdi_externo_sano check (
  (status_cfdi = 'externo') = (cfdi_externo_uuid is not null)
  and (cfdi_externo_uuid is null
       or cfdi_externo_uuid ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
);

alter table public.cfdi_invoices drop column if exists facturapi_receipt_id;
alter table public.cfdi_globales drop column if exists recibos;

commit;
