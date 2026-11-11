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

## El perfil de plataforma en Stripe: modelo Airbnb (11 nov 2026)

Crear cuentas en LIVE pedía tres cosas de la cuenta numan, no del código: la
llave restringida «caminante-app (Vercel produccion)» con **Accounts v2 →
Write**, la identidad de Luis verificada y el cuestionario «Confirm your
integration choices». Luis eligió **B, «Buyers will purchase from you»**
(modelo Airbnb: el dinero pasa por NUMAN y se transfiere a la operadora,
pagos individuales, sin cargos y transferencias separados, alta hospedada por
Stripe, Express por omisión) y aceptó las responsabilidades que Stripe le
pone a la plataforma en B:

- **NUMAN responde por reembolsos, contracargos y multas.**
- **NUMAN responde por pérdidas por fraude de la operadora y saldos negativos.**
- NUMAN revisa a cada operadora (categorías restringidas) y le da soporte.
- **Radar Standard: MX$20.00 por cuenta conectada** (MX$0 por transacción).
  Luis: se le cobra a la operadora como **cuota de admisión**, descontada del
  primer pago que se le manda (la cláusula la redacta la sesión legal, i1).

**La admisión** (`lib/operadores/admision.ts`, tabla `operator_admisiones`,
0078): en la primera venta por Connect, el webhook revierte $20 de SU
transferencia (`transfers.createReversal`). ⚠️ **No se suma a la comisión**:
el `application_fee`, `platform_fee_mxn`, `fee_retenido_mxn` (= total del
CFDI de la comisión) y el tope del 20 % quedan intactos. Una fila por
operadora (PK = el «una sola vez»); `fallida` se reintenta en la siguiente
venta; una `pendiente` abandonada busca primero si la reversión ya llegó a
Stripe. Nunca tumba un pago. El panel de la operadora resta sólo la
`cobrada`. Sin la 0078 aplicada no cobra nada y lo registra.

Con ese perfil Stripe SÍ aceptó la cuenta como la crea `crearCuentaV2`
(merchant + recipient). La primera fue Nomádika, `acct_1UaiUdGRRBL2rPeh`.
⚠️ Ojo con la retención: cobrar como Airbnb es justo el caso de la pregunta
h3 a Marisol (¿plataforma que cobra por cuenta de terceros ⇒ retiene ISR/IVA
a personas físicas?). Tiene que estar contestada antes de su primera venta.

**La operadora no va al enlace de Stripe (11 nov 2026).** Luis: «nosotros no
queremos que entren nunca a Stripe». En su propio panel (Mi alta → Cobrar) el
paso 1 ya no ofrece «Conectar» ni «Continuar la verificación» (`sinEnlaceExterno`
en `CobrosPanel`), y `pedirLinkStripe` le niega el enlace en el servidor. Sólo
la casa lo abre. El camino es el alta dentro de la plataforma
(`COBRO_EN_PLATAFORMA`), que espera la pregunta i3 a legal. ⚠️ Nomádika
(`acct_1UaiUdGRRBL2rPeh`) nació con panel completo y ese tipo no se cambia:
al prender el alta en plataforma se cierra (no tiene movimientos) y se crea
la nueva.

## La retención de ISR e IVA: modelo Airbnb (11 nov 2026)

Luis: «Hay que hacerlo como hace airbnb entonces. Construye.» Con el dinero
pasando por NUMAN, NUMAN retiene ISR e IVA a la operadora y los entera (D1 de
`design/legal/DECISIONES-LEGAL-FISCAL-2026-11-11.md`). NUMAN no declara por
ella: retiene, le da su CFDI de retenciones y entera.

- **Cálculo** (`lib/fiscal/retencion.ts`): base = lo cobrado sin IVA (con
  complementos, menos descuentos; la comisión NO se resta). 2026: ISR 2.5 %,
  IVA 50 % del IVA cobrado; sin RFC 20 % / 100 %. Tasas POR EJERCICIO.
- ⚠️ **Candado:** un ejercicio sin tasas no cobra por cuenta conectada
  (`planDeCobro` cae a la casa). Cobrar sin retener = retención omitida.
- ⚠️ **La transferencia sale NETA** (`transfer_data.amount` = cobrado −
  comisión con IVA − retención) y **ya no hay `application_fee`**: Stripe no
  acepta los dos juntos («mutually exclusive», probado en test). Así los
  reembolsos (`reverse_transfer`) revierten en proporción y todo cuadra solo:
  $1,750 → transfiere $1,241.60 (ISR TRUNCADO por venta, M15: $37.71);
  devolver $875 revirtió la mitad. Probado en
  `tests/e2e/connect.test.ts` (PROBAR_CONNECT=1).
- **Se congela al cobrar** en `payments.isr_retenido_mxn`,
  `iva_retenido_mxn`, `retencion_regla` (0079). Lo vigente tras devoluciones
  se DERIVA en proporción (`retencionVigente`).
