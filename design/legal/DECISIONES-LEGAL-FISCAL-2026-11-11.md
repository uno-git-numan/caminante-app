# Decisiones legales y fiscales de Caminante — 11 de noviembre de 2026

**Para Luis, y de Luis a Marisol.** Luis decidió el 11 nov que no hay abogado
externo: la sesión legal y fiscal decide con su criterio, se construye así, y
Marisol revisa después. Este documento es ese paquete. Se lee sin abrir el repo.
Cada decisión trae **qué se decidió, por qué, el fundamento con artículo y la
alternativa descartada**. Marisol puede contestar «sí, está bien pensado» o
marcar la línea que cambiaría; donde yo mismo dudo, lo digo en «Lo que Marisol
confirma» (§10) en vez de disfrazarlo de certeza.

**Todo artículo citado se leyó del texto oficial** (PDF de la Cámara de
Diputados: LISR última reforma DOF 01-04-2024, LIVA DOF 12-11-2021, LFPC DOF
12-12-2025, LFPDPPP DOF 14-11-2025, LIF 2026 DOF 07-11-2025) o de una copia
íntegra cuando el oficial no era legible (CCF 1843, 2110, 2546; LRITF 22;
LFPIORPI 17, última reforma DOF 16-07-2025). **Ningún número está inventado**:
donde no hay dato, se dice y se dice de dónde saldría.

---

## 0 · Resumen en una página

| # | Decisión | Qué cambia en la plataforma |
|---|---|---|
| D1 | **NUMAN retiene ISR e IVA a las operadoras desde la primera venta cobrada por cuenta conectada** (modelo B de Stripe, el de Airbnb; **confirmado por Luis el 11 nov en la noche**) | Módulo de retención **antes** de la primera venta de Nomádika; mientras no exista, el sistema no vende por cuenta conectada |
| D2 | Tasas 2026: **ISR 2.5 %** sobre lo cobrado sin IVA; **IVA 50 %** del IVA cobrado; sin RFC válido **20 % / 100 %**. Personas físicas y morales igual | Tasas en configuración por ejercicio y tipo de persona |
| D3 | Base = **todo lo que el cliente paga, sin IVA**, incluidos complementos; la comisión de NUMAN **no** reduce la base | El cálculo parte del total cobrado, no del neto de la operadora |
| D4 | Calendario: entero **día 17**; CFDI de retenciones **día 5**; informativa de operadoras **día 10** (nombre, RFC, **CURP**, domicilio fiscal, **banco y CLABE**, monto) | La plataforma **sí guarda la CLABE y la CURP** de la operadora (cambia lo dicho el 9–11 nov); salen de la CSF y de la ficha fiscal |
| D5 | CSF validada contra el SAT = RFC proporcionado = tasa con RFC | Ya está; sin CSF válida, tasa sin RFC |
| D6 | Pagos actuales a Nomádika contra factura: **sin retención de ISR del 10 %** (no es servicio profesional); **1.25 % sólo si es RESICO**; IVA sin retención | Depende de su CSF (pendiente de pedirla) |
| D7 | **Cuota de admisión**: servicio gravado, **$20 con IVA incluido** ($17.24 + $2.76), **renglón aparte en el CFDI de la comisión** de esa venta, clave 80141628, forma de pago 17 (compensación) | Desglose del CFDI de la admisión |
| D8 | Claves y CFDI: experiencia **90121501**; comisión **80141628**; uso **G03** (S01 si no deduce); **PUE**; forma de pago en el CFDI de la operadora al cliente = **la real del cliente** (04/28/03/01), no 31 | Sin cambio salvo la clave (hoy 90121500 → 90121501) |
| D9 | Devoluciones: parcial → CFDI de egreso relacionado; total mismo mes → cancelar motivo 03; total mes cerrado → egreso; comisión devuelta → egreso proporcional de NUMAN | Ya está en el diseño de facturación |
| D10 | Global mensual «público en general» **por emisor**, RFC XAXX010101000 | Ya está |
| D11 | **Alta de NUMAN como retenedora** antes de la primera retención (la presenta Marisol con la e.firma de Luis); RESICO es problema del régimen de la operadora, no de la retención | Aviso en pantalla a personas físicas en RESICO |
| D12 | Cancelación del cliente: **piso legal de 5 días hábiles** de revocación cuando la salida está a más de 10 días hábiles (LFPC 56) **además** de las 24 h de Luis; cuando cancela la operadora por causa imputable, el cliente recibe **100 % + bonificación del 20 %** (LFPC 92 Bis y 92 Ter), a cargo de la operadora | Lógica de cancelación y texto en /reservar; la bonificación se descuenta a la operadora |
| D13 | **Caminante devuelve al cliente de inmediato y recupera de la operadora** (es garante frente al cliente) | Ya es así en reembolsos (Stripe es la verdad); Quinta §9 lo respalda |
| D14 | **Fuerza mayor** definida (clima, cierre por autoridad, contingencia o bloqueo, emergencia del guía) y la penalización es pena convencional dentro del CCF 1843 | Motivos de fuerza mayor en el registro de cancelación |
| D15 | Liberar el dinero antes o después de la experiencia: era de negocio y **Luis lo decidió el 12 nov: ANTES**, «El dinero se libera antes. Casi cuando le caiga el pago del cliente.» | Nada: es lo que el código hace (transferencia neta en el acto del cobro; Stripe deposita según el calendario de la cuenta) |
| D16 | Datos a Stripe = **transferencia** (no encargo); consentimiento **expreso** en el convenio; el aviso de privacidad se actualiza con texto listo | Publicar el aviso nuevo antes de prender el alta dentro de la plataforma |
| D17 | Anthropic (lectura de CSF) = **persona encargada**; la CLABE y la CURP se conservan como datos fiscales | Mención en el aviso; nada más |
| D18 | NUMAN **no** realiza actividad vulnerable (LFPIORPI 17) **ni** emite fondos de pago electrónico (LRITF 22) | Nada |
| D19 | Devolución **después** de facturar al cliente: **CFDI de egreso** relacionado (tipo 01) en todos los casos, el mismo día en que Stripe confirma la devolución; **cancelar** (motivo 03) sólo si es total y aún no requiere aceptación del receptor. Antes de cualquier CFDI: el recibo se cancela o se reexpide por lo neto | Afina D9; el reembolso dispara el egreso o la baja del recibo (M19) |
| D20 | NUMAN **sí** puede facturar por cuenta de la operadora con su CSD: ya hay mandato (Décima tercera §1 a). Faltan tres candados: la operadora firma **ella** la carta manifiesto con su e.firma, sube **ella** su CSD y responde de él (CFF 17-J); NUMAN lo usa sólo para esas facturas y lo da de baja al terminar | Convenio **v3.3 (menor)** + texto de consentimiento al activar la facturación en el panel + párrafo en el aviso de privacidad |
| §5 | Convenio v3.2 cerrado: representante por nombre, tope de responsabilidad, sede CDMX, mandato de timbrado, **variante B de retención** | **Publicado el 11 nov 2026** (hash `e11f82e9…8224`, verificado contra la base); la retención ya está en producción, así que la primera venta por cuenta conectada retiene |

