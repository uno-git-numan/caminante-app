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

**D20 bis · Dónde vive el CSD (12 nov, pregunta de producto).** Hoy el `.cer` y
el `.key` se guardan en el bucket `csd` de la plataforma y el servidor los
reenvía a Facturapi; la contraseña no se guarda. Eso contradice lo que **ya
está publicado** en v3.3 (Octava §4: «Caminante no los almacena en sus propios
sistemas»; Décima tercera §1 bis: viajan «de su navegador al proveedor de
certificación»). Criterio: **nunca se almacenan, ni de paso.** Borrarlos al
confirmar no basta: mientras existan en el bucket son una copia de la clave
privada de la operadora bajo nuestra custodia, y es la clave que sella sus
facturas (CFF 17-J); un respaldo del bucket la conservaría aunque la borráramos.
Orden de preferencia: (1) del navegador **directo** a Facturapi, si su módulo
incrustable o su API lo permiten desde el cliente, como la carta manifiesto;
(2) si no, el servidor **reenvía en memoria** en la misma petición (archivos y
contraseña juntos, sin escribir a disco, bucket ni log) y sólo guarda la
confirmación de Facturapi (número de certificado, vigencia). `csd_cer_path` y
`csd_key_path` (0038) dejan de usarse: se migran a esa confirmación y los
archivos que haya hoy en el bucket se **borran** una vez que Facturapi confirme
que tiene el CSD de esa organización. **Resuelto (producto, 12 nov):** va la vía (2), porque la API de certificados de
Facturapi exige la llave secreta y no puede vivir en el navegador; se guardan
sólo número de certificado y vigencia. Producto revisó base y bucket: ninguna
operadora tiene `csd_cer_path` y el bucket `csd` está vacío, así que **no hay
copias que borrar**, tampoco de NUMAN.

**Carta manifiesto incrustada (módulo de Facturapi dentro del panel):** cumple
el candado 1 de D20 tal cual, porque la e.firma viaja del navegador de la
operadora a Facturapi; el panel sólo lee el estado por API. Dos condiciones: el
marco debe decir que es una página de Facturapi (quien firma tiene que saber a
quién le entrega su e.firma) y el aviso de privacidad ya lo cubre («ni recibe
tu e.firma»; Facturapi como encargado).

**Lo que no cambia:** el modelo Airbnb (la operadora factura al cliente;
NUMAN sólo su comisión). La organización de la operadora en Facturapi es una
herramienta de NUMAN para ejecutar el mandato, no un cambio de emisor. **Lo
que no hace falta:** poder notarial (el mandato puede ser privado, CCF 2551–2552,
y la aceptación electrónica del convenio vale, Décima sexta); ni aviso al SAT
(no existe la figura de «facturador por cuenta de terceros» con aviso; el PAC
es el único autorizado y ya está).

### D21 · Respuesta de Marisol (12 nov, leída el 17 nov): corte, pasado y la global sin recibos

Marisol contestó el correo del visto bueno (texto íntegro en la bitácora de
producto, 17 nov) y adjuntó 7 XML: globales de junio a septiembre y dos
facturas de junio. Criterio de la sesión legal sobre lo que dejó abierto:

1. **El visto bueno al punto 1 está dado** («el sistema debe configurarse para
   emitir toda la facturación individual y factura global»). Basta para prender
   `FACTURACION_CLIENTES` **cuando se cumplan cuatro cosas**: el corte movido
   (punto 2); la operación de noviembre que ella ya facturó marcada `externo`
   con su UUID (no vino el XML: se le pide); la emisión de prueba de la global
   nueva cotejada por legal; y la aprobación de Luis en la sesión que lo prenda.
2. **El corte se mueve al 1 de noviembre de 2026** (00:00 CDMX). Es su propio
   argumento: si un mes lo trabajan dos manos hay discrepancias. El sistema
   factura **meses completos**; noviembre es el primero. Cambiar la fecha es un
   commit de producto, con la aprobación de Luis.
