# PLAN — Stripe Connect + facturación multi-emisor

Qué hace falta para que un operador externo venda por la plataforma, cobre a su
nombre y facture con su propio CSD. Backend y frontend.

**Modelo acordado (13 ago 2026):**
- El cliente paga en la plataforma. El cobro nace en la cuenta de Stripe **del
  operador** (cargo directo); Numan retiene su comisión como `application_fee`.
- El CFDI al cliente lo emite **el operador, con su propio CSD**, desde el motor de
  la plataforma.
- Numan le factura al operador **únicamente la comisión**.

⚠️ Dos piezas esperan respuesta de Eduardo: **el tipo de cargo** (asumimos directo)
y **las retenciones**. Todo lo demás se puede construir sin esas respuestas.

---

## Principio que ordena el plan

**El camino que hoy cobra dinero real no se toca hasta el final.** Las experiencias
propias siguen cobrando por el flujo actual (`createCheckout` → webhook →
`finalize-selfserve`) mientras Connect se construye al lado. La bifurcación ocurre
en un solo punto y detrás de una bandera por operador: *si esta experiencia tiene
operador con Connect listo, va por el camino nuevo; si no, por el de siempre.*

Eso permite que el primer operador venda de verdad sin poner en riesgo las ventas
de Caminante.

---

# FASE 0 · Cimientos (sin dependencias)

### 0.1 Migración `0036_connect_operadores`

Sobre `operators`, todo aditivo:

| Columna | Para qué |
|---|---|
| `stripe_account_id` | La cuenta conectada |
| `stripe_charges_enabled` · `stripe_payouts_enabled` | Lo que Stripe dice que ya puede hacer |
| `stripe_requirements` jsonb | Qué le falta a Stripe (se muestra al operador tal cual) |
| `stripe_onboarded_at` | Cuándo completó |
| `rfc` · `razon_social` · `regimen_fiscal` · `cp_fiscal` | Datos de emisor |
| `tipo_persona` (`fisica` \| `moral`) | **Define si hay retención** |
| `facturapi_org_id` | Su organización en Facturapi |
| `csd_subido_at` · `csd_vence_at` | El CSD caduca a los 4 años: hay que avisar |

Y una tabla `operator_payouts` para el corte por operador (aunque con cargo directo
Stripe paga solo, hay que poder auditarlo).

### 0.2 Bucket privado `csd`

**El CSD es la firma electrónica del operador. No puede vivir en un bucket
público.** Mismo patrón que `comprobantes` (0034): bucket privado, se guarda la
RUTA nunca la URL, nombre de archivo aleatorio, y se lee por URL firmada de 5
minutos desde una ruta gateada a admin.

⚠️ **La contraseña del CSD no se guarda en nuestra base.** Va directo a Facturapi
al crear la organización y no se persiste de nuestro lado. Si Facturapi la
necesita después, se vuelve a pedir.

### 0.3 Gate «operador listo para vender»

Un archivo espejo de `flujo-venta.ts` — `lib/operators/listo-para-vender.ts`:

```
operadorListo(op) = stripe_charges_enabled
                  && csd cargado y vigente
                  && datos fiscales completos
                  && convenio firmado
```

Lo consultan los mismos tres lugares que hoy consulta `deslindeListo`: publicar
desde el formulario, publicar desde el dashboard, y **cobrar**. Es la misma regla
de la casa: si no está completo, no se vende.

---

# FASE 1 · Connect, backend

### 1.1 Alta de la cuenta conectada
`lib/payments/connect.ts`:
- `crearCuentaConectada(operatorId)` → cuenta Express en MX, con
  `capabilities: card_payments + transfers`.
- `crearLinkOnboarding(operatorId)` → Account Link que lleva al operador al flujo
  de Stripe (KYC: identificación, RFC, CLABE). **Los Account Links caducan**: se
  generan al vuelo, nunca se guardan.
- `refrescarEstado(operatorId)` → lee la cuenta y actualiza los tres campos de
  estado.

### 1.2 Webhook de cuentas
Evento `account.updated` sobre cuentas conectadas → actualiza
`stripe_charges_enabled`, `payouts_enabled` y `requirements`. Es lo que hace que la
pantalla del operador diga la verdad sin que nadie la refresque a mano.

### 1.3 El cobro
`createCheckout` bifurca en **un solo `if`**:

- **Sin operador Connect** → exactamente lo de hoy. Cero cambios.
- **Con operador Connect** → sesión creada **sobre la cuenta del operador**
  (`stripeAccount`), con `application_fee_amount` = comisión congelada × monto.

⚠️ La comisión se calcula **server-side desde `operators.commission_pct`**, nunca
desde el cliente — misma regla que ya rige los `priceTiers`.

⚠️ **El check de cupo y el gate del deslinde se aplican igual.** Que el cobro viva
en otra cuenta no relaja ninguna regla de venta.

### 1.4 El webhook de pagos
Los eventos de cuentas conectadas llegan con el identificador de la cuenta. Hay que:
- Resolver el operador a partir de esa cuenta.
- Reusar `finalizeSelfServeCheckout` **cambiando qué se guarda**: el ingreso del
  operador NO es ingreso de Numan. En `payments` hay que distinguir
  `monto_operador` de `comision_numan`.
