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

---

## 0 · MODELO FISCAL — definido con Luis el 9 nov 2026

**Operamos como Airbnb.** Confirmado el 9 nov contra la **guía oficial de
Airbnb México** («Guía de pago de impuestos en México», 84 pp.): «*Tu factura
debe emitirse por el monto total del alojamiento, experiencia o aventura*» la
emite el **anfitrión**, incluso si el huésped no la pide (entonces en una
«factura global»); Airbnb emite **sólo** «*la factura por el cobro por uso de
plataforma*» (reglas 2.7.1.16 y 12.1.4) y entrega cada mes la **constancia de
retenciones** (4 % ISR hospedaje, 1 % otros servicios, 8 % IVA; 36 % sin RFC;
sin retención a personas morales en esa versión de la guía). En devoluciones,
el anfitrión emite nota de crédito o cancela. Así factura Airbnb en México:
el **anfitrión emite el CFDI al huésped** por el hospedaje (a su RFC si lo pide,
o lo mete en su global); **Airbnb emite su propio CFDI por su tarifa de
servicio** (con IVA); y Airbnb, como plataforma que cobra por cuenta del
anfitrión, **le retiene ISR e IVA y le entrega cada mes un CFDI de retenciones**.
Airbnb nunca factura el hospedaje: sólo intermedia.

Traducido a Caminante:

| Quién | Qué emite | A quién |
|---|---|---|
| **La operadora** (DRUIDAS para las experiencias propias; Nomádika; Kéntro) | CFDI de ingreso por la experiencia, con su CSD, desde el portal (**B1**) | al cliente (o global **B1g**) |
| **NUMAN HUB** (la plataforma) | CFDI de ingreso por la **comisión de plataforma + IVA** (**B2**) | a la operadora |
| **NUMAN HUB** | CFDI de **retenciones e información de pagos** (**R1**), mensual | a cada operadora persona física (y a morales si la reforma 2026 lo exige: ver abajo) |
| NUMAN HUB | nada por lo que deposita (**liquidación**): es dinero de la operadora cobrado por su cuenta | — |

### 0.1 La nueva pieza: DRUIDAS

Se constituye una **empresa de turismo (DRUIDAS)** que será la operadora de las
experiencias propias (Caminante; Kéntro conserva su RFC). **NUMAN HUB queda
como la plataforma**: software, cobro y comisión. Consecuencias:

- NUMAN **ya no necesita** dar de alta turismo en el SAT: factura servicios de
  plataforma (comisión) y nada más. Cierra la «omisión» de la CSF.
- DRUIDAS nace con las actividades de turismo en su CSF **desde el acta**
  (agencias de viajes / organización de excursiones), su e.firma y su **CSD**;
  en Facturapi tiene su propia organización. En la base es una fila de
  `operators` (`propia = true`), y la fila `numan-caminante` deja de ser
  operadora: NUMAN es `es_la_casa` (plataforma), DRUIDAS es la casa que vende.
- **Mientras DRUIDAS no exista**, las ventas propias no tienen emisor turístico
  limpio. Decisión: las ventas de la casa se facturan al cliente **cuando
  DRUIDAS tenga CSD**; hasta entonces se acumulan `por-emitir` (y Marisol decide
  si las ventas de 2026 anteriores a DRUIDAS las emite NUMAN como hasta hoy).
  Nomádika **sí puede arrancar antes**: en cuanto suba su CSD.
- NUMAN le factura a DRUIDAS la comisión (B2) igual que a cualquier operadora.
  Es una operación entre partes relacionadas: la contadora fija el **precio de
  transferencia** (la escala pública es defendible porque es la misma que paga
  Nomádika).
- Tiempo realista: acta + RFC + e.firma + CSD + alta de actividades: **4 a 8
  semanas**. Arrancar YA; la Fase 1 (datos fiscales en Mi espacio) se construye
  en paralelo porque no depende de DRUIDAS.

### 0.2 Operadoras persona física (serán muchas) — qué tiene que pasar