3. **Octubre y lo anterior los cierra Marisol**, no el sistema. Tres razones:
   ella lleva la contabilidad y las declaraciones de esos meses; las cifras de
   la plataforma no cuadran con las suyas en junio, julio y agosto y **nadie
   sabe todavía cuál es la buena**; y el sistema no emite documentos fiscales
   sobre números sin conciliar (regla 5: nada de parches). La verdad del
   ingreso es **lo que entró al banco de NUMAN y a Stripe**, no lo que dice la
   plataforma: puede haber transferencias registradas que no cobró NUMAN. Con
   los estados de cuenta que pidió, ella emite la global extemporánea de
   octubre y, si procede, las complementarias de junio a agosto; el sistema le
   da el detalle pago por pago y luego marca esos pagos `externo` con el UUID.
   ⚠️ **El ingreso de octubre se declara en el pago provisional de octubre, que
   vence hoy 17 nov, tenga o no CFDI todavía**: Luis lo ve con Marisol hoy.
4. **Siguen sin respuesta M7** (aviso de NUMAN como retenedora) y la
   confirmación expresa del corte. Luis se lo vuelve a preguntar en el mismo
   hilo (§7). **M17 queda cerrada**: ella presenta la actualización de
   actividades.
5. **Concepto de la global: se queda 01010101 / ACT / «Venta» / cantidad 1 /
   folio como número de identificación**, un concepto por pago, no la clave de
   la experiencia. Es la forma de la guía de llenado del CFDI global del SAT
   (la leyó producto; hoy no pude releerla en la fuente, queda como **M20**
   porque las globales de Marisol usan un solo concepto con clave 90121502).
6. **Pago capturado después de timbrada la global de su mes**: sale en una
   **global complementaria del mismo mes** (nodo de información global con el
   mes del cobro, fechada el día en que se emite), automática en la siguiente
   corrida, con aviso a Marisol porque cambia un mes que quizá ya declaró
   (**M21**).
7. **Factura individual sólo hasta el fin del mes del cobro**: aceptado, si el
   plazo se le dice al cliente **al comprar y en el comprobante** (LFPC 7). La
   excepción se hace a mano: egreso contra la global y factura individual.
8. **El comprobante de la plataforma** sustituye al recibo: debe llevar RFC y
   régimen del emisor, lugar y fecha, descripción, total y el folio, que son
   los requisitos del comprobante de operaciones con el público en general
   (regla de la factura global de la RMF, citada de memoria: **M20**, igual que
   el plazo de 24 horas tras el cierre del periodo; el cron del día 1 a las
   7:00 cumple ese plazo y el de 72 horas que cita Marisol).
9. **D19 no cambia de fondo**: sin recibos de Facturapi, una devolución antes de
   la factura sólo reduce lo que entra a la global. El «recibo pendiente» de la
   Quinta §8 del convenio es el comprobante de la plataforma; **no hace falta
   versión nueva**. La cancelación con motivo 03 sigue manual hasta M19.

### D21 bis · Lo de D21, verificado en la fuente oficial (17 nov, noche)

Lo que en D21 iba citado de memoria ya está leído en el texto oficial. Fuentes:
**RMF 2026 compilada hasta su Tercera Modificación** (sitio de normatividad del
SAT, 859 pp.) y **«Guía de llenado del CFDI global, versión 4.0»** del SAT
(publicada el 31 dic 2021, revisión 1 del 8 mar 2023). Copias en Drive
`legal/2026-11 legal y fiscal/sat/`.

