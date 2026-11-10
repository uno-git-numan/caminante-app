# Convenio de operación en la plataforma Caminante — v3 (documento de trabajo)

### v3 · 9 de noviembre de 2026 · PARA JORGE, Y DE AHÍ A `CONVENIO-v3-FIRMABLE.md`

> **Este archivo es el de trabajo.** Lleva la tabla «qué cambió del v2», las notas
> 🔸 para Jorge, Marisol y Luis, y comentarios entre `>`. El texto que se firma es
> `CONVENIO-v3-FIRMABLE.md`, que se **deriva** de éste con
> `design/operadores/derivar-firmable.py` (quita las líneas `>`, las 🔸 y los
> comentarios). Si se edita uno, se regenera el otro: nunca se editan por separado.
>
> **Por qué existe el v3.** El v2 se escribió la mañana del 9 nov. Esa tarde se
> promovió el alta de operadoras nueva (commit 8486047) y cuatro cosas del v2
> dejaron de ser ciertas: facturar ya no es condición para cobrar, el CSD salió
> del candado, el expediente se pide por tipo de persona, y el sistema **no
> retiene ISR ni IVA**. Hoy ninguna operadora puede cobrar por cuenta conectada
> porque no hay un convenio publicado (`operator_agreement_versions` vacía): el
> gate `operadorListo` exige `convenio_firmado_at`. (Desde la noche del 9 nov el
> gate tiene **cinco** condiciones: Stripe verificada, datos fiscales tomados de la
> CSF validada por el SAT, física o moral, convenio firmado y comisión resuelta;
> sin trato negociado se firma la escala pública y `comision_desde` = día de la
> firma. El CSD sigue fuera.)
>
> **Restricción de formato que manda sobre todo el texto:** la pantalla de firma
> (`admin/mi-alta/convenio/Convenio.tsx`) pinta **sólo títulos (`#`) y negritas
> (`**`)**. No pinta tablas, listas, cursivas ni enlaces. Por eso las tablas del
> v2 (comisión, cancelaciones, retenciones) van aquí **renglón por renglón**, y
> los números de cláusula se escriben en el texto. Lo que se firma es lo que se ve.

## Qué cambió del v2 a este v3

| Dónde | v2 decía | v3 dice | Por qué |
|---|---|---|---|
| Preámbulo | Carátula con campos `[___]` | El Operador es quien consta en la **carátula de firma** (nombre, RFC si está capturado, fecha, comisión pactada); sus datos fiscales se completan desde la CSF del expediente | Es lo que la pantalla muestra y guarda con el hash |
| Tercera | Tabla A/B | Misma escala, renglón por renglón; se agrega que una **comisión pactada en la carátula** sustituye a las tablas sin rebasar el 20 % | La pantalla no pinta tablas; `commission_pct` existe y manda sobre la escala |
| Cuarta §1 y §4 | «comisión, IVA y retenciones de ley» en cada cobro | Lo que se separa en el cobro es **comisión + IVA**; las retenciones sólo si Caminante las efectúa (§8) | `retencionDe` retiene comisión × 1.16 y nada más |
| Cuarta §7 | Aceptación del contrato de cuentas conectadas «dentro del convenio»; Caminante no almacena identificaciones | La cuenta tiene **panel completo** en el procesador; el Operador acepta los términos **directamente con Stripe en su pantalla**; Caminante sí conserva la identificación oficial en el expediente, **nunca la cuenta bancaria** | Accounts v2, `dashboard: "full"`, `fees_collector`/`losses_collector` = stripe; la INE ya sube al expediente (8486047) |
| Cuarta §8 | Tabla de retenciones como hecho | **Dos redacciones**: A (hoy: Caminante no retiene; avisará fecha e inicio) y B (reteniendo). El firmable lleva la **A**. Cuál se publica depende de Marisol (h1–h4) | El sistema no retiene; prometerlo sería falso |
| Cuarta §9 | Ejemplo con ISR e IVA retenidos ($1,241.59) | Ejemplo real de hoy: $1,750 → el Operador recibe **$1,400** | Es lo que Stripe deposita (saldo de la cuenta conectada) |
| Quinta | Porcentajes «DECIDE LUIS» | **Confirmados por Luis el 9 nov**: ventanas 30/15 y 60/30, 24 h de arrepentimiento, penalización 0/10/20/30 %, mín. $500, tope $15,000, fuerza mayor exenta | Decisión tomada |
| Sexta | RNT «cuando le sea exigible»; «capacitación vigente en primeros auxilios»; «protocolo de seguridad» como si fueran papeles | RNT siempre; seguros con la redacción del anexo por actividad; primeros auxilios y protocolo como **obligaciones de operar**, no documentos que se entregan | El expediente (`GENERALES`) ya no pide esos papeles; el botiquín es declaración en el anexo |
| Octava | Sólo datos de participantes | Párrafo nuevo: los **documentos del Operador** se leen con herramientas automatizadas, incluido un **proveedor externo de IA**, y la CSF se valida contra el SAT; los datos de salud de participantes **jamás** pasan por ahí | `csf.ts` (Claude + validador del SAT) |
| Décima tercera §1 | El portal timbra, siempre | El Operador **siempre** factura a su cliente; puede hacerlo desde el portal (si prende la facturación, carga su CSD y autoriza) o por sus propios medios; si factura por fuera, Caminante no emite ni responde | Facturar es opcional y posterior |
| Décima tercera §7 | «CSD vigente o no puede cobrar» | CSF **reciente** (≤ 90 días al subirla), leída y validada; CSD sólo para usar la facturación del portal | Decisión de Luis 9 nov; `DIAS_RECIENTE = 90` |
| Anexo B | Descripción genérica | Transcribe `GENERALES`: 5 obligatorios (física y moral) + 2 opcionales; por actividad en el Anexo E | Fuente única |
| Anexo F | RFC, régimen, **CSD vigente, CLABE**, tabla de retenciones | RFC, régimen, CP, tipo de persona, CSF; CSD **sólo si activa la facturación**; **sin CLABE** | La cuenta bancaria va directo al procesador (Cuarta §7) |
| Kéntro | Citada como operadora moral | No aparece | Standby (Luis, 9 nov) |

