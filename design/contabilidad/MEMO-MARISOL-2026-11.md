# Memo a Marisol — las 7 confirmaciones del modelo fiscal (nov 2026)

**Preparado el 9 nov 2026** por la sesión legal/fiscal de Caminante. Se manda
desde el correo de Luis (borrador en Gmail: «Caminante · 7 confirmaciones
fiscales + exportación del SAT»). **Marisol contesta en la columna derecha;
cuando conteste, este archivo se actualiza con su respuesta y la fecha, y la
sesión de código lee de aquí las tasas y las claves.** Nada de esto se quema en
código antes de su respuesta.

Modelo que no se reabre (`MAPA-FACTURACION.md` §0): operamos como Airbnb. La
operadora emite el CFDI al cliente por el total; NUMAN HUB emite a la operadora
el CFDI por su comisión + IVA; NUMAN retiene ISR e IVA a las operadoras y emite
el CFDI de retenciones mensual. La comisión de Stripe va dentro de la de NUMAN.

**Lo que ya verifiqué contra el texto oficial** (Cámara de Diputados, 9 nov):

- **LIF 2026, art. 25 fracc. VI** (DOF 07-11-2025): las PM que proporcionan
  plataformas aplican **2.5 %** «en sustitución de la tasa a que se refiere el
  artículo 113-A, párrafo tercero, fracción III» (que dice 1 %). Y las **personas
  morales** que obtienen ingresos por enajenación de bienes y prestación de
  servicios a través de plataformas pagan ISR **mediante retención del 2.5 %**
  sin deducción, acreditable contra provisionales y anual; **20 %** si no dan
  RFC; la plataforma cumple 113-C fracc. II, III, IV p.1 y V respecto de ellas.
- **LIF 2026, art. 25 fracc. IX**: los **residentes en el país** que presten los
  servicios del 18-B fracc. II (intermediación) y cobren por cuenta del
  prestador deben **retener IVA a las personas morales** conforme al 18-J fracc.
  II inciso a) párrafo primero (= 50 %), 100 % si depositan en cuentas en el
  extranjero, expedir el CFDI de retenciones y dar la información de la fracc.
  III del 18-J.
- **LISR 113-A** (DOF 08-12-2020): retención a personas físicas sobre el ingreso
  sin IVA: 2.1 % transporte/entrega · 4 % hospedaje · **1 % enajenación y
  prestación de servicios** (→ 2.5 % por la LIF 2026). **113-C fracc. IV**:
  entero a más tardar el **día 17** del mes siguiente; **20 %** si no dan RFC;
  fracc. II: CFDI de retenciones dentro de los **5 días** siguientes al mes.
- **LISR 113-B**: pago definitivo opcional si sus ingresos del ejercicio anterior
  no excedieron **$300,000** (aviso al SAT en 30 días del primer ingreso; 5 años).
- **LIVA 1-A BIS**: los residentes en México que den servicios digitales de
  intermediación cumplen las obligaciones del **18-J**. **18-J fracc. II a)**:
  retener a personas físicas el **50 % del IVA** cobrado (**100 %** sin RFC);
  b) enterar a más tardar el **día 17**; c) CFDI de retenciones dentro de **5
  días**; d) **inscribirse como retenedores**. **Fracc. I**: publicar el IVA por
  separado o el precio con la leyenda **«IVA incluido»**. **Fracc. III**:
  informativa mensual al SAT (nombre, RFC, CURP, domicilio, banco y CLABE, monto
  por operador) **a más tardar el día 10**.
- **LISR 113-E** (RESICO PF): excluye a socios de PM y partes relacionadas; **no
  menciona plataformas textualmente** — la incompatibilidad RESICO/plataformas
  viene de la RMF y de los criterios del SAT (pregunta c).
- **LISR 206 fracc. I**: RESICO PM no aplica si un socio controla otra sociedad
  o son partes relacionadas → DRUIDAS tributa en 601.

---

## Las 7 preguntas (contesta en la columna derecha)