| Qué | Lo que dice la fuente | Efecto |
|---|---|---|
| Regla de la factura global | **RMF 2026, regla 2.7.1.21**: CFDI diario, semanal o mensual con el importe de **cada una** de las operaciones y el **número de folio** de sus comprobantes, a la clave genérica del RFC; se remite «a más tardar dentro de las **24 horas siguientes al cierre**» del periodo; se separa el IVA | Confirma la global mensual por pago. El cron diario a las 7:00 del día 1 cumple las 24 horas |
| El comprobante de la plataforma | Misma regla, segundo párrafo: requisitos del **CFF 29-A fracciones I y III** (RFC, nombre y régimen de quien expide; lugar y fecha), **valor total**, cantidad y **descripción del servicio** | Lo que producto ya puso en el correo (D21 punto 8). Confirmado |
| Concepto de la global | Guía, nodo Concepto: ClaveProdServ **«01010101»**, NoIdentificacion = **folio** del comprobante, Cantidad **«1»**, ClaveUnidad **«ACT»**, Descripcion **«Venta»**, ValorUnitario = **subtotal** del comprobante; Unidad no debe existir | Confirmado tal cual. No es la clave de la experiencia |
| Receptor de la global | RFC XAXX010101000, Nombre **«PUBLICO EN GENERAL»**, DomicilioFiscalReceptor = LugarExpedicion, régimen 616, uso S01 | Confirmado; cotejar el Nombre en la prueba |
| Nodo de información global | Periodicidad, Meses (01–12 si no es bimestral) y Año («igual al año en curso o al inmediato anterior» respecto de la fecha de emisión) | La complementaria con el mes del cobro y fecha del día **cabe** en la regla |
| **Forma de pago de la global** | «la clave de forma de pago con la que se liquidó **el comprobante… de mayor monto** de entre los contenidos en el CFDI global» | ⚠️ **Corrección para producto:** es la forma de pago del **pago individual más grande**, no la que suma más en el periodo |
| **Egreso contra la global** | Apéndice 2 de la guía: egreso tipo de relación **01**, a PUBLICO EN GENERAL, uso **G02**, con el **folio** del comprobante en NoIdentificacion; el ejemplo usa la clave **84111506** y la descripción de la devolución | ⚠️ **Para producto:** en el egreso contra una global, clave 84111506 y el folio, como el ejemplo; no 01010101 |
| **Factura individual después de la global** | Apéndice 2, fracción III: **egreso** por esa operación relacionado a la global y luego el **CFDI nominativo**. (La fracción II, cancelar y rehacer la global, también es válida) | La «excepción a mano» de D21 punto 7 tiene camino oficial: es exactamente ése |
| **Cancelar sin aceptación del receptor** (M19) | **RMF 2026, regla 2.7.1.35**: I. hasta **$1,000**; III. egresos; VI. retenciones; **VII. los expedidos al público en general (2.7.1.21)**; **IX. dentro del día hábil siguiente** a su expedición. Fuera de eso, 2.7.1.34: el receptor tiene 3 días y su silencio es aceptación | D19 queda firme: cancelar (motivo 03) sólo si la devolución es total y la factura es de hasta $1,000 o del día hábil anterior; lo demás, egreso. La global y los CFDI de retenciones se pueden cancelar sin aceptación |

Lo que **no** releí: el límite técnico de 72 horas entre la fecha de emisión y
el timbrado (lo citan Marisol y Facturapi; es validación del Anexo 20). No
cambia nada: la global se fecha el último día del mes y se timbra el día 1.

Con esto **M19 y M20 dejan de ser dudas de fuente**: Marisol sólo confirma que
está de acuerdo con el formato por pago (sus globales llevan un concepto único
con clave 90121502) y con el egreso como regla.

**Cotejo de la emisión de PRUEBA de la global (sandbox de Facturapi, 17 nov
2026; `design/legal/pruebas/global-sandbox-2026-11-17.md`, UUID de prueba
C838F0E8…A9FD, sin validez fiscal).** La sesión legal la comparó contra la guía
del CFDI global 4.0 y recalculó los montos. **Cuadra; la API que ya se paga
emite la global sin el producto de recibos.**