Fuentes: LISR 113-A a 113-C, LIVA 18-J; guías 2026 al pie. **Las tasas exactas
las confirma la contadora** porque las fuentes se contradicen en una (ver ⚠️).

1. **La plataforma retiene.** Cuando NUMAN cobra por cuenta de una persona
   física y le deposita, debe **retener ISR e IVA** sobre el ingreso SIN IVA de
   cada venta y enterarlos al SAT **a más tardar el 17 del mes siguiente**.
   - IVA: **50 % del IVA trasladado** (8 % del precio sin IVA) si da RFC; **100 %**
     si no.
   - ISR por «prestación de servicios» (lo nuestro: no es hospedaje ni
     transporte): la LISR 113-A III dice **1 %**; la **LIF 2026, art. 25 fracc.
     VI** (DOF 07-11-2025, leída el 9 nov) lo sustituye por **2.5 %** y extiende
     la retención a **personas morales** (2.5 %; 20 % sin RFC; IVA 50 % por la
     fracc. IX). ⚠️ Marisol lo confirma (`MEMO-MARISOL-2026-11.md`). Sin RFC: **20 %**.
2. **CFDI de retenciones mensual** (complemento «Servicios Plataformas
   Tecnológicas») de NUMAN a cada operadora, y la declaración informativa.
   Es el documento **R1** del mapa; se emite por Facturapi.
3. **La operadora cambia de régimen**: debe darse de alta en el **Régimen de
   actividades empresariales con ingresos a través de plataformas tecnológicas
   (625)**. ⚠️ **RESICO es incompatible** con ingresos por plataformas (la exclusión
   NO está en el texto del 113-E —verificado 9 nov contra el PDF oficial—; la
   traen la RMF y los criterios del SAT: Marisol cita la regla exacta,
   `MEMO-MARISOL-2026-11.md` pregunta c): una operadora en RESICO tiene que salirse o no puede vender por
   Caminante. Esto va en el **onboarding** («Mi alta»): el expediente pide el
   régimen y el gate `listo-para-vender` rechaza RESICO y «sin régimen».
4. **Pago definitivo**: si sus ingresos anuales no pasan de **$300,000**, puede
   optar por que la retención sea su impuesto final (menos carga para ella). Se
   le explica en el onboarding; la opción la ejerce ella ante el SAT.
5. **Ella sigue facturando al cliente** (B1) y su CFDI lleva, si la contadora lo
   indica, el complemento de plataformas tecnológicas. El portal lo timbra con
   su CSD; ella no hace nada.
6. **Lo que ve en su liquidación**: cobrado − devuelto − comisión(+IVA) −
   **retenciones** = lo que se le deposita. El convenio lo dice con números.

⚠️ **Personas morales (Kéntro, DRUIDAS):** varias guías 2026 afirman que la
reforma extendió la retención a personas morales residentes (4 % ISR ó 2.5 %
según la fuente, y 8 % IVA). Si es así, B2 y R1 aplican igual a Kéntro y a
DRUIDAS. Marisol confirma; el código trae las tasas en **configuración por tipo
de persona**, nunca quemadas.

### 0.3 La comisión de Stripe va DENTRO de la comisión de NUMAN

Decidido: NUMAN la absorbe (el código ya lo hace: la liquidación es cobrado −
devuelto − comisión, sin restar Stripe). Se corrige la decisión del 13 ago en
el plan de Connect y el **convenio** lo dice así. Con Connect, igual:
`application_fee` = comisión + IVA y NUMAN paga el fee de Stripe.

### 0.4 Claves SAT para la experiencia (c_ClaveProdServ, Anexo 20 v4.0)

Familia **9012 «Facilitación de viajes»**:

| Clave | Descripción oficial | Cuándo |
|---|---|---|
| **90121501** | Servicios de organización de excursiones | **la clave por defecto de toda experiencia** (B1): es literalmente lo que vende una operadora |
| 90121502 | Agencias de viajes | si la operadora se asume como agencia (revende hospedaje y transporte de terceros) |
| 90121701 | Guías locales o de excursiones | experiencia que es sólo guía (sin hospedaje ni logística) |
| 90111501 / 90111800 | Hoteles / campamentos | sólo si la contadora pide **desglosar** el hospedaje como concepto aparte |
| 78111800 | Transporte de pasajeros por carretera | complemento de transporte vendido aparte (el tren de Barrancas) |
| **80141628** | Servicio de distribuidores por comisión | **la comisión de NUMAN a la operadora (B2)**; el propio SAT la sugiere para comisiones mercantiles |
| 80141706 | Servicio de intermediación de productos | alternativa para B2 si la contadora prefiere «intermediación» |

Reglas: **un concepto por línea cobrada** (viaje por persona; cada complemento
con su clave; el descuento como `Descuento` del concepto); objeto de impuesto
**02** (sí objeto de IVA, 16 %); unidad **E48 «Unidad de servicio»**; método
**PUE** (se paga en una exhibición antes del viaje); forma de pago **04**
tarjeta / **03** transferencia / **01** efectivo — y en el B1 de la operadora,
como el dinero lo cobró NUMAN, la contadora decide si va **31 «Intermediario
pagos»** (existe exactamente para esto) o la forma con que pagó el cliente.
**Hoy el default del código es 90121500 («Agentes de viajes»), que es la
familia, no un servicio: se cambia a 90121501.** La clave y el uso CFDI
(G03 gastos en general por defecto; S01 para quien no deduce) se guardan **por
experiencia** con el default de arriba, para que una experiencia con hospedaje
desglosado o un complemento de transporte no se facture mal.

### 0.5 Devoluciones: nota de crédito, cancelación o nada

| Caso | Qué conviene | Por qué |
|---|---|---|
| Aún **no se emitió** CFDI (la mayoría: el cliente pide factura después) | **Nada.** El pago pasa a `no-facturable` y no entra en la global | no hay documento que corregir |
| Devolución **parcial** (50 % por la política, o un complemento) | **CFDI de egreso** (nota de crédito) relacionado al de ingreso, tipo de relación 01 | la operación SÍ ocurrió; el egreso resta ingreso e IVA sin tocar el original |
| Devolución **total** y la salida no ocurrió, **dentro del mismo mes** | **Cancelar** con motivo **03 «No se llevó a cabo la operación»** | es lo que el SAT prevé para eso; deja el periodo limpio. Si el CFDI pasa de $1,000 el receptor tiene 3 días hábiles para aceptar; si no responde, se acepta solo |
| Devolución **total** después de cerrado el mes (IVA ya declarado) | **Egreso** por el total | cancelar un periodo declarado obliga a complementaria; el egreso lo ajusta en el mes en que se devuelve |
| Comisión (B2) cuando hay devolución | **Egreso proporcional** NUMAN → operadora | la comisión vuelve en la misma proporción que el cobro (`netoDelPago`) |
| Concesión al liquidar (L1) | **Egreso** sobre B2 | es un descuento posterior sobre la comisión, no un error |

**Por qué no «cancelar siempre»:** desde 2026 la cancelación de un CFDI con
complemento de pago exige aceptación aunque sea menor a $1,000 y el SAT multa
las cancelaciones fuera de plazo; la nota de crédito nunca depende del
receptor. **Por qué no «egreso siempre»:** si la experiencia no ocurrió,
sostener un ingreso y un egreso iguales es ruido en la contabilidad y en la
conciliación con La Caja. La regla de arriba es la propuesta; Marisol la fija y
el código la lee como configuración (`mismo_mes → cancelar | egreso`).

### 0.6 El pasado: lo que Marisol emitió por fuera

Marisol ha venido emitiendo los CFDI del 2026 por fuera, sin dejar registro en
Drive ni en la base. **Antes del primer timbre del sistema**, ella entrega la
lista de UUIDs emitidos (basta exportar del portal del SAT «facturas emitidas»
de NUMAN HUB) y un script la cruza contra los 82 cobros por monto y fecha:

- cruza → `payments.status_cfdi = 'emitido'` + fila en `cfdi_invoices` con el
  UUID (sin XML si no lo tiene; se puede descargar del SAT después);
