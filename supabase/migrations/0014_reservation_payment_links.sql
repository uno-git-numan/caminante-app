-- 0014 — Link de pago POR PERSONA atado a la reserva
--
-- Contexto: hasta ahora el Stripe link vivía a nivel EXPERIENCIA (uno para todos,
-- en experiences.data.stripeLink, generado por generateStripeLink). Para cobrar por
-- WhatsApp necesitamos un link POR RESERVA: monto = precio_por_persona × num_people,
-- con metadata {reservation_id, contact_id, slot_id} que Stripe copia al Checkout
-- Session y nos llega de vuelta en el webhook (checkout.session.completed) para
-- registrar el pago en `payments` y avanzar reservations.status.
--
-- Aplicar a mano en el SQL Editor (no hay CLI). Idempotente.

alter table public.reservations
  add column if not exists payment_link_url text,   -- URL del Stripe Payment Link enviado por WhatsApp
  add column if not exists payment_link_id text,    -- plink_… (para reconciliar / archivar)
  add column if not exists amount_due_mxn numeric(12,2); -- snapshot del total al crear el link (precio × personas)

comment on column public.reservations.payment_link_url is
  'Stripe Payment Link por-reserva (cobro por WhatsApp). Lo crea createReservationPaymentLink.';
comment on column public.reservations.amount_due_mxn is
  'Total cobrado por el link al momento de crearlo = precio_por_persona × num_people. Target para decidir paid vs partially_paid.';
