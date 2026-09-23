# Convenio de operación en la plataforma Caminante
### v1 — LISTO PARA REVISIÓN LEGAL · 8 de septiembre de 2026

> **Sigue sin ser un documento firmable.** Ningún abogado lo ha revisado. Se
> acompaña de `MEMO-REVISION-LEGAL.md`, que explica el negocio y hace las
> preguntas concretas.
>
> **Qué cambió del v0 (17 ago) a este v1:**
> - Las **tablas de comisión** ahora son las que el sistema cobra de verdad. Las
>   del v0 estaban desfasadas: prometían 10% donde la plataforma cobra hasta
>   20%. Ver la nota de la Cláusula Tercera.
> - **Actualización del 8 de septiembre:** la columna B se rebajó a
>   15/13/11/9/8 para que separarse de la A premie de verdad traer al cliente
>   propio, y se agregó una **comisión mínima de $250** por reserva. Las dos
>   columnas comparten cortes y se publican como una sola tabla.
> - Se resolvieron con el sistema, no con opinión: **ventana de atribución (60
>   días)** y **quién absorbe la comisión de Stripe (Caminante)**.
> - Se agregó el **tope de 20%** como techo contractual, el **congelamiento de la
>   comisión al firmar**, y **cómo se tarifican los complementos**.
> - La **facturación** se redactó como está construida hoy, no como se deseaba.
> - Los 🔸 que quedan son decisiones que **necesitan al abogado o a Luis**, no
>   descuidos.

---

## Preámbulo

Convenio de prestación de servicios de plataforma que celebran, por una parte,
**[RAZÓN SOCIAL DE CAMINANTE], RFC [___]**, con domicilio en [___] (en adelante
**«Caminante»** o **«la Plataforma»**), representada por [___]; y por la otra,
**[RAZÓN SOCIAL DEL OPERADOR], RFC [___]**, con domicilio en [___] (en adelante
**«el Operador»**), representado por [___], quien declara contar con facultades
suficientes para obligarlo.

✅ *Resuelto por Luis el 23 sep 2026: **Caminante y NUMAN son dos entidades
legales distintas.** El convenio se firma entre el Operador y Caminante, y la
comisión es un ingreso real entre partes independientes — no un asiento contable
interno, que era la duda que bloqueaba todo lo demás.*

🔸 ⚠️ **Y eso le pone nombre y RFC a una cosa que hoy el sistema tiene de otro
modo.** La única identidad fiscal cargada para la casa es
**NUMAN HUB · RFC NHU250826CS8 · régimen 601**, y es la que el timbrador usaría
para emitir el CFDI de la comisión. Si quien cobra la comisión es Caminante,
hace falta **el RFC de Caminante**, su razón social y su régimen, y son tres
datos que Luis tiene que dar antes de que se emita el primer CFDI de comisión.
No es obra: el sistema ya guarda un hogar fiscal por operadora y la casa es una
más. Es el dato lo que falta.

---

## Primera · Objeto

Caminante otorga al Operador acceso a una plataforma tecnológica para publicar,
promover, vender y administrar sus experiencias, que incluye: página pública de
cada experiencia, cobro en línea, generación y firma de deslindes, expediente de
participantes, control de cupos y fechas, lista de asistentes, kit de
comunicación, encuesta de satisfacción, panel de administración y portal con la
marca del Operador.

**Caminante NO es operador turístico ni presta el servicio de viaje.** Actúa
exclusivamente como intermediario tecnológico y de cobro. La experiencia —su
diseño, ejecución, seguridad y cumplimiento— es responsabilidad exclusiva del
Operador.

## Segunda · Naturaleza de la relación

Las partes son independientes entre sí. Este convenio **no constituye** relación
laboral, asociación, sociedad, franquicia, coinversión ni mandato. Ninguna parte
puede obligar a la otra frente a terceros.

El Operador es el único patrón de su personal y guías, y responde de todas las
obligaciones laborales y de seguridad social que le correspondan. Caminante no
ejerce dirección ni subordinación sobre ellos.

## Tercera · Comisión

Caminante retiene una comisión sobre cada venta cobrada a través de la
plataforma, conforme a las tablas siguientes. **Los tramos son marginales**:
cada tasa aplica únicamente a la porción del precio comprendida en su rango, no
al total. Así, subir el precio nunca reduce la comisión en pesos.

