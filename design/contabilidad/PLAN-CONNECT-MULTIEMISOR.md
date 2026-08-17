# PLAN — Stripe Connect + facturación multi-emisor

> **Este documento es el punto de partida de una sesión nueva.** Trae todo lo
> acordado con Luis el 13 ago 2026. Antes de tocar código, lee también:
> `CLAUDE.md` (reglas del proyecto), `design/contabilidad/HANDOFF-FINANZAS.md`
> (el estado contable y lo que pidieron los asesores) y
> `design/operadores/FUNNEL.md` (el funnel de alta de operadores, ya construido).
>
> **Reglas de la casa que aplican aquí, sin excepción:** nunca se inventa un
> número · las migraciones son aditivas y las aplica Luis a mano · Luis teclea los
> secretos, Claude no los toca · nada de parches ni ajustes temporales · el panel
> se viste con el HTML de Claude Design, no se rediseña.

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

**Criterio de Luis (13 ago): «todo menos lo que no deben de saber».** No es un panel
mínimo: es la misma amplitud de funciones que el de Numan, con el alcance recortado
a lo suyo.

⚠️ Aun así vive en una **superficie aparte**, no como filtro sobre el panel actual.
La amplitud es decisión de producto; el aislamiento es lo que hace que una consulta
sin filtrar no pueda enseñar la operación completa. Todas las consultas del panel
del operador nacen con su `operator_id` en la firma — no como parámetro opcional.

| Va | No va |
|---|---|
| Panorama de **sus** salidas | Cualquier cosa de otro operador |
| Eventos y ocupación | Los márgenes y costos de Caminante |
| Reservas y roster de sus salidas | El CRM completo de contactos |
| Su dinero: vendido, comisión, retenciones, depósitos | Recursos global |
| Sus facturas (las que emitió y la de comisión) | Solicitudes, accesos, cobro manual |
| Su encuesta y sus testimonios | El Kit y el calendario de redes de Caminante |
| Su marca y su expediente | |

**Datos médicos — decisión tomada.** El operador ve **solo el bloque de seguridad
en campo** (alergias, padecimientos, contacto de emergencia) de quien sube a SU
salida. No ve CURP, beneficiario ni aseguradora. Cada consulta queda registrada.
Es dato sensible bajo LFPDPPP: se peca de estrecho a propósito.

### 3.2b En el panel de Numan — información de operadores
- Columna de estado por operador: **Stripe · CSD · Convenio · Listo**.
- Ventas y comisión generada por operador; lo que se le debe y lo que se le pagó.
- Sus documentos con vigencias (póliza, CSD, certificaciones).
- Historial de cancelaciones y penalizaciones.

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

# FASE 4 · Cancelaciones y reembolsos

⚠️ **Hoy NO existe política de cancelación en ninguna parte.** Ni en el modelo de
datos, ni en la página pública, ni en el deslinde. Se vende sin decirle al cliente
bajo qué condiciones le devuelven su dinero — y eso es justo lo que Jorge señaló
que debe estar en los términos y condiciones.

### 4.1 La política, por experiencia
`Experience.cancelacion`: ventanas en días antes de la salida y qué porcentaje se
devuelve en cada una. Ejemplo: 30+ días → 100% · 15-29 → 50% · menos de 15 → 0%.
Se captura en el formulario y **se publica en la página de la experiencia**.

Por congruencia con la regla de la casa, entra a `listaParaPublicar`: sin política
de cancelación no se publica, igual que sin deslinde y sin encuesta.

### 4.2 El evaluador
`lib/cancelaciones/evaluar.ts` — **función pura, sin efectos**, misma forma que
`deslindeListo`:

```
evaluarCancelacion(reserva, quienCancela, fecha) → {
  dentroDePolitica, porcentajeCliente, montoCliente,
  comisionSeDevuelve, penalizacionOperador, motivo
}
```

Aplica la matriz acordada:

