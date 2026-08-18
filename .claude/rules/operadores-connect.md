---
paths:
  - "src/lib/operators/**"
  - "src/lib/operadores/**"
  - "src/app/caminante/admin/operadores/**"
  - "src/app/caminante/operador/**"
  - "src/app/caminante/operadores/**"
  - "src/app/caminante/o/**"
---

# Operadores externos y Stripe Connect

Plan completo: `design/contabilidad/PLAN-CONNECT-MULTIEMISOR.md`.

## El modelo, en una línea

Un operador externo vende por la plataforma, cobra **en su propia cuenta de
Stripe** (cargo directo) y factura al cliente **con su propio CSD**. Numan retiene
su comisión como `application_fee` y le factura al operador solo esa comisión.

Hoy en producción conviven **dos épocas**: los operadores sin cuenta conectada
siguen por el camino de siempre (todo el dinero entra a NUMAN HUB y se les
transfiere a mano) y los que estén en Connect cobrarán directo. El código
distingue por `operators.stripe_account_id`.

## ⚠️ Los tres candados de dinero — no se relajan

**1 · La comisión sale de `commission_pct` y de ningún otro lado.** Existieron
`platform_fee_pct` y `stripe_fee_bearer` duplicando ese dato sin que nadie las
leyera; la **0037 las borró** justo para que no puedan usarse por error. Si Connect
leyera una y el reporte de payout la otra, el checkout cobraría un porcentaje y el
corte mostraría otro: un bug de dinero **silencioso**.

**`commission_pct` en NULL significa SIN DEFINIR, no cero.** `operadorListo` lo
rechaza a propósito: con cargo directo el dinero entra a la cuenta del operador y
lo único que retiene Numan es el `application_fee`. En NULL la venta saldría
perfecta, el cliente viajaría contento y **Numan ganaría cero**, sin un error en
pantalla. Y como la atribución se congela en la venta (0016), tampoco se puede
cobrar hacia atrás.

**2 · El CSD son DOS archivos.** El SAT entrega `.cer` y `.key` y timbrar necesita
ambos (`csd_cer_path` + `csd_key_path`, 0038). Con uno solo el expediente se ve
completo en pantalla y falla en producción. **La contraseña del CSD no tiene
columna y no se guarda**: va directo a Facturapi al crear la organización.

**3 · El webhook verifica con DOS secretos.** En Stripe el alcance de un endpoint
es *tu cuenta* **o** *cuentas conectadas*, nunca los dos, y solo se fija al
crearlo. Por eso `account.updated` llega por un endpoint APARTE con su propia
firma, y `api/payments/webhook` prueba `STRIPE_WEBHOOK_SECRET` y
`STRIPE_WEBHOOK_SECRET_CONNECT`. Sin eso, **todo evento de cuenta conectada
rebotaría con 400** y el gate seguiría creyendo que un operador puede cobrar
cuando Stripe ya lo apagó.

## El gate: `lib/operators/listo-para-vender.ts`

`operadorListo(op)` es el espejo de `deslindeListo` (ver `rules/experiencias.md`):
si el flujo no está completo, **no se vende**. Cinco condiciones, todas
verificables — ninguna es casilla de honor:

1. `stripe_charges_enabled` — lo dice **Stripe**, no nosotros. Lo escribe el
   webhook `account.updated`; que exista la cuenta no significa KYC completo.
2. CSD `.cer` **y** `.key` presentes y vigentes (caduca a los 4 años).
3. Datos fiscales del emisor completos + `tipo_persona` (define si hay retención
   de ISR e IVA; Numan es corresponsable solidaria).
4. `convenio_firmado_at` — la fecha de firma, no una casilla marcada.
5. `commission_pct` no NULL.

Un operador **sin** `stripe_account_id` no está en Connect y el gate lo deja pasar
(`requiereConnect`). Esa es la bandera por operador: el camino que hoy mueve
dinero real no se toca.

Usa **`COLUMNAS_GATE`** para el `select`; si un call site inventa el suyo y omite
una columna, llega `undefined` y el gate la reporta faltante estando llena.

## Dónde vive qué

| | |
|---|---|
| Alta de cuenta, Account Links, estado | `lib/payments/connect.ts` |
| Acciones del panel | `lib/payments/connect-actions.ts` |
| Gate | `lib/operators/listo-para-vender.ts` |
| Pantallas de onboarding | `admin/operadores/cobros/` |
| Convenio y datos fiscales | `admin/operadores/ConvenioForm.tsx` |
| Perfil público | `admin/operadores/OperadorForm.tsx` → `/caminante/operador/<slug>` |
| Portal con su marca | `lib/operators/branding.ts` → `/caminante/o/<slug>` |
| Alta idempotente | `lib/operators/alta.ts` (`ensureOperador`) |

**Los Account Links caducan en minutos y son de un solo uso**: se generan en el
clic y **nunca se guardan**. Un link guardado es un link muerto.

## El dato fiscal tiene UN solo hogar (0038)

`operators.rfc` / `razon_social` / `regimen_fiscal` / `cp_fiscal` = **quien EMITE**
el CFDI. Es la fuente para facturar y la que lee el gate.

`operators.legal` (jsonb) = **quien RESPONDE** por el viaje en el deslinde:
`{domicilio, responsable}`. **No guarda RFC ni razón social.**

Antes vivían en los dos lados y mordió: Kéntro tenía su RFC en el jsonb y las
columnas planas en NULL, así que el gate lo reportaba faltante estando capturado.

## Las dos puertas de entrada (no confundir)

**Embajador** (`/caminante/embajadores`) — vende, Caminante opera. 30% de utilidad
neta **en el convenio, no en el sistema**. Aprobar NO da acceso al panel.
`commission_pct` queda NULL a propósito: esa columna es el % que retiene la
plataforma, que es otra cosa.

**Operador** (`/caminante/signup?tipo=operador`, `/caminante/operadores/aplicar`) —
opera lo suyo. Aprobar SÍ abre el panel.

Las dos crean la fila en `operators`, que es lo único que hace que sus ventas se
atribuyan.

## ⚠️ REGLA QUE CUESTA DINERO

**Asignar el operador ANTES de la primera venta.** La atribución se congela reserva
por reserva al cobrar (0016) y **no se rellena hacia atrás**. Prueba viva: los
**$103,500** de «Hacienda y hongos» están atribuidos a Numan · Caminante y no a
Kéntro. Pendiente de Luis cómo se salda.

## Gotchas que ya costaron

- **`operators.slug` no lo asignaba nada**: toda operadora nacida de una
  aprobación quedaba sin dirección pública. Ahora lo calcula `ensureOperador`;
  `saveOperatorProfile` rescata a los viejos **una sola vez** (renombrar rompe
  links vivos) y `setOperatorPublic` se niega a publicar sin slug.
- **El «%» del detalle de experiencia heredaba la comisión del operador anterior**
  y `commission_pct` vive en el OPERADOR, así que le aplicaba a todo lo suyo.
- **Especificidad del CSS del portal**: una regla base como `.opw a{color:…}`
  (0-1-1) le gana a una clase sola (0-1-0). Todo texto sobre foto va prefijado con
  el scope, y el velo sobre la imagen es obligatorio.