| Precio por persona (sin IVA) | **A ·** Caminante origina la venta | **B ·** El Operador origina la venta |
|---|---|---|
| Hasta $3,000 MXN | 20% | **15%** |
| $3,001 – $8,000 | 18% | **13%** |
| $8,001 – $15,000 | 16% | **11%** |
| $15,001 – $40,000 | 14% | **9%** |
| Más de $40,000 | 14% | **8%** |

**A** aplica cuando la venta llega por el sitio, el boletín, las redes o la
audiencia de Caminante. **B**, cuando el Operador dirige a su propio cliente a la
plataforma (ver *Origen de la venta*, más abajo).

**Comisión mínima.** Cada reserva causa una comisión de al menos **$250 MXN**,
sin que en ningún caso pueda exceder el techo del 20% del importe cobrado. El
mínimo opera sobre la reserva completa, no sobre cada concepto por separado, y
solo resulta aplicable en reservas menores a $1,667 MXN.

> **Nota de trazabilidad — cómo se fijó la columna B (8 sep 2026).** La columna B
> es más baja que la A en cinco puntos porcentuales en todo el rango, y esa
> diferencia es deliberada: es lo que la plataforma paga por que el Operador
> traiga a su propio cliente. Antes de esta versión ambas columnas arrancaban en
> 20% y en el ticket promedio se separaban 1.2 puntos, con lo que traer clientes
> propios prácticamente no se premiaba.
>
> El piso lo fija el costo real de operar la plataforma —comisión bancaria,
> infraestructura, timbrado y mensajería—, medido en **5.64%** del precio con el
> volumen actual y **4.95%** a quinientas reservas mensuales. Con la columna B,
> el margen más delgado de toda la tabla es de 4.2 puntos porcentuales, y
> corresponde a un precio de $50,000 por persona que hoy no se comercializa. El
> desglose, con la fuente y la fecha de cada precio, está en
> `design/contabilidad/COSTOS-PLATAFORMA.md`.
>
> El borrador v0 (17 ago) prometía en el supuesto B un 10% plano que no coincidía
> con lo que el sistema calculaba. Ambas tablas están hoy reconciliadas contra el
> motor de cobro, y `scripts/invariantes.mjs` detiene el despliegue si vuelven a
> separarse o si la columna B llegara a superar a la A en cualquier tramo.

**Techo absoluto.** Ninguna tasa de ninguna tabla excederá el **20%**. Este
techo es una obligación de Caminante frente al Operador y no puede rebasarse ni
siquiera al actualizar las tablas conforme a la Cláusula Décima segunda.

**Los porcentajes no incluyen IVA.** El impuesto se agrega al emitir el
comprobante fiscal correspondiente.

**Origen de la venta.** Se considera originada por el Operador toda venta que
ingrese a través de su portal o de los enlaces de seguimiento que Caminante le
proporcione, **dentro de los 60 días naturales siguientes** al primer ingreso
del cliente por ese medio. Vencido ese plazo, o si el cliente llega por
cualquier otro camino, la venta se considera originada por Caminante.

**La comisión se congela dos veces.** Primero al firmar: las tasas de este
convenio son las que rigen para el Operador mientras no acepte expresamente una
versión posterior, aunque Caminante cambie sus tablas generales. Y segundo por
venta: la tasa aplicable a cada reserva es la vigente al momento de cobrarse, y
las modificaciones posteriores no afectan ventas ya realizadas.

**Cómo se tarifican los complementos.** Cuando el cliente contrate servicios
adicionales a través de la plataforma (traslados, noches extra, actividades
opcionales), **cada concepto se tarifica por su propio precio unitario** y las
comisiones se suman. No se suman los precios para tarifar el total. Un traslado
de $7,000 paga la tasa que le corresponde a $7,000, aunque se venda junto a una
experiencia de $32,000.

**Lo vendido antes de la fecha de arranque no genera comisión** y no se suma
retroactivamente. La fecha de arranque se hace constar en la carátula.

## Cuarta · Cobro, retención y pago

> 🔸 **Reescrita el 23 sep 2026, y pendiente de revisión.** La versión anterior
> describía un solo mecanismo —Caminante cobra todo y transfiere el remanente a
> mano— y hoy hay dos. El cambio no es de redacción: con el cobro a nombre del
> Operador, **su parte del dinero nunca pasa por la cuenta de Caminante**, y eso
> mueve quién tiene el dinero y cuándo. Lo que hay que decidir va marcado.