> **Sin cambio (Luis, no reabrir):** escala A/B, tope 20 %, mínimo $250,
> congelamiento, complementos, descuentos, fecha de arranque, modelo Airbnb,
> comisión del procesador dentro de la de Caminante.

---

<!-- FIRMABLE -->
# Convenio de operación en la plataforma Caminante

Versión 3 · noviembre de 2026

## Preámbulo

Convenio de prestación de servicios de plataforma que celebran, por una parte, **NUMAN HUB, S.A. de C.V.**, RFC **NHU250826CS8**, con domicilio en Prado Norte 525, interior 204, Lomas de Chapultepec I Sección, Miguel Hidalgo, C.P. 11000, Ciudad de México, titular de la plataforma y de la marca **Caminante**, representada por su representante legal con facultades que constan en la escritura pública 107,629 otorgada ante la Notaría 1 de la Ciudad de México (en adelante **«Caminante»** o **«la Plataforma»**); y por la otra, la persona física o moral identificada en la **carátula de firma** de este documento (en adelante **«el Operador»**), representada por quien lo acepta electrónicamente, quien declara contar con facultades suficientes para obligarlo.

Los datos del Operador —nombre o razón social, RFC, régimen fiscal, código postal fiscal y tipo de persona— se toman de su expediente en la plataforma, en particular de su Constancia de Situación Fiscal, y quedan registrados junto con la firma. Si al firmar algún dato fiscal no estuviera capturado, el Operador se obliga a completarlo en su expediente; su falta no invalida este convenio.

🔸 *Para Jorge:* el representante de NUMAN HUB se identifica por la escritura y no por nombre, porque la carátula la genera el sistema. Si la ley exige nombre y carácter, se agrega a la carátula desde el acta (`~/Expediente-NUMAN/corporativo/`). DRUIDAS, sociedad en constitución, firmará este mismo convenio como Operador; es parte relacionada de NUMAN HUB y por eso paga la escala pública (Décima tercera, punto 8; LISR 179).

## Primera · Objeto

Caminante otorga al Operador acceso a una plataforma tecnológica para publicar, promover, vender y administrar sus experiencias, que incluye: página pública de cada experiencia, cobro en línea, generación y firma de deslindes, expediente de participantes, control de cupos y fechas, lista de asistentes, kit de comunicación, encuesta de satisfacción, panel de administración y portal con la marca del Operador.

**Caminante no es operador turístico ni presta el servicio de viaje.** Actúa exclusivamente como intermediario tecnológico y de cobro. La experiencia —su diseño, ejecución, seguridad y cumplimiento— es responsabilidad exclusiva del Operador.

## Segunda · Naturaleza de la relación

Las partes son independientes entre sí. Este convenio **no constituye** relación laboral, asociación, sociedad, franquicia, coinversión ni mandato. Ninguna parte puede obligar a la otra frente a terceros.

El Operador es el único patrón de su personal y guías, y responde de todas las obligaciones laborales y de seguridad social que le correspondan. Caminante no ejerce dirección ni subordinación sobre ellos.

## Tercera · Comisión

**1 · La comisión de plataforma.** Caminante cobra al Operador una comisión por cada venta cobrada a través de la plataforma, conforme a las escalas siguientes. **Los tramos son marginales**: cada tasa aplica únicamente a la porción del precio por persona, sin IVA, comprendida en su rango, no al total. Así, subir el precio nunca reduce la comisión en pesos.

**Escala A — la venta la origina Caminante** (llega por el sitio, el boletín, las redes o la audiencia de Caminante):

Hasta $3,000 MXN: **20 %**.

De $3,001 a $8,000 MXN: **18 %**.

De $8,001 a $15,000 MXN: **16 %**.

De $15,001 a $40,000 MXN: **14 %**.

Más de $40,000 MXN: **14 %**.

**Escala B — la venta la origina el Operador** (dirige a su propio cliente a la plataforma):

Hasta $3,000 MXN: **15 %**.

De $3,001 a $8,000 MXN: **13 %**.

De $8,001 a $15,000 MXN: **11 %**.

De $15,001 a $40,000 MXN: **9 %**.

Más de $40,000 MXN: **8 %**.

**2 · Comisión pactada.** Si en la carátula de firma consta una comisión pactada distinta de las escalas, esa comisión sustituye a las escalas para todas las ventas del Operador, sin que pueda exceder el techo del punto 4.

**3 · Comisión mínima.** Cada reserva causa una comisión de al menos **$250 MXN**, sin que en ningún caso pueda exceder el techo del 20 % del importe cobrado. El mínimo opera sobre la reserva completa, no sobre cada concepto por separado, y sólo resulta aplicable en reservas menores a $1,667 MXN.

**4 · Techo absoluto.** Ninguna tasa, de ninguna escala ni pactada, excederá el **20 %** del importe cobrado. Este techo es una obligación de Caminante frente al Operador y no puede rebasarse ni siquiera al actualizar las escalas conforme a la Cláusula Décima segunda.

**5 · Qué incluye la comisión.** La comisión cubre **todos** los servicios de la Cláusula Primera **y el costo del procesamiento de pagos** (comisiones del procesador por cobro, por cuenta conectada y por depósito). Al Operador **no se le descuenta ningún otro concepto** por el uso de la plataforma, salvo, en su caso, las retenciones que la ley obligue a Caminante a efectuar conforme a la Cláusula Cuarta, punto 8.

**6 · Los porcentajes no incluyen IVA.** Al importe de la comisión se agrega el IVA a la tasa general (16 %), que consta en el comprobante fiscal que Caminante emite al Operador (Cláusula Décima tercera) y que el Operador puede acreditar.

**7 · Origen de la venta.** Se considera originada por el Operador toda venta que ingrese a través de su portal o de los enlaces de seguimiento que Caminante le proporcione, **dentro de los 60 días naturales siguientes** al primer ingreso del cliente por ese medio. Vencido ese plazo, o si el cliente llega por cualquier otro camino, la venta se considera originada por Caminante.

**8 · La comisión se congela dos veces.** Primero al firmar: las tasas de este convenio son las que rigen para el Operador mientras no acepte expresamente una versión posterior, aunque Caminante cambie sus escalas generales. Y segundo por venta: la tasa aplicable a cada reserva es la vigente al momento de cobrarse, y las modificaciones posteriores no afectan ventas ya realizadas.