- Mantener la idempotencia por `provider_ref` que ya existe.

⚠️ **Reembolsos**: al reembolsar hay que decidir si se devuelve también la
comisión. Con cargo directo no es automático. Es una decisión de política, no
técnica — pendiente de Luis.

### 1.5 Retenciones (esperando a Eduardo)
Si aplica: calcular ISR e IVA retenidos sobre el monto del operador, guardarlos en
`payments`, restarlos de lo que se le entera, y generar la constancia. **No se
construye a ciegas**: hasta que Eduardo confirme tasas y supuestos, queda el
espacio en el modelo de datos y nada más.

---

# FASE 2 · Facturación multi-emisor

Hoy `lib/facturacion/` asume **un solo emisor**: NUMAN. Esto lo abre.

### 2.1 Una organización de Facturapi por operador
- Al subir su CSD, se crea su organización en Facturapi y se guarda
  `facturapi_org_id`.
- El cliente de Facturapi deja de ser un singleton: `facturapiPara(operadorId)`
  devuelve el que corresponde. **Verificar que el plan contratado admita
  multi-organización** — es requisito, no detalle.

### 2.2 Dos facturas por venta de operador
1. **Operador → cliente**, por el total de la experiencia, con el CSD del operador.
   Es la que el cliente pide en `/caminante/facturacion`.
2. **Numan → operador**, por la comisión. Automática al confirmarse el cobro.

⚠️ **La clave de producto y el uso de CFDI pueden diferir** entre una y otra
(servicio turístico vs. comisión por intermediación). Las claves las confirma
Eduardo; el catálogo ya vive en `catalogos.ts`.

### 2.3 Autofactura del cliente
`/caminante/facturacion` ya existe. Cambia en que debe resolver **de quién es la
venta** y timbrar con ese emisor. El cliente no se entera: pide su factura igual.

### 2.4 Vigencia del CSD
Caduca a los 4 años. Un cron avisa 60 días antes, y `operadorListo` lo empieza a
rechazar cuando venció — igual que una póliza vencida en el expediente.

---

# FASE 3 · Frontend

### 3.1 Onboarding del operador (`/caminante/operador/cobros`)
Tres pasos con estado visible, en el lenguaje del panel:

1. **Conecta tu cuenta** → botón que lleva al Account Link de Stripe. Estados:
   sin empezar · incompleto (con lo que Stripe pide, textual) · listo.
2. **Sube tu CSD** → `.cer`, `.key` y contraseña. Con la explicación de para qué es
   y la promesa de que la contraseña no se guarda.
3. **Tus datos fiscales** → RFC, razón social, régimen, código postal.

Arriba, un semáforo: **«Listo para vender»** o qué falta. Es la misma lógica del
expediente del funnel de operadores.

### 3.2 Panel del operador
- **Sus ventas** — solo las suyas. ⚠️ Requiere que el panel deje de ser
  todo-o-nada: hoy quien entra ve todo. **Eso es alcance real** y hay que decidir
  si el operador entra al panel de Numan recortado o a uno propio.
- **Su dinero** — cobrado, comisión de la plataforma, retenciones si aplican, y qué
  le depositó Stripe.
- **Sus facturas** — las que emitió a clientes y las que Numan le emitió por comisión.

### 3.3 Admin
- En Operadores, columna de estado: Stripe · CSD · Convenio · **Listo**.
- En Recursos, separar **ingreso propio** de **comisión por intermediación**. Hoy
  `rentabilidad.ts` asume que Numan cobra y paga todo — con Connect deja de ser
  cierto y el tablero mentiría.

### 3.4 Público
- La página de experiencia de un operador ya muestra «Operada por».
- La pantalla de éxito y el correo de confirmación deben decir **quién factura**,
  para que el cliente no pida factura a quien no se la puede dar.

---

# Orden de construcción

| | Qué | Depende de |
|---|---|---|
| **1** | Migración 0036 + bucket CSD + gate | nada |
| **2** | Onboarding de Stripe (backend + las 3 pantallas) | 1 |
| **3** | Multi-emisor en Facturapi + subida de CSD | 1, y que Facturapi admita multi-org |
| **4** | El cobro con cargo directo | **confirmación de Eduardo** |
| **5** | Webhook, separación de ingreso, panel del operador | 4 |
| **6** | Retenciones | **respuesta de Eduardo** |
| **7** | Recursos separando propio vs. comisión | 5 |

Del 1 al 3 se puede arrancar hoy. El 4 es la línea que no se cruza sin Eduardo.

---

# Lo que hay que decidir (no es técnico)

1. **Reembolsos**: ¿se devuelve la comisión de Numan?
2. **¿Quién absorbe la comisión de Stripe?** Con cargo directo la paga el operador
   por default. Si Numan la absorbe, cambia el cálculo del fee.
3. **Panel del operador**: ¿el de Numan recortado, o uno propio?
4. **Convenio firmado**: hoy `operadorListo` lo exige. ¿Quién marca esa casilla y
   contra qué documento?
