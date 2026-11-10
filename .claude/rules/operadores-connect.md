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
columna y no se guarda**: desde el 9 nov 2026 el formulario de Cobrar la pide y
`guardarCsd` la manda a Facturapi en la misma llamada
(`lib/facturacion/organizacion.ts` → `conectarCsdFacturapi`), que crea la
organización de la operadora, sube el CSD y deja sus llaves cifradas (0076).

**3 · El webhook verifica con DOS secretos.** En Stripe el alcance de un endpoint
es *tu cuenta* **o** *cuentas conectadas*, nunca los dos, y solo se fija al
crearlo. Por eso `account.updated` llega por un endpoint APARTE con su propia
firma, y `api/payments/webhook` prueba `STRIPE_WEBHOOK_SECRET` y
`STRIPE_WEBHOOK_SECRET_CONNECT`. Sin eso, **todo evento de cuenta conectada
rebotaría con 400** y el gate seguiría creyendo que un operador puede cobrar
cuando Stripe ya lo apagó.

## El gate: `lib/operators/listo-para-vender.ts`

`operadorListo(op)` es el espejo de `deslindeListo` (ver `rules/experiencias.md`):
si el flujo no está completo, **no se vende**. ⚠️ Hasta el 22 sep 2026 **nadie lo
llamaba en ninguna puerta** aunque su encabezado prometiera tres; hoy lo llama
`candadosDe` (`lib/experiences/candados-venta.ts`), que es la única puerta de
publicar y cobrar. **Cinco condiciones desde el 9 nov 2026**, todas verificables:

1. `stripe_charges_enabled` — lo dice **Stripe**, no nosotros.
2. **Datos fiscales** (`rfc`, `razon_social`, `regimen_fiscal`, `cp_fiscal`):
   NUMAN le factura su comisión con Facturapi. ⚠️ **Nadie los teclea**: salen
   de la constancia confirmada por el SAT (ver abajo).
3. `tipo_persona` (física o moral): también sale del RFC de la constancia.
4. `convenio_firmado_at` — la fecha de firma, no una casilla marcada.
5. Comisión resuelta: `commission_pct` o `comision_desde`. ⚠️ Sin trato
   negociado se firma **la escala pública** y `firmarConvenio` escribe
   `comision_desde` = el día de la firma. La casa ya no teclea nada para que
   la operadora pueda firmar.

⚠️ **El CSD YA NO detiene la venta** (Luis, 9 nov 2026, haciendo el alta de
Nomádika en vivo: «si quieren facturación, que se prenda en un paso posterior,
pero no sea un cuello para empezar a cobrar»). Facturarle a SU cliente desde la
plataforma es opcional y vive en Cobrar; si no la prende, factura por fuera.

Un operador **sin** `stripe_account_id` no está en Connect y el gate lo deja pasar
(`requiereConnect`). Esa es la bandera por operador: el camino que hoy mueve
dinero real no se toca.

Usa **`COLUMNAS_GATE`** para el `select`; si un call site inventa el suyo y omite
una columna, llega `undefined` y el gate la reporta faltante estando llena.

## La cuenta conectada: Accounts v2, dashboard completo (9 nov 2026)

En LIVE Stripe rechazó la cuenta Express de siempre: «Use Accounts v2, remove
type, and set losses_collector to stripe». Probado en test: con pérdidas a
Stripe **sólo existe el dashboard completo** (`express` + `stripe` = «configuration
is not supported»). `crearCuentaV2` (`lib/payments/connect.ts`) la crea con
`configuration.merchant` (card_payments, MCC 4722) **y** `configuration.recipient`
(`stripe_balance.stripe_transfers`): sin la segunda el cargo con destino rebota.
El estado y el Account Link siguen por la API v1, que ve la cuenta como
`standard`. En cargo con destino el fee de Stripe lo sigue pagando la
plataforma: el reparto del dinero no cambió. ⚠️ La bandera `COBRO_EN_PLATAFORMA`
crea cuentas con pérdidas a la plataforma y **no se puede prender tal cual** en
LIVE.

## El alta en 15 minutos: un dato se obtiene, no se pide (9 nov 2026)

Meta de Luis: pasar de la solicitud a cobrar tan rápido como se abre una cuenta
de Revolut. Lista completa y lo que falta: `design/operadores/ALTA-EN-15-MINUTOS.md`.

- **Constancia → datos fiscales** (`lib/operadores/fiscal-de-csf.ts`): con
  `sat === "validada"`, `analizarCsf` escribe RFC, razón social, CP,
  física/moral y el régimen (si hay UNO de negocio; con dos, la pantalla ofrece
  sólo los de su constancia: `elegirRegimen`). Nunca pisa un RFC distinto.
- **Revisión automática** (`lib/operadores/revision-ia.ts`): la IA lee cada
  documento contra el catálogo. Limpio (es lo que se pide, legible, a su
  nombre, vigente, sin alertas) → **aprobado solo** (`revisado_por =
  "revisión automática"`). Cualquier duda → se queda en revisión con las
  razones escritas. **Nunca rechaza sola.** La constancia se aprueba sola con
  el SAT, sin alertas y con ≤ 90 días. La carpeta pasa sola a revisión y la
  actividad se aprueba sola con todo aprobado (`cerrarActividadSiCompleta`).