**9 · Complementos.** Cuando el cliente contrate servicios adicionales a través de la plataforma (traslados, noches extra, actividades opcionales), **cada concepto se tarifica por su propio precio unitario** y las comisiones se suman. Un traslado de $7,000 paga la tasa que le corresponde a $7,000, aunque se venda junto a una experiencia de $32,000.

**10 · Descuentos.** Los descuentos no cambian la comisión en porcentaje: la comisión se calcula sobre lo efectivamente cobrado al cliente, después del descuento, y el Operador y Caminante absorben el descuento en proporción.

**11 · Fecha de arranque.** La fecha de arranque es la de la firma de este convenio, salvo que en la carátula conste otra. Lo vendido antes de esa fecha no genera comisión y no se suma retroactivamente.

> *Trazabilidad:* las dos escalas son las que el motor de cobro aplica desde el 8 sep 2026 (`reglaComisionDeOperador`); el guardián de invariantes detiene el despliegue si se separan o si B supera a A en algún tramo (invariantes 17 y 18). La comisión pactada es `operators.commission_pct`.

## Cuarta · Cobro, retención y pago

**1 · Las dos formas de cobrar.** El cobro se hace por una de dos vías, según si el Operador tiene cuenta de cobro conectada a la plataforma.

**(a) Cobro a nombre del Operador**, cuando tiene cuenta conectada. El cargo se genera desde la plataforma pero **a nombre del Operador**, que es quien aparece como comercio en el estado de cuenta del cliente y quien presta el servicio. El procesador divide el importe **en el mismo acto del cobro**: la comisión de Caminante y su IVA se quedan con Caminante, y el resto entra **directamente a la cuenta del Operador**. Caminante no recibe, ni retiene en su poder, la parte del Operador.

**(b) Cobro por cuenta del Operador**, mientras no tenga cuenta conectada. Caminante cobra el importe total **por cuenta y orden del Operador**, retiene su comisión más el IVA, y **transfiere el remanente al Operador a los 7 días naturales posteriores al regreso** de la salida correspondiente. El importe cobrado por esta vía es dinero del Operador en poder de Caminante, no ingreso de Caminante.

**2 · La retención es la misma en las dos.** En ambos casos Caminante retiene únicamente su comisión más el IVA que le corresponda y, en su caso, los impuestos que la ley le obligue a retener al Operador conforme al punto 8. La retención de la comisión constituye el pago de ésta: la factura que Caminante emita por ese concepto (Cláusula Décima tercera) se salda contra ella por compensación, sin transferencia adicional.

**3 · El procesamiento de pagos lo absorbe Caminante.** Las comisiones del procesador de pagos —por cobro, por cuenta conectada activa y por depósito al Operador— **están incluidas en la comisión de plataforma** y las paga Caminante. No se descuentan de lo que recibe el Operador. **Esto aplica también cuando una venta se deshace**: el procesador no devuelve su comisión y esa pérdida es de Caminante, no del Operador (Cláusula Quinta).

🔸 *Para Jorge:* esta redacción sustituye la decisión del 13 ago 2026 (que cargaba la comisión del procesador al Operador) por la del 9 nov 2026. Costo medido del procesador: 4.80 % del cobro (`ESCENARIOS-DINERO.md`).

**4 · Desglose.** Caminante entregará al Operador, por cada salida y por cada mes, el desglose que permita conciliar: reservas cobradas, descuentos, devoluciones, comisión retenida, IVA de la comisión, impuestos retenidos si los hubiera, importe neto depositado y la vía por la que entró cada cobro.

**5 · Momento en que el Operador dispone del dinero.** En la vía (b) dispone de él al recibir la transferencia. En la vía (a) el importe entra a su cuenta al momento del cobro y queda sujeto al calendario de pagos de su propio procesador, que **no lo fija Caminante**.

**6 · El Operador dispone de su parte antes de la salida, a propósito.** En la vía (a) no se le fija retraso de pago: tener el dinero disponible antes de la fecha es, muchas veces, lo que le permite operar. La contrapartida está en la Cláusula Quinta: **si procede una devolución, el Operador reintegra su parte**, aunque ya la haya dispuesto. El sistema la toma de vuelta de su cuenta de cobro; si no hay saldo, la cuenta queda en descubierto y el adeudo es del Operador, quien podrá cubrirlo por transferencia o por compensación contra liquidaciones futuras.

**7 · El procesador de pagos.** El cobro se procesa a través de un **procesador de pagos tercero** —a la fecha, **Stripe**—, que es quien presta al Operador el servicio de procesamiento y depósito. Para recibir cobros por la vía (a), el Operador abre a través de la plataforma una **cuenta de cobro propia** en el procesador, con acceso a su propio panel, y:

a) **Celebra directamente con el procesador su contrato de servicios**, en la pantalla del propio procesador, al completar la verificación de su cuenta. A la fecha ese contrato es el Contrato de Servicios de Stripe (https://stripe.com/legal/ssa) junto con el Contrato de Cuenta de Stripe Connect (https://stripe.com/connect-account/legal/full), que el procesador puede modificar de tiempo en tiempo. Caminante no es parte de ese contrato ni responde por él.

b) **Se obliga a proporcionar al procesador información completa y verídica** sobre sí mismo y su negocio —identidad, datos fiscales, domicilio, cuenta bancaria y los documentos que el procesador solicite— y autoriza a Caminante a transmitirle los datos de su expediente que el procesador requiera para abrir la cuenta.

c) **Reconoce** que el procesador trata sus datos conforme a su propio aviso de privacidad (https://stripe.com/privacy) y que las operaciones se liquidan a través de los bancos adquirentes del procesador (https://stripe.com/legal/acquirer-disclosure).

d) Acepta que, **si no entrega la información que el procesador requiera** o ésta resulta falsa, el procesador puede suspender los depósitos, y Caminante puede suspender la venta por la vía (a) hasta que se regularice.

e) Acepta que el procesador cobre al Operador las comisiones del procesador que correspondan a su cuenta y responda frente a él por los saldos de la misma, conforme al contrato del inciso a), **sin perjuicio** de que, conforme al punto 3, Caminante reembolsa o absorbe dentro de su comisión el costo del procesamiento de cada venta.

