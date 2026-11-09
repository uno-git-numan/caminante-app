# MAPA — el dinero de Caminante y cada factura que nace de él

**9 nov 2026.** Pedido de Luis: que quien compró suba sus datos fiscales en
«Mi espacio», que el portal timbre con Facturapi y entregue la factura, y que la
plataforma facture sola lo que retiene a las operadoras. Esto es el mapa y el
plan; **no se construye nada hasta cerrar las decisiones de la §4.**

Lo que ya existe y NO se rehace: `lib/facturacion/` (cliente Facturapi,
catálogos SAT, token, `emitirCFDI`), la 0019 (`payments.status_cfdi`,
`cfdi_invoices`, bucket `cfdi`), `/caminante/facturacion` (autofactura por
correo+monto) y `/caminante/admin/facturacion`. Todo apagado por
`FACTURAPI_SECRET_KEY`. Ver `rules/dinero.md` y `PLAN-CONNECT-MULTIEMISOR.md` §2.

---

## 1 · Lo que hay en la caja hoy (verificado contra la base, 9 nov 2026)

| | |
|---|---|
| Cobros vivos (pagados + devueltos) desde el 12 jun 2026 | **82** |
| Cobrado | **$894,275.00** |
| Devuelto (Stripe, 9 devoluciones totales) | **$42,000.00** |
| Comisión de plataforma congelada en `platform_fee_mxn` | **$21,305.63** |
| Comisión de Stripe registrada | $9,842.34 |
| Por canal | **100 % `casa`** (49 Stripe + 24 transferencia + 9 devueltos). **Connect: 0.** |
| CFDI emitidos por el sistema | **0** — los 82 están `por-emitir` |
| Reservas pagadas por operadora | Caminante (la casa) **59** · Nomádika **12** · Kéntro 0 |
| Liquidaciones registradas | 1 (Nomádika, $18,707.69 el 18 sep, con $1,328.33 de concesión declarada) |

Datos fiscales de las tres operadoras en `operators`:

| | RFC | Razón social | Régimen | CP | Persona | CSD | Facturapi |
|---|---|---|---|---|---|---|---|
| Caminante (NUMAN HUB) | NHU250826CS8 | NUMAN HUB | 601 | 11000 | moral | **no** | **no** |
| Nomádika | ROBL990531HI3 | Laura Catalina Romero Barragán | **falta** | **falta** | **falta** (es física) | no | no |
| Kéntro | KHO230512AB1 | Kéntro Hospitalidad, S.A. de C.V. | **falta** | **falta** | **falta** | no | no |

Y de los **clientes** no hay ni un solo dato fiscal guardado: `contacts` no tiene
RFC ni CP fiscal. Eso es exactamente lo que falta en «Mi espacio».

⚠️ Dos hechos de los que depende todo lo demás:
- **El SAT no tiene registrada la actividad de turismo para NUMAN HUB** (la CSF
  trae 15 actividades de medios y software). Un CFDI con clave 90121500
  (agencias/operadores de excursiones) saldría de un emisor que no la declara.
  Consultado a Ekko el 18 ago; sigue abierto.
- **Nunca se ha emitido un CFDI.** Lo que la contadora haya declarado de estos
  $894,275 se hizo fuera del sistema. Antes de timbrar el primero hay que
  **cuadrar el pasado** (§3.0), o el sistema facturaría dos veces lo que ya se
  declaró.

---

## 2 · El mapa: cada movimiento de dinero y la factura que le toca

Convención: **A → B** = A paga a B. «CFDI ingreso X → Y» = X lo emite, Y lo recibe.

### 2.1 El cliente paga una experiencia

Hoy TODO el dinero entra a la cuenta de NUMAN HUB (canal `casa`), por cuatro
puertas que terminan igual (`rules/dinero.md`): web, página de pago (link
especial / WhatsApp), transferencia, pago manual. Precio público = base × 1.16;
la comisión se calcula sobre la **base sin IVA** (`lib/operadores/comision.ts`).