| # | Pregunta | Lo que encontré (y la fuente) | **Respuesta de Marisol · fecha** |
|---|---|---|---|
| **a** | **Tasa de ISR a personas físicas** por «prestación de servicios» vía plataforma en 2026 (Nomádika y las que vengan). ¿Aplicamos **2.5 %** sobre el ingreso sin IVA, y **20 %** si no entregan RFC? | LIF 2026 art. 25 fracc. VI sustituye el 1 % del 113-A III por 2.5 %. Transporte 2.1 % y hospedaje 4 % no cambian. Las experiencias de Caminante son «prestación de servicios» (no hospedaje ni transporte) salvo que la experiencia se desglose. | |
| **b** | **Personas morales** (Kéntro; DRUIDAS cuando exista): ¿les retenemos **2.5 % de ISR** (20 % sin RFC) y **50 % del IVA**, y les emitimos CFDI de retenciones igual que a las físicas? ¿Desde el 1 ene 2026? | LIF 2026 art. 25 fracc. VI (ISR) y fracc. IX inciso a) (IVA 50 %). Es la LIF, no la LISR: **vale sólo para 2026** salvo que la LIF 2027 lo repita → el código lo lleva como configuración por año. | |
| **c** | **IVA retenido**: **50 %** del IVA trasladado (8 % del precio sin IVA) con RFC y **100 %** sin RFC, para físicas y morales. ¿Correcto? ¿Y el régimen de la operadora física: debe estar en **625** (plataformas) y **RESICO es incompatible**? ¿Qué regla de la RMF 2026 lo dice exactamente? | LIVA 18-J fracc. II a) vía 1-A BIS; LIF 25 fracc. IX a) para morales. RESICO: la exclusión no está en el texto del 113-E; la traen la RMF (regla de RESICO sobre ingresos de la Sección III) y las preguntas frecuentes del SAT. Necesitamos la **regla exacta** para citarla en «Mi alta». | |
| **d** | **Claves SAT** (Anexo 20 v4.0): experiencia **90121501** «organización de excursiones»; guía sola **90121701**; hospedaje desglosado **90111501**; transporte **78111800**; comisión de plataforma **80141628** «distribuidores por comisión» (alternativa 80141706). Uso CFDI **G03** por defecto, **S01** para quien no deduce. Método **PUE**. En el CFDI de la operadora al cliente, forma de pago **31 «Intermediario pagos»** (el dinero lo cobró NUMAN) ¿o la del cliente (04/03/01)? Unidad **E48**, objeto de impuesto **02**. ¿Y el CFDI de la operadora lleva **complemento de plataformas tecnológicas**? | Catálogos c_ClaveProdServ, c_UsoCFDI, c_FormaPago del Anexo 20; forma 31 existe para pagos por intermediario. Hoy el código timbra con 90121500 (la familia, no el servicio): se cambia a 90121501. | |
| **e** | **Devoluciones**: sin CFDI emitido → nada (pago `no-facturable`, fuera de la global). Parcial → **CFDI de egreso** relacionado (tipo relación 01). Total y mismo mes → **cancelar** con motivo **03** «no se llevó a cabo la operación». Total con mes cerrado → **egreso** por el total. Comisión (B2) → **egreso proporcional** NUMAN→operadora. ¿Así? | Reglas de cancelación CFF 29-A y RMF 2.7.1.x (aceptación del receptor >$1,000; plazo de cancelación hasta la anual); el egreso nunca depende del receptor. | |
| **f** | **Global «público en general»** mensual **por emisor** (una de NUMAN para comisiones a quien no pida factura —si aplica— y una por operadora por sus ventas sin factura), RFC XAXX010101000, al cierre de mes. ¿Periodicidad mensual, clave y uso S01? | RMF 2.7.1.21 (global). | |
| **g** | **Precio de transferencia NUMAN→DRUIDAS** (partes relacionadas): proponemos cobrarle a DRUIDAS **la misma escala pública** que paga Nomádika (20/18/16/14/14 por tramos, tope 20 %, mínimo $250), con el mismo convenio. ¿Basta como soporte de precio de mercado? ¿DRUIDAS queda eximida del estudio del 76 fracc. IX por el umbral de ingresos? | LISR 179 (partes relacionadas), 76 fracc. IX y XII; Marisol dijo el 2 sep que las cuotas entre empresas deben ser variables y ligadas a indicadores: la comisión por venta lo es. | |