Caminante **no almacena** la cuenta bancaria del Operador: el Operador la captura directamente ante el procesador. La identificación oficial y los demás documentos del expediente los conserva Caminante conforme al Anexo B y la Cláusula Octava.

🔸 *Para Jorge:* la cuenta es Accounts v2 con panel completo (`dashboard: "full"`) y con comisiones y pérdidas a cargo del procesador (`fees_collector` y `losses_collector` = stripe; `connect.ts`, `crearCuentaV2`). Stripe documenta que con panel completo **la aceptación del contrato la recaba Stripe** en su propio onboarding, no la plataforma (docs.stripe.com/connect/service-agreement-types: «Stripe handles the service agreement acceptance if you use Stripe-hosted onboarding»). Por eso el inciso a) ya no hace que la firma del convenio valga como aceptación del contrato de Stripe. Tu pregunta 7 del v1 (saldos negativos) cambia con `losses_collector = stripe`: el riesgo de pérdidas es del procesador frente a la cuenta, no de Caminante; te dejo el dato y no la cierro. El inciso e) intenta reconciliar «Stripe le cobra su fee a la cuenta» con «Caminante lo absorbe»: en el cargo con destino el fee lo paga la plataforma, así que e) es defensivo; dinos si sobra.

**8 · Retenciones de ley.** Caminante es una plataforma tecnológica de intermediación y la ley puede obligarla a **retener y enterar** al SAT impuestos del Operador y a emitirle el comprobante correspondiente (Ley del Impuesto sobre la Renta, artículos 113-A a 113-C; Ley del Impuesto al Valor Agregado, artículos 1-A BIS y 18-J; Ley de Ingresos de la Federación del ejercicio).

A la fecha de esta versión **Caminante no efectúa retenciones** de ISR ni de IVA sobre las ventas del Operador: en cada cobro separa únicamente su comisión y el IVA de ésta. El Operador es responsable de cumplir sus propias obligaciones fiscales por los ingresos que recibe a través de la plataforma, y declara a Caminante, bajo protesta de decir verdad, si es persona física o moral y su RFC.

Cuando Caminante inicie las retenciones que la ley le imponga, lo **notificará al Operador** con la fecha de inicio, las tasas aplicables y su fundamento; a partir de esa fecha las descontará de cada liquidación, le emitirá el CFDI de retenciones e información de pagos a más tardar el día 5 del mes siguiente, y las enterará en los plazos de ley. Las tasas serán **las que fije la ley en cada ejercicio**; su inicio o su cambio por disposición legal no constituye modificación de este convenio. Las retenciones son impuestos del Operador pagados por su cuenta, que él acredita en sus declaraciones.

Si la autoridad fiscal determinara que Caminante debió retener y enterar impuestos del Operador por periodos en los que no lo hizo, y Caminante los enterara, el Operador **reembolsará a Caminante** las cantidades enteradas por su cuenta, por compensación contra liquidaciones futuras o por transferencia, sin perjuicio de su derecho a acreditarlas.

🔸 **Para Marisol (h1–h4 del memo) y luego Jorge — ESTE PUNTO DECIDE QUÉ SE PUBLICA.** La redacción de arriba es la **variante A (hoy: sin retener)** y es la que lleva el firmable, porque es la única verdadera hoy. **Hecho verificado en Stripe LIVE el 9 nov (llave de solo lectura):** ninguna venta ha pasado por cuenta conectada (0 cargos con destino, 0 transferencias, 0 comisiones de aplicación); a Nomádika NUMAN le paga contra factura de servicios. La intención de Luis es **no arrancar el cobro por cuenta conectada sin retención** (memo h2). Si Marisol confirma que debe retenerse desde la primera venta, el firmable se publica con la **variante B** cuando el sistema retenga (se cambia aquí y se vuelve a derivar); si admite arrancar y retener después, se publica la A. El último párrafo (reembolso de lo que Caminante entere por periodos pasados) es la consecuencia de h3 y necesita el visto de Jorge. El régimen 625 y la incompatibilidad con RESICO del v2 salen del convenio hasta que Marisol cite la regla (113-E no lo dice).

> **Variante B — cuando el sistema retenga (sustituye los párrafos 2 a 4 del punto 8):**
>
> Caminante cobra por cuenta del Operador a través de una plataforma tecnológica y, por ello, la ley la obliga a **retener y enterar** al SAT impuestos del Operador y a emitirle el comprobante correspondiente. El Operador lo reconoce y acepta que esas retenciones se descuenten de cada liquidación, conforme a las tasas vigentes en cada ejercicio. Para el ejercicio 2026:
>
> Operador persona física con RFC: ISR **2.5 %** del precio sin IVA, e IVA **50 %** del IVA trasladado (Ley del ISR 113-A fracción III y 113-C; Ley de Ingresos 2026 artículo 25 fracción VI; Ley del IVA 18-J fracción II inciso a).
>
> Operador persona moral con RFC: ISR **2.5 %** del precio sin IVA, e IVA **50 %** del IVA trasladado (Ley de Ingresos 2026 artículo 25 fracciones VI y IX).
>
> Operador sin RFC válido en el expediente: ISR **20 %** e IVA **100 %** (Ley del ISR 113-C fracción IV; Ley del IVA 18-J fracción II inciso a).
>
> Las tasas son **las que fije la ley en cada ejercicio**; su cambio por reforma no constituye modificación de este convenio y se refleja en la liquidación desde la fecha en que entre en vigor. Caminante entrega al Operador, **a más tardar el día 5 de cada mes**, el CFDI de retenciones e información de pagos del mes anterior con el complemento de plataformas tecnológicas, y entera los impuestos retenidos en los plazos de ley. Las retenciones son impuestos del Operador pagados por su cuenta: él las acredita en sus declaraciones.

**9 · La liquidación, en una línea.** Lo que recibe el Operador por cada venta es: **importe cobrado, menos devoluciones, menos comisión de plataforma, menos IVA de la comisión** y, cuando Caminante las efectúe conforme al punto 8, menos los impuestos retenidos. Nada más se descuenta.

