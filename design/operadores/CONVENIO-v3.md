# Convenio de operación en la plataforma Caminante — v3 (documento de trabajo)

### v3.2 · 11 de noviembre de 2026 · CERRADO POR LA SESIÓN LEGAL; MARISOL REVISA; LUIS PUBLICA

> **v3.2 · 11 nov 2026 (tarde).** Luis decidió que no hay abogado externo: la sesión
> legal cierra las decisiones con su criterio y Marisol revisa después. Cada decisión,
> con fundamento y alternativa, está en `design/legal/DECISIONES-LEGAL-FISCAL-2026-11-11.md`.
> Las notas 🔸 que esperaban a Jorge se convirtieron en «Decidido» (`>`); las que
> esperan a Marisol siguen como 🔸. Lo que cambió en el texto: Preámbulo (nombre del
> representante), **Cuarta §8 ahora lleva la variante B** (se retiene desde la primera
> venta por cuenta conectada; la venta por esa vía se bloquea hasta que el sistema
> retenga), Cuarta §9 (ejemplo con retención), Quinta §2 (piso legal LFPC 56), §3
> (fuerza mayor definida, bonificación del 20 %), §5 (Caminante devuelve y recupera),
> Octava §2 y §3 (encargado; **la CLABE y la CURP sí se conservan** para la informativa
> del 18-J), Novena (tope), Décima tercera §1 a) (mandato), Décima octava (sede), Anexo F.

> **v3.1 · 11 nov 2026.** Luis eligió en Stripe el perfil de plataforma B («Buyers will
> purchase from you», el de Airbnb) y aceptó ante Stripe reembolsos, contracargos,
> multas, fraude y saldos negativos de las cuentas conectadas, más MX$20 por cuenta
> conectada (Radar). Decidió que esos $20 los paga la operadora una sola vez, descontados
> de su primer pago, **como cláusula**; y que la operadora **nunca entra a Stripe**: los
> datos se capturan en la plataforma y viajan como tokens. Todo está en
> `design/legal/BITACORA-PARA-LEGAL.md` (preguntas i1–i3). Lo que cambió aquí: Cuarta §3
> (ya no absorbe la cuota por cuenta), **§3 bis nuevo** (admisión), §6, **§7 reescrita**
> (aceptación del contrato de Stripe dentro del convenio, con el texto que Stripe exige),
> **Quinta §9 nueva** (traslado de lo que Caminante responde ante el procesador),
> **Octava §3 nueva** (datos para la cuenta de cobro, consentimiento expreso de la CLABE),
> Novena, Anexo D, y la tabla final.

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
| **v3.1 · Cuarta §3** | Caminante absorbe las comisiones del procesador «por cobro, por cuenta conectada activa y por depósito» | Absorbe las de cobro y depósito; la **cuota por cuenta conectada** se traslada una sola vez como admisión (§3 bis) | Luis, 11 nov: «esos 20 cóbralos de costo de primera admisión» |
| **v3.1 · Cuarta §3 bis** (nuevo) | — | **Cuota de admisión de $20.00 MXN**, una sola vez, descontada por compensación de la primera venta por la vía (a) revirtiendo esa cantidad de su transferencia; comprobante fiscal | `admision.ts`, 0078 (`operator_admisiones`): reversión de $20 de la primera transferencia, aparte de la comisión |
| **v3.1 · Cuarta §6** | «El sistema la toma de vuelta de su cuenta de cobro» | Añade el mecanismo: reversión total o parcial de la transferencia de esa venta | Es lo que Stripe permite en el cargo con destino |
| **v3.1 · Cuarta §7** | La operadora acepta los términos «directamente con Stripe en su pantalla» | La aceptación del Acuerdo de cuentas conectadas de Stripe **vive en este convenio**, con el texto que Stripe publica para plataformas que recaban la aceptación (docs.stripe.com/connect/updating-service-agreements); si la cuenta se completa en la pantalla de Stripe, Stripe la recaba además. Los datos que el procesador exige pueden capturarse dentro de la plataforma y viajan del navegador al procesador. Inciso e) reescrito: lo que Caminante responde ante el procesador | Luis: la operadora no entra a Stripe (alta dentro de la plataforma, `alta-cobro.ts`, apagada hasta cerrar esta cláusula); perfil B aceptado el 11 nov |
| **v3.1 · Quinta §9** (nuevo) | — | Reembolsos, contracargos, multas, fraude y saldos negativos que Caminante responde ante el procesador se **trasladan al Operador** cuando le sean imputables: reversión de la transferencia, compensación, pago en 5 días hábiles | Responsabilidades aceptadas ante Stripe el 11 nov |
| **v3.1 · Octava §3** (nuevo) | — | Datos para la cuenta de cobro (identidad, nacimiento, domicilio, teléfono, identificación, **CLABE**): viajan del navegador al procesador, Caminante no los recibe; **consentimiento expreso** del Operador y de sus personas (LFPDPPP 2025 art. 7, datos patrimoniales); el Operador garantiza el de su representante y dueños | Nueva LFPDPPP (DOF 20 mar 2025, última reforma 14 nov 2025) |
| **v3.2 · Preámbulo** | Representante «con facultades que constan en la escritura» | Por nombre: Luis de la Rosa Orvañanos | Decidido por legal (sin abogado externo desde el 11 nov tarde) |
| **v3.2 · Cuarta §8** | Variante A (hoy no se retiene) en el firmable | **Variante B**: se retiene 2.5 % ISR / 50 % IVA (20/100 sin RFC) desde la primera venta por cuenta conectada; base = total cobrado sin IVA; día 5 / 17 / 10 | D1–D5; producto bloquea la venta por cuenta conectada hasta que el módulo exista |
| **v3.2 · Cuarta §9** | Ejemplo sin retención ($1,400) | Ejemplo con retención: el Operador recibe **$1,241.59** | D3 |
| **v3.2 · Quinta §2, §3, §5** | 24 h; fuerza mayor en tres palabras; «el Operador reintegra» | Piso legal de 5 días hábiles (LFPC 56); bonificación del 20 % al cliente a cargo del Operador (92 Bis/Ter); fuerza mayor definida; Caminante devuelve de inmediato y recupera | D12–D14 |
| **v3.2 · Octava §3 y Anexo F** | Caminante no conserva la CLABE | **Sí conserva CLABE y CURP** como datos fiscales: la informativa del 18-J III los exige | D4 |
| **v3.2 · Novena, Décima tercera §1 a), Décima octava** | Sin tope; «autoriza a timbrar»; sede sin negociación previa | Tope = comisiones de 12 meses, sin indirectos; mandato (CCF 2546); CDMX con 15 días hábiles de negociación | §5 del documento de decisiones |
| **v3.2 · Cuarta §1(a), §6, §8, §9** (noche) | «El procesador divide el importe…»; retención «descontada de cada venta» | **La transferencia al Operador se hace neta** de comisión, IVA y retenciones en el acto del cobro; la reversión por devolución es proporcional e incluye comisión y retenciones | Mecánica construida por producto (555129e): Stripe no combina comisión de aplicación con transferencia neta |
| **v3.1 · Anexo D** | Remite al aviso publicado | Añade que el aviso informa que el procesador recibe y trata los datos de la cuenta de cobro conforme a su propia política | Stripe lo exige a quien enlaza su propio aviso de privacidad |