| Qué se verificó | En la prueba | Esperado (guía / regla) | Cuadra |
|---|---|---|---|
| Tipo, método y lugar | I · PUE · 11000 | Ingreso · PUE · C.P. de la CSF | ✔ |
| Receptor | XAXX010101000 · «PUBLICO EN GENERAL» · 616 · S01 · domicilio 11000 | Idéntico; domicilio = lugar de expedición | ✔ |
| Información global | Periodicidad 04 · Meses 11 · Año 2026 | Mensual; mes del cobro; año en curso | ✔ |
| Cada concepto | 01010101 · folio CAM-0000NN · 1 · ACT · «Venta» · ObjetoImp 02 | Idéntico | ✔ |
| Valor unitario | 9,913.793103 · 2,198.275862 · 6,896.551724 | Cobrado ÷ 1.16 ($11,500, $2,550, $8,000), a seis decimales | ✔ |
| IVA | 002 · Tasa · 0.160000; suma 3,041.38 | 16 % sobre cada subtotal | ✔ |
| Totales | SubTotal 19,008.62 · Total 22,050.00 | El total es **exactamente lo cobrado** | ✔ |
| Fecha atrasada | Pedida 48 h atrás y respetada | Permite fechar el último día del mes y timbrar el día 1 | ✔ |
| Forma de pago | 04 | La del pago mayor ($11,500). El ejemplo no distingue la regla vieja de la corregida | pendiente de la corrección |

Tres cosas que salen de la prueba:

- **Falta archivar el XML** de esta prueba en `design/legal/pruebas/`, como el
  de retenciones: el cotejo se hizo sobre la transcripción de producto, y el
  expediente debe guardar el documento. Con el XML reviso además el nodo del
  emisor y el resumen de impuestos. Es condición para prender.
- **Llave de idempotencia:** repetirla tras un timbrado exitoso da 409 y no
  duplica. Regla: ante un 409 **nunca** se genera una llave nueva para el mismo
  emisor, mes y modo; primero se busca la factura en Facturapi y se anota. Una
  global duplicada es ingreso duplicado.
- **El egreso de prueba** salió con la clave de la experiencia y uso S01, antes
  de D21 bis. Se repite con 84111506, el folio y G02 cuando se construya la
  corrección, y esa segunda prueba también se coteja.

**Estado al 17 nov (noche):** D21 en producción (af13e36), apagado. El correo a
Marisol con las cuatro preguntas de §7 y el listado pago por pago de junio a
octubre **ya salió** en el hilo. Para prender `FACTURACION_CLIENTES` faltan: el
XML de la operación de noviembre de Marisol, las dos correcciones de D21 bis
construidas y su prueba cotejada (con los XML archivados), y la aprobación de
Luis.

**Segunda ronda de pruebas, cotejada sobre los XML (17 nov, noche; commits
f905d79 y e4e1073; tres XML archivados en `design/legal/pruebas/`).** La
sesión legal leyó los tres XML nodo por nodo y sumó los conceptos. **Las dos
correcciones de D21 bis están construidas y probadas; no queda nada que
corregir en el formato.**

| XML | Lo que se verificó | Cuadra |
|---|---|---|
| Global de la primera ronda | Emisor NHU250826CS8 · «NUMAN HUB» · 601; resumen de impuestos base 19,008.62 e IVA 3,041.38; Σ conceptos = 22,050.00 | ✔ (cierra lo que faltaba del primer cotejo) |
| Global con formas de pago mezcladas | Tres tarjetas de $5,000 y una transferencia de $9,000: **FormaPago 03**, la del pago individual mayor, aunque tarjeta suma más ($15,000). Total 24,000.00 = lo cobrado; nodo global 04/11/2026 | ✔ corrección 1 |
| Egreso contra esa global | Tipo E · relación **01** con el UUID de la global · PUBLICO EN GENERAL 616 · uso **G02** · concepto **84111506** con el folio CAM-000086 · forma de pago 03 (la del cobro devuelto) · total 1,500.00 · sin nodo global | ✔ corrección 2 |