---

## 1 · Retención de ISR e IVA a las operadoras

### D1 · NUMAN retiene, y desde la primera venta por cuenta conectada

**Qué.** Cuando una venta se cobra con la cuenta conectada de la operadora
(cargo con destino: el dinero entra a la cuenta de NUMAN en Stripe y se
transfiere a la operadora en el mismo acto), NUMAN retiene ISR e IVA a la
operadora y los entera al SAT. Desde la primera venta; no hay «arrancar y
retener después».

**Por qué.** La LISR dice que el ISR de las personas físicas que presten
servicios «a través de Internet, mediante plataformas tecnológicas» **se paga
mediante retención que efectúan las personas morales residentes en México que
proporcionen el uso de las plataformas** (art. 113-A, párrafos 1 y 2), «sobre
el total de los ingresos que efectivamente perciban las personas físicas por
conducto de los citados medios» (párrafo 3). La LIVA obliga a los residentes
en México que operen como intermediarios a cumplir el 18-J (art. 1-A BIS), y el
18-J fracción II dice: «cuando cobren el precio y el IVA… **por cuenta** del
prestador del servicio, deberán retener… el 50 %». En el modelo B NUMAN cobra
el precio y el IVA por cuenta de la operadora: el cargo nace en la cuenta de
NUMAN y NUMAN decide cuánto se transfiere. Es exactamente el supuesto. La
obligación nace **operación por operación** al cobrar (LIVA 1-B: contraprestación
efectivamente cobrada); una venta cobrada sin retener es una retención omitida,
no un periodo de gracia. Por eso no existe la opción de «arrancar y retener
después» (pregunta h2).

**Confirmado por Luis el 11 nov (noche).** Preguntó si la operadora podía
recibir el dinero y «retener» ella misma, cómo lo hace Airbnb y si NUMAN iba a
declarar por la operadora. Se le compararon tres caminos en
`RETENCION-TRES-CAMINOS-2026-11-11.md`: **A**, cargo directo en la cuenta de la
operadora (NUMAN no retiene; sólo la informativa del día 10; la ley lo prevé en
LIVA 18-M y LISR 113-A párrafo 4; la operadora paga el procesador y una
operadora sin cuenta conectada no vende); **B**, cargo con destino, el de
Airbnb (NUMAN cobra por cuenta de la operadora y retiene); **C**, NUMAN vende a
nombre propio (IVA e ISR sobre dinero ajeno, toda la responsabilidad LFPC,
rompe el modelo). Luis: «Hay que hacerlo como hace airbnb entonces. Construye.»
**Decidido: B.** A queda documentado como alternativa válida por si algún día
el costo de retener pesa más que el control del dinero; C no se recomienda.
NUMAN nunca declara por la operadora: entera lo que retuvo y ella declara lo
suyo.

**Lo que NO retiene NUMAN.** Las ventas de las experiencias propias (operadora
`numan-caminante`, 100 % casa) no son ingresos de un tercero: no hay retención.
DRUIDAS, cuando exista, será un tercero (persona moral): retención igual que a
cualquiera (D2).

### D2 · Tasas del ejercicio 2026

**Qué.** ISR **2.5 %** sobre lo cobrado sin IVA. IVA **50 %** del IVA cobrado.
Sin RFC válido en el expediente: ISR **20 %**, IVA **100 %**. Las mismas tasas
para persona física y persona moral.

**Fundamento.** LISR 113-A fracción III fija 1 % para prestación de servicios;
la **LIF 2026 art. 25 fracción VI** (DOF 07-11-2025, verificada el 9 nov) la
sustituye por **2.5 %** para 2026 y extiende la retención a las personas
morales; la fracción IX extiende el IVA del 50 % a las morales. LISR 113-C
fracción IV, segundo párrafo: sin RFC, 20 %. LIVA 18-J fracción II inciso a):
50 %, y 100 % sin RFC. Las tasas viven en configuración por ejercicio: la LIF
2027 puede cambiarlas.

**Por qué no 4 % (hospedaje).** El 113-A fracción II da 4 % a «servicios de
hospedaje». Lo que Caminante vende es la experiencia completa (guía, logística,
y a veces hospedaje dentro del paquete), un solo servicio con clave 90121501;
no se vende hospedaje por separado. Si una operadora vendiera **sólo** hospedaje
por la plataforma, aplicaría el 4 %: hoy no existe ese caso y el sistema no lo
necesita. *Marisol confirma (§10).*

**Alternativa descartada.** Tasas quemadas en código. Son de la LIF, cambian
cada año.

### D3 · Base de la retención

**Qué.** La base del ISR es **todo lo que el cliente pagó, sin IVA**: precio de
la experiencia más complementos (tren, extras), menos descuentos aplicados,
menos devoluciones. La comisión de NUMAN **no se resta**: es un costo de la
operadora, no una reducción de su ingreso. La base del IVA es el IVA cobrado al
cliente sobre esa misma cantidad.

**Fundamento.** LISR 113-A párrafo 1: «incluidos aquellos pagos que reciban por
cualquier concepto adicional a través de los mismos»; párrafo 3: «sobre el
total de los ingresos que efectivamente perciban… sin incluir el IVA». LIVA
18-J II a): «el 50 % del IVA cobrado».

**Ejemplo con la escala A.** Precio al cliente $1,750.00 = base $1,508.62 + IVA
$241.38. Comisión de NUMAN 20 % sobre la base = $301.72 + IVA $48.28 = $350.00.
ISR retenido 2.5 % × $1,508.62 = **$37.72**. IVA retenido 50 % × $241.38 =
**$120.69**. La operadora recibe $1,750.00 − $350.00 − $37.72 − $120.69 =
**$1,241.59**. (Es el ejemplo del mapa de facturación §0.2.) **Precisión del 12
nov (M15):** la retención por venta se **trunca** a centavos, no se redondea,
porque el SAT valida el CFDI de retenciones con el truncado: ISR **$37.71**, IVA
$120.69, la operadora recibe **$1,241.60**; los centavos que falten frente al
CFDI del mes los pone NUMAN al enterar.

**Alternativa descartada.** Retener sobre el neto que recibe la operadora
($1,400). La ley dice «total de los ingresos que efectivamente perciban por
conducto» de la plataforma, y la operadora factura al cliente los $1,750.

### D4 · Calendario y obligaciones de NUMAN como retenedora