> **Sin cambio (Luis, no reabrir):** escala A/B, tope 20 %, mínimo $250,
> congelamiento, complementos, descuentos, fecha de arranque, modelo Airbnb,
> comisión del procesador dentro de la de Caminante.

---

<!-- FIRMABLE -->
# Convenio de operación en la plataforma Caminante

Versión 3 · noviembre de 2026

## Preámbulo

Convenio de prestación de servicios de plataforma que celebran, por una parte, **NUMAN HUB, S.A. de C.V.**, RFC **NHU250826CS8**, con domicilio en Prado Norte 525, interior 204, Lomas de Chapultepec I Sección, Miguel Hidalgo, C.P. 11000, Ciudad de México, titular de la plataforma y de la marca **Caminante**, representada representada por Luis de la Rosa Orvañanos, con las facultades que constan en la escritura pública 107,629 otorgada ante la Notaría 1 de la Ciudad de México (en adelante **«Caminante»** o **«la Plataforma»**); y por la otra, la persona física o moral identificada en la **carátula de firma** de este documento (en adelante **«el Operador»**), representada por quien lo acepta electrónicamente, quien declara contar con facultades suficientes para obligarlo.

Los datos del Operador —nombre o razón social, RFC, régimen fiscal, código postal fiscal y tipo de persona— se toman de su expediente en la plataforma, en particular de su Constancia de Situación Fiscal, y quedan registrados junto con la firma. Si al firmar algún dato fiscal no estuviera capturado, el Operador se obliga a completarlo en su expediente; su falta no invalida este convenio.

> **Decidido (legal, 11 nov).** El representante va por nombre; el carácter exacto (administrador único o apoderado) se toma del acta en `~/Expediente-NUMAN/corporativo/` y se escribe en la carátula. DRUIDAS, sociedad en constitución, firmará este mismo convenio como Operador; es parte relacionada de NUMAN HUB y por eso paga la escala pública (Décima tercera, punto 8; LISR 179).

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

**(a) Cobro a nombre del Operador**, cuando tiene cuenta conectada. El cargo se genera desde la plataforma pero **a nombre del Operador**, que es quien aparece como comercio en el estado de cuenta del cliente y quien presta el servicio. El importe entra a la cuenta de Caminante en el procesador y, **en el mismo acto del cobro**, Caminante transfiere a la cuenta de cobro del Operador **lo que le corresponde**: el importe cobrado menos la comisión de Caminante, su IVA y las retenciones de impuestos del punto 8. Caminante se queda únicamente con esas cantidades; la parte del Operador no permanece en su poder.

**(b) Cobro por cuenta del Operador**, mientras no tenga cuenta conectada. Caminante cobra el importe total **por cuenta y orden del Operador**, retiene su comisión más el IVA, y **transfiere el remanente al Operador a los 7 días naturales posteriores al regreso** de la salida correspondiente. El importe cobrado por esta vía es dinero del Operador en poder de Caminante, no ingreso de Caminante.

**2 · La retención es la misma en las dos.** En ambos casos Caminante retiene únicamente su comisión más el IVA que le corresponda y, en su caso, los impuestos que la ley le obligue a retener al Operador conforme al punto 8. La retención de la comisión constituye el pago de ésta: la factura que Caminante emita por ese concepto (Cláusula Décima tercera) se salda contra ella por compensación, sin transferencia adicional.

**3 · El procesamiento de pagos lo absorbe Caminante.** Las comisiones del procesador de pagos por cada cobro y por cada depósito al Operador **están incluidas en la comisión de plataforma** y las paga Caminante. No se descuentan de lo que recibe el Operador. **Esto aplica también cuando una venta se deshace**: el procesador no devuelve su comisión y esa pérdida es de Caminante, no del Operador (Cláusula Quinta). La única excepción es la cuota de admisión del punto 3 bis.

**3 bis · Cuota de admisión.** Por la apertura de su cuenta de cobro conectada, el Operador paga a Caminante, **una sola vez**, una cuota de admisión de **$20.00 MXN** (veinte pesos 00/100 moneda nacional), importe que comprende el impuesto al valor agregado que en su caso cause. Corresponde al cargo que el procesador hace a Caminante por cada cuenta conectada a su plataforma. **Se cobra por compensación**: Caminante la descuenta del primer importe que corresponda al Operador por una venta cobrada por la vía (a), revirtiendo esa cantidad de la transferencia de esa venta o, si esa transferencia no alcanzara, de la siguiente, y le entrega el comprobante fiscal correspondiente. No hay otra cuota de admisión ni de permanencia, ni cargo por venta distinto de la comisión de la Cláusula Tercera. Si el procesador cambia el cargo por cuenta conectada, la cuota de admisión cambia con él para los Operadores que no la hayan pagado antes del cambio, y Caminante lo publica en la plataforma.

🔸 **Marisol confirma (M8; D7 decidido):** la cuota es lo que Stripe le cobra a NUMAN por cada cuenta conectada (Radar Standard, MX$20.00, aceptado por Luis el 11 nov). Nuestra lectura, a confirmar: **no es un gasto por cuenta de terceros** (el cargo de Stripe se factura a NUMAN, no a nombre de la operadora, así que no cabe en la regla de la RMF de erogaciones por cuenta de terceros, 2.7.1.12/2.7.1.13 según el año), sino **contraprestación de NUMAN** y por tanto gravada al 16 % (LIVA 14 y 18: el valor del servicio incluye «reembolsos» y «cualquier otro concepto» que se cobre a quien recibe el servicio). Luis decidió que lo que se descuenta son **$20 exactos** (el código revierte $20.00): por eso la cláusula dice «comprende el IVA», es decir $17.24 + $2.76. Preguntas: ¿IVA incluido así, o $20 + IVA ($23.20)? ¿Va como **renglón aparte** en el CFDI de la comisión de esa primera venta o como **CFDI propio**? ¿Con la misma clave 80141628 u otra? Si contesta «sin IVA», se quita la frase del IVA y se vuelve a derivar. > **Decidido (legal, 11 nov; D7).** Compensación (CCF 2185) y reversión parcial son exigibles así; el cambio de cuota por cambio del procesador es modificación menor (Décima segunda). La frase «que no la hayan pagado antes del cambio» sigue al código, que fija el monto cuando se cobra (primera venta), no cuando se abre la cuenta (producto, 11 nov tarde).