- **Fechas de vencimiento**: se leen del documento; el renglón ya no las pide.
- **CSD**: vigencia y RFC salen del `.cer` (`lib/facturacion/cer.ts`); si el RFC
  no es el de la operadora, no se guarda.
- **Stripe precargado** (`lib/payments/identidad-stripe.ts`): la cuenta v2 nace
  con RFC, razón social (moral) y CP, y `completarIdentidadStripe` se los manda
  si la constancia llega después (sólo mientras no cobre). El nombre de una
  persona física NO se manda: partirlo sería adivinar.
- **La llamada es un interruptor** (`lib/operadores/llamada.ts`): obligatoria
  por omisión (hoy). Con `ALTA_LLAMADA=opcional` en Vercel (y un redeploy) la
  solicitud se aprueba sola al llegar (`lib/admin/aprobar-solicitud.ts`, el
  núcleo sin guarda, FUERA del archivo `use server`).

## Dónde vive qué

| | |
|---|---|
| Alta de cuenta, Account Links, estado | `lib/payments/connect.ts` |
| Acciones del panel | `lib/payments/connect-actions.ts` |
| Gate | `lib/operators/listo-para-vender.ts` |
| Pantallas de onboarding (casa, todas) | `admin/operadores/cobros/` |
| Cobrar, marca y expediente (la operadora, lo suyo; la casa por ella con `?operadora=`) | `admin/mi-alta/cobrar/`, `admin/mi-alta/marca/`, `admin/mi-alta/expediente/` |
| Los candados de venta, UNA puerta para publicar×2 y cobrar | `lib/experiences/candados-venta.ts` (invariante #20) |
| Dispensa del candado de actividad (con dueño y caducidad) | `operator_activity_dispensas` (0060), `lib/operadores/candado-actividad.ts` |
| Comisión y entidad legal (los datos fiscales sólo se enseñan) | `admin/operadores/ConvenioForm.tsx` |
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

## El alta de la cuenta DENTRO de la plataforma (24 sep 2026, APAGADA)

Luis: «No menciones Stripe en el front end… que pongan todo y nosotros
mandamos a Stripe.» Construido y **apagado**: se prende con
`COBRO_EN_PLATAFORMA=1` en Vercel, y sólo cuando el abogado cierre la Cuarta
§7 del convenio (pendiente 12 de `CONVENIO-v1.md`): la aceptación del contrato
de cuentas conectadas que Stripe exige no aparece en pantalla, vive en el
convenio firmado. Prenderla antes sería sellar un `tos_acceptance` sin respaldo.

| | |
|---|---|
| Bandera, CLABE, traducción de `requirements`, `recaudaLaPlataforma` | `lib/payments/alta-cobro.ts` (puro, con pruebas) |
| Crear con propiedades de control / completar con tokens | `lib/payments/connect.ts` (`crearCuentaConectada`, `completarAltaCobro`) |
| La acción (exige convenio firmado; sólo acepta `ctoken_`/`ptoken_`/`btok_`) | `lib/payments/connect-actions.ts` → `completarAltaCobroAction` |
| La pantalla | `admin/mi-alta/cobrar/AltaCobro.tsx`, montada por `cobrar/page.tsx` en el paso 1 de `CobrosPanel` |

**Cómo funciona.** La operadora captura en nuestra pantalla; Stripe.js hace
tokens en SU navegador (`account`, `person`, `bank_account`; la identificación
sube directo a `uploads.stripe.com` con la llave publicable) y el servidor sólo
recibe los tokens. **Ni un dato personal pasa por Caminante ni se guarda.** La
cuenta se crea con `controller` (sin dashboard, la plataforma recaba
requisitos, paga comisiones y responde por saldos negativos), `business_type`
según `tipo_persona`, MCC 4722 y el token; la CLABE va como `external_account`.
Lo que Stripe siga pidiendo (`requirements.currently_due`) se traduce con
`traducirPendientes` y se vuelve a pedir en la misma pantalla.

⚠️ **Se decide POR CUENTA, no sólo por bandera.** El tipo de dashboard es
inmutable: una cuenta que ya salió al enlace (Express) se sigue completando por
su enlace aunque la bandera esté prendida. `refrescarEstado` devuelve
`recaudaLaPlataforma` leyendo `controller.requirement_collection`.

⚠️ **Con la bandera apagada NADA cambia**: cuenta Express + Account Links, como
siempre. La prueba `alta-cobro.test.ts` lo afirma.

**Probada contra Stripe en modo test (25 sep 2026):** `tests/e2e/alta-cobro.test.ts`
—se prende con `PROBAR_CONNECT=1` y llave `sk_test_`— crea una cuenta física y
una moral con la misma forma que manda la pantalla (token de cuenta, token de
persona, CLABE) y afirma que **nada de lo que recabamos queda pendiente** en
`requirements.currently_due`. Las cuentas se borran al final. Si Stripe cambia
lo que pide para MX, esta prueba lo dice antes que una operadora.

**Falta para prenderla:** el abogado (Cuarta §7) y `COBRO_EN_PLATAFORMA=1` +
rebuild en Vercel.