**1 · Las dos formas de cobrar.** El cobro se hace por una de dos vías, según si
el Operador tiene cuenta de cobro conectada a la plataforma:

**(a) Cobro a nombre del Operador** *(cuando tiene cuenta conectada)*. El cargo
se genera desde la plataforma pero **a nombre del Operador**, que es quien
aparece como comercio en el estado de cuenta del cliente y quien presta el
servicio. El procesador divide el importe **en el mismo acto del cobro**: la
comisión de Caminante más su IVA se queda con Caminante, y el resto entra
**directamente a la cuenta del Operador**. Caminante no recibe, ni retiene en su
poder, la parte del Operador.

**(b) Cobro por cuenta de Caminante** *(mientras no tenga cuenta conectada)*.
Caminante cobra el importe total, retiene su comisión más el IVA, y **transfiere
el remanente al Operador a los 7 días naturales posteriores al regreso** de la
salida correspondiente.

**2 · La retención es la misma en las dos.** En ambos casos Caminante retiene
únicamente su comisión más el IVA que le corresponda, y esa retención constituye
el pago de dicha comisión: la factura que Caminante emita por ese concepto
(Cláusula Décima tercera) se salda contra ella, sin transferencia adicional.

**3 · Sin más deducciones.** Las comisiones bancarias y de procesamiento de pago
**las absorbe Caminante**. No se descuentan de lo que recibe el Operador: su
parte es el importe cobrado menos la comisión de plataforma y su IVA, y nada más.

**4 · Desglose.** Caminante entregará al Operador, por cada salida, el desglose
que permita conciliar: reservas cobradas, comisión retenida, IVA, importe neto y
la vía por la que entró cada cobro.

**5 · Momento en que el Operador dispone del dinero.** En la vía (b) dispone de
él al recibir la transferencia. En la vía (a) el importe entra a su cuenta al
momento del cobro y queda sujeto al calendario de pagos de su propio procesador,
que **no lo fija Caminante**.

**6 · El Operador dispone de su parte antes de la salida, a propósito.**
*(Decidido por Luis el 23 sep 2026.)* En la vía (a) no se le fija retraso de
pago: **tener el dinero disponible antes de la fecha es, muchas veces, lo que le
permite operar** —anticipos de hospedaje, transporte, guías—, y retenerlo hasta
después del regreso trasladaría ese costo al Operador sin necesidad.

La contrapartida se dice aquí y se ejecuta en la Cláusula Quinta: **si procede
una devolución, el Operador reintegra su parte**, aunque ya la haya dispuesto.
El sistema la jala de vuelta de su cuenta automáticamente; si para entonces no
hay saldo, la cuenta queda en descubierto y el adeudo es del Operador, quien
podrá cubrirlo por transferencia o por compensación contra liquidaciones
futuras.

🔸 *Para la revisión: confirmar que describir la vía (a) como cobro «a nombre
del Operador» es correcto para efectos de quién percibe el ingreso, dado que el
cargo lo origina la plataforma.*

## Quinta · Devoluciones, cancelaciones y contracargos

El Operador fija su política de cancelación, que se publica en la página de la
experiencia y obliga a las partes frente al cliente.

Cuando proceda una devolución, se reintegra al cliente el importe que
corresponda y **la comisión de Caminante se ajusta en la misma proporción**: la
comisión sigue a lo que el cliente efectivamente pagó. Si se devuelve todo, se
devuelve toda la comisión; si el Operador retiene una parte conforme a su
política, Caminante conserva su comisión únicamente sobre esa parte.

Si la devolución ocurre después de que el Operador dispuso de su parte, éste la
reintegrará a Caminante, por transferencia o por compensación contra
liquidaciones futuras (Cláusula Cuarta, punto 6).

**El costo de procesamiento de una venta que se deshace no lo devuelve el
procesador de pagos.** [🔸 *Decidir a cargo de quién queda.* Hoy la Cláusula
Cuarta dice que Caminante absorbe los costos de procesamiento sin distinguir el
caso de una cancelación, así que hoy los absorbe Caminante. **Medido sobre los
20 pagos conciliados del histórico: de $215,400.00 cobrados, el procesador se
quedó $10,331.87, el 4.80%** — $83.94 en una venta de $1,750. Es lo que
Caminante pierde por cada cancelación, además de devolver su comisión.]