| Obligación | Plazo | Fundamento |
|---|---|---|
| Enterar ISR retenido | Día 17 del mes siguiente | LISR 113-C fracc. IV |
| Enterar IVA retenido | Día 17 del mes siguiente | LIVA 18-J fracc. II b) |
| CFDI de retenciones e información de pagos a cada operadora (complemento «Servicios Plataformas Tecnológicas») | Dentro de los 5 días siguientes al mes | LISR 113-C fracc. II; LIVA 18-J fracc. II c) |
| Informativa mensual de operadoras: nombre o razón social, RFC, **CURP**, domicilio fiscal, **institución financiera y CLABE** donde reciben los depósitos, monto de operaciones; dirección del inmueble si hay hospedaje | Día 10 del mes siguiente | LIVA 18-J fracc. III (aun cuando no se haya cobrado) |
| Inscribirse en el RFC como retenedora | Antes de la primera retención | LIVA 18-J fracc. II d) |
| Publicar los precios con la leyenda «IVA incluido» | Siempre | LIVA 18-J fracc. I, segundo párrafo |
| Conservar la documentación de retención y entero | Contabilidad | LISR 113-C fracc. V |

**Consecuencia que cambia lo dicho antes.** El 9 y el 11 nov escribí que
Caminante **no conserva** la CLABE de la operadora (va directo a Stripe como
token). **La informativa del 18-J III e) exige reportar banco y CLABE**, y Stripe
no devuelve la CLABE completa de una cuenta conectada. Decisión: **la plataforma
sí guarda la CLABE** (y la CURP) de cada operadora **como dato fiscal** para esa
informativa, separada del token que viaja a Stripe. Ambas salen de donde ya
están: la CURP viene en la Constancia de Situación Fiscal de una persona física;
la CLABE se pide una vez en la ficha fiscal. El convenio (Octava §3, Anexo F) y
el aviso de privacidad lo dicen así desde esta versión.

### D5 · Qué basta para aplicar la tasa con RFC (h1)

**Qué.** La Constancia de Situación Fiscal validada contra el validador público
del SAT (idCIF + RFC) es «proporcionar la clave en el RFC». Con ella, 2.5 % /
50 %. Sin ella, 20 % / 100 % (LISR 113-C IV párrafo 2; LIVA 18-J II a). Nada más
hace falta.

### D6 · Lo que NUMAN le paga hoy a Nomádika contra factura (h4)

**Qué.** Mientras Nomádika no cobre por cuenta conectada, NUMAN le paga el
servicio contra su factura. Si su régimen es **actividad empresarial (612)**:
**ninguna retención** de ISR ni de IVA. Si es **RESICO (626)**: NUMAN retiene
**1.25 % de ISR** sobre el pago sin IVA y lo entera el día 17 (LISR 113-J), y
le entrega el CFDI de retención. IVA: sin retención en ambos casos.

**Por qué.** La retención del 10 % de ISR es sólo por **servicios
profesionales** (LISR 106, último párrafo: «cuando los contribuyentes presten
servicios profesionales a las personas morales»); operar una excursión es
actividad empresarial, no honorarios. La retención de IVA de las personas
morales (LIVA 1-A fracción II) es por servicios personales independientes y
otros supuestos tasados; la operación turística no está. *Marisol confirma el
1-A (§10).* La del 1.25 % es específica de RESICO (113-J).

**Pendiente de dato.** El régimen de Nomádika sale de su CSF, que aún no se le
ha pedido (mensaje a Cat/Laura, hoja de decisiones de Luis fila 9).

### D7 · Cuota de admisión de $20 (i1)

**Qué.** Es **contraprestación de NUMAN** gravada al **16 %**. Los $20 que se
descuentan **incluyen el IVA**: $17.24 + $2.76. Se factura como **renglón aparte
en el CFDI de ingreso de la comisión** de esa primera venta (un comprobante,
dos conceptos), clave **80141628** con descripción «Cuota de admisión a la
plataforma, única», unidad E48, objeto de impuesto 02, **forma de pago 17
(compensación)**, PUE. No se suma a la comisión en ningún cálculo.

**Por qué.** Stripe le cobra los MX$20 a **NUMAN** por cada cuenta conectada
(Radar Standard); el CFDI de Stripe es a nombre de NUMAN, no de la operadora,
así que no cabe en la regla de erogaciones por cuenta de terceros (RMF, regla
2.7.1.12 / 2.7.1.13 según el año: exige el comprobante a nombre del tercero).
Cobrárselo a la operadora es un cargo más del servicio de plataforma, y la LIVA
18 incluye en el valor del servicio «las cantidades que además se carguen o
cobren a quien reciba el servicio por… reembolsos… o cualquier otro concepto».
IVA incluido porque Luis fijó los $20 como lo descontado y el código revierte
$20.00 exactos. Compensación: CCF 2185 (dos personas deudoras y acreedoras
recíprocamente); forma de pago 17 del catálogo c_FormaPago.

**Alternativas descartadas.** (a) Sin IVA como «reembolso de gasto»: no cumple
la regla de terceros. (b) $20 + IVA = $23.20: cambia el monto que Luis decidió
y el que el código descuenta. (c) CFDI propio: un comprobante más por $20 para
conciliar; el renglón aparte se concilia solo porque la reversión en Stripe
lleva su propio id.

### D8 · Claves del Anexo 20 y forma de pago

| Concepto | Clave / valor | Por qué |
|---|---|---|
| Experiencia (CFDI de la operadora al cliente) | **90121501** «Servicios de organización de excursiones» | Es el servicio; hoy el código timbra 90121500 (la familia): se cambia |
| Guía sola / hospedaje desglosado / transporte | 90121701 / 90111501 / 78111800 | Sólo si se venden por separado; hoy no |
| Comisión de NUMAN a la operadora | **80141628** «Servicio de distribuidores por comisión» | Intermediación por comisión |
| Uso de CFDI | **G03** gastos en general; **S01** sin efectos fiscales para quien no deduce | Catálogo c_UsoCFDI |
| Método de pago | **PUE** | Se cobra antes de operar |
| Forma de pago en el CFDI de la operadora al cliente | **La real del cliente**: 04 tarjeta de crédito, 28 débito, 03 transferencia, 01 efectivo | El cargo es **a nombre de la operadora** (`on_behalf_of`: ella es el comercio en el estado de cuenta); NUMAN no es un intermediario de pagos autorizado |
| Unidad / objeto de impuesto | E48 / 02 | Servicio gravado |
| Complemento «Servicios Plataformas Tecnológicas» | En el **CFDI de retenciones de NUMAN**, no en el CFDI de la operadora al cliente | LISR 113-C II: el comprobante de retención «acompañado de la información que señale el SAT» |

**Alternativa descartada.** Forma de pago **31 «Intermediario pagos»** en el
CFDI de la operadora. Existe en el catálogo y Marisol puede preferirla; la
dejo como la línea de este documento con más probabilidad de cambiar (§10).

### D9 · Devoluciones (e)