```
Cliente ──$ precio público (IVA incluido)──▶ NUMAN HUB (Stripe o banco)
                                                │
                                                ├─ Stripe se cobra 3.6 % + $3 + IVA
                                                ├─ NUMAN retiene comisión (platform_fee_mxn, sin IVA) + su IVA
                                                └─ el resto se LIQUIDA a la operadora por banco (operator_liquidaciones)
```

**Caso A · experiencia de la casa (59 de 71 reservas pagadas).** Un solo CFDI:

| # | CFDI | Emisor → receptor | Monto | Cuándo |
|---|---|---|---|---|
| A1 | **Ingreso** por la experiencia (PUE, tarjeta 04 o transferencia 03) | NUMAN HUB → cliente | lo que pagó (viaje + complementos − descuento), IVA incluido | cuando el cliente lo pide desde Mi espacio, o… |
| A2 | **Ingreso global «público en general»** (RFC XAXX010101000) | NUMAN HUB → público | la suma de los A1 que nadie pidió en el mes | al cierre de mes, automático |

**Caso B · experiencia de una operadora (Nomádika hoy; Kéntro mañana).**
Es la **decisión 2 del MVP (modelo Airbnb)**: la operadora le factura al cliente
su servicio; Caminante factura SOLO su comisión, a la operadora. Dos CFDI por
venta, de dos emisores distintos:

| # | CFDI | Emisor → receptor | Monto | Cuándo |
|---|---|---|---|---|
| B1 | **Ingreso** por la experiencia | **OPERADORA** → cliente (con el CSD de la operadora, desde el portal) | lo que pagó el cliente, IVA incluido | cuando el cliente lo pide, o B1g global de la operadora al cierre |
| B2 | **Ingreso por comisión de intermediación** | **NUMAN HUB → operadora** | `platform_fee_mxn` + 16 % IVA (= lo retenido; decisión 4 del MVP) | **automático al confirmarse el pago** (webhook / transferencia confirmada) |

Lo que NUMAN le deposita a la operadora (`liquidación`) **no genera CFDI**: es
dinero cobrado por cuenta de ella, no un pago por un servicio. Lo que sí deja
rastro es B2, que explica la diferencia entre lo cobrado y lo depositado.

⚠️ **La alternativa (modelo reventa):** NUMAN factura 100 % al cliente y la
operadora le factura a NUMAN su neto. Es más fácil hoy (sólo necesita el CSD de
NUMAN) y coincide con cómo FLUYE el dinero, pero contradice la decisión 2,
convierte en ingreso de NUMAN $894k que no son suyos, y con una operadora
persona física (Nomádika) obliga a NUMAN a retenerle como a un prestador de
servicios. **Se propone sostener Airbnb (B1+B2)**; la contadora confirma en §4.

### 2.2 Descuentos, códigos y links especiales

No cambian el mapa: el CFDI es por **lo que se pagó**. El precio de lista y el
descuento viajan en la factura como `Descuento` del concepto (SAT lo permite y
cuadra con `reservations.precio_lista_mxn` / `descuento_mxn`). Los complementos
(el tren) son **conceptos aparte** en el mismo CFDI, con su propia clave.

### 2.3 Devoluciones (9 totales hasta hoy; $42,000)

```
NUMAN HUB ──$ devolución──▶ Cliente        (Stripe devuelve también su parte de la comisión de Stripe)
```

| # | Si ya se había emitido… | Qué nace |
|---|---|---|
| D1 | A1 o B1 (factura al cliente) | **CFDI de egreso** (nota de crédito) relacionado, por lo devuelto; o **cancelación** con motivo 01/02 si es total y la contadora lo prefiere así |
| D2 | B2 (comisión a la operadora) | **Egreso proporcional** NUMAN → operadora: la comisión se devuelve en la misma proporción que el cobro (`netoDelPago`), así que el CFDI también |
| D3 | nada todavía | nada: el pago pasa a `no-facturable` y la global del mes no lo incluye |

### 2.4 Liquidación a la operadora (lo que sale del banco de NUMAN)

```
NUMAN HUB ──$ cobrado − devuelto − comisión (proporcional)──▶ Operadora
```