Los **contracargos** derivados de la prestación del servicio son por cuenta del
Operador; los derivados de fallas de la plataforma o del cobro, por cuenta de
Caminante.

✅ **La devolución parcial ya está construida** (23 sep 2026), así que esta
cláusula dejó de prometer lo que el sistema no hacía. Y el reparto no lo calcula
Caminante: se le pide al procesador, que lo hace en proporción y en las dos
patas. **Medido**, sobre esta venta: un reembolso de $875 devolvió $175 de
comisión y bajó $700 del saldo del Operador.

*Es la misma regla que aplica Airbnb —su comisión sigue a lo que el huésped
acabó pagando— y por eso se redactó así.*

📄 **Los escenarios completos, con los importes de cada peso en cada caso, están
en `ESCENARIOS-DINERO.md`**, al lado de este archivo. Ahí están las cinco
preguntas que quedan para la conversación con el abogado, y la que más pesa no
es un número: **si el Operador no reintegra, ¿Caminante le devuelve al cliente
de su bolsa y lo persigue después?** Esa decisión define si Caminante es
intermediaria o garante.

## Sexta · Obligaciones del Operador

1. Contar con **Registro Nacional de Turismo** vigente, cuando le sea exigible.
2. Mantener **seguro de responsabilidad civil** vigente durante toda la
   operación, y acreditarlo a solicitud de Caminante.
3. Contar con guías con la certificación aplicable **(NOM-08-TUR, NOM-09-TUR y
   demás normas oficiales que correspondan a la actividad)** y con capacitación
   vigente en primeros auxilios.
4. Contar con las **autorizaciones del sitio** donde opera: de la CONANP cuando
   se trate de Área Natural Protegida, o del ejido, comunidad o propietario
   cuando el terreno sea de su titularidad, así como los permisos municipales o
   de protección civil aplicables.
5. Mantener un **protocolo de seguridad** y de atención de emergencias.
6. Honrar todas las reservas confirmadas a través de la plataforma.
7. Mantener actualizada y veraz la información de sus experiencias: itinerario,
   nivel de dificultad, incluye y no incluye, cupos y precios.
8. Informar a Caminante, **sin demora**, de cualquier incidente que afecte la
   seguridad de un participante.
9. Cumplir la **Ley Federal de Protección al Consumidor** frente al cliente
   final, en su carácter de prestador del servicio.
10. **Suscribir el anexo de cada actividad que ofrezca** y cumplir lo que ese
    anexo exija, en los términos del apartado siguiente.

### Anexos por actividad

Este convenio fija el marco de la relación. **Lo que se le exige al Operador
cambia según la actividad que ofrezca**: una caminata y un descenso a una
caverna no se acreditan igual, no se aseguran igual y no se rescatan igual.

Por eso, para cada actividad que el Operador quiera ofrecer en la plataforma se
suscribe un **anexo por actividad**, que forma parte integrante de este convenio
y que precisa, para esa actividad y sólo para ella: la norma oficial aplicable,
los documentos que integran el expediente, sus vigencias, y las condiciones
mínimas de operación.

Se aplican estas reglas:

a. El anexo **no sustituye** este convenio ni lo contradice: lo detalla. En lo
   comercial —comisión, cobro, pago, terminación— manda este convenio. En lo
   técnico y de seguridad de una actividad, manda su anexo.

b. **Cada actividad se aprueba y se suspende por separado.** Que una actividad
   quede incompleta, vencida o suspendida no afecta a las demás: el Operador
   sigue vendiendo las actividades cuyo anexo esté vigente y cuyo expediente
   esté aprobado.

c. El Operador **no puede publicar ni vender una experiencia de una actividad
   cuyo anexo no haya suscrito**, o cuyo expediente no esté aprobado. La
   plataforma lo impide técnicamente; esta cláusula lo dice también por escrito.

d. Los anexos se publican, versionan y firman con el mismo procedimiento y los
   mismos plazos que este convenio (Cláusula Décima segunda), y con la misma
   firma electrónica (Cláusula Décima sexta).

e. Las obligaciones de esta Cláusula Sexta aplican a **todas** las actividades,
   estén o no repetidas en un anexo.

