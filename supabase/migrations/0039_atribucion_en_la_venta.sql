-- 0039 · De dónde vino el cliente, congelado en la venta
--
-- ADITIVA. Se aplica a mano en el SQL Editor.
--
-- ⚠️ Esto NO se agregó a la 0036 aunque era el plan: Luis ya la aplicó (junto
-- con la 0037 y la 0038) mientras se escribía esto. Una migración que ya corrió
-- no se edita — se le agrega otra. Y de paso evita que dos sesiones escriban el
-- mismo archivo, que es la colisión que ya nos costó una vuelta hoy.
--
-- ── Qué resuelve ─────────────────────────────────────────────────────────────
-- La comisión ya no es un porcentaje plano del operador: depende de QUIÉN trajo
-- al cliente (ver `src/lib/operadores/comision.ts`). Dos escalas:
--   · VENTA      — Caminante entregó el cliente. 25/22/20/18%.
--   · PLATAFORMA — el operador lo trajo y solo usa los rieles. 20/17/14/11/8%.
--
-- El monto que se retuvo YA tiene dónde vivir (`payments.platform_fee_mxn` y
-- `platform_fee_pct_frozen`, que existían sin dueño hasta hoy). Lo que falta es
-- POR QUÉ fue ese monto — y sin eso, en tres meses nadie va a poder explicar por
-- qué dos ventas del mismo precio pagaron distinto. La atribución es la razón, y
-- una razón que no se guarda es una discusión con el operador que se pierde.
--
-- ── Por qué se CONGELA y no se deduce ────────────────────────────────────────
-- Misma lógica que `reservations.commission_pct` (0016): la cookie de atribución
-- vive 60 días, el operador dueño de una experiencia puede cambiar, y las
-- escalas van a moverse. Recalcular después daría otro número. Lo que valió al
-- momento de cobrar es lo único defendible frente a quien reclame.

begin;

alter table public.reservations
  -- QUIÉN trajo al cliente. NULL = nadie en particular, o sea Caminante.
  -- Es el operador que traía la cookie de primer toque, no necesariamente el
  -- dueño de la experiencia — ver el comentario de `escala_comision`.
  add column if not exists atribuido_a uuid references public.operators(id) on delete set null,
  -- QUÉ escala se aplicó. Se congela: no se vuelve a calcular nunca.
  add column if not exists escala_comision text;

alter table public.reservations
  drop constraint if exists reservations_escala_comision_check;
alter table public.reservations
  add constraint reservations_escala_comision_check
  check (escala_comision is null or escala_comision in ('venta','plataforma'));

create index if not exists reservations_atribuido_a_idx
  on public.reservations (atribuido_a)
  where atribuido_a is not null;

comment on column public.reservations.atribuido_a is
  'Operador que traia la cookie de atribucion (primer toque, 60 dias) cuando se cobro. NULL = la venta es de Caminante. NO es lo mismo que operator_id: ese es el DUENO de la experiencia, este es QUIEN TRAJO al cliente.';

comment on column public.reservations.escala_comision is
  'venta | plataforma. Congelado al cobrar, jamas se recalcula (mismo criterio que commission_pct en la 0016). OJO: escala=venta con atribuido_a NO nulo es correcto y esperado — pasa cuando la cookie nombra a un operador DISTINTO al dueno de la experiencia: A no trajo a ese cliente a la salida de B, asi que la venta es de Caminante.';

commit;