Sin CFDI emitido → nada (pago no facturable, fuera de la global). Parcial →
**CFDI de egreso** relacionado (tipo relación 01). Total y mismo mes →
**cancelar** con motivo 03 «no se llevó a cabo la operación». Total con mes
cerrado → **egreso** por el total. Comisión devuelta → **egreso proporcional**
de NUMAN a la operadora. Retenciones de una venta devuelta → se corrigen en el
CFDI de retenciones del mes. Fundamento: CFF 29-A y reglas de cancelación de la
RMF (aceptación del receptor arriba de $1,000; plazo hasta la anual); el egreso
nunca depende del receptor.

### D10 · Factura global (f)

Mensual, **por emisor** (una de NUMAN por comisiones a quien no pida factura;
una por operadora por sus ventas sin factura), RFC XAXX010101000, uso S01, al
cierre de mes. Fundamento: RMF 2.7.1.21.

### D11 · Alta de NUMAN como retenedora y RESICO

NUMAN presenta el aviso de actualización de obligaciones en el RFC (retenciones
de ISR e IVA por plataformas tecnológicas) **antes** de la primera retención:
lo presenta **Marisol con la e.firma de Luis**. La LISR 113-E (RESICO) no
menciona plataformas en su texto; si la RMF excluye del RESICO a quien vende
por plataforma, es problema del régimen de la operadora, no de la retención de
NUMAN, que es la misma. La pantalla de alta le avisa a una persona física en
RESICO que consulte a su contador. *Marisol cita la regla (§10).*

---

## 2 · Cancelaciones y protección al consumidor

### D12 · Piso legal para el cliente (LFPC 56) y bonificación (92 Bis y 92 Ter)

**Qué.** Se conservan los números de Luis (30/15 y 60/30 → 100/50/0 %; 24 h de
arrepentimiento si la salida está a 7 días o más). Se agrega el **piso legal**:
si la salida está a **más de 10 días hábiles** de la compra, el cliente puede
revocar **dentro de los 5 días hábiles** siguientes con devolución del 100 %.
Cuando la operadora cancela por causa imputable a ella, el cliente recibe el
**100 % más una bonificación del 20 %** del precio pagado, y esa bonificación
**es a cargo de la operadora**, además de la penalización a Caminante. La
devolución se hace **por la misma forma de pago**.

**Fundamento.** LFPC 56: en ventas fuera del establecimiento el contrato se
perfecciona a los 5 días hábiles y en ese lapso el consumidor «tendrá el derecho
de revocar su consentimiento sin responsabilidad alguna… Tratándose de
servicios, lo anterior no será aplicable si la fecha de prestación del servicio
se encuentra a diez días hábiles o menos de la fecha de la orden de compra».
LFPC 92 Bis: bonificación «cuando la prestación de un servicio… no se preste…
por causas imputables al proveedor»; 92 Ter: «no podrá ser menor al veinte por
ciento del precio pagado». LFPC 92, párrafo añadido en 2019: la devolución «se
efectuará utilizando la misma forma de pago». LFPC 90 II y III: en un contrato
de adhesión no vale liberar al proveedor de responsabilidad ni trasladarla a un
tercero: por eso la bonificación no se puede pactar «a cargo del cliente» ni
omitirse en la política que el cliente acepta.

**Alternativa descartada.** Dejar sólo las 24 h. Frente al cliente una política
no puede ser menor que la ley; si PROFECO la revisa, la cláusula cae y el daño
es la reputación.

### D13 · Caminante devuelve al cliente y recupera de la operadora

**Qué.** Cuando proceda una devolución, Caminante la hace al cliente **de
inmediato** por la misma vía del cobro y la recupera de la operadora
(reversión de la transferencia → compensación → pago en 5 días hábiles).
Caminante es **garante** del reembolso frente al cliente; la operadora sigue
siendo la obligada final.

**Por qué.** Tres razones convergen: el cliente pagó en la página de Caminante
y ésta es su proveedor visible para la LFPC (7: respetar lo ofrecido; 10: no
cargos sin consentimiento); NUMAN aceptó ante Stripe responder por reembolsos y
contracargos (perfil B, 11 nov); y el sistema ya opera así (la verdad de un
reembolso es Stripe). Decir «intermediaria» en el convenio y actuar como
garante sería un texto que miente.

### D14 · Fuerza mayor y pena convencional

**Fuerza mayor** (exime la penalización y la bonificación): condiciones
meteorológicas que impidan operar con seguridad conforme al protocolo de la
actividad o a aviso de autoridad; cierre del área natural, del camino o del
puerto por la autoridad; contingencia sanitaria o bloqueo que impida llegar;
emergencia médica del guía responsable sin sustituto posible. La operadora la
acredita (reporte, aviso, parte médico) y Caminante la registra. **Pena
convencional**: la penalización de la Quinta §3 (10/20/30 %, mín. $500, tope
$15,000) es pena convencional; CCF 1843: «no puede exceder ni en valor ni en
cuantía a la obligación principal», y como el máximo es 30 % del valor de las
reservas, cumple.

### D15 · Liberar el dinero antes o después de la experiencia — es de negocio

**Decidido por Luis el 12 nov 2026: antes.** «El dinero se libera antes. Casi cuando le caiga el pago del cliente.» Coincide con la
recomendación legal y con el código (transferencia neta en el acto del cobro);
nada cambia en el convenio (Cuarta §5 y §6). Lo que sigue era el análisis:

**Qué.** No es una decisión legal: es de riesgo y de flujo de la operadora.
**Va a Luis.** Recomendación de la sesión legal: **antes, como hoy**, porque el
convenio ya tiene los dos candados que importan (Quinta §9: reversión,
compensación, pago en 5 días; Décima primera: suspensión), y porque en la cuenta
actual de Nomádika el saldo negativo es de Stripe, no de NUMAN. Si Luis elige
«después», cambian la Cuarta §5 y §6 y el calendario de pagos en Stripe.

---

## 3 · Datos personales

### D16 · Los datos que van a Stripe son una transferencia; el consentimiento es expreso

**Qué.** Comunicar a Stripe los datos de la operadora (identidad, nacimiento,
domicilio, teléfono, RFC, identificación, CLABE) es una **transferencia** (no un
encargo): Stripe los trata como responsable propio, bajo su propio contrato con
la operadora. El consentimiento se recaba **expreso** en el convenio (firma
electrónica), con mención específica a los datos financieros y patrimoniales.
El aviso de privacidad lleva la **cláusula de aceptación de la transferencia**
y el enlace y la frase que Stripe exige.

**Fundamento.** LFPDPPP 2025 art. 2 fracc. XII («persona encargada»: trata datos
**por cuenta del responsable») y XX («transferencia»: «toda comunicación de
datos personales… a persona distinta de la titular, del responsable o de la
persona encargada»). Art. 7, párrafo 5: «los datos financieros o patrimoniales
requerirán el consentimiento expreso… salvo las excepciones a que se refieren
los artículos 9 y 36»; art. 7, párrafo 2: el consentimiento es expreso cuando
se manifiesta «por medios electrónicos». Art. 36 fracc. IV y VII permitirían la
transferencia sin consentimiento (contrato en interés del titular; cumplimiento
de la relación jurídica), pero el expreso cuesta nada y cierra la duda. Art.
35: al transferir hay que comunicar el aviso y las finalidades al receptor, y
el aviso «contendrá una cláusula en la que se indique si la persona titular
acepta o no la transferencia».