## Séptima · Obligaciones de Caminante

1. Mantener la plataforma disponible en condiciones razonables de operación.
2. Cobrar y resguardar los importes de las reservas y liquidarlos en los
   términos de la Cláusula Cuarta.
3. Entregar al Operador la información de los participantes que requiera para
   operar la salida.
4. Dar soporte al Operador en el uso de la plataforma.
5. No comercializar las experiencias del Operador fuera de la plataforma sin su
   consentimiento.

## Octava · Datos personales

El Operador recibirá datos personales de los participantes, **incluidos datos
sensibles de salud** (padecimientos, alergias, restricciones alimentarias),
necesarios para operar la salida con seguridad.

El Operador actúa como **encargado del tratamiento** en términos de la Ley
Federal de Protección de Datos Personales en Posesión de los Particulares, y se
obliga a:

1. Usar esos datos **exclusivamente** para operar la salida correspondiente.
2. No transferirlos a terceros sin base legal ni instrucción de Caminante.
3. Guardar confidencialidad, incluso después de terminado este convenio.
4. Implementar medidas de seguridad razonables.
5. **Suprimirlos** una vez concluida la salida y cumplidas las obligaciones
   legales de conservación.
6. Contar con su propio **aviso de privacidad** y ponerlo a disposición.
7. Notificar a Caminante cualquier vulneración, dentro de las 48 horas
   siguientes a conocerla.

## Novena · Responsabilidad

El Operador es el **único responsable** de la prestación de la experiencia y
responde frente a los participantes y frente a terceros por cualquier daño
derivado de su operación.

El Operador **sacará en paz y a salvo** a Caminante de cualquier reclamación,
demanda o sanción derivada de la operación de sus experiencias, del
incumplimiento de sus obligaciones legales o de la falta de los permisos y
seguros previstos en la Cláusula Sexta.

La responsabilidad de Caminante se limita a los servicios de plataforma y de
cobro descritos en este convenio.
🔸 *Definir tope de responsabilidad de Caminante. Lo usual es el monto de las
comisiones de los últimos meses.*

## Décima · Propiedad intelectual

Cada parte conserva la titularidad de sus marcas y contenidos.

El Operador otorga a Caminante una licencia **no exclusiva, gratuita y revocable
al terminar el convenio**, para usar sus fotografías, textos, logotipo y
materiales con el fin de promover sus experiencias en la plataforma y en los
canales de Caminante.

El Operador declara contar con los derechos sobre el material que entregue,
incluidas las autorizaciones de las personas retratadas.

## Décima primera · Vigencia, terminación y suspensión

Vigencia **indefinida**. Cualquiera de las partes puede darlo por terminado con
**30 días naturales** de aviso previo por escrito.

**Las reservas ya vendidas se respetan.** La terminación no libera al Operador
de operar las salidas ya cobradas, ni a Caminante de liquidarlas.

Caminante podrá **suspender** la publicación y venta de nuevas experiencias, sin
terminar el convenio, cuando el Operador incumpla la Cláusula Sexta, cuando
venza su seguro o sus permisos, o cuando exista un incidente de seguridad en
investigación. La suspensión **no afecta** la operación ni la liquidación de lo
ya vendido.

## Décima segunda · Modificaciones

Caminante podrá actualizar este convenio. Las modificaciones se clasifican en:

- **Menores** (redacción, datos de contacto, aclaraciones que no alteran
  derechos ni obligaciones): surten efecto al notificarse y se tienen por
  aceptadas al continuar usando la plataforma.
- **Mayores** (comisión, plazos de pago, responsabilidades): se notifican con
  **30 días naturales** de anticipación y requieren aceptación expresa del
  Operador. Transcurrido el plazo sin aceptación, Caminante podrá suspender la
  publicación de nuevas experiencias. **Las ventas ya realizadas se rigen por la
  versión vigente al momento de cada venta.**

## Décima tercera · Facturación

> 🔸 **Reescrita el 23 sep 2026 al modelo decidido, y pendiente de revisión.** La
> versión anterior ponía a NUMAN facturando el viaje al cliente, que es lo
> contrario de lo que se decidió el 22 sep. Lo que sigue describe el modelo
> Airbnb y coincide con lo que el sistema ya hace; **el criterio fiscal sigue
> siendo del abogado y del contador**, y lo que hay que confirmar va marcado.