**«Unidad = Actividad» en cada concepto (pregunta de producto).** Facturapi lo
escribe a partir de la clave ACT y no deja quitarlo. La guía del CFDI global
dice que ese campo «no debe existir». **Se acepta así y no detiene nada:** en
el esquema oficial del CFDI 4.0 (`cfdv40.xsd`, leído hoy) `Unidad` es un
atributo **opcional**; el valor es la descripción de catálogo de la propia
clave ACT, así que no contradice nada; no toca importes, impuestos ni folios; y
el proveedor de certificación, que es quien valida contra la matriz del SAT,
lo timbra. Es una diferencia de forma frente a la guía, no un defecto del
comprobante. Queda anotado para Marisol (**M22**, informativo) y producto puede
preguntarle a Facturapi si existe forma de omitirlo, sin esperar la respuesta.

**409:** la llave va también como identificador externo y la búsqueda por él
devuelve esa factura; el código no genera llave nueva. Cumple la regla.

**Lo que no se puede probar hasta el 1 de diciembre:** la fecha «último día del
mes». **La primera global real se coteja antes de darla por buena**, igual que
el primer CFDI de retenciones.

**Para prender `FACTURACION_CLIENTES` ya sólo faltan dos cosas:** el XML de la
operación de noviembre que Marisol facturó (para marcarla `externo`) y que
Luis lo prenda.

### D22 · La factura de la comisión (B2) y quién factura una venta cobrada por la casa

Producto construyó el CFDI de la comisión de NUMAN a la operadora (apagado,
`FACTURACION_COMISIONES`) y preguntó tres cosas.

1. **Forma de pago 17 (compensación) en todo el comprobante de comisión y en su
   egreso.** Sí. El convenio dice que la comisión retenida «constituye el pago
   de ésta» y que la factura «se salda contra ella por compensación, sin
   transferencia adicional» (Cuarta §2; Décima tercera §4); es la compensación
   del CCF 2185, clave 17 del catálogo de formas de pago. La comisión que se
   devuelve tampoco viaja por una transferencia: se aplica a la devolución que
   Caminante le hace al cliente por cuenta de la operadora. *Marisol confirma*
   (**M23**; va con M1).
2. **Cuándo se prende.** Antes de la primera venta por cuenta conectada, junto
   con las retenciones: la factura sale por cada cobro (Décima tercera §2) y es
   ingreso propio de NUMAN (CFF 29). No depende del interruptor de facturación
   a clientes. Condiciones: llave en vivo de Facturapi creada; **prueba en
   sandbox del CFDI de comisión con el renglón de admisión y de su egreso,
   cotejada por legal sobre el XML**; Marisol avisada de que esas facturas las
   emite el sistema; y que Luis lo prenda. La primera venta por cuenta
   conectada sigue además detrás del aviso de NUMAN como retenedora (D11, M7).
3. **Quién factura al cliente una venta cobrada por la casa de una operadora
   externa.** Lo decide **el convenio, no el canal**:

| Caso | Quién le vende al cliente | Factura al cliente | Comisión y retenciones |
|---|---|---|---|
| Operadora externa **con convenio firmado**, cobro por la casa (Cuarta §1 b: «por cuenta y orden del Operador») | La operadora | **La operadora** (desde el portal si lo activó; si no, por sus medios, y la pantalla del cliente lo dice) | **Sí** las dos: factura de comisión de NUMAN y retención de ISR e IVA, igual que por cuenta conectada. La LIVA 18-J II obliga a retener «cuando cobren el precio… por cuenta» del prestador, y la Cuarta §8 no distingue vías |
| Operadora externa **sin convenio** (vende con dispensa; Nomádika hoy) | NUMAN, a nombre propio | **NUMAN** (factura individual o su global) | **Ninguna.** La operadora es proveedora y le factura a NUMAN su servicio (D6); lo que NUMAN gana es su margen |
| Experiencia de la casa | NUMAN | NUMAN | Ninguna |

   Consecuencias para el código: el emisor de la factura al cliente es la
   operadora **sólo si tiene convenio firmado**; sin convenio es la casa (hoy
   el código busca siempre a la operadora y esa venta se quedaría sin factura).
   Y el primer caso **no está construido** en lo fiscal: ni la retención ni la
   factura de comisión salen en ventas por la casa. Mientras no lo esté,
   **candado: una operadora externa con convenio firmado no vende por la casa**;
   vende cuando tenga su cuenta conectada. Cobrarle a su cliente sin retener
   sería una retención omitida (D1). Hoy no hay ninguna venta así.