Ejemplo con la escala A: precio al cliente $1,750 (base sin IVA $1,508.62); comisión 20 % sobre la base = $301.72, más IVA $48.28, total separado para Caminante **$350.00**; **el Operador recibe $1,400.00**. Si Caminante efectuara retenciones conforme al punto 8, se restarían de esos $1,400.00 y constarían en el CFDI de retenciones.

> *Trazabilidad:* es lo que `connect-cobro.ts` hace hoy: `application_fee_amount` = comisión × 1.16; el saldo de la cuenta conectada tras una venta de $1,750 es $1,400 (comentario del archivo). El ejemplo con retenciones ($1,241.59) vive en `MAPA-FACTURACION.md` §0.2 para cuando aplique.

## Quinta · Devoluciones, cancelaciones y contracargos

**1 · La política de cancelación es parte de este convenio** y se publica en la página de cada experiencia antes de que el cliente pague. El Operador elige, por experiencia, una de las dos políticas del **Anexo C** y no puede ofrecer una más laxa que la de sus propios proveedores (hospedaje, transporte).

**2 · Ventanas para el cliente** (Anexo C). Los días se cuentan en días naturales hasta la fecha de inicio de la salida.

**Política Estándar**, para salidas de uno o dos días: cancela con 30 días o más, devolución del **100 %**; de 15 a 29 días, **50 %**; con menos de 15 días, **sin devolución**.

**Política Expedición**, para viajes largos o con anticipos altos: cancela con 60 días o más, devolución del **100 %**; de 30 a 59 días, **50 %**; con menos de 30 días, **sin devolución**.

**Arrepentimiento**, en cualquiera de las dos políticas: si el cliente cancela **dentro de las 24 horas** siguientes a su reserva y la salida está a 7 días o más, recibe el **100 %**.

**3 · Cuando cancela el Operador**, el cliente recibe siempre el **100 %**, y el Operador paga a Caminante una **penalización** sobre el valor de las reservas canceladas, salvo **fuerza mayor documentada** (clima que impide operar con seguridad, cierre del área por la autoridad, emergencia médica del guía), que el Operador acredita y Caminante aprueba y registra en su historial. La penalización depende de la anticipación con la que el Operador cancele respecto de la fecha de la salida:

Con más de 30 días: **sin penalización**.

De 15 a 30 días: **10 %**.

De 3 a 14 días: **20 %**.

Con menos de 72 horas, o si no se presenta: **30 %**.

La penalización es de al menos **$500 MXN** y de a lo más **$15,000 MXN** por salida. **Se descuenta de las liquidaciones futuras del Operador**; no se cobra aparte. Caminante emite al Operador el comprobante fiscal que corresponda por la penalización.

🔸 *Para Jorge:* qué cuenta como fuerza mayor en montaña y mar, y que la penalización sea exigible como pena convencional (Código Civil Federal 1840 y siguientes). Los números los confirmó Luis el 9 nov 2026 (tomados del plan de Connect del 13 ago; referencia Airbnb y GetYourGuide).

**4 · La comisión sigue al dinero.** Cuando proceda una devolución, se reintegra al cliente el importe que corresponda y **la comisión de Caminante y su IVA se ajustan en la misma proporción**: si se devuelve todo, se devuelve toda la comisión; si el Operador retiene una parte conforme a su política, Caminante conserva su comisión únicamente sobre esa parte. Si Caminante hubiera efectuado retenciones de impuestos sobre esa venta, se corrigen en el CFDI de retenciones del mes.

**5 · Si el Operador ya dispuso de su parte**, la reintegra a Caminante por transferencia o por compensación contra liquidaciones futuras (Cláusula Cuarta, punto 6).

🔸 *Para Jorge:* si el Operador no reintegra, ¿Caminante devuelve al cliente de su bolsa y lo persigue después? Define si Caminante es intermediaria o garante (pregunta 9 del v1; la más importante).

**6 · El costo de procesamiento de una venta que se deshace lo absorbe Caminante** (Cláusula Cuarta, punto 3). Es la consecuencia de que la comisión del procesador vaya dentro de la comisión de plataforma.

**7 · Contracargos.** Los derivados de la prestación del servicio son por cuenta del Operador; los derivados de fallas de la plataforma o del cobro, por cuenta de Caminante.

🔸 *Para Jorge:* con el cargo a nombre del Operador (vía a) y pérdidas a cargo del procesador, confirmar que los contracargos por el servicio siguen siendo del Operador y cómo se le trasladan.

**8 · Documentos fiscales de la devolución.** Si el Operador emitió CFDI al cliente desde el portal: devolución parcial, CFDI de egreso relacionado; devolución total dentro del mismo mes, cancelación del comprobante; devolución total con mes cerrado, CFDI de egreso. La comisión devuelta se documenta con un CFDI de egreso de Caminante al Operador en la misma proporción. Si el Operador facturó por sus propios medios, documenta él la devolución.

🔸 *Para Marisol:* el motivo de cancelación y la regla de devoluciones son la pregunta e del memo.

## Sexta · Obligaciones del Operador

1. Contar con **Registro Nacional de Turismo** vigente y mantenerlo en su expediente.

2. Mantener vigentes una **póliza de responsabilidad civil** y una **póliza colectiva de seguro de accidentes y enfermedades**, emitidas por una aseguradora autorizada, que cubran a todas las personas de cada salida todos los días que dure. Vale una póliza anual o una contratada por integrante y por día de salida; si es por salida, el Operador la contrata antes de cada una, la conserva y la entrega cuando Caminante se la pida.

3. Operar cada actividad con guías acreditados conforme a la norma oficial que le corresponda (NOM-09-TUR-2002 y las demás aplicables), en la modalidad de que se trate, y conforme a lo que exija el anexo de esa actividad.

4. Contar con las **autorizaciones del sitio** donde opera: de la CONANP cuando se trate de Área Natural Protegida, o del ejido, comunidad o propietario cuando el terreno sea de su titularidad, así como los permisos municipales o de protección civil aplicables.

5. **Operar con seguridad**: llevar en cada salida el botiquín adecuado y saber usarlo, prever cómo se atiende una emergencia y cómo se pide ayuda donde no hay señal, y cumplir las condiciones de operación del anexo de cada actividad. Estas son obligaciones de cada salida, no documentos que se entregan.

6. Honrar todas las reservas confirmadas a través de la plataforma.