> *Trazabilidad:* `src/lib/operadores/admision.ts` y la migración 0078 (`operator_admisiones`, una fila por operadora): en la primera venta por Connect se revierte $20.00 de la transferencia (`transfers.createReversal`, concepto `admision_operadora`), **aparte** del `application_fee_amount`, para no ensuciar la comisión congelada ni el tope del 20 %. Nunca tumba un pago; si falla, la siguiente venta lo reintenta.

> **Decidido.** Esta redacción sustituye la decisión del 13 ago 2026 (que cargaba la comisión del procesador al Operador) por la del 9 nov 2026. Costo medido del procesador: 4.80 % del cobro (`ESCENARIOS-DINERO.md`).

**4 · Desglose.** Caminante entregará al Operador, por cada salida y por cada mes, el desglose que permita conciliar: reservas cobradas, descuentos, devoluciones, comisión retenida, IVA de la comisión, impuestos retenidos si los hubiera, importe neto depositado y la vía por la que entró cada cobro.

**5 · Momento en que el Operador dispone del dinero.** En la vía (b) dispone de él al recibir la transferencia. En la vía (a) el importe entra a su cuenta al momento del cobro y queda sujeto al calendario de pagos de su propio procesador, que **no lo fija Caminante**.

**6 · El Operador dispone de su parte antes de la salida, a propósito.** En la vía (a) no se le fija retraso de pago: tener el dinero disponible antes de la fecha es, muchas veces, lo que le permite operar. La contrapartida está en la Cláusula Quinta: **si procede una devolución, el Operador reintegra su parte**, aunque ya la haya dispuesto. El sistema la toma de vuelta de su cuenta de cobro, revirtiendo total o parcialmente la transferencia de esa venta; la reversión es proporcional a lo devuelto e incluye, en la misma proporción, la comisión y las retenciones de esa venta (Cláusula Quinta, punto 4). Si no hay saldo, la cuenta queda en descubierto y el adeudo es del Operador, quien podrá cubrirlo por transferencia o por compensación contra liquidaciones futuras.

🔸 **Para Luis (D15, es de negocio):** aquí está la decisión de si el dinero se libera **antes** de la salida (como hoy, a propósito) o **después de la experiencia** (como Airbnb, que paga al anfitrión ~24 h después del check-in). Con el perfil B, NUMAN responde ante Stripe por reembolsos y saldos negativos: si la operadora ya dispuso del dinero y hay que devolver, el hueco lo cubre NUMAN y lo persigue (Quinta §9). Liberar después reduce ese riesgo a cambio de que la operadora opere sin el anticipo. **No lo cambié**: lo decides tú y es una línea aquí y una en Stripe (calendario de pagos de la cuenta conectada). Si decides «después», también cambia el §5.

**7 · El procesador de pagos.** El cobro se procesa a través de un **procesador de pagos tercero** —a la fecha, **Stripe**—, que es quien presta al Operador el servicio de procesamiento y depósito. Para recibir cobros por la vía (a), el Operador tiene una **cuenta de cobro propia** en el procesador, abierta a través de la plataforma. El Operador puede completar y mantener esa cuenta **desde la plataforma**, sin salir de ella, o en la pantalla del propio procesador cuando la plataforma lo lleve ahí. En ambos casos:

a) **Acepta el contrato del procesador.** Los servicios de procesamiento de pago para los Operadores en Caminante son proporcionados por Stripe y están sujetos al Acuerdo de cuentas conectadas de Stripe (Stripe Connected Account Agreement, https://stripe.com/connect-account/legal/full), que incluye los Términos de servicio de Stripe (Stripe Terms of Service, https://stripe.com/legal/ssa); en conjunto, el «Acuerdo de servicio de Stripe». **Al firmar este convenio, o al seguir operando como Operador en Caminante, el Operador acepta cumplir las obligaciones del Acuerdo de servicio de Stripe**, que puede ser modificado por Stripe de tanto en tanto. Para que Caminante pueda ofrecer servicios de procesamiento de pagos a través de Stripe, el Operador acepta proporcionar a Caminante información completa y exacta sobre sí mismo y su negocio, y autoriza a Caminante a compartir dicha información y los datos de las transacciones relacionadas con el uso de los servicios de procesamiento de pago proporcionados por Stripe. Caminante registra ante el procesador la fecha, la dirección IP y el navegador desde los que el Operador otorgó esta aceptación. Cuando el Operador complete su cuenta en la pantalla del propio procesador, éste le pedirá además su aceptación ahí. Caminante no es parte de ese contrato ni responde por él.

b) **Se obliga a proporcionar información completa y verídica** sobre sí mismo, su negocio y las personas que lo representan o son sus dueños —identidad, fecha de nacimiento, domicilio, teléfono, datos fiscales, identificación oficial y cuenta bancaria CLABE— y a mantenerla actualizada. Cuando la captura se hace dentro de la plataforma, esos datos viajan **del navegador del Operador al procesador**; Caminante no los recibe por esa vía ni los puede leer. La CURP y la CLABE que Caminante conserva como datos fiscales son las de la Cláusula Octava, punto 3, y no se usan para otro fin. Autoriza a Caminante a transmitir al procesador los datos de su expediente que éste requiera.

c) **Reconoce** que el procesador trata sus datos conforme a su propio aviso de privacidad (https://stripe.com/privacy) y que las operaciones se liquidan a través de los bancos adquirentes del procesador (https://stripe.com/legal/acquirer-disclosure).

d) Acepta que, **si no entrega la información que el procesador requiera** o ésta resulta falsa, el procesador puede suspender los depósitos, y Caminante puede suspender la venta por la vía (a) hasta que se regularice.

e) **Reconoce que Caminante responde frente al procesador** por los reembolsos, contracargos, multas, pérdidas por fraude y saldos negativos de las cuentas conectadas de su plataforma, y que por eso lo que de ello le sea imputable al Operador se le traslada conforme a la Cláusula Quinta, punto 9. Reconoce también que Caminante revisa a cada Operador antes de habilitarle el cobro, y que puede pedirle información adicional cuando el procesador o la ley lo exijan.