### h · Agregada el 9 nov 2026 (tarde): retener desde la primera venta por Connect

**Cómo está hoy (corregido por Luis el 9 nov):** ninguna operadora cobra
todavía por cuenta conectada. NUMAN cobra todo con su cuenta y a Nomádika le
deposita desde la cuenta de NUMAN, contra la factura de servicios que Nomádika
le emite. No hay ventas por plataforma sin retener que regularizar.
**Verificado en Stripe LIVE el 9 nov 2026** (llave de solo lectura de La Caja):
96 cargos en la cuenta de NUMAN, 0 con `transfer_data`/`on_behalf_of`, 0
transferencias a cuentas conectadas, 0 `application_fees`. El correo a Marisol
lleva la pregunta h con este dato (borrador actualizado esa noche).

**Cómo va a ser (Luis):** primero tiene que funcionar el cobro por cuenta
conectada, con los datos fiscales de la operadora bien. NUMAN le factura su
comisión con Facturapi, y la operadora le factura a sus clientes en una global
a público en general. El sistema **todavía no retiene ISR ni IVA**: hoy sólo
separa la comisión más su IVA. La retención se construye antes de que la
primera operadora cobre por esa vía.

| # | Pregunta | **Respuesta de Marisol · fecha** |
|---|---|---|
| **h1** | ¿Qué necesitamos de la operadora para retenerle la tasa con RFC (2.5 % / 50 %) y no la de sin RFC (20 % / 100 %)? ¿Basta su Constancia de Situación Fiscal validada contra el SAT, o hace falta algo más? | |
| **h2** | ¿La retención tiene que funcionar desde la **primera** venta por cuenta conectada, o hay forma válida de arrancar y retener después? (Nuestra intención: no arrancar sin ella.) | |
| **h3** | En el cobro por cuenta conectada, el cargo se hace **a nombre de la operadora** (`on_behalf_of`: ella es el comercio que ve el cliente), pero el dinero pasa por la cuenta de NUMAN y ahí se separa la comisión. ¿Eso basta para que NUMAN sea «plataforma tecnológica» obligada a retener (113-A, 18-J)? ¿Cambia algo frente a cobrar por cuenta de la operadora? | |
| **h4** | Hoy NUMAN le compra el servicio a Nomádika (persona física) contra factura de servicios. ¿Ese esquema le obliga a NUMAN alguna retención mientras no pasemos a la plataforma? | |

### i · Agregada el 11 nov 2026: la cuota de admisión de $20 y el modelo B en Stripe

**Qué pasó (hecho):** el 11 nov Luis eligió en Stripe el perfil de plataforma B
(«Buyers will purchase from you», el de Airbnb: el dinero pasa por NUMAN y se
transfiere a la operadora en el mismo cargo) y aceptó que NUMAN responde ante
Stripe por reembolsos, contracargos, multas, fraude y saldos negativos de las
cuentas conectadas, más **MX$20.00 por cuenta conectada** (Radar Standard).
Nomádika ya tiene cuenta conectada en LIVE, restringida (aún no cobra). Con
esto **h3 deja de ser hipotética**: la retención tiene que estar resuelta antes
de la primera venta de Nomádika por esa vía.

**Lo que decidió Luis:** los $20 los paga la operadora **una sola vez**,
descontados de su primer pago (el código revierte $20.00 exactos de la primera
transferencia; `admision.ts`, migración 0078). Está redactado en el convenio v3,
Cuarta §3 bis.