- El panel de la operadora resta comisión y retención (`lo-que-recibe.ts`,
  campo `retenciones`).
- Si se devuelve completa la venta que pagó la **admisión**, Stripe ya le
  regresó los $20 al revertir lo que quedaba: `admisionDevuelta` la deja
  «fallida» para cobrarla en la siguiente.

## CURP, domicilio fiscal y CLABE: la tabla cerrada (0081, 11 nov 2026)

La informativa mensual de plataformas (LIVA 18-J III, D4) pide CURP,
domicilio fiscal, banco y CLABE de cada operadora. Viven en
`operator_fiscal_privado` (RLS sin políticas), **nunca en `operators`**: esa
ficha llegó a leerse con la llave pública hasta la 0080.

- CURP y domicilio: de la constancia confirmada (`csf.ts` →
  `guardarDeConstancia`), sin pasar por `analisis` (que ve el panel). La CURP
  sólo si sus 10 primeros caracteres son los del RFC (`curpDeRfc`).
- CLABE: se captura una vez en Cobrar (`guardarClabeAction`), con dígito de
  control; el banco sale del prefijo contra el listado de Banxico
  (`lib/fiscal/clabe.ts`), y sólo se teclea si no está.
- Las pantallas reciben `FiscalPrivadoPanel`: si está y la CLABE enmascarada.

## El reporte mensual de retenciones (11 nov 2026)

Marisol lo pidió para presentar las informativas. Pantalla de la casa
`/caminante/admin/plataforma/retenciones?mes=AAAA-MM` (enlazada desde Recursos
→ «Lo que se declara») y CSV en `/caminante/api/admin/retenciones?mes=…`
(`&detalle=1` venta por venta). Cálculo puro en `lib/fiscal/reporte-retenciones.ts`.

- Un mes = ventas por Connect COBRADAS en el mes (hora CDMX). **Corte al
  emitir** (legal, REPORTE-MENSUAL-RETENCIONES §3): una devolución confirmada
  antes del corte se neta en SU venta (total ⇒ no se reporta); una posterior no
  toca el mes (lo enterado queda a favor de la operadora, Quinta §4). El
  complemento del SAT no admite negativos.
- Sólo operadoras con ventas: el layout del SAT «no acepta cero» (legal §4).
- `&formato=txt` = carga masiva PTEv2 de la informativa: «|», UTF-8, sin
  encabezado, `5|RFC|base|base|ISR|IVA|CLABE|TA4`, pesos enteros.
- Lo que falta para la informativa (CURP, domicilio, banco, CLABE) se lista en
  `faltan`; no se rellena. En pantalla CURP y CLABE enmascaradas; completas
  sólo en el CSV, sólo para la casa.
- Formatos: `design/legal/REPORTE-MENSUAL-RETENCIONES-2026-11-12.md`. Dudas
  abiertas para Marisol: M10–M14 de ese documento.

## El CFDI de retenciones (0082, 12 nov 2026)

Uno por operadora y mes, a más tardar el día 5 (LISR 113-C II): clave 26 con
el complemento «Servicios Plataformas Tecnológicas» 1.0, una sección por venta.

- **Puro** (`lib/fiscal/cfdi-retenciones.ts`): montos con la regla del SAT
  (base del mes × tasa, TRUNCADO), XML del complemento **validado contra el XSD
  oficial** (`tests/fixtures/sat/`, la prueba corre si hay `xmllint`), cuerpo
  de `POST /v2/retentions` de Facturapi (`complements: [xml]`).
- ⚠️ **`CATALOGO` en null = no se emite.** Tipo de servicio, periodicidad,
  tipo de impuesto, tipo de pago de la retención y forma de pago de prepago
  los confirma la sesión legal (pregunta del 12 nov). `catalogoListo()` dice
  cuál falta. Tampoco se emite sin `FACTURAPI_SECRET_KEY` (llave de NUMAN).
- **Emisión** (`emitir-retenciones.ts`): aparta una fila VIVA por operadora y
  mes en `cfdi_retenciones` (índice parcial) ANTES de llamar al PAC; idempotency
  `ret-<mes>-<operadora>`; una «pendiente» de más de 15 min se reintenta. Al
  timbrar la manda por correo a la operadora. Su `timbrado_at` es el CORTE del
  reporte. Botones en «Retenciones del mes» y cron el día 2
  (`/caminante/api/cron/retenciones`).
- **Forma de pago por venta** (M14): `payments.medio_pago` (card:credit,
  card:debit, oxxo…), crudo de Stripe; la clave SAT se deriva al emitir.
- ⚠️ **El webhook trae `payment_intent` como id, sin expandir.** Hasta el 12 nov
  el `transfer_id` nunca se llenaba (la admisión no se habría cobrado).
  `finalize-selfserve` ahora pide el PaymentIntent con `expand: latest_charge`.
- Lo que se ENTERA el 17 es lo que dicen los CFDI (`totales.isrEnterar`); lo
  retenido por venta puede diferir unos centavos: los pone NUMAN (M15).

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