Sin CFDI (ver 2.1-B). Lo que SÍ puede nacer:

| # | Caso | CFDI |
|---|---|---|
| L1 | Concesión al liquidar (`diferencia_mxn`, como la de Nomádika: $1,328.33 «menos comisión por ser la primera») | **Egreso** NUMAN → operadora sobre los B2 de ese periodo, por la diferencia. Hoy esa concesión existe en la base y **no tiene documento fiscal**. |
| L2 | Penalización a la operadora que cancela sin causa (política del plan de Connect, «se descuenta de pagos futuros») | **Ingreso** NUMAN → operadora por la penalización, o se netea contra la liquidación con su CFDI. Todavía no hay una sola. |

⚠️ **Quién absorbe la comisión de Stripe.** La decisión del 13 ago dice «la
operadora». El código dice otra cosa: la liquidación es cobrado − devuelto −
comisión, **sin restar Stripe**, así que hoy la absorbe NUMAN (los $9,842 son
costo de NUMAN). Si se cambia, la operadora recibe menos y hay que decidir si el
cargo de Stripe se le refactura (CFDI de NUMAN → operadora por «gastos por
cuenta de») o se deja en la comisión. Decisión en §4.

### 2.5 Lo que NUMAN paga a terceros (sale del portal, entra a La Caja)

| # | Movimiento | CFDI que debe EXISTIR (lo emite el tercero, NUMAN lo recibe) |
|---|---|---|
| T1 | Stripe cobra su comisión | CFDI de Stripe México → NUMAN (IVA acreditable; 3.646 % de costo real) |
| T2 | Proveedores de la experiencia propia (hospedaje, guías, tren) | CFDI proveedor → NUMAN. Ya lo lleva `/facturas` de La Caja. |
| T3 | Embajadores (30 % de la utilidad neta) y equipo (10 % numan / 3 % Caminante) | CFDI de honorarios o nómina del receptor → NUMAN. **No lo emite el portal**; el portal sólo deriva cuánto (`lib/equipo/comisiones.ts`). |
| T4 | Facturapi, Vercel, Supabase, Resend | CFDI del proveedor → NUMAN (La Caja). |

### 2.6 Retenciones (la pregunta que decide si Nomádika cobra lo que cree)

Nomádika es **persona física**. Cuando una plataforma cobra por cuenta de una
persona física y le entrega el dinero, la ley de plataformas tecnológicas
(LISR 113-A, LIVA 18-J) puede obligar a la plataforma a **retener ISR e IVA** y a
emitir cada mes un **CFDI de retenciones e información de pagos**. Si aplica,
nace:

| # | CFDI | Emisor → receptor | Cuándo |
|---|---|---|---|
| R1 | **Retenciones** (complemento plataformas tecnológicas) | NUMAN HUB → operadora persona física | mensual, por lo cobrado por su cuenta |

Hoy no se retiene nada y la liquidación entrega el 100 % del neto. **Esto lo
decide la contadora, no el código**; el plan deja el componente en cero hasta
que diga (decisión 2 del MVP).

### 2.7 Mañana, con Connect (A3)

Cargo con destino + `on_behalf_of` = la operadora: el dinero del cliente cae en
la cuenta conectada y NUMAN se queda sólo `application_fee` = comisión + IVA.
**Las facturas son exactamente las mismas (B1, B2, D1, D2, R1)**; lo que
desaparece es la liquidación por banco. Por eso conviene construir el modelo
Airbnb ahora: Connect no cambia el mapa, sólo quita un paso.

### 2.8 Resumen: los diez documentos

| | Emisor → receptor | Disparador | Fase |
|---|---|---|---|
| A1 | NUMAN → cliente (experiencia propia) | el cliente lo pide | 1 |
| A2 | NUMAN → público en general (global) | cierre de mes | 5 |
| B1 | Operadora → cliente (experiencia de operadora) | el cliente lo pide | 2 |
| B1g | Operadora → público en general (global) | cierre de mes, botón para la operadora | 5 |
| B2 | NUMAN → operadora (comisión + IVA) | pago confirmado | 3 |
| D1 | Egreso sobre A1/B1 | devolución confirmada por Stripe | 4 |
| D2 | Egreso sobre B2 (proporcional) | devolución confirmada | 4 |
| L1 | Egreso sobre B2 por concesión al liquidar | liquidación con diferencia | 4 |
| L2 | Ingreso por penalización a la operadora | cancelación sin causa | después |
| R1 | Retenciones a persona física | mensual | 6 (si la contadora dice que aplica) |