| # | Pregunta | **Lo que propone la sesión legal (fundamento)** | **Respuesta de Marisol · fecha** |
|---|---|---|---|
| **i1a** | ¿La cuota de admisión es **servicio de NUMAN gravado al 16 %** o **reembolso de un gasto** sin IVA? | Servicio gravado: Stripe le factura el cargo a NUMAN, no a nombre de la operadora, así que no cabe en la regla de erogaciones por cuenta de terceros (RMF 2.7.1.12 / 2.7.1.13 según el año, exige el CFDI a nombre del tercero); y LIVA 14 y 18 incluyen en el valor del servicio «reembolsos» y «cualquier otro concepto» que se cobre a quien lo recibe. | |
| **i1b** | Si lleva IVA: ¿los **$20 lo incluyen** ($17.24 + $2.76, que es lo que el sistema descuenta) o es **$20 + IVA** ($23.20)? | $20 con IVA incluido, porque Luis fijó los $20 como lo descontado y el código lo revierte así; la cláusula dice «comprende el IVA que en su caso cause». Si Marisol dice «sin IVA», se quita la frase. | |
| **i1c** | ¿Va como **renglón aparte** en el CFDI de la comisión de esa primera venta, o como **CFDI propio**? ¿Clave de producto **80141628** (la de la comisión) u otra? | Renglón aparte en el mismo CFDI de comisión (un solo comprobante, dos conceptos, PUE), con la misma clave 80141628 y descripción «Cuota de admisión a la plataforma, única». Lo importante es que **no se sume a la comisión**: el tope del 20 % y la comisión congelada se calculan sin ella. | |
| **i1d** | El descuento se hace **por compensación** contra la transferencia de la primera venta. ¿Algún requisito fiscal para que el CFDI diga «pagado» si nunca hubo transferencia aparte? | Forma de pago **17 «Compensación»** del catálogo c_FormaPago; igual que la comisión (que ya se salda por compensación, Décima tercera §4). | |

**Sobre h3 con el perfil B:** el cargo es a nombre de la operadora
(`on_behalf_of`), el dinero entra a la cuenta de NUMAN en Stripe y de ahí se
transfiere; NUMAN **sí** responde ante Stripe por el dinero (reembolsos, saldos
negativos). Es el caso más parecido a Airbnb. Si la respuesta a h3 es «sí
retiene», la variante B del convenio (Cuarta §8) se publica **antes** de la
primera venta de Nomádika.

### Dos cosas más que caen de las respuestas

- **Alta de NUMAN como retenedora**: qué aviso presenta NUMAN (actualización de
  obligaciones: retenciones de ISR e IVA por plataformas tecnológicas; 18-J
  fracc. II d) y 113-C). Detalle en `NUMAN-PLATAFORMA-RETENEDORA.md`.
- **Actividad económica de NUMAN**: ¿conviene agregar «intermediación /
  comisión mercantil» a la CSF para que el CFDI con 80141628 sea congruente?
  Turismo **ya no** se agrega: lo tendrá DRUIDAS.

---

## La exportación del SAT (tarea 3) — va en el mismo correo

Para cuadrar los 82 cobros de la plataforma ($894,275 al 9 nov) con lo que ya
se declaró, necesitamos la **lista de CFDI emitidos por NUMAN HUB en 2026**
(portal del SAT → Factura electrónica → Consultar facturas emitidas → exportar
a CSV/Excel), con: UUID, fecha de emisión, RFC y nombre del receptor, total,
estado (vigente/cancelado), y si fue global. Y los **XML** si los tiene. Se
guarda en `Drive/CONTABILIDAD/NUMAN-HUB_NHU250826CS8/2026/cfdi-emitidos-sat/`
(carpeta creada el 9 nov con un LEEME). La sesión de código cruza por monto y
fecha; lo que no cruce se decide uno por uno con ella.

---

## Respuestas (se llena al recibirlas)

| Fecha | Quién | Qué contestó | Qué cambia |
|---|---|---|---|
| | | | |

**Fuentes:** LIF 2026 (DOF 07-11-2025) art. 25 fracc. VI y IX; LISR 113-A a
113-E y 206 (última reforma DOF 01-04-2024); LIVA 1-A BIS y 18-J (última reforma
DOF 12-11-2021) — todos leídos del PDF oficial de la Cámara de Diputados el 9
nov 2026. Guías consultadas (no oficiales): Contarito, Siempre al Día, El
Contribuyente (nov 2025), Camacho Limón. Guía de Airbnb México (84 pp.).