7. Mantener actualizada y veraz la información de sus experiencias: itinerario, nivel de dificultad, incluye y no incluye, cupos y precios.

8. Informar a Caminante, **sin demora**, de cualquier incidente que afecte la seguridad de un participante.

9. Cumplir la **Ley Federal de Protección al Consumidor** frente al cliente final, en su carácter de prestador del servicio.

10. Entregar y mantener vigente el **expediente** del Anexo B, y **suscribir el anexo de cada actividad que ofrezca** y cumplir lo que ese anexo exija, en los términos del apartado siguiente.

### Anexos por actividad

Este convenio fija el marco de la relación. **Lo que se le exige al Operador cambia según la actividad que ofrezca**: una caminata y un descenso a una caverna no se acreditan igual, no se aseguran igual y no se rescatan igual.

Por eso, para cada actividad que el Operador quiera ofrecer en la plataforma se suscribe un **anexo por actividad**, que forma parte integrante de este convenio y que precisa, para esa actividad y sólo para ella: la norma oficial aplicable, los documentos que integran el expediente de la actividad, sus vigencias, y las condiciones mínimas de operación.

a) El anexo **no sustituye** este convenio ni lo contradice: lo detalla. En lo comercial —comisión, cobro, pago, terminación— manda este convenio. En lo técnico y de seguridad de una actividad, manda su anexo.

b) **Cada actividad se aprueba y se suspende por separado.** Que una actividad quede incompleta, vencida o suspendida no afecta a las demás: el Operador sigue vendiendo las actividades cuyo anexo esté vigente y cuyo expediente esté aprobado.

c) El Operador **no puede publicar ni vender una experiencia de una actividad cuyo anexo no haya suscrito**, o cuyo expediente no esté aprobado. La plataforma lo impide técnicamente; esta cláusula lo dice también por escrito.

d) Los anexos se publican, versionan y firman con el mismo procedimiento y los mismos plazos que este convenio (Cláusula Décima segunda), y con la misma firma electrónica (Cláusula Décima sexta).

e) Las obligaciones de esta Cláusula Sexta aplican a **todas** las actividades, estén o no repetidas en un anexo.

> *Trazabilidad:* `candado-actividad.ts` y `subconvenio-doc.ts` citan «Cláusula Sexta, Anexos por actividad»; el marco del anexo (Quinta «Botiquín», Sexta «Seguros de cada salida») dice lo mismo que los puntos 2 y 5 de esta cláusula.

## Séptima · Obligaciones de Caminante

1. Mantener la plataforma disponible en condiciones razonables de operación.

2. Cobrar los importes de las reservas y liquidarlos en los términos de la Cláusula Cuarta.

3. Entregar al Operador la información de los participantes que requiera para operar la salida.

4. Dar soporte al Operador en el uso de la plataforma.

5. No comercializar las experiencias del Operador fuera de la plataforma sin su consentimiento.

## Octava · Datos personales

**1 · Datos de los participantes.** El Operador recibirá datos personales de los participantes, **incluidos datos sensibles de salud** (padecimientos, alergias, restricciones alimentarias), necesarios para operar la salida con seguridad. El Operador actúa como **encargado del tratamiento** en términos de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, y se obliga a:

a) Usar esos datos **exclusivamente** para operar la salida correspondiente.

b) No transferirlos a terceros sin base legal ni instrucción de Caminante.

c) Guardar confidencialidad, incluso después de terminado este convenio.

d) Implementar medidas de seguridad razonables.

e) **Suprimirlos** una vez concluida la salida y cumplidas las obligaciones legales de conservación.

f) Contar con su propio **aviso de privacidad** y ponerlo a disposición.

g) Notificar a Caminante cualquier vulneración, dentro de las 48 horas siguientes a conocerla.

**2 · Datos del Operador.** Caminante trata los datos del Operador, de su representante y de las personas que integran su expediente conforme a su aviso de privacidad, publicado en la plataforma. El Operador reconoce y acepta que los **documentos de su expediente** (en particular la Constancia de Situación Fiscal y las identificaciones) se **leen y revisan con herramientas automatizadas, incluido un proveedor externo de inteligencia artificial**, para extraer sus datos, detectar señales de alteración y verificar que coinciden con lo capturado, y que la Constancia de Situación Fiscal se **valida contra el servicio público del SAT**. Esas herramientas no deciden por sí solas: una persona de Caminante revisa el resultado. **Los datos de salud de los participantes nunca se procesan con esas herramientas.**

🔸 *Para Jorge:* el proveedor de IA hoy es Anthropic (API de Claude, `csf.ts`); la CSF se valida en `siat.sat.gob.mx`. Decide si la mención al proveedor externo va en el convenio o basta con el aviso de privacidad, y si hace falta consentimiento expreso aparte para la transferencia internacional de datos (LFPDPPP 36–37).

## Novena · Responsabilidad

El Operador es el **único responsable** de la prestación de la experiencia y responde frente a los participantes y frente a terceros por cualquier daño derivado de su operación.

El Operador **sacará en paz y a salvo** a Caminante de cualquier reclamación, demanda o sanción derivada de la operación de sus experiencias, del incumplimiento de sus obligaciones legales o de la falta de los permisos y seguros previstos en la Cláusula Sexta.

La responsabilidad de Caminante se limita a los servicios de plataforma y de cobro descritos en este convenio.

🔸 *Para Jorge:* definir tope de responsabilidad de Caminante. Lo usual es el monto de las comisiones de los últimos meses. Y si la indemnización es oponible frente a la LFPC.

## Décima · Propiedad intelectual

Cada parte conserva la titularidad de sus marcas y contenidos.

El Operador otorga a Caminante una licencia **no exclusiva, gratuita y revocable al terminar el convenio**, para usar sus fotografías, textos, logotipo y materiales con el fin de promover sus experiencias en la plataforma y en los canales de Caminante.

El Operador declara contar con los derechos sobre el material que entregue, incluidas las autorizaciones de las personas retratadas.

## Décima primera · Vigencia, terminación y suspensión

Vigencia **indefinida**. Cualquiera de las partes puede darlo por terminado con **30 días naturales** de aviso previo por escrito.

**Las reservas ya vendidas se respetan.** La terminación no libera al Operador de operar las salidas ya cobradas, ni a Caminante de liquidarlas.

