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

🔸 *Hoy Caminante y NUMAN son la misma entidad. Este convenio sólo tiene sentido
jurídico cuando estén separadas; mientras tanto, la comisión de NUMAN es un
asiento contable interno.*

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

1. Caminante cobra al cliente el importe total de la reserva.
2. Del importe cobrado, Caminante **retiene** la comisión más su IVA.
3. El remanente se transfiere al Operador **a los 7 días naturales posteriores
   al regreso** de la salida correspondiente.
4. La retención constituye el pago de la comisión; las partes acuerdan que la
   factura que Caminante emita por ese concepto se salda por **compensación**
   contra el importe adeudado al Operador, sin necesidad de transferencia
   adicional.
5. Caminante entregará al Operador el desglose de cada liquidación: reservas
   cobradas, comisión retenida, IVA e importe neto.

6. **Las comisiones bancarias y de procesamiento de pago las absorbe
   Caminante.** No se descuentan del importe que se liquida al Operador: su
   liquidación es el importe cobrado menos la comisión de plataforma y su IVA,
   sin más deducciones.

🔸 *Para la revisión: hoy la liquidación se hace por transferencia manual. Está
en construcción el pago automatizado por Stripe Connect, en el que el importe se
divide en el momento del cobro. Confirmar si el cambio de mecanismo exige
modificar esta cláusula o cabe en su redacción actual.*

## Quinta · Devoluciones, cancelaciones y contracargos

El Operador fija su política de cancelación, que se publica en la página de la
experiencia y obliga a las partes frente al cliente.

Cuando proceda una devolución, Caminante reintegra al cliente el importe que
corresponda y **la comisión se ajusta en la misma proporción**. Si la devolución
ocurre después de haberse liquidado al Operador, éste reintegrará a Caminante la
parte correspondiente o se compensará contra liquidaciones futuras.

Los **contracargos** derivados de la prestación del servicio son por cuenta del
Operador; los derivados de fallas de la plataforma o del cobro, por cuenta de
Caminante.

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

**Al viajero.** Caminante emite el CFDI al cliente final, a nombre de NUMAN, por
el importe total de la reserva, en su carácter de comercializadora. El Operador
autoriza expresamente esa emisión.

**Al Operador.** Caminante emite CFDI al Operador por la comisión más su IVA. Esa
factura se salda por compensación contra el importe adeudado al Operador,
conforme a la Cláusula Cuarta.

**Del Operador a Caminante.** El Operador emite CFDI a NUMAN por el servicio
turístico prestado, por el importe neto liquidado.

Ambas partes se obligan a mantener vigente su situación fiscal y a entregarse la
documentación que requieran para cumplir sus obligaciones.

🔸 **Ésta es la pregunta 4 del memo, y es la que más aprieta.** Se redactó como
el sistema funciona hoy —un solo emisor, NUMAN— y no como decía el v0, que
ponía al Operador facturando al viajero. Necesitamos criterio sobre si NUMAN
puede facturar un servicio turístico que no presta, y qué implica para el IVA de
ambas partes. Está en construcción la facturación multi-emisor, que permitiría
que cada operadora timbre con su propio sello; la respuesta a esta pregunta
decide si esa obra es opcional o urgente.

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
| Quién factura al viajero | **NUMAN, como comercializadora** | Es lo único que el sistema sabe hacer hoy |

## Lo que sigue abierto, y de quién es la decisión

| # | Pregunta | ¿Quién decide? |
|---|---|---|
| 1 | ¿Caminante se separa de NUMAN en su propia entidad? | **Luis** — es previa a todo lo demás |
| 2 | Tope de responsabilidad de Caminante | Abogado |
| 3 | Sede de jurisdicción y mediación previa | Abogado, con preferencia de Luis |
| 4 | Si NUMAN puede facturar el servicio turístico | Abogado y contador |
| 5 | Si la indemnización de la Novena es oponible | Abogado |

## Anexos que conviene tener

- **Anexo A** — Tabla de comisiones vigente (para poder actualizarla sin
  reescribir el convenio).
- **Anexo B** — Documentos del expediente y sus vigencias.
- **Anexo C** — Política de cancelación del Operador.
- **Anexo D** — Aviso de privacidad y encargo de tratamiento.