---

## 3 · El plan, por fases

**Regla del plan:** cada fase deja el sistema completo y verdadero para lo que
cubre; nada se prende «a medias». El código existente se reusa; lo que se
vuelva obsoleto (el lookup correo+monto para quien ya tiene sesión) se quita en
el mismo ciclo.

### Fase 0 · Cimientos que no son código (Luis + contadora) — BLOQUEA TODO

1. **Facturapi**: contratar el plan **«API de Facturación CFDI»** ($299/mes +
   $0.60 por timbre; ya es multi-RFC, no contratar Facturación Web / Autofactura
   / Facturapi para Stripe). Crear la organización de NUMAN HUB, subir su **CSD**
   (lo sube Luis; Claude nunca lo toca), sacar Test key y Live key.
2. **SAT**: que NUMAN HUB tenga registrada la actividad de turismo (o que Ekko
   diga por escrito que no hace falta).
3. **Cuadrar el pasado**: lista de los 82 cobros con lo que la contadora ya
   declaró. Cada uno queda `emitido` (si ella emitió a mano, con su UUID),
   `publico-general` (si entró en una global suya) o `no-facturable`. **Sólo
   los que queden `por-emitir` entran al sistema.** Se hace con un script de
   lectura + un CSV que ella llena; nada se adivina.
4. **Datos fiscales de las operadoras**: régimen, CP fiscal y tipo de persona de
   Nomádika y Kéntro (hoy en NULL; obligatorios en CFDI 4.0).
5. Las **decisiones de la §4**.

### Fase 1 · Datos fiscales en Mi espacio + «Mis facturas» (la casa, caso A)

- Migración **0075**: tabla `datos_fiscales` (una por cuenta: `user_id`,
  `contact_id`, RFC, razón social exacta, régimen, CP, uso CFDI por defecto,
  correo para facturas, `csf_path` opcional, `verificado_at`). Validación con
  `catalogos.ts` (RFC, CP, régimen compatible con el tipo de RFC).
- En `/caminante/perfil`, bloque **«Tus datos fiscales»** (estilo del
  entregable `.mesp`; si hace falta lámina nueva, se le pide a Claude Design
  ANTES) y bloque **«Tus facturas»**: cada pago de la persona con su estado
  (facturable · emitida · incluida en global · no facturable), botón
  **«Facturar»** que timbra con los datos guardados sin volver a teclear, y
  descargas XML/PDF.
- `emitirCFDI` deja de depender del formulario: toma los datos de
  `datos_fiscales`; el camino por token (quien compró sin cuenta) se conserva y
  al terminar le ofrece guardar los datos en su cuenta.
- Correo «tu factura» por Resend con XML+PDF (hoy lo manda Facturapi; mejor el
  remitente «Luis · Caminante», como todo lo demás).
- Lo que se quita: el lookup correo+monto para quien tiene sesión.
- **Sandbox primero** (Test key en `.env.local`), **luego Live en Vercel.**

### Fase 2 · El emisor correcto (operadoras, caso B1)

- `facturapiPara(operatorId)`: una organización de Facturapi por operadora
  (`operators.facturapi_org_id`), creada por API cuando la operadora sube su CSD
  en Mi alta (el flujo de subida ya existe: bucket `csd`, `csd_cer_path`,
  `csd_key_path`, gate `listo-para-vender` que exige los DOS archivos). La
  contraseña del CSD la teclea la operadora y va directo a Facturapi; no se
  guarda.
- La autofactura del cliente resuelve **de quién es la venta** y timbra con esa
  organización. El cliente no nota la diferencia.