Para el procesador, el Operador captura su cuenta bancaria directamente; Caminante no se la transmite. La identificación oficial, los demás documentos del expediente y los datos fiscales (incluida la CLABE para la información mensual al SAT) los conserva Caminante conforme al Anexo B, al Anexo F y a la Cláusula Octava.

> **Decidido (legal, 11 nov; D16).** El inciso a) es, palabra por palabra, el texto en español que Stripe publica para plataformas que recaban la aceptación en sus propios términos (docs.stripe.com/connect/updating-service-agreements, «Agrega el contrato de servicios de Stripe a tus condiciones de uso»), con «Operadores» y «Caminante» en los huecos. Stripe exige, además, que la plataforma registre fecha e IP de la aceptación (`identity.attestations.terms_of_service` en Accounts v2 / `tos_acceptance` en v1): el código lo hace con el token de cuenta (`tos_shown_and_accepted`, `connect.ts`, `completarAltaCobro`). Hoy conviven dos formas de cuenta: (1) la de Nomádika, `acct_1UaiUdGRRBL2rPeh`, Accounts v2 con panel completo y pérdidas a cargo de Stripe (`losses_collector = stripe`), donde Stripe recaba la aceptación en su pantalla; (2) la del alta dentro de la plataforma (`COBRO_EN_PLATAFORMA`, apagada), sin panel y con pérdidas a cargo de la plataforma, donde la aceptación es ÉSTA. El inciso a) vale para las dos. **Cuadrado el 11 nov (tarde) con Stripe LIVE** (`GET /v2/core/accounts/acct_1UaiUdGRRBL2rPeh`: `dashboard: full`, `fees_collector`, `losses_collector` y `requirements_collector` = `stripe`): para la cuenta actual de Nomádika el saldo negativo es de Stripe, no de NUMAN; el perfil B fija valores por omisión y la cuenta los sobrescribe al crearse. Lo que NO cambia: el cobro es cargo con destino y vive en la cuenta de NUMAN, así que reembolsos y contracargos se descuentan **primero del saldo de NUMAN** y NUMAN los recupera revirtiendo la transferencia: la Quinta §9 aplica tal cual. Con el alta dentro de la plataforma las cuentas nacen con `losses_collector = application` y ahí NUMAN sí responde por el saldo negativo; esa cuenta de Nomádika se cerrará y recreará al prender el alta (el tipo de panel no se cambia). El inciso e) y la Quinta §9 sirven para los dos casos.

**8 · Retenciones de ley.** Caminante es una plataforma tecnológica de intermediación y la ley puede obligarla a **retener y enterar** al SAT impuestos del Operador y a emitirle el comprobante correspondiente (Ley del Impuesto sobre la Renta, artículos 113-A a 113-C; Ley del Impuesto al Valor Agregado, artículos 1-A BIS y 18-J; Ley de Ingresos de la Federación del ejercicio).

Caminante cobra por cuenta del Operador a través de una plataforma tecnológica y, por ello, la ley la obliga a **retener y enterar** al SAT impuestos del Operador y a emitirle el comprobante correspondiente. El Operador lo reconoce y acepta que la transferencia de cada venta se haga **neta de esas retenciones**, conforme a las tasas vigentes en cada ejercicio. Para el ejercicio 2026:

Operador persona física con RFC: ISR **2.5 %** del importe cobrado sin IVA, e IVA **50 %** del IVA cobrado (Ley del ISR 113-A y 113-C; Ley de Ingresos 2026 artículo 25 fracción VI; Ley del IVA 1-A BIS y 18-J fracción II inciso a).

Operador persona moral con RFC: ISR **2.5 %** del importe cobrado sin IVA, e IVA **50 %** del IVA cobrado (Ley de Ingresos 2026 artículo 25 fracciones VI y IX).

Operador sin RFC válido en el expediente: ISR **20 %** e IVA **100 %** (Ley del ISR 113-C fracción IV; Ley del IVA 18-J fracción II inciso a).

La base es **todo lo que el cliente paga por la reserva, sin IVA**, incluidos complementos y descontadas las devoluciones; la comisión de Caminante no la reduce. Las tasas son **las que fije la ley en cada ejercicio**; su cambio por reforma no constituye modificación de este convenio y se refleja desde la fecha en que entre en vigor. Caminante entrega al Operador, **a más tardar el día 5 de cada mes**, el CFDI de retenciones e información de pagos del mes anterior con el complemento de plataformas tecnológicas, entera los impuestos retenidos a más tardar el día 17 y presenta al SAT la información mensual de operadores que la ley exige. Las retenciones son impuestos del Operador pagados por su cuenta: él las acredita en sus declaraciones. El Operador declara a Caminante, bajo protesta de decir verdad, si es persona física o moral, su RFC y su régimen, mediante su Constancia de Situación Fiscal.

Si la autoridad fiscal determinara que Caminante debió retener y enterar impuestos del Operador por operaciones en las que no lo hizo, y Caminante los enterara, el Operador **reembolsará a Caminante** las cantidades enteradas por su cuenta, por compensación contra ventas futuras o por transferencia, sin perjuicio de su derecho a acreditarlas.

> **Decidido (legal, 11 nov tarde; `DECISIONES-LEGAL-FISCAL-2026-11-11.md` D1–D5).** La variante A («hoy no se retiene») salió del firmable: con el perfil B de Stripe NUMAN cobra por cuenta de la operadora y la obligación nace venta por venta (LISR 113-A; LIVA 1-A BIS + 18-J II). El firmable dice la verdad desde la primera venta porque la sesión de producto **bloquea la venta por cuenta conectada hasta que el módulo de retención exista** (lista de construcción, punto 1). Verificado en Stripe LIVE el 9 nov: ninguna venta ha pasado por cuenta conectada; no hay nada que regularizar. 🔸 *Marisol confirma* M2 (LIF 25 VI/IX a morales) y M3 (2.5 % y no 4 % con hospedaje incluido).

**9 · La liquidación, en una línea.** Lo que recibe el Operador por cada venta es: **importe cobrado, menos devoluciones, menos comisión de plataforma, menos IVA de la comisión, menos los impuestos retenidos conforme al punto 8** y, una sola vez, la cuota de admisión del punto 3 bis. Nada más se descuenta. La transferencia al Operador se hace **neta de la comisión, su IVA y las retenciones** en el mismo acto del cobro; la cuota de admisión se descuenta aparte, como dice el punto 3 bis.

Ejemplo con la escala A: precio al cliente $1,750.00 (base sin IVA $1,508.62, IVA $241.38); comisión 20 % sobre la base = $301.72, más IVA $48.28, total separado para Caminante **$350.00**; ISR retenido 2.5 % de $1,508.62 = **$37.72**; IVA retenido 50 % de $241.38 = **$120.69**; **el Operador recibe $1,241.59**, y lo retenido consta en su CFDI de retenciones del mes.