| Quién cancela | Cliente | Comisión Numan | Penalización |
|---|---|---|---|
| Cliente, dentro de política | Según ventana | Se devuelve | — |
| Cliente, fuera de política | Según ventana | Se retiene | — |
| Operador, fuerza mayor | 100% | Se devuelve | No |
| Operador, sin causa | 100% | Se devuelve | **Sí** |

⚠️ **La comisión de Stripe la absorbe el operador** (decisión de Luis: por eso se le
descuenta). Única excepción: si la cancelación es por falla de Numan, la absorbe
Numan. Va escrito en el convenio.

### 4.3 La pantalla de reembolso (admin)
El reembolso lo dispara **una persona**, nunca el sistema solo. La pantalla muestra
todo lo necesario para decidir sin salir a buscarlo:

- **Cliente**: nombre, correo, WhatsApp.
- **La venta**: experiencia, salida, personas, nivel de cabaña, cuánto pagó, cuándo,
  con qué método, y la referencia del cobro (`pi_…` de Stripe o la referencia
  bancaria si fue transferencia).
- **El reloj**: días que faltan para la salida y **en qué ventana cae**.
- **El veredicto del evaluador**: cuánto corresponde devolver y por qué.
- **Monto editable**, como en transferencias: casi siempre hay una razón para
  desviarse, y manda lo que de verdad se devuelve.
- Campo de **motivo**, obligatorio.

### 4.4 Lo que el reembolso tiene que disparar
Un reembolso no es solo mover dinero. En orden, y todo o nada:

1. Refund en Stripe (con la comisión de plataforma devuelta o no, según la matriz).
2. Reserva a `cancelled` y **liberar el cupo** (`seats_taken`) — si no, la salida
   se queda viéndose llena.
3. ⚠️ **El CFDI ya timbrado**: cancelar ante el SAT o emitir nota de crédito. Es
   paso fiscal obligatorio, no opcional. **Cuál de los dos lo confirma Jorge.**
4. Correo al cliente con el comprobante de lo devuelto.
5. Aviso al operador, con la penalización si aplica.
6. Registro en el ledger para que Recursos cuadre.

⚠️ **Los pagos por transferencia no se reembolsan por Stripe.** Ahí la devolución
la hace Luis desde el banco y el sistema solo la registra, con su comprobante —
mismo patrón que `registrarTransferencia` (0034), a la inversa.

---

# Orden de construcción

## Carril A — se construye YA, sin esperar a Jorge

| | Qué |
|---|---|
| **A1** | Migración 0036 + bucket privado del CSD + gate `operadorListo` |
| **A2** | Onboarding de Stripe: alta de cuenta, Account Links, webhook `account.updated` y sus 3 pantallas. **No depende del tipo de cargo.** |
| **A3** | Multi-emisor en Facturapi + subida del CSD |
| **A4** | Política de cancelación por experiencia + el evaluador (función pura) |
| **A5** | Panel del operador (superficie nueva, consultas nacidas con `operator_id`) |
| **A6** | Información de operadores en el panel de Numan |
| **A7** | Borrador del convenio, para que Jorge lo revise en vez de escribirlo |

## Carril B — espera respuesta de Jorge

| | Qué | Qué se necesita |
|---|---|---|
| **B1** | El cobro | Confirmar **cargo directo** vs. destino |
| **B2** | Webhook de cuentas conectadas + separación de ingreso propio vs. comisión | B1 |
| **B3** | Retenciones (cálculo, constancias, entero) | Tasas y supuestos |
| **B4** | Ejecución del reembolso en Stripe | B1 (con cargo directo cambia cómo se devuelve la comisión) |
| **B5** | Cancelación de CFDI vs. nota de crédito | Cuál procede |
| **B6** | Recursos separando propio de comisión | B2 |

**La pantalla de reembolso (4.3) se puede construir completa en el carril A** — el
evaluador, la información y el registro. Lo único que espera es el botón que
ejecuta el refund contra Stripe.