**Alternativa descartada.** Tratar a Stripe como encargado y no pedir
consentimiento. No cuadra: la operadora firma el contrato de Stripe
directamente (Cuarta §7 a) y Stripe decide finalidades propias (verificación,
prevención de fraude).

### D17 · Anthropic (lectura de la CSF) es persona encargada; la CLABE y la CURP se conservan

**Qué.** La herramienta que lee la Constancia y la identificación (API de
Claude) trata los datos **por cuenta de Caminante y bajo sus instrucciones**:
es **persona encargada** (art. 2 XII); no requiere consentimiento, pero **sí
mención en el aviso** y la prohibición de que trate datos de salud de
participantes (regla 8 de la casa, que se mantiene). La validación contra el
SAT es consulta a un servicio público con los datos que el propio SAT emitió.
Por D4, la plataforma **conserva la CLABE y la CURP** de la operadora para la
informativa mensual: el aviso lo dice y da el fundamento (LIVA 18-J III).

**Texto listo para el aviso** en `design/legal/AVISO-PRIVACIDAD-ADICIONES-2026-11.md`.

---

## 4 · Lavado de dinero y Ley Fintech

### D18 · NUMAN no realiza actividad vulnerable ni es institución de fondos de pago electrónico

**Qué.** No hay obligación de aviso ante la UIF ni autorización de la CNBV.

**Por qué.** Revisé las 17 fracciones del art. 17 de la LFPIORPI (última reforma
DOF 16-07-2025): juegos y sorteos, tarjetas y monederos, cheques de viajero,
mutuo y crédito, inmuebles, metales y joyas, arte, vehículos, blindaje,
traslado de valores, servicios profesionales que manejen recursos del cliente
(fedatarios, abogados, contadores actuando en nombre del cliente), donativos,
comercio exterior, arrendamiento de inmuebles y activos virtuales. Una
plataforma que intermedia servicios turísticos y cobra a través de un
procesador de pagos regulado no está en ninguna. La LRITF art. 22 reserva a las
instituciones autorizadas por la CNBV «la emisión, administración, redención y
transmisión de fondos de pago electrónico» con el público: NUMAN no emite ni
administra fondos; el cliente paga con su tarjeta a través de Stripe, el saldo
vive en Stripe y Stripe deposita. NUMAN es un intermediario comisionista, figura
que la propia ley fiscal describe (LISR 113-A, LIVA 18-J).

**Dónde cambiaría.** Si NUMAN recibiera dinero de clientes **fuera** de Stripe
por cuenta de operadoras (transferencias SPEI a la cuenta bancaria de NUMAN por
ventas de terceros, la «vía b» del convenio) en volumen y plazos largos, la
figura se acercaría a la captación. Hoy la vía b existe para ventas propias y
para operadoras sin cuenta conectada, con liquidación a 7 días del regreso.
**Recomendación**: que la vía b para terceros sea transitoria y la cuenta
conectada la regla, que ya es la intención de Luis.

**Revisar a cada operadora** (lo que NUMAN aceptó ante Stripe): es una
obligación **contractual con Stripe**, no de la LFPIORPI. Se cumple con el
expediente (RNT, identificación, CSF validada, pólizas) y con no admitir giros
restringidos; el convenio ya lo dice (Cuarta §7 e).

---

### D19 · Devolución después de facturar al cliente (M19 de producto)

D9 ya decidía el documento; esto fija **cuándo** y **qué pasa con el recibo**.

- **Recibo sin CFDI** (nota de venta de Facturapi, no fiscal): una devolución
  total **cancela el recibo** en el mismo acto; una parcial lo cancela y lo
  reexpide por lo neto cobrado (cómo lo haga Facturapi lo define producto). Así
  la global nunca se detiene por un recibo devuelto, y el cliente que pida
  factura después recibe la del importe real.
- **Con CFDI ya emitido** (autofactura o global): **CFDI de egreso** relacionado
  al original con tipo de relación 01, por el importe devuelto con su IVA, la
  misma clave de producto, forma de pago la de la devolución (la misma vía del
  cobro, LFPC 92) y método PUE. Se emite **el mismo día en que Stripe confirma
  la devolución** (es el evento que ya dispara la reversión a la operadora), con
  fecha de ese día. Un egreso **no depende del receptor** y deja el ingreso
  original intacto en su mes: por eso es la regla general.
- **Cancelar** el CFDI original (motivo 03 «no se llevó a cabo la operación»)
  sólo cuando la devolución es **total** y la cancelación **no requiere
  aceptación** del receptor (comprobante de hasta $1,000 o dentro del plazo
  corto que la RMF da tras la emisión; **M19**, Marisol confirma el numeral y el
  plazo vigentes). Fuera de eso, egreso: una cancelación pendiente de aceptación
  en el Buzón de un cliente que no contesta se queda «en proceso» y el ingreso
  sigue vivo. Y nunca fuera del ejercicio (CFF 29-A, cuarto párrafo).
- **Global**: si la venta ya entró en una global, el egreso se relaciona con la
  global (receptor público en general). La global del mes **no** incluye lo
  devuelto antes de timbrarla (candado 4 de producto).
- La comisión devuelta sigue D9: egreso proporcional de NUMAN a la operadora;
  las retenciones, Quinta §4 del convenio.

### D20 · NUMAN factura por cuenta de la operadora con el CSD de ella (pregunta de Luis)

**Sí se puede, y el convenio v3.2 ya lo contempla en lo esencial**: la Décima
tercera §1 a) es un **mandato** (CCF 2546) limitado a generar, timbrar con su
CSD y conservar los comprobantes de sus ventas por la plataforma, ejecutado por
conducto de un proveedor autorizado de certificación; el Operador sigue siendo
el emisor y responde del contenido. Un CFDI timbrado con el CSD del
contribuyente **es del contribuyente** aunque lo genere un tercero: la ley sólo
exige que se expida por un PAC (CFF 29 II y IV) y presume que lo que lleva su
sello lo firmó su titular (CFF 17-D). Lo que falta son **tres candados**, y de
ahí sale una versión **v3.3 menor** del convenio (precisa un servicio opcional
ya pactado; quien ya firmó v3.2 no tiene que volver a firmar, y acepta estos
términos **al activar la facturación en su panel**, que es el acto que importa):

1. **La carta manifiesto la firma la operadora, con su e.firma, ella misma.** El
   PAC la exige de cada RFC que timbra; la e.firma es la firma de la persona y
   **nunca pasa por Caminante** (ni por chat ni por correo: la regla de los
   secretos vale también para ellas). Va en el convenio como obligación del
   Operador **para usar** la facturación desde el portal, no como obligación
   general: quien no la firma, factura por sus medios (inciso b).