> *Trazabilidad (producto, 555129e, 11 nov noche):* `connect-cobro.ts` ya **no** usa `application_fee_amount`; la transferencia a la cuenta conectada es neta = cobrado − comisión × 1.16 − ISR − IVA retenidos, y Caminante se queda el resto desde el cobro. Stripe no admite combinar comisión de aplicación y transferencia neta; con la transferencia neta un reembolso parcial revierte en proporción solo (probado: devolver $875 de $1,750 revirtió $620.80 de $1,241.59). La admisión sigue siendo reversión aparte. Candado: sin tasas del ejercicio, no se cobra por cuenta conectada (migración 0079).

## Quinta · Devoluciones, cancelaciones y contracargos

**1 · La política de cancelación es parte de este convenio** y se publica en la página de cada experiencia antes de que el cliente pague. El Operador elige, por experiencia, una de las dos políticas del **Anexo C** y no puede ofrecer una más laxa que la de sus propios proveedores (hospedaje, transporte).

**2 · Ventanas para el cliente** (Anexo C). Los días se cuentan en días naturales hasta la fecha de inicio de la salida.

**Política Estándar**, para salidas de uno o dos días: cancela con 30 días o más, devolución del **100 %**; de 15 a 29 días, **50 %**; con menos de 15 días, **sin devolución**.

**Política Expedición**, para viajes largos o con anticipos altos: cancela con 60 días o más, devolución del **100 %**; de 30 a 59 días, **50 %**; con menos de 30 días, **sin devolución**.

**Arrepentimiento**, en cualquiera de las dos políticas: si el cliente cancela **dentro de las 24 horas** siguientes a su reserva y la salida está a 7 días o más, recibe el **100 %**. Además, cuando la salida esté a **más de 10 días hábiles** de la fecha de la reserva, el cliente puede revocarla **dentro de los 5 días hábiles** siguientes sin responsabilidad, con devolución del **100 %**, conforme al artículo 56 de la Ley Federal de Protección al Consumidor. Toda devolución al cliente se hace **por la misma forma de pago** con la que pagó.

> **Decidido (legal, 11 nov; D12).** El piso legal del 56 se suma a las 24 h de Luis; no sustituye sus números. LFPC 92: misma forma de pago.

**3 · Cuando cancela el Operador**, el cliente recibe siempre el **100 %** y, si la cancelación le es imputable al Operador, además una **bonificación del 20 % del precio pagado** (artículos 92 Bis y 92 Ter de la Ley Federal de Protección al Consumidor), que es a cargo del Operador; y el Operador paga a Caminante una **penalización** sobre el valor de las reservas canceladas. Quedan exentas la bonificación y la penalización en caso de **fuerza mayor documentada**: condiciones meteorológicas que impidan operar con seguridad conforme al protocolo de la actividad o a aviso de autoridad; cierre del área natural, del camino o del puerto por la autoridad; contingencia sanitaria o bloqueo que impida llegar; o emergencia médica del guía responsable sin sustituto posible. El Operador la acredita con el reporte, aviso o parte correspondiente y Caminante la registra en su historial. La penalización depende de la anticipación con la que el Operador cancele respecto de la fecha de la salida:

Con más de 30 días: **sin penalización**.

De 15 a 30 días: **10 %**.

De 3 a 14 días: **20 %**.

Con menos de 72 horas, o si no se presenta: **30 %**.

La penalización es una pena convencional, de al menos **$500 MXN** y de a lo más **$15,000 MXN** por salida, y en ningún caso excede el valor de las reservas canceladas. La bonificación al cliente y la penalización **se descuentan de las ventas futuras del Operador** o se recuperan conforme al punto 9; no se cobran aparte. Caminante emite al Operador el comprobante fiscal que corresponda por la penalización.

> **Decidido (legal, 11 nov; D12, D14).** Fuerza mayor definida; pena convencional dentro del CCF 1843 (no excede la obligación principal). Los números son de Luis (9 nov).

**4 · La comisión sigue al dinero.** Cuando proceda una devolución, se reintegra al cliente el importe que corresponda y **la comisión de Caminante y su IVA se ajustan en la misma proporción**: si se devuelve todo, se devuelve toda la comisión; si el Operador retiene una parte conforme a su política, Caminante conserva su comisión únicamente sobre esa parte. Las retenciones de impuestos de esa venta se ajustan en la misma proporción **si la devolución ocurre antes de que Caminante emita el CFDI de retenciones del mes de la venta**; si ocurre después, la retención ya enterada queda a favor del Operador, que la acredita con ese CFDI, y el Operador reintegra a Caminante su importe conforme al punto 9.

**5 · Caminante devuelve al cliente y recupera del Operador.** Cuando proceda una devolución, Caminante la hace al cliente **de inmediato** y por la misma forma de pago, aunque el Operador ya haya dispuesto de su parte; el Operador la reintegra a Caminante conforme al punto 9 (reversión de la transferencia, compensación contra ventas futuras o pago en 5 días hábiles). Frente al cliente, Caminante responde por la devolución; frente a Caminante, responde el Operador.

> **Decidido (legal, 11 nov; D13).** Caminante es garante del reembolso frente al cliente: es lo que la LFPC le exige a quien cobró, lo que NUMAN aceptó ante Stripe y lo que el sistema ya hace.

**6 · El costo de procesamiento de una venta que se deshace lo absorbe Caminante** (Cláusula Cuarta, punto 3). Es la consecuencia de que la comisión del procesador vaya dentro de la comisión de plataforma.

**7 · Contracargos.** Los derivados de la prestación del servicio son por cuenta del Operador; los derivados de fallas de la plataforma o del cobro, por cuenta de Caminante.

> **Decidido (legal, 11 nov).** Los contracargos por el servicio son del Operador y se le trasladan conforme al punto 9; los de la plataforma o el cobro, de Caminante.

**8 · Documentos fiscales de la devolución.** Si el Operador emitió CFDI al cliente desde el portal: devolución parcial, CFDI de egreso relacionado; devolución total dentro del mismo mes, cancelación del comprobante; devolución total con mes cerrado, CFDI de egreso. La comisión devuelta se documenta con un CFDI de egreso de Caminante al Operador en la misma proporción. Si el Operador facturó por sus propios medios, documenta él la devolución.

🔸 *Para Marisol:* el motivo de cancelación y la regla de devoluciones son la pregunta e del memo.