---

# Decisiones ya tomadas (13 ago)

1. ✅ **Reembolsos** — matriz de 4.2, con penalización al operador que cancela sin
   causa (tomado del precedente de GetYourGuide).
2. ✅ **Comisión de Stripe** — la absorbe el operador; por eso se le descuenta.
   Excepción: falla de Numan.
3. ✅ **Panel del operador** — «todo menos lo que no deben saber», en superficie
   aparte. Datos médicos: solo el bloque de seguridad en campo, con registro.
4. ✅ **Convenio** — se genera. Claude redacta el borrador, Jorge lo vuelve
   exigible, y el gate lee el documento firmado del expediente, no una casilla.

# Política de cancelación · propuesta con base en la industria

Investigado en Airbnb (rehízo su sistema en oct 2025) y GetYourGuide. Los tres
patrones que comparten y que aquí se copian:

1. La penalización al operador **escala con la cercanía a la salida**.
2. **Se descuenta de pagos futuros**, no se cobra aparte.
3. **Se exenta por fuerza mayor** documentada.

Referencia: Airbnb cobra al anfitrión entre **USD $50 y $1,000** por cancelación
evitable, como porcentaje del total de la reserva, descontado de su siguiente
depósito. (Antes el tope era $100; lo subieron para desincentivar.) GetYourGuide
solo considera justificable la cancelación del proveedor por fuerza mayor.

## A · Ventanas para el CLIENTE — dos políticas, se elige por experiencia

**Estándar** (salidas de 1–2 días, tipo Amanalco):

| Cuándo cancela | Devolución |
|---|---|
| 30+ días antes | 100% |
| 15–29 días | 50% |
| Menos de 15 días | 0% |

**Expedición** (viajes largos o con anticipos altos, tipo Ensenada o Barrancas):

| Cuándo cancela | Devolución |
|---|---|
| 60+ días antes | 100% |
| 30–59 días | 50% |
| Menos de 30 días | 0% |

⚠️ **Por qué dos y no una:** los proveedores piden anticipo. Lobo Glamp exige **50%
para apartar**. Si Caminante devolviera 100% a 15 días cuando el hospedaje ya está
comprometido, la pérdida la come Caminante. Las ventanas tienen que ser al menos
tan estrictas como las del proveedor de esa experiencia — **es una regla, no una
preferencia**, y conviene verificarla contra cada cotización.

**Más una ventana universal de arrepentimiento**, copiada de Airbnb: **24 horas
para cancelar con reembolso completo** si la reserva se hizo con 7+ días de
anticipación. Cuesta poco, evita casi todas las disputas por compra impulsiva y
juega a favor en cualquier queja ante PROFECO.

## B · Penalización al OPERADOR que cancela sin causa

Sobre el valor de las reservas canceladas:

| Cuándo cancela | Penalización |
|---|---|
| Más de 30 días antes | 0% — hay tiempo de recolocar |
| 15–30 días | 10% |
| 3–14 días | 20% |
| Menos de 72 h, o no se presenta | 30% |

- **Mínimo $500 · tope $15,000** por salida.
- **Se descuenta de pagos futuros** (patrón Airbnb), no se factura aparte.
- **Se exenta por fuerza mayor documentada**: clima que impide operar con
  seguridad, cierre del área, emergencia médica del guía. La documenta el operador
  y la aprueba Luis — queda registrada en su historial.
- El cliente siempre recibe **100%**, cancele quien cancele, si la cancelación es
  del operador.

⚠️ Va al convenio y a los términos y condiciones. Sin eso escrito y aceptado, no es
exigible.

---

# Sigue abierto

- Que Luis confirme o ajuste los porcentajes de arriba.
- Verificar las ventanas de cada proveedor vigente (Lobo Glamp 50% de anticipo;
  faltan Ensenada, Barrancas y volcanes) para que ninguna política de cliente sea
  más laxa que la del proveedor.