- entró en una global suya → `publico-general`;
- lo que no cruce queda `por-emitir` y se decide uno por uno.

Y hacia adelante, **la regla de oro aplica**: todo CFDI que emita el sistema se
archiva en `cfdi_invoices` + Storage y se drena a La Caja (Fase 5). Lo que
Marisol emita a mano, si algo, se registra en la misma tabla desde el panel.

### 0.7 Una sola ficha fiscal por cuenta — de acuerdo

Una ficha por cuenta, editable. Quien necesite facturar a otro RFC (su
empresa) la cambia antes de pedir la factura; la factura guarda la ficha
**congelada** en `cfdi_invoices`, así que cambiarla después no reescribe nada.
Si en seis meses aparecen diez personas que alternan dos RFC, se agrega un
selector; hoy sería un control para nadie.

### 0.8 El flujo del dinero tiene que justificar las facturas (Luis, 9 nov)

Hoy el 100 % entra a la cuenta de NUMAN y NUMAN deposita el neto por banco.
Fiscalmente eso es **cobro por cuenta de terceros** y es exactamente lo que hace
Airbnb (cobra todo, retiene, deposita): el modelo B1/B2/R1 es válido así. Pero
Luis quiere que **el dinero mismo** lo diga, no sólo los documentos. Eso es
**Stripe Connect con cargo con destino y `on_behalf_of` = la operadora**
(decisión 3 del MVP), y por eso Connect deja de ser «después» y entra al plan:

```
Cliente ──$ total──▶ Stripe (cargo a nombre de la OPERADORA, on_behalf_of)
                       ├─ application_fee → NUMAN  = comisión + IVA (+ retenciones ISR/IVA cuando apliquen)
                       └─ el resto cae en la CUENTA CONECTADA de la operadora (Stripe le deposita a su banco)
```

- La operadora es el **comerciante de liquidación**: en su Stripe y en su banco
  aparece el total cobrado menos lo que NUMAN retuvo. **Su B1 cuadra con su
  cuenta; el B2 de NUMAN cuadra con el `application_fee`.** No hay liquidación
  por banco que explicar.
- Las **retenciones** viajan dentro del `application_fee`: NUMAN se queda
  comisión + IVA + ISR/IVA retenidos, entera los retenidos al SAT el 17 y emite
  R1. `platform_fee_mxn` sigue siendo la comisión sin IVA; lo demás se deriva.
- **Devoluciones**: `refund` con `reverse_transfer` + `refund_application_fee`
  → las dos partes regresan en proporción, igual que las notas de crédito.
- NUMAN paga el fee de Stripe (está dentro de su comisión, §0.3).
- **DRUIDAS también es cuenta conectada**: las experiencias propias corren por
  el mismo riel; NUMAN nunca toca su parte.
- Nomádika es persona física: Stripe Express MX admite individuos (KYC con
  INE y CLABE). Kéntro y DRUIDAS: empresa.

**Transición**: lo que ya se cobró por `casa` se liquida como hasta hoy y se
documenta como cobro por cuenta de terceros (B1 de la operadora + B2 de NUMAN,
sin Connect). Desde que una operadora tenga cuenta conectada, sus ventas
nuevas van por Connect. Los dos canales ya existen en `payments.canal_cobro`
y la liquidación sólo mira `casa` (trigger 0066).

Qué falta para Connect (`caminante-connect-multiemisor`): el segundo webhook
de Stripe para cuentas conectadas (Luis), `createCheckout` bifurcando por
canal (la última pieza, a propósito), y la cuenta Express de cada operadora
desde «Mi alta» (pantalla ya construida). **Entra como Fase 2b** del plan.

### Fuentes consultadas (9 nov 2026)