2. **El CSD lo sube la operadora** (archivos .cer y .key y su contraseña) en su
   panel, directo al proveedor de certificación; Caminante **no lo recibe por
   otra vía** y no lo puede extraer. El CSD **no es la e.firma**: sólo sirve
   para sellar comprobantes (CFF 29 II), que es exactamente lo que el mandato
   cubre. La obligación de resguardar la clave privada es del titular (CFF
   17-J): el convenio lo dice y la operadora **responde de todo comprobante
   sellado con su CSD mientras no lo revoque**; puede revocarlo ante el SAT o
   darlo de baja en el panel en cualquier momento, y Caminante deja de emitir en
   ese instante.
3. **Uso limitado, baja y datos.** Caminante usa el CSD **sólo** para los
   comprobantes de ventas por la plataforma, sus egresos por devolución y su
   global; cancela comprobantes sólo por instrucción de la operadora o por las
   devoluciones de la Quinta; al terminar el convenio (o al desactivar la
   facturación) da de baja el CSD en el proveedor y conserva únicamente los
   XML emitidos por el plazo legal (CFF 30: 5 años) para entregárselos. El
   CSD y su contraseña son **información confidencial** (Décima cuarta) y, en
   persona física, datos personales: el aviso de privacidad nombra la
   finalidad («facturación desde el portal, por tu cuenta») y al proveedor de
   certificación como **persona encargada** (LFPDPPP 2025 art. 2 XII).

**Lo que no cambia:** el modelo Airbnb (la operadora factura al cliente;
NUMAN sólo su comisión). La organización de la operadora en Facturapi es una
herramienta de NUMAN para ejecutar el mandato, no un cambio de emisor. **Lo
que no hace falta:** poder notarial (el mandato puede ser privado, CCF 2551–2552,
y la aceptación electrónica del convenio vale, Décima sexta); ni aviso al SAT
(no existe la figura de «facturador por cuenta de terceros» con aviso; el PAC
es el único autorizado y ya está).

## 5 · El convenio, cerrado (v3.2 → v3.3)

**v3.3 (menor) publicada el 12 nov 2026 (03:38 UTC)**, orden 2, hash
`32d3701eff720e8e0e24972f2834e034fb997c3da18a4c958f7ed2ac8383e978`, aprobada por
Luis en la sesión legal y ejecutada por ella con el hash comparado; verificada
por PostgREST (texto de la base = firmable, 46,641 bytes). Añade, por D19 y
D20, la Décima tercera §1 bis (facturación desde el portal: carta manifiesto y
CSD por la propia operadora, uso limitado y baja), la Octava §4 (el CSD como
información confidencial; el PAC como encargado) y la Quinta §8 (egreso como
regla). La v3.2 sigue en la base como orden 1.

| Punto | Decisión | Fundamento / por qué |
|---|---|---|
| Preámbulo | NUMAN HUB representada por **Luis de la Rosa Orvañanos** con las facultades de la escritura 107,629; el carácter exacto (administrador único / apoderado) se toma del acta y se escribe en la carátula | La carátula la genera el sistema; un nombre en el texto evita la duda de «quién firma» |
| Cuarta §8 | **Variante B** (retiene) en el firmable | D1. El firmable dice la verdad desde la primera venta porque la venta por cuenta conectada se bloquea hasta que el sistema retenga |
| Quinta §2 | Piso legal de 5 días hábiles (salida a más de 10 días hábiles) | D12 |
| Quinta §3 | Fuerza mayor definida; bonificación del 20 % al cliente a cargo de la operadora | D12, D14 |
| Quinta §5 | Caminante devuelve y recupera | D13 |
| Octava §2 y §3 | Encargado (IA) y transferencia (Stripe); CLABE y CURP conservadas | D16, D17, D4 |
| Novena | Tope: la responsabilidad total de Caminante frente al Operador no excede las comisiones cobradas a ese Operador en los 12 meses anteriores; sin daños indirectos ni lucro cesante | CCF 2110: los daños deben ser consecuencia «inmediata y directa»; el tope es la práctica estándar de plataformas y proporcional al ingreso |
| Décima tercera §1 a) | La autorización para timbrar con el CSD de la operadora es **mandato** limitado a generar, timbrar y conservar CFDI por su cuenta; la operadora es la emisora | CCF 2546: el mandatario ejecuta por cuenta del mandante los actos que éste le encarga; el CSD es de ella y el PAC (Facturapi) timbra |
| Décima octava | Leyes federales; tribunales de la **Ciudad de México**; antes, 15 días hábiles de negociación directa por escrito | Domicilio de NUMAN; la mediación obligatoria descartada por costo y porque frena cobros pequeños |
| Décima segunda | El cambio de la cuota de admisión por cambio del procesador es modificación **menor** (se publica); un cambio de comisión o de plazos sigue siendo mayor | Ya lo decía; se precisa |

---

## 6 · Lo que construye la sesión de producto, en orden

1. **Candado**: ninguna venta por cuenta conectada mientras el módulo de
   retención no exista (y ninguna operadora puede firmar un convenio que no esté
   publicado: eso ya está).
2. **Módulo de retención** (D1–D5): tasas por ejercicio y tipo de persona; base
   = total cobrado sin IVA; cálculo al cobrar; **la transferencia a la operadora se hace neta** de
   comisión, IVA y retenciones en el acto del cobro (construido en 555129e;
   la admisión sí es movimiento aparte); CFDI de retenciones con complemento
   «Servicios Plataformas Tecnológicas» el día 5; acumulado mensual para el
   entero del 17; informativa del día 10 con CURP, domicilio fiscal, banco y
   CLABE; corrección en devoluciones.
3. **CURP y CLABE como datos fiscales** de la operadora (D4): CURP de la CSF;
   CLABE en la ficha fiscal; aviso de privacidad actualizado.
4. **Aviso de privacidad** (D16, D17): texto listo en
   `AVISO-PRIVACIDAD-ADICIONES-2026-11.md`. Desbloquea el alta dentro de la
   plataforma.
5. **CFDI de la admisión** (D7): renglón aparte, IVA incluido, forma de pago 17.
6. **Cancelaciones** (D12, D13): piso legal de 5 días hábiles; bonificación del
   20 % a cargo de la operadora cuando cancela por causa imputable; devolución
   por la misma vía (ya).
7. **Leyenda «IVA incluido»** en todo precio publicado (LIVA 18-J I).
8. Clave 90121501 en el CFDI de la experiencia (hoy 90121500).
9. **Devoluciones y recibos** (D19): el reembolso confirmado por Stripe cancela o
   reexpide el recibo, o emite el egreso relacionado el mismo día.
10. **Facturación por cuenta de la operadora** (D20): texto de consentimiento al
    activar («Activar facturación desde el portal»), con los tres candados; carga
    del CSD y firma de la carta manifiesto **por la propia operadora**; baja del
    CSD al desactivar o terminar. Se prende sólo con `FACTURACION_CLIENTES=1` y
    después de publicar v3.3.