- Vigencia del CSD (4 años): `csd_vence_at` ya existe; aviso 60 días antes y el
  gate lo rechaza vencido.

### Fase 3 · La comisión se factura sola (B2)

- Al confirmarse un pago de una venta de operadora (webhook de Stripe o
  transferencia confirmada), NUMAN emite **B2** a la operadora por
  `platform_fee_mxn` + IVA. Idempotente por pago (índice único por
  `payment_id` + `tipo`).
- `cfdi_invoices` crece con `tipo` (`cliente` · `comision` · `egreso` ·
  `retencion` · `global`), `emisor_operator_id`, `receptor_operator_id`,
  `relacionado_id` (0075 o 0076).
- La operadora ve sus B2 en su panel («Facturas de Caminante») y la liquidación
  los enlaza: lo depositado = cobrado − devuelto − (lo que dicen las B2).
- Clave de producto y uso CFDI de la comisión los confirma la contadora
  (intermediación ≠ servicio turístico).

### Fase 4 · Devoluciones y concesiones (D1, D2, L1)

- `finalizeRefund` dispara el egreso proporcional sobre lo emitido; si no había
  CFDI, marca `no-facturable`.
- La liquidación con `diferencia_mxn` emite L1.
- Regla «cancelar vs. nota de crédito» configurable (la fija la contadora).

### Fase 5 · Cierre de mes (A2, B1g)

- Cron el día 1: global de NUMAN por los `por-emitir` de la casa del mes
  anterior; botón para que cada operadora emita la suya desde su panel.
- Write-back a La Caja (F4 de la memoria): bajar XML/PDF de `cfdi_invoices` sin
  archivar y escribir `ingresos.csv` + `emitidas/`.

### Fase 6 · Retenciones (R1), sólo si la contadora dice que aplica

- Cálculo mensual por operadora persona física, CFDI de retenciones,
  y la liquidación resta lo retenido. Hasta entonces el componente vale 0 y se
  dice en pantalla («sin retención: pendiente de definir»), nunca se oculta.

### Después · Connect (A3)

Mismo mapa; se quita la liquidación por banco. Lo pendiente de Luis está en
`caminante-connect-multiemisor` (segundo webhook, comisión de Kéntro).

---

## 4 · Decisiones que no son mías

Para Luis (y la contadora donde se indica). **Sin estas, la Fase 1 no arranca.**

1. **Modelo fiscal para el canal `casa`**: Airbnb (B1+B2, lo propuesto) o
   reventa. *Contadora.*
2. **Retención a operadoras persona física** (Nomádika): ¿aplica el régimen de
   plataformas (ISR/IVA)? ¿con qué tasas? *Contadora.*
3. **Quién absorbe la comisión de Stripe**: hoy NUMAN (código); la decisión del
   13 ago decía la operadora. Elegir una y alinear código y convenio.
4. **Claves SAT**: producto/servicio de la experiencia (hoy default 90121500),
   de la comisión, de los complementos; uso CFDI por defecto (G03 vs S01 para
   personas físicas); forma de pago (04 tarjeta, 03 transferencia). *Contadora.*
5. **Devoluciones**: nota de crédito siempre, o cancelación cuando es total y del
   mismo mes. *Contadora.*
6. **Global «público en general»**: mensual el día 1, por emisor. ¿Diaria
   mejor? *Contadora.*
7. **El pasado**: quién llena el CSV de los 82 cobros (qué se declaró y cómo).
8. **Actividad en el SAT**: ¿ya está, o Ekko dice que no hace falta?
9. **Datos fiscales del cliente**: una sola ficha por cuenta (propuesto) o
   varias (quien compra para su empresa y para sí). Una es más simple; varias
   es un dropdown al facturar.

## 5 · Qué NO hace el portal (a propósito)

- No emite los CFDI que terceros deben darle a NUMAN (T1–T4): eso es La Caja.
- No mueve dinero: las liquidaciones se registran, el banco lo opera Luis.
- No guarda contraseñas de CSD ni llaves: van a Facturapi; las teclea su dueño.
- No decide tasas ni claves fiscales: las fija la contadora y el código las
  lee de configuración.