**9 · Lo que Caminante responde ante el procesador se traslada al Operador cuando le sea imputable.** Frente al procesador de pagos, Caminante responde por los reembolsos, los contracargos, las multas del procesador o de las redes de tarjetas, las pérdidas por fraude y los saldos negativos de las cuentas conectadas de su plataforma. Cuando cualquiera de esos conceptos derive de la prestación del servicio del Operador, de su cancelación, de su incumplimiento de este convenio, de información falsa o incompleta, o de actos de fraude propios o de su personal, **es a cargo del Operador**, quien lo reembolsa a Caminante por su importe, sin recargo. Para cobrarlo, Caminante puede, a su elección y en este orden: revertir total o parcialmente la transferencia de la venta de que se trate; compensarlo contra cualquier importe que deba al Operador por ventas presentes o futuras; o exigirle el pago por transferencia, que el Operador hará dentro de los **5 días hábiles** siguientes al aviso con el desglose. Si el adeudo no se cubre, subsiste, y Caminante puede suspender la publicación y venta conforme a la Cláusula Décima primera. Son a cargo de Caminante los que deriven de fallas de la plataforma o del cobro.

> **Decidido (legal, 11 nov; D12, D13).** Esto traslada lo que NUMAN aceptó ante Stripe el 11 nov (perfil B: «You'll be responsible for refunds, chargebacks, and fines… losses from seller fraud and negative balances on connected accounts»). Tres cosas que revisar: (1) que la reversión de transferencia y la compensación (CCF 2185–2186) tengan la forma correcta y no choquen con la pena convencional del §3; (2) **LFPC 56**: en venta fuera del establecimiento (la web lo es) el consumidor puede revocar sin responsabilidad dentro de los **5 días hábiles**, salvo que el servicio se preste a 10 días hábiles o menos de la orden de compra. Nuestra ventana de arrepentimiento (24 h, salida a 7+ días) es **más corta** que la legal cuando la salida está a más de 10 días hábiles; la política no puede ser menor que la ley frente al cliente. Luis decidió los números el 9 nov sin este dato: propongo que la de arrepentimiento diga «24 horas, o el plazo mayor que la ley conceda al cliente». (3) **LFPC 92 Bis**: si el servicio no se presta por causa imputable al proveedor (el Operador cancela), el cliente tiene derecho a **bonificación o compensación**, no sólo a la devolución; y LFPC 92 exige devolver por la misma forma de pago. La penalización del §3 cubre a Caminante; ¿la bonificación al cliente sale de ahí o se pacta aparte? LFPC 90 (cláusulas inválidas en contratos de adhesión) aplica a lo que el cliente firma, no a este convenio entre empresas, pero la política del Anexo C sí es contrato de adhesión frente al cliente.

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

> **Decidido (legal, 11 nov; D17).** El proveedor de IA (Anthropic, `csf.ts`) es **persona encargada** (LFPDPPP 2025 art. 2 XII): no requiere consentimiento, sí mención en el aviso de privacidad y la prohibición de tratar datos de salud. La mención en el convenio se queda por transparencia.

**3 · Datos para la cuenta de cobro.** Para abrir y mantener la cuenta de cobro de la Cláusula Cuarta, punto 7, el procesador de pagos exige datos del Operador y, en su caso, de su representante legal y de las personas que son sus dueñas: nombre, fecha de nacimiento, domicilio, teléfono, RFC, identificación oficial y la cuenta bancaria CLABE en la que recibirá sus ventas. Cuando el Operador los captura dentro de la plataforma para el procesador, viajan cifrados de su navegador al procesador: **Caminante no los recibe por esa vía ni los puede leer**; sólo conserva el identificador de la cuenta y su estado. Aparte de ello, Caminante **sí conserva, como datos fiscales del Operador, su CURP y la CLABE** en la que recibe sus ventas, porque la ley le obliga a reportarlos mensualmente al SAT junto con su nombre, RFC, domicilio fiscal y el monto de sus operaciones (Ley del IVA, artículo 18-J fracción III); los trata sólo para ese fin y para la facturación y retenciones de este convenio. La CURP y el domicilio fiscal se toman de la Constancia de Situación Fiscal del expediente; la CLABE se captura una sola vez, con su dígito verificador, y el banco se deduce de ella. Esos datos se guardan en un registro de acceso restringido, que sólo el sistema lee, y la CLABE se muestra en pantalla enmascarada. El Operador **consiente de manera expresa** que esos datos, incluidos los financieros y patrimoniales, se comuniquen al procesador para que éste los trate conforme a su propio aviso de privacidad, dentro y fuera de México, con el fin de verificar su identidad, prevenir fraudes y depositarle sus ventas. El Operador garantiza que cuenta con el consentimiento de su representante y de sus dueños para esa comunicación, y responde de ello. El Operador puede ejercer sus derechos sobre esos datos ante el procesador, y ante Caminante los que correspondan a su expediente.

> **Decidido (legal, 11 nov; D16, D17, D4).** En la nueva LFPDPPP (DOF 20 mar 2025, última reforma 14 nov 2025) **no existe «remisión»** como figura (la palabra no aparece en la ley; venía del Reglamento de 2011). El art. 2 define «persona encargada» (XII: quien trata datos por cuenta del responsable) y «transferencia» (XX: toda comunicación a persona distinta de la titular, del responsable o de la persona encargada). Stripe trata los datos **como responsable propio** (la operadora contrata directamente con Stripe, inciso a) de la Cuarta §7), así que nuestra lectura es que es **transferencia**, no encargo. El art. 7 exige **consentimiento expreso** para datos financieros o patrimoniales (la CLABE) «salvo las excepciones de los artículos 9 y 36»; el art. 36 fracciones IV (contrato celebrado en interés del titular entre el responsable y un tercero) y VII (cumplimiento de la relación jurídica) permitirían la transferencia sin consentimiento, pero lo pedimos **expreso de todos modos** porque la firma electrónica del convenio ya lo es (art. 7, «por medios electrónicos») y cuesta nada. El art. 35 obliga a comunicar al tercero el aviso y las finalidades, y a que el aviso tenga **una cláusula donde el titular acepta o no la transferencia**: eso va en el aviso de privacidad (Anexo D), que hoy no la tiene. Confirma la lectura. Sobre «revisar a cada operadora» (lo que NUMAN aceptó ante Stripe): revisé el art. 17 de la LFPIORPI (última reforma DOF 16-07-2025) fracción por fracción y **ninguna** describe a una plataforma que cobra por cuenta de vendedores a través de un procesador regulado; te dejo la pregunta abierta, junto con la de si el saldo que pasa por la cuenta de NUMAN en Stripe toca la Ley Fintech (fondos de pago electrónico) o si el regulado es sólo Stripe. No lo afirmo en ningún sentido.