Lo que **no** se construye: nada sobre liberar el dinero después (D15, Luis);
nada sobre RESICO salvo el aviso en pantalla.

---

**Dos candados antes de crear la llave Live (criterio legal, 12 nov):**

1. **Fecha de corte como candado en el código, no como acuerdo.** Un CFDI
   emitido por el sistema sobre una venta que Marisol ya facturó o ya metió en
   una global es un **ingreso duplicado ante el SAT**, y la cura es cancelarlo
   (motivo 01 o 02 con sustitución), que deja rastro y a veces pide la
   aceptación del receptor. Por eso el sistema **no emite nada** (recibo,
   autofactura ni global) sobre cobros anteriores a la fecha de corte que
   Marisol confirme (propuesta: 10 nov 2026), y las ventas posteriores que
   ella ya haya facturado se marcan como «facturada fuera del sistema» con el
   UUID de su CFDI. La global de noviembre sale **sólo** con lo que esté
   después del corte y sin marca. Fundamento: CFF 29 y 29-A (un comprobante por
   operación), regla de la factura global de la RMF (2.7.1.21 vigente, M18).
2. **Dos interruptores, no uno.** Las retenciones a las operadoras (LISR 113-C,
   LIVA 18-J) son una obligación de NUMAN **independiente** de cómo facture
   sus propias ventas, y la primera venta por cuenta conectada puede llegar
   antes de que Marisol conteste sobre lo demás. El CFDI de retenciones se
   prende **con la llave Live sola**; los recibos, la autofactura y la global
   de clientes llevan **su propio interruptor**, apagado hasta el visto bueno
   de Marisol (punto 1 del correo). Producto lo construye.

## 6 bis · El reporte mensual de retenciones: lo que el sistema le entrega a Marisol

Marisol pidió «el reporte de las retenciones del mes para presentar las
informativas». Está construido (12 nov 2026). El detalle completo, con la fuente
de cada formato del SAT, está en `REPORTE-MENSUAL-RETENCIONES-2026-11-12.md`;
esto es lo que ella necesita para operarlo.

**Dónde:** panel de Caminante → **Recursos (plataforma)** → **«Lo que se
declara»** → **«Retenciones del mes»** (abre el mes anterior; se puede elegir
otro). Tres descargas:

| Botón | Qué trae | Para qué |
|---|---|---|
| **«Descargar txt para el SAT (informativa)»** | Una línea por operadora, 8 columnas separadas por `\|`: `5` (tipo de servicio: enajenación de bienes y prestación de servicios con retención) · RFC · monto de las operaciones para ISR · monto para IVA · ISR retenido · IVA retenido · CLABE · `TA4` (prestación de servicios). Pesos enteros, UTF-8, sin encabezado: es el formato del instructivo de carga masiva del aplicativo del SAT | Se sube tal cual en «Agregar desde archivo» de la **declaración informativa por el uso de plataformas tecnológicas**, a más tardar el **día 10** (LISR 113-C III; LIVA 18-J III; RMF 12.2.7) |
| **«Resumen CSV para la contadora»** | Por operadora: nombre o razón social, RFC, CURP, domicilio fiscal, banco, CLABE, número de ventas, base sin IVA, IVA cobrado, ISR retenido, IVA retenido, comisión sin IVA, y qué dato falta si falta; una fila **TOTAL** con los dos montos del entero | El **entero del día 17** (ISR retenido e IVA retenido del mes) en la declaración mensual de NUMAN bajo las obligaciones de retenedora (LISR 113-C IV; LIVA 18-J II b); y la captura por RFC si el aplicativo la pide |
| **«Detalle venta por venta»** | Fecha de cobro, operadora, cobrado, devuelto antes del corte, base sin IVA, IVA, comisión y %, ISR retenido, IVA retenido, y si la venta se reporta | Soporte de contabilidad; es lo mismo que alimenta el CFDI de retenciones |

**Las tres obligaciones del mes y quién hace cada una:**

1. **Día 5 · CFDI de retenciones e información de pagos**, uno por operadora,
   clave 26 «Servicios mediante Plataformas Tecnológicas» con el complemento de
   plataformas: **lo emite el sistema** por Facturapi el **día 2** (tarea
   programada a las 10:00) o antes a mano desde «Retenciones del mes»; la
   operadora lo recibe por correo con XML y PDF. Construido el 12 nov; se
   prende cuando Facturapi tenga la llave de NUMAN.
2. **Día 10 · Informativa de operadoras**: **Marisol** sube el txt.
3. **Día 17 · Entero** de ISR e IVA retenidos: **Marisol**, con la fila TOTAL.

**Reglas que el sistema aplica, para que el reporte se lea bien:**

- **Corte al emitir.** Una devolución confirmada antes de emitir el CFDI del mes
  de la venta se neta en esa venta (si fue total, la venta no se reporta); una
  posterior **no toca el mes**: la retención enterada queda a favor de la
  operadora (su CFDI la ampara) y ella reintegra a Caminante ese importe
  (convenio, Quinta §4 y §9). Mientras el CFDI no exista, el corte es «ahora».
- **Sólo operadoras con ventas** en el mes; el formato del SAT no acepta ceros.
- **Truncado por venta** (M15): la retención se calcula por cada venta y se
  trunca a centavos; el CFDI del mes lleva el truncado del total, como exige el
  instructivo; los centavos que falten entre una cosa y otra **los pone NUMAN
  al enterar**. Ejemplo: $1,750 → ISR $37.71, IVA $120.69, la operadora recibe
  $1,241.60.
- **Lo que falta se lista, no se rellena**: si a una operadora le falta RFC o
  un monto redondea a cero, no entra al txt y la pantalla dice por qué.
- Todos los montos sin IVA, salvo «IVA cobrado»; redondeo al peso **sólo** en
  el txt.

**Lo que Marisol confirma de esta parte: M10–M15** (§10). Lo más probable que
cambie: en qué aplicativo entera NUMAN (M10) y si el «monto para IVA» del txt
va con IVA (M11).

## 7 · Lo que hace Luis

- Mandar este documento a Marisol (y el correo con las preguntas, que ahora son
  «confirma estas decisiones»).
- ~~Decidir D15 (liberar antes o después).~~ Decidido el 12 nov: antes.
- ~~Publicar el convenio v3.2~~ Hecho: publicado el 11 nov 2026 con el hash
  comparado; las operadoras ya pueden firmar.
- Pedir a Cat/Laura la CSF de Nomádika (D6).
- ~~Aprobar el convenio v3.3 (menor).~~ Aprobado y **publicado el 12 nov 2026
  (03:38 UTC)**, orden 2, hash `32d3701e…e978`, verificado contra la base. Queda
  el texto de consentimiento del panel (producto).