**1 · Del Operador al viajero.** El servicio turístico lo presta el Operador y lo
factura el Operador. Emite el CFDI al cliente final por el importe total de la
reserva, con su propio Certificado de Sello Digital y bajo su propio régimen. Si
el cliente no solicita comprobante, el Operador lo incorpora a su factura global
a público en general.

Caminante pone a su disposición la herramienta de autofacturación y los datos de
cada reserva, y **no emite ese comprobante ni responde por él**.

**2 · De Caminante al Operador.** Caminante emite CFDI al Operador **únicamente
por su comisión de plataforma**, más el IVA que corresponda. Esa comisión es el
único ingreso de Caminante derivado de la operación.

**3 · La retención es el pago de esa factura.** El importe retenido al momento
del cobro (Cláusula Cuarta) equivale exactamente al total de ese CFDI —comisión
más IVA—, de modo que ambos importes se saldan entre sí sin transferencia
adicional. Caminante entregará el desglose que permita conciliarlos reserva por
reserva.

**4 · Caminante no factura el servicio turístico.** No lo presta ni lo
comercializa por cuenta propia: su papel es de intermediación tecnológica y de
cobro, conforme a la Cláusula Segunda.

🔸 *Confirmar la clave de producto y servicio que corresponde a la comisión:
servicios de intermediación, no organización de viajes. Hoy el timbrador trae
por omisión la **90121500** —agencias y operadores de viajes—, que describe el
viaje y no la intermediación. Es configurable por entorno
(`FACTURAPI_CLAVE_PROD_SERV`), así que cambiarla no requiere obra.*

**5 · Retenciones de ley.** Si conforme a la legislación fiscal vigente Caminante
queda obligada, por intermediar y cobrar por cuenta del Operador, a efectuar
retenciones de ISR e IVA y a emitir los comprobantes correspondientes, lo hará y
lo reflejará en el desglose de cada liquidación.

🔸 **Pregunta para el contador, y es la que más aprieta de esta cláusula:** si
Caminante cae en el régimen de plataformas tecnológicas cuando el Operador es
persona física. Nomádika lo es. De la respuesta depende si hay que retener ISR e
IVA y emitir CFDI de retenciones, o no. *El sistema nace con ese componente
existente y en cero: prenderlo es un cambio de configuración, no de obra.*

**6 · Vigencia de la situación fiscal.** Ambas partes se obligan a mantener
vigente su situación fiscal y a entregarse la documentación que requieran para
cumplir sus obligaciones. En particular, el Operador mantendrá **vigente su CSD
en la plataforma**; mientras no lo esté, sus experiencias no pueden cobrar.

---

**Por qué esta redacción y no la anterior**, para quien la revise:

- **El SAT no tiene registrada a NUMAN en turismo.** Las quince actividades de su
  Constancia de Situación Fiscal son de medios y software. Facturar un servicio
  turístico que además no presta es justo lo que este modelo evita.
- **Las dos facturas cierran a cero.** Lo que Stripe retiene en el cobro es, al
  peso, el total del CFDI que Caminante emite al Operador. Con una venta de
  $1,750: $350.00 retenidos —$301.72 de comisión y $48.28 de IVA— y $1,400.00 a
  la cuenta del Operador.
- **La facturación multi-emisor ya está escrita** (una organización por emisor en
  el timbrador), gateada a la espera de la cuenta y del CSD. Esta cláusula no
  describe una intención: describe lo que el sistema hace cuando se prenda.

La **Cláusula Cuarta** quedó alineada con esto el mismo día: describe las dos
vías de cobro y dice, en la vía a nombre del Operador, que su parte nunca pasa
por la cuenta de Caminante. Las dos cláusulas hay que leerlas juntas.

## Décima cuarta · Confidencialidad

Las partes guardarán confidencialidad sobre la información comercial, técnica y
de clientes a la que accedan, durante la vigencia y por **2 años** después.

## Décima quinta · Cesión

Ninguna parte podrá ceder este convenio sin consentimiento previo y por escrito
de la otra, salvo que Caminante lo ceda a una empresa de su mismo grupo.

## Décima sexta · Firma electrónica

Las partes reconocen la validez de la aceptación electrónica de este convenio en
términos de los artículos 89 a 114 del **Código de Comercio**. El registro
electrónico que conserve Caminante —que incluye la versión íntegra del documento
mostrado, su huella digital, la identidad de quien aceptó, la fecha y la hora—
hace prueba plena de la celebración.

