---
paths:
  - "src/lib/payments/**"
  - "src/lib/facturacion/**"
  - "src/app/caminante/api/payments/**"
  - "src/app/caminante/admin/dinero/**"
  - "src/app/caminante/reservar/**"
  - "src/app/caminante/reserva/**"
---

# Dinero: cobros, webhook y facturación

**Stripe está en LIVE desde el 1 jul 2026.** Todo lo que se toca aquí mueve dinero
real de clientes reales. Si dudas, no lo toques y pregunta.

## Las cuatro puertas por las que nace una reserva

Son cuatro a propósito, y **las cuatro tienen que quedar igual de completas**:

1. **Web self-serve** — `/caminante/reservar/[slug]` → `createCheckout`
   (`lib/payments/checkout.ts`) → webhook → `finalize-selfserve.ts`.
2. **WhatsApp** — `/admin/cobro` genera un Payment Link por reserva
   (`reservation-links.ts`) → webhook → `finalize-reservation.ts`.
3. **Transferencia / efectivo** — `/admin/dinero` → `lib/admin/transferencias.ts`.
4. **Pago manual con enlace de alta** — el admin captura lo poco que sabe y el
   sistema devuelve un link para que la persona se dé de alta y firme.

⚠️ Hasta el 11 ago la 3 y la 4 **no existían**, y quien pagaba por transferencia
simplemente no existía para la plataforma. Lo destapó Lorena Saravia: transfirió
$16,500 y la salida se veía en 4/12 cuando iba en 5/12, con ella lista para viajar
sin firmar deslinde.

## El webhook es el único camino rastreado

`api/payments/webhook/route.ts`. Orden: `finalizeReservationCheckout` (WhatsApp)
→ si `handled=false`, `finalizeSelfServeCheckout` (web). Idempotente por
`payments.provider_ref` (= PaymentIntent id).

**Verifica con DOS secretos de firma** — ver `rules/operadores-connect.md`.

`charge.refunded` → `finalizeRefund`. Sin eso un cobro devuelto seguía contando
como ingreso y como bruto del operador.

`payment_intent.succeeded` está **guardado por `intent.metadata.trip_id`**: es el
camino marketplace dormido (trips/bookings). Los PI de Payment Links no lo traen.

⚠️ **Los links de Stripe generados a mano quedaron eliminados.** No pasaban por
webhook → no registraban ni atribuían. Hay **un solo camino web rastreado**.

## Reglas que no se rompen

- **El monto se resuelve SIEMPRE server-side.** `createCheckout` calcula el precio
  por índice contra `priceTiers` guardado — **jamás un monto que venga del
  cliente**. Prioridad: tier elegido → `slot.price_mxn` → `price.amount`.
- **El status solo avanza, nunca retrocede** (RANK en `finalize-*`). No toca
  `completed` ni `cancelled`.
- **Check de cupo real antes de cobrar**, y token exacto para salidas privadas.
- **El gate del deslinde bloquea cobrar** (`deslindeListo`). Aunque algo se cuele
  publicado, no se cobra sin deslinde.
- **`stripe_fee_mxn` en NULL cuando no aplica** (transferencias): «no aplica» no es
  «fue cero», y el tablero de rentabilidad distingue las dos cosas.
- **Datos médicos JAMÁS salen a Notion** ni a ninguna herramienta externa (LFPDPPP).
  `notion_sync_log` lleva payload solo comercial.

## La comisión real de Stripe MX (medida, no estimada)

**3.6% + $3 MXN + 16% de IVA sobre la comisión = 4.229% all-in.** El IVA es
acreditable, así que el costo fiscal real es 3.646%. Una tarjeta Amex extranjera
midió 4.1% + $3.

Si el cliente absorbe la comisión, el cálculo es **`total = (base + 3) / (1 − 0.036)`**.
El ingenuo `base × 1.036` deja **$15 corto por transacción** a $11,500.

## Facturación (CFDI)

Ver `design/contabilidad/` y `rules/operadores-connect.md`. Hoy `lib/facturacion/`
asume **un solo emisor** (NUMAN HUB, RFC `NHU250826CS8`). Abrirlo a multi-emisor es
la fase A3 y depende de que la cuenta de Facturapi admita **multi-organización** —
requisito, no detalle.

Cobros reales sin CFDI entran como `status_cfdi = por-emitir`.

## Nunca inventes un número

Si un dato no está, dilo y di de dónde tendría que salir. **Un reporte con un
número inventado es peor que no tener reporte.** Y nada de parches: si falta algo
para cuadrar, se pide — jamás se tapa con un ajuste.