### D23 · La política de cancelación frente al cliente (D12, construible)

La política sólo se pinta en la plantilla vieja; la ficha actual y la pantalla
de reservar no la muestran, y el convenio publicado promete que se publica
antes de pagar (Quinta §1). El texto que ve el cliente, dónde va, qué se
guarda, la calculadora del reembolso y cómo se paga la bonificación están en
**`design/legal/POLITICA-CANCELACION-CLIENTE-2026-11.md`**. En corto:

- **Texto** en la ficha, resumen con el texto desplegable en reservar y en la
  página de pago, y junto al botón: «Al pagar aceptas la política de
  cancelación de esta experiencia.» Sin casilla; con **prueba**: cada reserva
  guarda la variante, la huella del texto mostrado y la fecha.
- **Calculadora** que propone el importe por regla (cancelación de la
  operación, arrepentimiento legal, 24 horas, ventanas); la casa confirma.
- **Bonificación del 20 %:** el procesador no devuelve más de lo cobrado. El
  100 % vuelve por la misma forma de pago (LFPC 92) y el 20 % se paga **por
  transferencia** en 5 días hábiles; la ley fija el mínimo, no el medio (92
  Ter). La paga la casa como garante (D13), la transfiere Luis, y se recupera
  de la operadora (Quinta §3 y §9). La cuenta del cliente no se guarda.
- Sin versión nueva del convenio. Abierto para legal: leer la NOM-010-TUR-2001
  y el registro de contratos de adhesión de PROFECO.


### D24 · Cotejo de la factura de comisión de prueba y cuatro precisiones a D23 (17 nov, noche)

**Cotejo sobre los XML** (`design/legal/pruebas/comision-sandbox-2026-11-17.xml` y `egreso-comision-sandbox-2026-11-17.xml`, ambiente de pruebas, sin validez fiscal):

| Punto | En el XML | Resultado |
|---|---|---|
| Factura de comisión | Tipo I · emisor NUMAN HUB 601 · uso G03 · PUE · **forma de pago 17** · clave 80141628 · unidad E48 · objeto 02 | Conforme a D7, D8 y D22 |
| Renglón de comisión | 350.00 + IVA 56.00 = 406.00 | Igual a lo retenido |
| Renglón de admisión | 17.241379 + 2.758621 = 20.00 | Conforme a D7 |
| Totales | Subtotal 367.24 · IVA 58.76 · total 426.00 | Recalculado, cuadra |
| Egreso | Tipo E · relación 01 con el UUID de la comisión · uso G02 · forma de pago 17 · 175.00 + 28.00 = 203.00 | La mitad de 406.00; la admisión no vuelve en parcial |

La guía de llenado del Anexo 20 (Apéndice 5, egresos) pide en el egreso «la clave que corresponda según el caso o la clave 84111506» y la forma de pago «con la que se está efectuando» la devolución: 80141628 y 17 cumplen. **La prueba cuadra.** Una mejora, no bloqueante: si el cobro y la emisión caen en meses distintos (cobro el último día por la noche), fechar el CFDI de comisión el día del cobro, dentro de las 72 horas, como la global. Se le informa a Marisol (**M25**).

**Las cuatro preguntas de producto sobre D23:**