- Airbnb en México: **[Guía oficial de pago de impuestos en México (PDF de Airbnb, 84 pp.)](https://assets.contentstack.io/v3/assets/bltb428ce5d46f8efd8/blt149e452d316dcaa9/5fdd215cb80b0a1a68f9f371/Airbnb_Guia_de_Pago_de_Impuestos_en_Mexico.pdf)** · [Facturación CFDI para hosts de Airbnb (Host Tax)](https://hosttax.mx/recursos/facturacion-airbnb) · [¿Se puede facturar Airbnb? (Praxium)](https://praxiumconsultores.com/blog/puedo-pedir-factura-de-airbnb-como-huesped) · [Impuestos Airbnb 2026 (Heru)](https://www.heru.app/blog/impuestos-airbnb-mexico/) · [Ayuda de Airbnb](https://es-l.airbnb.com/help/article/1857)
- Régimen de plataformas: [Guía 2026 (Praxium)](https://praxiumconsultores.com/blog/regimen-plataformas-digitales-guia-2026) · [Art. 113-A comentado (SDV)](https://sdv.com.mx/compendio/ley-isr/articulo-113-a/) · [Retenciones 2026 (Contarito)](https://contarito.com.mx/blog/retenciones-plataformas-digitales-2026-tabla-actualizada/) · [Personas morales 2026 (Camacho Limón)](https://camacholimon.com/retenciones-personas-morales-plataformas-digitales-2026/) · [Régimen 625 (SATFácil)](https://www.satfacil.com.mx/regimen/625-plataformas-tecnologicas) · [RESICO y plataformas (Mercado Pago)](https://www.mercadopago.com.mx/blog/que-es-resico-para-vendedores-plataformas) · [Obligaciones de las plataformas (Siempre al día)](https://siemprealdia.co/mexico/fiscal/obligaciones-fiscales-de-las-plataformas-digitales/)
- Claves SAT: [90121500 y familia 9012 (veinte.mx)](https://veinte.mx/catalogos/servicios/grupo/9012) · [Anexo 20 v4.0 90121500 (GNCYS)](https://www.gncys.com/anexo20/4.0/claveprodserv/90121500) · [80141628 distribuidores por comisión](https://veinte.mx/catalogos/clave/80141628) · [80141706 intermediación](https://veinte.mx/catalogos/clave/80141706) · [Sugerencia del SAT: servicios de comisión (PDF)](http://omawww.sat.gob.mx/informacion_fiscal/factura_electronica/Documents/Sugerencia_PyS/Ser_comision.pdf) · [Forma de pago 31 (Facturama)](https://facturama.mx/blog/que-significa/forma-de-pago-sat-intermediarios/)
- Cancelación vs egreso: [Cancelación de CFDI 2026 (Alegra)](https://blog.alegra.com/mexico/cancelacion-de-cfdi-paso-a-paso/) · [Reglas de aceptación 2026 (Carbajal)](https://carbajalcontadores.com/2026/08/01/cancelacion-cfdi-2026-nuevas-reglas-aceptacion-receptor-plazos-sat/) · [Motivos y plazos (Ortiz Garza)](https://www.ortizgarza.com.mx/guias/cancelacion-cfdi/)

Son guías de despachos y proveedores, no el DOF: **las tasas y la regla de
cancelación las valida Marisol** antes de quedar en configuración.

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

### Fase 2b · Connect: que el dinero caiga donde dice la factura (§0.8)

- Cuenta Express por operadora desde «Mi alta» (pantalla construida; falta el
  segundo webhook de Stripe, de Luis).
- `createCheckout` bifurca por canal: con cuenta conectada lista → cargo con
  destino + `on_behalf_of`, `application_fee` = comisión + IVA (+ retenciones);
  sin cuenta → `casa` como hoy. `finalize-*` ya lee `canal_cobro`.
- Reembolsos con `reverse_transfer` + `refund_application_fee`.
- Candado: `commission_pct` NULL bloquea Connect (ya cableado).

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

**Resueltas el 9 nov (ver §0):** 1 (Airbnb), 3 (Stripe dentro de la comisión de NUMAN), 7 (Marisol entrega UUIDs), 8 (NUMAN deja de ser operadora; nace DRUIDAS), 9 (una ficha). **Quedan para Marisol:** 2 (tasas exactas y si alcanza a morales), 4 (confirmar claves de §0.4), 5 (confirmar regla de §0.5), 6 (global mensual).

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
