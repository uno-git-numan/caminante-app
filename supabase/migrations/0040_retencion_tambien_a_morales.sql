-- 0040 · La retención ya NO distingue física de moral — corrige un comentario
--        que iba a hacer que alguien construyera mal
--
-- Solo cambia COMMENTs. No toca datos, ni columnas, ni restricciones.
--
-- ── Qué estaba mal ───────────────────────────────────────────────────────────
-- La 0036 dejó escrito que `tipo_persona` «define si hay retención». Era cierto
-- hasta el 31 de diciembre de 2025: las plataformas solo retenían a PERSONAS
-- FÍSICAS. La reforma aprobada el 17 de octubre y publicada el 7 de noviembre de
-- 2025 la extendió a PERSONAS MORALES.
--
-- Hoy hay retención SIEMPRE. `tipo_persona` ya no decide SI se retiene, decide
-- CUÁNTO. Quien leyera el comentario viejo podría cablear «moral ⇒ no retener»,
-- y eso deja a Numan como corresponsable solidaria de una retención omitida.
--
-- ── Las tasas, para que vivan donde se consultan ─────────────────────────────
-- Persona FÍSICA con RFC:  ISR 2.5% servicios · 4% hospedaje  ·  IVA 8%
-- Persona MORAL con RFC:   ISR 4%                             ·  IVA 8%
-- SIN RFC (cualquiera):    ISR 20%                            ·  IVA 16%
--
-- ⚠️ El 2.5% subió desde 1% en la LIF 2026. Si alguien encuentra 1% en algún
-- lado, está leyendo algo viejo.
--
-- ⚠️ Servicios (2.5%) vs hospedaje (4%) NO está resuelto para nuestras
-- experiencias, que incluyen noche además de guía. Está en la propuesta que va a
-- revisar el despacho. Mientras no haya respuesta, la regla de la casa es
-- RETENER LA TASA MÁS ALTA: retener de más se lo acredita el operador en su
-- declaración; retener de menos lo paga Numan.

begin;

comment on column public.operators.tipo_persona is
  'fisica | moral. NO decide SI hay retencion — desde 2026 hay retencion en los dos casos (reforma publicada 7 nov 2025). Decide CUANTO: fisica 2.5% ISR servicios / 4% hospedaje, moral 4% ISR; IVA 8% ambas con RFC. SIN RFC: 20% ISR y 16% IVA para cualquiera. NULL = sin capturar: el gate operadorListo no debe dejar vender sin esto, porque sin saber el tipo no se puede retener bien y Numan es corresponsable solidaria.';

commit;