1. **Reserva anterior a la política publicada.** Se confirma: la variante de la experiencia es sólo referencia. Dos precisiones. El piso legal no es referencia: cancelación de la operación y arrepentimiento del artículo 56 aplican siempre. Y a esa persona no se le dice «aceptaste»: la carga de probar que se informó es del proveedor (LFPC 7 y 76 Bis V), así que en la duda se resuelve a favor del cliente y lo decide la casa con motivo escrito.
2. **Fecha para el arrepentimiento.** Se confirma la cascada. Precisión: el artículo 56 cuenta los 5 días desde «la firma del contrato» y mide la anticipación desde «la orden de compra». Cuando el pago llega después de la aceptación (transferencia), los 5 días hábiles corren desde lo último entre aceptación y primer pago; la anticipación de 10 días hábiles se mide desde la aceptación. Ajuste menor.
3. **Cupo mínimo no alcanzado.** Hoy está bien como quedó: genera bonificación, porque el texto que el cliente aceptó promete el 20 % salvo fuerza mayor y no trae excepción por cupo. Para que sea causa aparte sin bonificación hacen falta tres cosas: el mínimo y la fecha límite de confirmación escritos en la ficha y en el texto aceptado antes de pagar; el aviso al cliente a más tardar en esa fecha; y la devolución del 100 %. La NOM-010-TUR-2001 (6.2.5) pide que el paquete especifique «el número mínimo de personas que conformen el grupo»; una cláusula sin número ni fecha sería nula por LFPC 90 I. Adoptarla es **decisión de Luis** (y la fecha límite); exige texto nuevo de la política, que rige sólo para reservas posteriores.
4. **Documento de fuerza mayor.** Se pide el **archivo**, no sólo la descripción: la fuerza mayor quita la bonificación y quien la invoca la prueba (LFPC 92 Bis). Mientras no haya carga de archivo, el motivo lleva autoridad, fecha y liga o folio, y el archivo se guarda en Drive. Excepción: la emergencia médica del guía se acredita con la declaración de la operadora, sin diagnóstico ni parte médico (dato de salud, regla 8).

**Leído en la fuente (pendiente de D23):** la NOM-010-TUR-2001 está vigente según el Catálogo Mexicano de Normas (DOF 2 ene 2002). Hasta donde llega el texto publicado (numerales 1 a 6.2.7) fija contenido mínimo del contrato (prestador, turista, servicios y precio, causales de rescisión, cancelación) y **no ordena registrarlo**. La LFPC sólo obliga a registrar un contrato de adhesión cuando una norma oficial lo ordena (86 y 87); el registro voluntario existe (88). Falta leer la sección 7 de la norma (vigilancia), que el PDF del catálogo no trae.

**Corrección:** la cita de D23 era LFPC 76 Bis **fracción V** (términos y condiciones antes de la transacción), no III. La fracción III pide además domicilio físico, teléfonos y medios de reclamación antes de pagar: producto revisa que estén a la vista.


### D25 · El domicilio y los medios de reclamación antes de pagar (18 nov)

Producto encontró que antes de pagar no se veía ningún medio de reclamación ni domicilio, y que el aviso de privacidad tampoco trae domicilio. Dos leyes lo piden: la LFPC 76 Bis fracción III («su domicilio físico, números telefónicos y demás medios» para reclamaciones, **antes** de celebrar la transacción) y la LFPDPPP de 2025, artículo 15 fracción I («la identidad y domicilio del responsable» en el aviso de privacidad). Textos leídos en la versión vigente de la Cámara de Diputados (LFPC, última reforma DOF 12-12-2025; LFPDPPP, DOF 14-11-2025).

**Decisión:**

| Qué se muestra | Dónde | De quién |
|---|---|---|
| Razón social, domicilio, correo y WhatsApp para reclamaciones y aclaraciones | Reservar, página de pago, pie del sitio y aviso de privacidad | **Siempre NUMAN HUB, S.A. de C.V.** |
| Nombre o razón social de quien vende y opera | Ficha, reservar y página de pago | La operadora (NOM-010-TUR-2001, 5.2.1) |
| Domicilio de la operadora | No se publica por ahora | Ver abajo |