## Novena · Responsabilidad

El Operador es el **único responsable** de la prestación de la experiencia y responde frente a los participantes y frente a terceros por cualquier daño derivado de su operación.

El Operador **sacará en paz y a salvo** a Caminante de cualquier reclamación, demanda o sanción derivada de la operación de sus experiencias, del incumplimiento de sus obligaciones legales o de la falta de los permisos y seguros previstos en la Cláusula Sexta, incluidas las reclamaciones del procesador de pagos que le sean imputables conforme a la Cláusula Quinta, punto 9.

La responsabilidad de Caminante se limita a los servicios de plataforma y de cobro descritos en este convenio. **La responsabilidad total de Caminante frente al Operador**, por cualquier causa derivada de este convenio, **no excederá el importe de las comisiones que Caminante haya cobrado a ese Operador en los 12 meses anteriores** al hecho que la origine, y no comprende daños indirectos, lucro cesante ni pérdida de oportunidad. Esta limitación no aplica a lo que la ley no permita limitar.

> **Decidido (legal, 11 nov; §5 del documento de decisiones).** Tope proporcional al ingreso; CCF 2110 (daños inmediatos y directos). Es oponible entre empresas; frente al cliente rige la LFPC y por eso la Quinta §5 hace a Caminante garante.

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

a) **Desde el portal de Caminante**, si activa la facturación en su panel, carga su Certificado de Sello Digital y autoriza a Caminante a timbrar en su nombre. En ese caso el portal emite el comprobante por cuenta del Operador cuando el cliente lo solicita, con la clave de producto que corresponda al servicio (a la fecha, 90121501 «Servicios de organización de excursiones», o la que corresponda al concepto), y lo que nadie solicita se incorpora a la **factura global** mensual del Operador a público en general, también emitida desde el portal. Para ese fin el Operador otorga a Caminante **mandato**, limitado a generar, timbrar con su Certificado de Sello Digital y conservar por su cuenta los comprobantes de sus ventas a través de la plataforma, que Caminante ejecuta por conducto de un proveedor autorizado de certificación; el Operador es y sigue siendo el emisor de esos comprobantes y responsable de su contenido.

b) **Por sus propios medios.** Si el Operador no activa la facturación en el portal, factura a sus clientes por fuera de la plataforma con los datos de cada reserva que la plataforma le entrega. En ese caso Caminante **no emite ni responde** por esos comprobantes.

En ningún caso Caminante emite ese comprobante a nombre propio: pone la herramienta y los datos de cada reserva.

**2 · De Caminante al Operador.** Caminante emite CFDI al Operador **únicamente por su comisión de plataforma**, más el IVA, con la clave de producto que corresponda a la intermediación (a la fecha, 80141628 «Servicio de distribuidores por comisión»), por cada cobro confirmado. Esa comisión es el único ingreso de Caminante derivado de la operación.

**3 · El CFDI de retenciones.** Por las retenciones de la Cláusula Cuarta, punto 8, Caminante emite al Operador, a más tardar el día 5 de cada mes, el **CFDI de retenciones e información de pagos** del mes anterior, con la clave de retención 26 «Servicios mediante Plataformas Tecnológicas» y el complemento de plataformas tecnológicas, timbrado por su proveedor autorizado de certificación. Las devoluciones del mes se reflejan en él (Cláusula Quinta, punto 4).

> *Trazabilidad (producto, 11 nov noche):* Facturapi, el mismo PAC de NUMAN, timbra retenciones (`POST /v2/retentions`, clave 26 en su catálogo) y recibe el XML del complemento en `complements`; la versión del comprobante (2.0) se confirma leyendo el primer XML timbrado en modo test. 🔸 *Marisol confirma* M9.

**4 · La retención es el pago de la factura de comisión.** El importe separado al momento del cobro por concepto de comisión equivale exactamente al total del CFDI de comisión —comisión más IVA—, y ambos se saldan entre sí sin transferencia adicional. Caminante entrega el desglose que permita conciliarlos reserva por reserva.

**5 · Caminante no factura el servicio turístico.** No lo presta ni lo comercializa por cuenta propia: su papel es de intermediación tecnológica y de cobro, conforme a la Cláusula Segunda. Lo que Caminante cobra por la vía (b) de la Cláusula Cuarta lo cobra **por cuenta del Operador** y no es ingreso de Caminante.

**6 · Devoluciones.** Se documentan conforme a la Cláusula Quinta, punto 8.

**7 · Situación fiscal.** Ambas partes se obligan a mantener vigente su situación fiscal y a entregarse la documentación que requieran. El Operador entrega en su expediente su **Constancia de Situación Fiscal**, que la plataforma lee y valida (Cláusula Octava, punto 2) y que se considera reciente cuando tiene **90 días o menos** al subirla; si el Operador cambia de régimen, de domicilio fiscal o de razón social, sube una nueva. El **Certificado de Sello Digital vigente** sólo es requisito para usar la facturación desde el portal (punto 1, inciso a); su falta o vencimiento no impide cobrar, pero sí emitir comprobantes desde la plataforma hasta regularizarlo.

**8 · Partes relacionadas.** Cuando el Operador sea parte relacionada de Caminante, la comisión es la de la escala pública de la Cláusula Tercera sin trato preferente, y ambas partes conservan la documentación que acredite que la operación se pactó como entre partes independientes.

> **Decidido (legal, 11 nov; D7–D10, §5).** Claves 90121501 / 80141628, uso G03/S01, PUE, forma de pago real del cliente, devoluciones y global como en el documento de decisiones; la autorización del inciso a) es mandato (CCF 2546). 🔸 *Marisol confirma* M1 (forma de pago 04/28/03 o 31) y M6 (complemento sólo en el CFDI de retenciones).

> **Decidido (legal, 12 nov; `REPORTE-MENSUAL-RETENCIONES-2026-11-12.md` §3).** El complemento del CFDI de retenciones no admite importes negativos ni fechas fuera del mes: por eso el corte es la emisión. 🔸 *Marisol confirma* M12.

## Décima cuarta · Confidencialidad

Las partes guardarán confidencialidad sobre la información comercial, técnica y de clientes a la que accedan, durante la vigencia y por **2 años** después.

## Décima quinta · Cesión

Ninguna parte podrá ceder este convenio sin consentimiento previo y por escrito de la otra, salvo que Caminante lo ceda a una empresa de su mismo grupo.

## Décima sexta · Firma electrónica

