-- 0072 · EL EMBAJADOR TAMBIÉN SE LLEVA — un objeto más en el libro (0071).
--
-- La lámina «Quién lo lleva» (27 sep 2026) pone Tomar / Asignar en las
-- tarjetas de «Por contestar»: las solicitudes de fecha y los embajadores que
-- aplicaron. Las solicitudes de fecha NO necesitan nada nuevo: desde que se
-- mandan ya tienen su tarjeta en el CRM (`crm_cards.slot_request_id`), y esa
-- tarjeta es lo que se lleva. Los embajadores sí: `ambassador_applications`
-- no tiene tarjeta y no era un objeto del libro.
--
-- Qué se atribuye ahora:
--   embajador → ambassador_applications.id   (operadora · clientes; la facultad
--                                             se llama «Clientes y embajadores»
--                                             a propósito)
--
-- De qué operadora es un embajador: de la que lo contesta —el programa vive en
-- /caminante/embajadores y se contesta desde la Comunidad de esa operadora—.
-- Al aprobarlo o rechazarlo, la atribución se cierra como `resuelta`.
--
-- Sólo se amplía el CHECK. Ninguna fila cambia.

alter table public.staff_atribuciones
  drop constraint if exists staff_atribuciones_objeto_check;

alter table public.staff_atribuciones
  add constraint staff_atribuciones_objeto_check
  check (objeto in ('solicitud', 'operadora', 'tarjeta', 'grupo', 'embajador'));

comment on table public.staff_atribuciones is
  'Libro de atribución del equipo (0071, 0072): quién tiene qué (solicitud, '
  'operadora, tarjeta, grupo, embajador) y en qué tramo. Fila abierta = hasta '
  'null. Nunca se borra.';