- Firmar con la e.firma el aviso de NUMAN como retenedora que presente Marisol.
- ~~Carta manifiesto de Facturapi y suscripción.~~ Hecho el 12 nov: Luis la
  firmó con la e.firma de NUMAN y pagó la suscripción. La llave Live está
  desbloqueada pero **no creada**: se crea cuando Marisol conteste (abajo).
- **Esperar la respuesta de Marisol** al correo del 12 nov («Visto bueno para
  prender la facturación de la plataforma», texto en
  `design/contabilidad/PREGUNTA-MARISOL-FACTURACION-2026-11-12.md`) antes de
  crear la llave Live. Sus respuestas cierran M7 (alta como retenedora), M17 y
  M18.

## 8 · Lo que hace Marisol

Presentar el aviso de NUMAN como retenedora (D11); confirmar o corregir §10;
conciliar lo retenido cada mes en La Caja.

## 9 · Lo que no se reabre

Modelo Airbnb (la operadora factura al cliente; NUMAN sólo su comisión); la
comisión de Stripe dentro de la comisión de NUMAN; escalas A/B, tope 20 %,
mínimo $250; perfil B en Stripe; $20 de admisión descontados exactos.

## 10 · Lo que Marisol confirma (la línea que cambiaría)

| # | Duda honesta | Dónde pega |
|---|---|---|
| M1 | Forma de pago en el CFDI de la operadora al cliente: la real del cliente (04/28/03) **o 31 «Intermediario pagos»** | D8 |
| M2 | Que la LIF 2026 art. 25 fracc. VI y IX aplican a las personas morales que venden por plataforma exactamente como lo leí el 9 nov (2.5 % / 50 %) | D2 |
| M3 | Que la experiencia completa con hospedaje incluido es «prestación de servicios» (2.5 %) y no «hospedaje» (4 %) | D2 |
| M4 | LIVA 1-A fracc. II: que un pago de NUMAN a Nomádika por operar una excursión no causa retención de IVA (no es servicio personal independiente) | D6 |
| M5 | La regla de la RMF que excluye (o no) del RESICO a quien vende por plataforma; y el número vigente de la regla de erogaciones por cuenta de terceros (2.7.1.12 o 2.7.1.13) | D11, D7 |
| M6 | Que el complemento «Servicios Plataformas Tecnológicas» va sólo en el CFDI de retenciones de NUMAN y no en el CFDI de la operadora al cliente | D8 |
| M7 | El aviso exacto de alta como retenedora y si conviene agregar «intermediación / comisión mercantil» a las actividades de NUMAN en la CSF | D11 |
| M8 | Clave 80141628 para la cuota de admisión (o la que ella prefiera) | D7 |
| M9 | CFDI de retenciones e información de pagos: clave de retención **26** «Servicios mediante Plataformas Tecnológicas», complemento «Servicios Plataformas Tecnológicas» y versión 2.0 del comprobante, timbrado por Facturapi (verificado por producto en su especificación el 11 nov; **confirmado el 11 nov con la primera emisión de prueba en sandbox**, UUID 89876b8d…35a8, cotejada nodo por nodo por la sesión legal: clave 26, versión 2.0, 001/002, TipoPagoRet 04/01, truncado, complemento 1.0 — ver el reporte mensual §2.2) | D4 |
| M10 | Aplicativo del entero para NUMAN (declaración mensual con las obligaciones de retenedora, o «retenciones por el uso de plataformas»); mes sin ventas: ¿informativa en ceros o sin registros?; DIOT: que las retenciones a operadoras no van ahí | §6 bis |
| M11 | «Monto de las operaciones para IVA» del txt: ¿base sin IVA (como sale hoy) o con IVA? | §6 bis |
| M12 | Devoluciones después del corte: ¿se queda la retención a favor de la operadora (decidido) o se cancela y sustituye el CFDI y se compensa en el siguiente entero? | §6 bis |
| M13 | En el complemento, la comisión va sin IVA y la cuota de admisión no se incluye | `REPORTE-MENSUAL-RETENCIONES` §2.2 |
| M14 | Forma de pago por venta en el complemento: la real del cliente (03/06/02), no 08 «Intermediario pagos» | ídem |
| M15 | Truncado por venta y centavos a cargo de NUMAN al enterar (decidido y en producción) | §6 bis |
| M16 | Claves del CFDI de retenciones confirmadas en los catálogos oficiales el 12 nov (TipoDeServ 06 con 2.5 % en 2026, Periodicidad 02 mensual, TipoPagoRet 04 ISR provisional por omisión y 01 IVA, tarjeta prepago como débito 06): sólo la prepago y el «04 por omisión» son criterio nuestro | `REPORTE-MENSUAL-RETENCIONES` §2.2 |
| M17 | **Actividad económica de turismo en la CSF de NUMAN** (27 ene 2026: producción audiovisual, software, procesamiento de información). La clave de producto 90121501 del CFDI no depende de la actividad registrada, pero el SAT cruza actividad contra lo facturado y puede observar. Criterio legal: presentar el **aviso de actualización de actividades económicas y obligaciones** (CFF 27, apartado B fracción II del RCFF 29) agregando organización de excursiones / agencia de viajes, mientras DRUIDAS se constituye. Marisol confirma si ya lo presentó o lo presenta | D8 |
| M18 | **El pasado: qué ventas ya facturó o metió en global** de las 75 (12 jun–9 nov, $879,775) y las 3 desde el 10 nov ($25,650). Con su lista (o los XML) el sistema las marca como facturadas fuera y el corte queda confirmado. Hasta entonces, el sistema no factura nada de clientes (§6, candado 1) | D8, D10 |
| M19 | **Cancelación sin aceptación del receptor**: numeral vigente de la RMF 2026 (en 2025, 2.7.1.35) y su plazo corto tras la emisión (un día hábil); y que prefiera el **egreso** como regla general frente a cancelar con sustitución (D19) | D19 |

Todo lo demás lo doy por decidido y así se construye. Si Marisol cambia una
línea, cambia esa línea y lo que dependa de ella; no se reabre el resto.

---

**Fuentes leídas del texto oficial el 9 y el 11 nov 2026:** LISR 106, 113-A,
113-B, 113-C, 113-D, 113-E, 113-J, 179, 206; LIVA 1-A BIS, 1-B, 18, 18-J; LIF
2026 art. 25 VI y IX; LFPC 7, 10, 56, 76 Bis, 90, 92, 92 Bis, 92 Ter, 93;
LFPDPPP 2025 arts. 2, 7, 8, 9, 10, 35, 36; LFPIORPI 17; LRITF 22; CCF 1843,
2110, 2185, 2546. Stripe: docs.stripe.com/connect/updating-service-agreements y
service-agreement-types (11 nov). Dónde vive todo: repo de Caminante
`design/legal/` y `design/operadores/`; Drive `numan/CAMINANTE/legal/2026-11
legal y fiscal/`; Notion «Caminante · Legal y fiscal (nov 2026)».