- **El domicilio de NUMAN** es el de su Constancia de Situación Fiscal (30 sep 2025), el mismo del preámbulo del convenio publicado: **Prado Norte 525, interior 204, Lomas de Chapultepec I Sección, Miguel Hidalgo, C.P. 11000, Ciudad de México.** No hay que pedírselo a Luis; si la oficina cambió, se actualiza primero en el SAT.
- **Por qué siempre NUMAN:** la transacción se celebra en su plataforma, cobra o hace cobrar, y responde frente al cliente por la devolución (D13, Quinta §5). Hoy además toda venta es de la casa o de una operadora sin convenio, donde NUMAN vende a nombre propio (D22).
- **El domicilio de la operadora no se publica todavía.** Muchas son personas físicas y su domicilio fiscal es su casa. Para la primera operadora con convenio que venda a nombre propio, la siguiente versión del convenio dirá: la persona moral publica su domicilio fiscal; la persona física señala el domicilio de Caminante como domicilio convencional para recibir reclamaciones de sus clientes, y Caminante se las turna. Queda en la lista de la próxima versión, junto con el cupo mínimo si Luis lo adopta.
- **Aviso de privacidad:** dos párrafos nuevos en `AVISO-PRIVACIDAD-ADICIONES-2026-11.md`: identidad y domicilio del responsable, y la cuenta bancaria que el cliente da para recibir una bonificación (dato financiero: consentimiento expreso, art. 7; se usa sólo para ese pago por la excepción del art. 9 fracción IV y no se guarda).

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
    del CSD y firma de la carta manifiesto **por la propia operadora** (módulo
    incrustado de Facturapi); **el CSD no se almacena ni de paso** (D20 bis:
    directo o reenvío en memoria; borrar lo que hoy hay en el bucket `csd`);
    baja del CSD al desactivar o terminar. Se prende sólo con
    `FACTURACION_CLIENTES=1`; v3.3 ya está publicada.

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
- **Hoy 17 nov, con Marisol:** que el ingreso de octubre entre en el pago
  provisional que vence hoy; mandarle los **estados de cuenta** que pidió; y
  preguntarle en el mismo hilo (**enviado el 17 nov** con el listado pago por
  pago de junio a octubre; falta su respuesta): (a) ¿confirmas que el sistema factura desde el
  **1 de noviembre** y tú cierras octubre y las diferencias de junio a agosto?;
  (b) ¿nos mandas el XML de la operación de noviembre que ya facturaste?;
  (c) ¿presentas el **aviso de NUMAN como retenedora** antes de la primera
  retención?; (d) ¿te parece la global con un concepto por pago (01010101,
  «Venta», folio)?
- Aprobar en la sesión de producto el cambio del corte al 1 nov.
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
| M20 | Global armada por la plataforma: un concepto por pago 01010101 / ACT / «Venta» / folio (sus globales llevan un solo concepto con 90121502); requisitos del comprobante de operación con el público en general; y el plazo de 24 horas tras el cierre del mes | D21 |
| M21 | Pago capturado tarde: global complementaria del mismo mes, con aviso a ella; factura individual sólo hasta el fin del mes del cobro | D21 |
| M22 | Informativo: Facturapi escribe `Unidad="Actividad"` en cada concepto de la global; la guía dice que no debe existir, el esquema lo permite | D21 bis |
| M23 | Forma de pago **17 (compensación)** en el CFDI de comisión de NUMAN a la operadora y en su egreso | D22 |
| M24 | Bonificación del 20 % al cliente (LFPC 92 Ter): cómo se documenta y se deduce; y si la penalización que Caminante cobra a la operadora causa IVA y con qué comprobante | D23 |
| M25 | Fechar el CFDI de comisión el día del cobro cuando cobro y emisión caen en meses distintos (dentro de 72 horas) | D24 |

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