## Décima séptima · Notificaciones

Por correo electrónico a las direcciones señaladas en el preámbulo, y a través
del panel del Operador.

## Décima octava · Ley aplicable y jurisdicción

Este convenio se rige por las leyes de los Estados Unidos Mexicanos. Para su
interpretación y cumplimiento, las partes se someten a los tribunales
competentes de **[Ciudad de México]**, renunciando a cualquier otro fuero.
🔸 *Confirmar sede. Considerar mediación previa como paso obligatorio.*

---

## Lo que quedó resuelto en este v1

| Pregunta del v0 | Respuesta | De dónde salió |
|---|---|---|
| Ventana de atribución | **60 días naturales** | Es lo que el sistema aplica hoy (`ATRIB_DIAS`) |
| Comisiones bancarias | **Las absorbe Caminante** | El payout es bruto − comisión, sin descontar Stripe |
| Tablas de comisión | Las de la Cláusula Tercera | Decididas por Luis el 8 sep contra el costo real de la plataforma; reconciliadas con el motor de cobro y protegidas por un invariante |
| Quién factura al viajero | **El Operador, con su propio CSD** | Decisión de Luis, 22 sep: modelo Airbnb. Caminante factura sólo su comisión. Ver la Décima tercera |

## Lo que sigue abierto, y de quién es la decisión

| # | Pregunta | ¿Quién decide? |
|---|---|---|
| 1 | ~~¿Caminante se separa de NUMAN?~~ → **resuelto: son dos entidades distintas.** Falta el RFC, razón social y régimen de Caminante para emitir el CFDI de comisión | **Luis** — es un dato, no una obra |
| 2 | Tope de responsabilidad de Caminante | Abogado |
| 3 | Sede de jurisdicción y mediación previa | Abogado, con preferencia de Luis |
| 4 | ~~Si NUMAN puede facturar el servicio turístico~~ → **decidido: no lo factura.** Queda confirmar el IVA del reparto y la clave de producto de la comisión | Contador |
| 4b | Si Caminante debe retener ISR e IVA a operadoras persona física (régimen de plataformas tecnológicas) | **Contador** — Nomádika es persona física |
| 5 | Si la indemnización de la Novena es oponible | Abogado |
| 6 | ~~¿Retraso de pago al Operador?~~ → **resuelto: sin retraso.** Dispone de su parte antes de la salida porque es lo que le permite operar; si hay devolución, reintegra | Luis, 23 sep |
| 7 | **El costo de procesamiento de una venta cancelada no lo devuelve el procesador: $83.94 en una venta de $1,750 (4.80% medido). ¿A cargo de quién queda?** | **Luis** — hoy lo absorbe Caminante por omisión, no por decisión |
| 8 | ~~¿Se construye la devolución parcial?~~ → **resuelta: construida** (0063, falta aplicarla en producción) | Luis, 23 sep |
| 9 | **Si el Operador no reintegra lo devuelto, ¿Caminante le devuelve al cliente de su bolsa y lo persigue después?** Define si es intermediaria o garante | **Abogado** — la más importante de todas. Ver ESCENARIOS-DINERO.md |
| 10 | ¿Penalización al Operador que cancela, como hace Airbnb? ¿Y qué cuenta como fuerza mayor en montaña? | Luis, con el abogado |
| 11 | Ahora que el cargo es a nombre del Operador, ¿los contracargos siguen siendo suyos? | Abogado |

## Anexos que conviene tener

- **Anexo A** — Tabla de comisiones vigente (para poder actualizarla sin
  reescribir el convenio).
- **Anexo B** — Documentos del expediente y sus vigencias.
- **Anexo C** — Política de cancelación del Operador.
- **Anexo D** — Aviso de privacidad y encargo de tratamiento.
- **Anexo E** — **Anexos por actividad.** Uno por cada actividad del catálogo
  (senderismo, alta montaña, buceo…). No se redactan a mano: se **generan** del
  catálogo de actividades (`src/lib/operadores/actividades.ts`), que es la misma
  fuente de la que sale el expediente que se le pide al Operador en pantalla.
  Ver `design/operadores/ANEXO-ACTIVIDAD.md` — el marco, y por qué se genera.