Caminante podrá **suspender** la publicación y venta de nuevas experiencias, sin terminar el convenio, cuando el Operador incumpla la Cláusula Sexta, cuando venza un documento indispensable de su expediente, o cuando exista un incidente de seguridad en investigación. La suspensión **no afecta** la operación ni la liquidación de lo ya vendido.

## Décima segunda · Modificaciones

Caminante podrá actualizar este convenio. Las modificaciones se clasifican en:

**Menores** (redacción, datos de contacto, aclaraciones que no alteran derechos ni obligaciones): surten efecto al notificarse y se tienen por aceptadas al continuar usando la plataforma.

**Mayores** (comisión, plazos de pago, responsabilidades): se notifican con **30 días naturales** de anticipación y requieren aceptación expresa del Operador. Transcurrido el plazo sin aceptación, Caminante podrá suspender la publicación de nuevas experiencias. **Las ventas ya realizadas se rigen por la versión vigente al momento de cada venta.**

## Décima tercera · Facturación

**1 · Del Operador al viajero.** El servicio turístico lo presta el Operador y **lo factura el Operador**. El Operador está obligado, **en todos los casos**, a expedir a su cliente el comprobante fiscal por el importe total de la reserva, bajo su RFC y su régimen, en los términos que la ley le exija. Puede hacerlo de dos maneras:

a) **Desde el portal de Caminante**, si activa la facturación en su panel, carga su Certificado de Sello Digital y autoriza a Caminante a timbrar en su nombre. En ese caso el portal emite el comprobante por cuenta del Operador cuando el cliente lo solicita, con la clave de producto que corresponda al servicio (a la fecha, 90121501 «Servicios de organización de excursiones», o la que corresponda al concepto), y lo que nadie solicita se incorpora a la **factura global** mensual del Operador a público en general, también emitida desde el portal. El Operador autoriza a Caminante a timbrar en su nombre con ese fin y a conservar los comprobantes.

b) **Por sus propios medios.** Si el Operador no activa la facturación en el portal, factura a sus clientes por fuera de la plataforma con los datos de cada reserva que la plataforma le entrega. En ese caso Caminante **no emite ni responde** por esos comprobantes.

En ningún caso Caminante emite ese comprobante a nombre propio: pone la herramienta y los datos de cada reserva.

**2 · De Caminante al Operador.** Caminante emite CFDI al Operador **únicamente por su comisión de plataforma**, más el IVA, con la clave de producto que corresponda a la intermediación (a la fecha, 80141628 «Servicio de distribuidores por comisión»), por cada cobro confirmado. Esa comisión es el único ingreso de Caminante derivado de la operación.

**3 · El CFDI de retenciones.** Cuando Caminante efectúe retenciones conforme a la Cláusula Cuarta, punto 8, emite al Operador, a más tardar el día 5 de cada mes, el **CFDI de retenciones e información de pagos** del mes anterior con el complemento que corresponda.

**4 · La retención es el pago de la factura de comisión.** El importe separado al momento del cobro por concepto de comisión equivale exactamente al total del CFDI de comisión —comisión más IVA—, y ambos se saldan entre sí sin transferencia adicional. Caminante entrega el desglose que permita conciliarlos reserva por reserva.

**5 · Caminante no factura el servicio turístico.** No lo presta ni lo comercializa por cuenta propia: su papel es de intermediación tecnológica y de cobro, conforme a la Cláusula Segunda. Lo que Caminante cobra por la vía (b) de la Cláusula Cuarta lo cobra **por cuenta del Operador** y no es ingreso de Caminante.

**6 · Devoluciones.** Se documentan conforme a la Cláusula Quinta, punto 8.

**7 · Situación fiscal.** Ambas partes se obligan a mantener vigente su situación fiscal y a entregarse la documentación que requieran. El Operador entrega en su expediente su **Constancia de Situación Fiscal**, que la plataforma lee y valida (Cláusula Octava, punto 2) y que se considera reciente cuando tiene **90 días o menos** al subirla; si el Operador cambia de régimen, de domicilio fiscal o de razón social, sube una nueva. El **Certificado de Sello Digital vigente** sólo es requisito para usar la facturación desde el portal (punto 1, inciso a); su falta o vencimiento no impide cobrar, pero sí emitir comprobantes desde la plataforma hasta regularizarlo.

**8 · Partes relacionadas.** Cuando el Operador sea parte relacionada de Caminante, la comisión es la de la escala pública de la Cláusula Tercera sin trato preferente, y ambas partes conservan la documentación que acredite que la operación se pactó como entre partes independientes.

🔸 *Para Marisol:* claves de producto, uso de CFDI, forma de pago en el CFDI del Operador y la regla de devoluciones (memo, preguntas d, e y f). 🔸 *Para Jorge:* que la autorización del punto 1 inciso a) (timbrar en nombre del Operador con su CSD desde el portal) tenga la forma que necesita (mandato o prestación de servicios de timbrado).

## Décima cuarta · Confidencialidad

Las partes guardarán confidencialidad sobre la información comercial, técnica y de clientes a la que accedan, durante la vigencia y por **2 años** después.

## Décima quinta · Cesión

Ninguna parte podrá ceder este convenio sin consentimiento previo y por escrito de la otra, salvo que Caminante lo ceda a una empresa de su mismo grupo.

## Décima sexta · Firma electrónica

Las partes reconocen la validez de la aceptación electrónica de este convenio en términos de los artículos 89 a 114 del **Código de Comercio**. El registro electrónico que conserve Caminante —que incluye la versión íntegra del documento mostrado, su huella digital, la identidad de quien aceptó, la fecha y la hora— hace prueba plena de la celebración.

## Décima séptima · Notificaciones

Por correo electrónico a las direcciones registradas en el expediente del Operador y de Caminante, y a través del panel del Operador.

## Décima octava · Ley aplicable y jurisdicción

Este convenio se rige por las leyes de los Estados Unidos Mexicanos. Para su interpretación y cumplimiento, las partes se someten a los tribunales competentes de la Ciudad de México, renunciando a cualquier otro fuero.

🔸 *Para Jorge:* confirmar sede. Considerar mediación previa como paso obligatorio.

## Anexo A · Escalas de comisión