Las partes reconocen la validez de la aceptación electrónica de este convenio en términos de los artículos 89 a 114 del **Código de Comercio**. El registro electrónico que conserve Caminante —que incluye la versión íntegra del documento mostrado, su huella digital, la identidad de quien aceptó, la fecha y la hora— hace prueba plena de la celebración.

## Décima séptima · Notificaciones

Por correo electrónico a las direcciones registradas en el expediente del Operador y de Caminante, y a través del panel del Operador.

## Décima octava · Ley aplicable y jurisdicción

Este convenio se rige por las leyes de los Estados Unidos Mexicanos. Para su interpretación y cumplimiento, las partes se someten a los tribunales competentes de la Ciudad de México, renunciando a cualquier otro fuero. Antes de acudir a los tribunales, las partes intentarán resolver cualquier controversia mediante negociación directa por escrito durante **15 días hábiles** contados desde la primera notificación de la controversia.

> **Decidido (legal, 11 nov; §5).** Ciudad de México; 15 días hábiles de negociación directa por escrito antes de acudir a tribunales; sin mediación obligatoria.

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

El aviso de privacidad de Caminante aplicable al Operador y a los participantes es el publicado en la plataforma, en la sección Privacidad. El Operador declara haberlo leído. Ese aviso informa que, al proporcionar datos para la cuenta de cobro, el procesador de pagos los recibe y los trata conforme a su propia política de privacidad (https://stripe.com/privacy), y contiene la cláusula sobre la aceptación de esa transferencia.

> **Decidido (legal, 11 nov; D16).** El aviso publicado hoy **no dice nada del procesador**; el texto listo está en `design/legal/AVISO-PRIVACIDAD-ADICIONES-2026-11.md`. Stripe exige a quien enlaza su propio aviso que éste enlace al de Stripe e incluya: «Cuando proporcionas datos personales en relación con Caminante, Stripe recibe esos datos personales y los procesa de acuerdo con la Política de privacidad de Stripe» (docs.stripe.com/connect/updating-service-agreements). Y la LFPDPPP 2025 art. 35 pide la cláusula de aceptación de la transferencia. Las dos cosas van al aviso antes de prender el alta dentro de la plataforma.

## Anexo E · Anexos por actividad

Uno por cada actividad que el Operador ofrezca, generado del catálogo de actividades de la plataforma y suscrito por separado conforme a la Cláusula Sexta, apartado «Anexos por actividad».

## Anexo F · Ficha fiscal del Operador

RFC, régimen fiscal, domicilio y código postal fiscal, CURP (persona física) y tipo de persona (física o moral), tomados de la Constancia de Situación Fiscal del expediente; y la CLABE en la que el Operador recibe sus ventas, para la información mensual al SAT (Cláusula Octava, punto 3). El Certificado de Sello Digital se registra únicamente si el Operador activa la facturación desde el portal. La ficha incluye las tasas de retención del ejercicio aplicables al Operador conforme a la Cláusula Cuarta, punto 8.
<!-- /FIRMABLE -->

---

## Lo que falta para publicar, y de quién es

| # | Qué | De quién | Bloquea publicar |
|---|---|---|---|
| ~~1~~ | ~~Candado en el código~~ **Hecho y EN PRODUCCIÓN** (8d24964 promovido el 11 nov; 0079/0080/0081 aplicadas): toda venta por cuenta conectada retiene al cobrar; sin tasas del ejercicio no cobra por Connect | — | No |
| 2 | **Publicar (listo para Luis, 12 nov):** el SQL ya está generado en `design/operadores/CONVENIO-v3.2-PUBLICAR.sql` (versión `v3.2`, mayor, `vigente_desde` = al correrlo). sha-256 del firmable `9a0bdb6df2af4aa41fbcdee7fcf77c3ba44e0fce16966c9dda45f9296eec3de0`; sha-256 del archivo SQL `e46f02bdff71550112a08004957f28e499305f2c1988c1f7e403c5c09814f3da`. Luis lo corre en el SQL Editor (o con `scripts/aplicar-migracion.mjs`) comparando el hash del SQL antes de Run; el `DO` del final revienta si el texto llegó distinto. Es la primera versión publicada: nadie vende con una vieja, así que puede entrar en vigor el mismo día | **Luis** | — |
| 3 | Marisol revisa `DECISIONES-LEGAL-FISCAL-2026-11-11.md`; si cambia una línea (M1–M8), se ajusta esa línea y se publica versión menor o mayor según toque | Marisol → Luis | No |
| 4 | D15 (liberar el dinero antes o después de la experiencia): si Luis elige «después», cambian Cuarta §5 y §6 antes de publicar | **Luis** | Sólo si elige «después» |
| 5 | Aviso de privacidad con las adiciones (`AVISO-PRIVACIDAD-ADICIONES-2026-11.md`) antes de prender el alta dentro de la plataforma | Sesión de producto | No para publicar; **sí** para `COBRO_EN_PLATAFORMA` |
| 6 | Carátula: el carácter del representante (administrador único o apoderado) desde el acta de NUMAN | Luis / sesión de producto | No |

**Nombres de cláusula que cita el código, conservados:** Cuarta §7 (`connect-actions.ts`, `alta-cobro.ts`, `MiAlta.tsx`, `invariantes.mjs`, `.claude/rules/operadores-connect.md`), Quinta (`reembolsos.ts`, `liquidaciones.ts`), Sexta «Anexos por actividad» (`candado-actividad.ts`, `subconvenio-doc.ts`). **No se renumeró nada**: las 18 cláusulas del v2 siguen en su lugar; los anexos A–F también. Lo que cita `CONVENIO-v1.md` por nombre de archivo sigue apuntando a un archivo que existe (con banner de sustituido).

**Kéntro** no aparece: standby por decisión de Luis (9 nov).

---

**Historial:** v0 17 ago 2026 · v1 8 sep 2026 (`MEMO-REVISION-LEGAL.md`) · v2 9 nov 2026 (mañana; modelo fiscal) · **v3 9 nov 2026 (noche; alta nueva, sin retención, cancelaciones confirmadas por Luis)** · **v3.1 11 nov 2026 (perfil B en Stripe, cuota de admisión, aceptación del contrato de Stripe en el convenio, datos de la cuenta de cobro; bitácora i1–i3)** · **v3.2 11 nov 2026 (tarde; cerrado por la sesión legal sin abogado externo: variante B, LFPC 56 y 92 Ter, garante, tope, sede, mandato, CLABE y CURP conservadas)**. Marisol revisa; Luis publica. Cuando Jorge lo cierre, Luis publica el firmable con `scripts/publicar-convenio.mjs` y la firma vive en `/caminante/admin/mi-alta/convenio`.