Las escalas A y B, la comisión mínima, el techo y las reglas de origen de la venta son las de la Cláusula Tercera. Si en la carátula consta una comisión pactada, es la que aplica.

## Anexo B · Expediente del Operador

El expediente se integra en la plataforma según el tipo de persona del Operador. Un documento vencido no cuenta como entregado; la plataforma avisa con anticipación de los vencimientos.

**Obligatorios para toda persona física o moral:**

1. Registro Nacional de Turismo (SECTUR) vigente.

2. Identificación oficial vigente —INE por ambos lados o pasaporte— de la persona física, o del representante legal de la persona moral; se renueva cada año en el expediente.

3. Constancia de Situación Fiscal, reciente al subirla (90 días o menos), que la plataforma lee y valida (Cláusula Décima tercera, punto 7).

4. Póliza de responsabilidad civil vigente: anual, o contratada por integrante por día de salida.

5. Póliza colectiva de seguro de accidentes y enfermedades, emitida por una aseguradora autorizada.

**Opcionales:**

6. Identificación oficial de quien opera en campo, cuando sea una persona distinta de quien firma.

7. Sólo para personas morales: acta constitutiva y poder del representante legal.

**Por actividad:** la credencial de guía SECTUR (NOM-09-TUR-2002) de la modalidad y los requisitos técnicos de cada actividad constan en su anexo (Anexo E).

> *Trazabilidad:* es `GENERALES` en `src/lib/operadores/actividades.ts` (rnt, id-responsable, id-operacion opcional, acta-constitutiva opcional sólo moral, csf, poliza-rc, poliza-gm). Si cambia el catálogo, cambia este anexo y se publica versión.

## Anexo C · Política de cancelación

Las dos políticas para el cliente (Estándar y Expedición), la ventana de arrepentimiento de 24 horas y la penalización al Operador que cancela son las de la Cláusula Quinta. El Operador elige una política por experiencia al publicarla y la plataforma la muestra al cliente antes de pagar.

## Anexo D · Aviso de privacidad

El aviso de privacidad de Caminante aplicable al Operador y a los participantes es el publicado en la plataforma, en la sección Privacidad. El Operador declara haberlo leído.

## Anexo E · Anexos por actividad

Uno por cada actividad que el Operador ofrezca, generado del catálogo de actividades de la plataforma y suscrito por separado conforme a la Cláusula Sexta, apartado «Anexos por actividad».

## Anexo F · Ficha fiscal del Operador

RFC, régimen fiscal, código postal fiscal y tipo de persona (física o moral), tomados de la Constancia de Situación Fiscal del expediente. El Certificado de Sello Digital se registra únicamente si el Operador activa la facturación desde el portal. Caminante no conserva la cuenta bancaria del Operador. Si Caminante efectúa retenciones conforme a la Cláusula Cuarta, punto 8, la ficha incluye las tasas del ejercicio aplicables al Operador.
<!-- /FIRMABLE -->

---

## Lo que falta para publicar, y de quién es

| # | Qué | De quién | Bloquea publicar |
|---|---|---|---|
| 1 | **h2 del memo**: ¿la retención debe funcionar desde la primera venta por cuenta conectada? Si sí, el firmable se publica con la variante B de la Cuarta §8 cuando el sistema retenga; si se puede arrancar y retener después, se publica la A (la de hoy) | **Marisol** | **Sí** |
| 2 | Revisión de exigibilidad: Cuarta §7 (contrato con Stripe directo, inciso e), Cuarta §8 último párrafo (reembolso de lo enterado por periodos pasados), Quinta §3 pena convencional y fuerza mayor, Quinta §5 garante o intermediaria, Quinta §7 contracargos, Octava §2 proveedor de IA y transferencia internacional, Novena tope, Décima tercera §1 forma de la autorización para timbrar, Décima octava sede | **Jorge** | **Sí** (es lo que lo vuelve firmable) |
| 3 | Confirmar que el representante de NUMAN HUB puede identificarse por escritura en la carátula, o pasar nombre y carácter a la carátula | Jorge | Sí |
| 4 | Mandar este documento y `CONVENIO-v3-FIRMABLE.md` a Jorge con la lista de arriba | **Luis** | — |
| 5 | Fecha de vigencia: al publicar como `mayor`, `vigente_desde` fija desde cuándo se exige; es la primera versión, así que puede ser el mismo día (no hay nadie vendiendo con una versión vieja) | Luis | — |
| 6 | Publicar: el firmable ya está derivado (`python3 design/operadores/derivar-firmable.py`); Luis corre `scripts/publicar-convenio.mjs design/operadores/CONVENIO-v3-FIRMABLE.md v3 mayor AAAA-MM-DD`, compara el hash y corre el SQL | **Luis** | — |
| 7 | Cuando Marisol conteste d, e y f: claves de producto y forma de pago en la Décima tercera; hoy van como «a la fecha» para no quemarlas | Marisol | No |
| 8 | Si Marisol cita la regla RMF de RESICO/plataformas, vuelve a entrar al convenio la declaración del régimen 625 (salió en este v3) | Marisol | No |

**Nombres de cláusula que cita el código, conservados:** Cuarta §7 (`connect-actions.ts`, `alta-cobro.ts`, `MiAlta.tsx`, `invariantes.mjs`, `.claude/rules/operadores-connect.md`), Quinta (`reembolsos.ts`, `liquidaciones.ts`), Sexta «Anexos por actividad» (`candado-actividad.ts`, `subconvenio-doc.ts`). **No se renumeró nada**: las 18 cláusulas del v2 siguen en su lugar; los anexos A–F también. Lo que cita `CONVENIO-v1.md` por nombre de archivo sigue apuntando a un archivo que existe (con banner de sustituido).

**Kéntro** no aparece: standby por decisión de Luis (9 nov).

---

**Historial:** v0 17 ago 2026 · v1 8 sep 2026 (`MEMO-REVISION-LEGAL.md`) · v2 9 nov 2026 (mañana; modelo fiscal) · **v3 9 nov 2026 (noche; alta nueva, sin retención, cancelaciones confirmadas por Luis)**. Cuando Jorge lo cierre, Luis publica el firmable con `scripts/publicar-convenio.mjs` y la firma vive en `/caminante/admin/mi-alta/convenio`.
