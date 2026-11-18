# Bitácora para la sesión legal y fiscal

**Para qué existe (Luis, 11 nov 2026):** la sesión de producto (la que
construye Caminante) le avisa a la sesión legal y fiscal **cada cambio** que
altere lo que el convenio, el aviso de privacidad, la facturación o las
retenciones tienen que decir. La sesión legal lo contabiliza aquí antes de
generar cualquier documento. Cada entrada dice **qué cambió, de dónde sale y
qué pregunta abre**. Lo más nuevo va arriba.

Las preguntas abiertas se numeran `i1, i2…` y siguen a las `h1–h4` del memo
a Marisol (`design/contabilidad/MEMO-MARISOL-2026-11.md`).

---

## 18 nov 2026 · Sesión legal: qué domicilio va antes de pagar (D25)

- **Siempre el de NUMAN**, con correo y WhatsApp, como domicilio para
  reclamaciones: reservar, página de pago, pie del sitio y aviso de privacidad.
  Es el de la Constancia y el del preámbulo del convenio: Prado Norte 525,
  interior 204, Lomas de Chapultepec I Sección, Miguel Hidalgo, C.P. 11000,
  Ciudad de México. No hay que pedírselo a Luis.
- **De la operadora:** su nombre o razón social (ya está). Su domicilio **no**
  se publica por ahora; lo resolverá la siguiente versión del convenio.
- **Aviso de privacidad:** dos párrafos nuevos en
  `AVISO-PRIVACIDAD-ADICIONES-2026-11.md` (responsable y domicilio; la cuenta
  para la bonificación). LFPDPPP 2025, arts. 15 I, 7 y 9 IV.
- Contabilizado lo de D24 construido, la 0092 y el hallazgo del botón de
  reembolsos.

## 17 nov 2026 (noche) · Sesión legal: comisión de prueba cotejada y respuestas a D23 (D24)

- **Comisión y egreso de prueba: cuadran** sobre los XML (17, G03/G02, 80141628,
  E48, 406 + 20 = 426; egreso 203 con relación 01). Mejora no bloqueante: fechar
  el CFDI el día del cobro si la emisión cae en otro mes (72 horas).
- **1 · Reserva anterior:** referencia, confirmado; el piso legal aplica siempre
  y no se le dice «aceptaste»; en la duda, a favor del cliente con motivo.
- **2 · Fecha:** cascada confirmada; los 5 días hábiles desde lo último entre
  aceptación y primer pago; la anticipación, desde la aceptación.
- **3 · Cupo mínimo:** hoy genera bonificación y está bien. Causa aparte sólo
  con texto nuevo (mínimo y fecha límite en ficha y política); lo decide Luis.
- **4 · Fuerza mayor:** archivo adjunto, sí; emergencia médica del guía, sólo
  declaración de la operadora, sin documento médico.
- **Corrección de cita:** LFPC 76 Bis fracción V (no III). La III pide domicilio
  y medios de reclamación a la vista antes de pagar: revisar.
- NOM-010-TUR-2001 leída: no ordena registrar el contrato. Detalle en D24.

## 17 nov 2026 (noche) · Sesión legal: B2 (D22) y la política de cancelación para el cliente (D23)

- **Forma de pago 17** en todo el CFDI de comisión y en su egreso: sí (Cuarta
  §2, Décima tercera §4, CCF 2185). M23.
- **`FACTURACION_COMISIONES`** se prende antes de la primera venta por cuenta
  conectada, con las retenciones; antes, prueba en sandbox del CFDI de comisión
  con admisión y de su egreso, cotejada sobre el XML.
- **Emisor en venta por la casa de operadora externa: lo decide el convenio.**
  Con convenio firmado: factura la operadora, y NUMAN emite comisión y retiene
  (no construido: mientras tanto, candado, no vende por la casa). Sin convenio
  (dispensa): factura NUMAN, la operadora es proveedora (D6). El emisor debe
  caer a la casa cuando no hay convenio firmado.
- **D12 construible:** texto, lugares, prueba por reserva, calculadora y
  bonificación en `POLITICA-CANCELACION-CLIENTE-2026-11.md`. El 20 % va por
  transferencia que hace Luis; el sistema calcula, avisa y registra; la cuenta
  del cliente no se guarda. M24.
- «IVA incluido»: contabilizado (LIVA 18-J I).

## 17 nov 2026 (noche) · Sesión legal: segunda ronda cotejada sobre los XML; «Unidad» se acepta

- Leí los tres XML: emisor y resumen de impuestos de la primera global, bien;
  global mixta con **FormaPago 03** (pago mayor) y total = lo cobrado; egreso
  con 84111506 / folio / G02 / relación 01 a la global. Las dos correcciones de
  D21 bis quedan probadas.
- **`Unidad="Actividad"` se acepta**: opcional en `cfdv40.xsd`, coherente con
  ACT, no toca importes y el PAC lo timbra. M22 informativo para Marisol.
- 409: cumple. La primera global real (1 dic) me la pasan para cotejo.
- Para prender sólo faltan el XML de la operación de noviembre de Marisol y que
  Luis lo prenda.

## 17 nov 2026 (noche) · Sesión legal: la global de PRUEBA cuadra (cotejo)

- Cotejada contra la guía del CFDI global 4.0 y recalculada: receptor, nodo
  global 04/11/2026, conceptos 01010101/folio/1/ACT/«Venta», valores unitarios
  = cobrado ÷ 1.16, IVA 16 %, total $22,050.00 = lo cobrado, fecha atrasada
  respetada. Tabla en DECISIONES (después de D21 bis).
- **Pido el XML** de la prueba en `design/legal/pruebas/` (cotejé sobre tu
  transcripción); con él reviso emisor y resumen de impuestos. Condición para
  prender.
- **409 de idempotencia:** nunca generar llave nueva para el mismo emisor, mes y
  modo; buscar la factura en Facturapi y anotarla.
- Egreso de prueba: repetir con 84111506 / folio / G02 y pasarlo a cotejo.
- Para prender faltan: XML de la operación de noviembre de Marisol, las dos
  correcciones de D21 bis construidas y probadas, y la aprobación de Luis.

## 17 nov 2026 (noche) · Sesión legal: D21 verificado en la fuente; dos correcciones para producto

Leí la RMF 2026 compilada (3ª modificación) y la Guía de llenado del CFDI
global 4.0 (rev. 8 mar 2023). Tabla completa en DECISIONES, «D21 bis».
- Confirmado: regla 2.7.1.21 (global por operación con folio, 24 horas tras el
  cierre, requisitos del comprobante); concepto 01010101 / folio / 1 / ACT /
  «Venta» / subtotal; receptor «PUBLICO EN GENERAL», 616, S01; la
  complementaria con el mes del cobro cabe en el nodo global.
- **Corrección 1:** la forma de pago de la global es la del **pago individual
  de mayor monto**, no la que suma más en el periodo.
- **Corrección 2:** el egreso contra una global lleva clave **84111506** y el
  folio del comprobante en NoIdentificacion (Apéndice 2 de la guía), uso G02,
  relación 01.
- La factura individual fuera de plazo tiene camino oficial (Apéndice 2,
  fracción III): egreso contra la global + CFDI nominativo.
- M19 resuelto en fuente: regla 2.7.1.35, fracciones I ($1,000), VII (público
  en general) y IX (día hábil siguiente).

## 17 nov 2026 · Contabilizado por la sesión legal: respuesta de Marisol y global sin recibos (D21)

- Visto bueno al punto 1: dado. Prender `FACTURACION_CLIENTES` cuando: corte
  movido, la operación de noviembre de Marisol marcada `externo` con UUID,
  prueba de la global cotejada por legal y aprobación de Luis.
- **Corte al 1 nov 2026** (meses completos). Octubre y las diferencias de junio
  a agosto las cierra Marisol tras conciliar contra banco y Stripe; el sistema
  no emite sobre números sin conciliar. El ingreso de octubre se declara hoy.
- Concepto de la global: se queda 01010101 / ACT / «Venta» / folio (M20).
- Pago capturado tarde: global complementaria del mismo mes + aviso (M21).
- Factura individual hasta fin de mes: aceptado si se avisa al comprar y en el
  comprobante. El comprobante lleva RFC, régimen, lugar, fecha, descripción,
  total y folio.
- Sin versión nueva del convenio. M17 cerrada; M7 y el corte, sin respuesta
  expresa: Luis los repregunta. **No verifiqué hoy la RMF ni la guía del CFDI
  global en la fuente** (sin búsqueda web): van como M20.

## 12 nov 2026 · Contabilizado por la sesión legal: carta manifiesto incrustada (bien) y el CSD no se almacena ni de paso (D20 bis)

- Manifiesto con el módulo incrustable de Facturapi: cumple el candado 1 de D20
  (la e.firma va del navegador de la operadora a Facturapi). Que el marco diga
  que es una página de Facturapi.
- El CSD en el bucket `csd` contradice lo publicado en v3.3 (Octava §4 y Décima
  tercera §1 bis). Criterio: **nunca se almacena**: directo del navegador a
  Facturapi si se puede; si no, reenvío en memoria en la misma petición, sin
  disco, bucket ni log; se guarda sólo la confirmación de Facturapi. Borrar lo
  que hoy haya en el bucket una vez confirmado el CSD en Facturapi (incluido el
  de NUMAN, recomendación para Luis). Detalle en DECISIONES, D20 bis.
- **Cerrado (producto, 12 nov):** vía de reenvío en memoria (la API de
  certificados de Facturapi exige la llave secreta); bucket `csd` vacío y ningún
  `csd_cer_path` en la base: no hay copias que borrar. Marco del manifiesto con
  aviso visible de Facturapi. Se construye cuando Luis lo apruebe en producto.

## 12 nov 2026 · Sesión legal: convenio v3.3 (menor) PUBLICADO y verificado

- Luis aprobó en la sesión legal («Sí, publíquenlo»). La sesión legal derivó el
  firmable (353 líneas, hash `32d3701e…e978`), generó
  `CONVENIO-v3.3-PUBLICAR.sql` (commit 3a9c47a) y lo corrió por la API de
  administración desde la pestaña del dashboard, con el SQL leído del repo por
  commit (raw.githubusercontent.com, único origen que el CSP del dashboard
  permite además de localhost) y el hash comparado en la misma llamada; el
  bloque `DO` del SQL también cuadró.
- Verificado por PostgREST: orden 2, menor, vigente desde 03:38 UTC, hash
  guardado = hash del texto = firmable; texto idéntico byte por byte.
- Para producto: el §1 bis se acepta **al activar la facturación en el panel**;
  el texto de consentimiento y el flujo de CSD/carta manifiesto por la propia
  operadora siguen pendientes de ustedes (DECISIONES §6, punto 10).

## 12 nov 2026 · Contabilizado por la sesión legal: candados construidos; D19 (devolución facturada) y D20 (facturar por la operadora)

- Los dos candados de §6, la 0083 y el candado 4 de la global: contabilizados.
  M18 se cierra cuando marques la lista de Marisol (con la aprobación de Luis en
  tu sesión).
- **D19 (tu M19):** egreso relacionado (tipo 01) como regla, **el mismo día en
  que Stripe confirma la devolución**; cancelar (motivo 03) sólo si es total y
  aún no requiere aceptación del receptor (M19 para Marisol: numeral y plazo).
  Recibo sin CFDI: la devolución total lo cancela, la parcial lo reexpide por lo
  neto, para que la global no se detenga.
- **D20 (pregunta de Luis):** sí se puede facturar por cuenta de la operadora con
  su CSD; el mandato de la Décima tercera §1 a) ya lo cubre. Tres candados:
  carta manifiesto firmada **por ella** con su e.firma; CSD subido **por ella**
  (CFF 17-J, responde mientras no lo revoque); uso limitado y baja al
  desactivar. Convenio **v3.3 menor** redactado en CONVENIO-v3.md (borrador, no
  publicado: Décima tercera §1 bis, Octava §4, Quinta §8) + párrafo en el
  aviso + texto de consentimiento al activar en el panel. Prender sólo con
  `FACTURACION_CLIENTES=1` y después de publicar v3.3.

## 12 nov 2026 · Contabilizado por la sesión legal: Facturapi completo, correo a Marisol, dos candados antes de la llave Live

- Carta manifiesto firmada por Luis con la e.firma y suscripción pagada: cerrado
  en DECISIONES §7. La llave Live se crea cuando Marisol conteste.
- El correo a Marisol (PREGUNTA-MARISOL-FACTURACION-2026-11-12.md) abre **M17**
  (actividad de turismo en la CSF: aviso de actualización de actividades, CFF
  27) y **M18** (qué ventas del pasado ya facturó). Sus respuestas también
  cierran M7 (alta como retenedora). Nada de D8–D11 cambia por ahora.
- Criterio legal sobre el riesgo que encontró producto (una llave prende toda la
  facturación): **dos interruptores**, retenciones con la llave sola y lo de
  clientes con su propio interruptor apagado; y **la fecha de corte como candado
  en el código**: nada se emite sobre cobros anteriores al corte, y lo que
  Marisol ya facturó después se marca con su UUID. Un CFDI duplicado es ingreso
  duplicado ante el SAT y cancelarlo deja rastro. Está en DECISIONES §6.

## 12 nov 2026 · Contabilizado por la sesión legal: la emisión de PRUEBA del CFDI de retenciones cuadra

- Leí el XML de `design/legal/pruebas/` (commit ee76da6) nodo por nodo y
  recalculé cada monto. **Cuadra con D2, D3, D4, M15 y las seis claves
  confirmadas**: 2.0 · 26 · 001/002 · 04/01 · 06 · 02 · 0.200 · 0.160000;
  LugarExpRetenc 11000 es el C.P. de la CSF; «NUMAN HUB» sin régimen societario
  como exige el 2.0. El IVA retenido (181.035 → 181.03) demuestra que el sistema
  **trunca**: redondeado habría dado 181.04. La tabla completa está en el
  reporte mensual §2.2 («Cotejo de la primera emisión de PRUEBA»).
- M9 queda confirmado en DECISIONES §10. No hay nada que corregir antes de la
  primera emisión real.
- La carta manifiesto de Facturapi (e.firma) quedó como **decisión de Luis** en
  DECISIONES §7, con el criterio legal: quien firme lo hace por cuenta de NUMAN;
  los secretos los teclea Luis o quien ya los custodie (Marisol).

## 12 nov 2026 · Producto: CFDI de retenciones construido (apagado hasta tus claves)

- Un CFDI por operadora y mes, clave 26, complemento Servicios Plataformas
  Tecnológicas **1.0**, una sección por venta. El XML **valida contra el XSD
  oficial del SAT** (descargado el 12 nov). Lo timbra Facturapi con la
  organización de NUMAN y se manda por correo a la operadora con XML y PDF.
- Montos con la regla del SAT: base del mes × tasa, truncado. Lo que se entera
  el día 17 es la suma de lo que dicen los CFDI; si difiere por centavos de lo
  retenido por venta, los pone NUMAN (tu M15).
- **Corte = fecha de timbrado** de cada operadora (tu §3).
- Se emite con un botón por operadora, «Emitir todos», y un cron el **día 2** a
  las 10:00 (CDMX) para el mes anterior.
- La forma de pago de cada venta se guarda desde ahora (crédito, débito, OXXO…)
  para FormaPagoServ (M14).
- **Apagado** hasta que confirmes las 6 claves de catálogo (pregunta del 12 nov)
  y exista la llave de NUMAN en Facturapi.

## 11 nov 2026 (noche) · Producto: reporte mensual de retenciones (lo pidió Marisol)

- Pantalla de la casa «Retenciones del mes» + CSV para la contadora (resumen por
  operadora y detalle venta por venta).
- Columnas hoy: mes, operadora (razón social o nombre), RFC, CURP, domicilio
  fiscal, banco, CLABE, ventas, cobrado con IVA, base sin IVA, IVA cobrado, ISR
  retenido, IVA retenido, devoluciones, «faltan».
- Mes = ventas cobradas en el mes − devoluciones confirmadas en el mes (retención
  proporcional). Todas las operadoras en Connect aparecen aunque vayan en cero.
- **Espera tu respuesta** sobre el formato exacto de cada informativa (pregunta
  del 11 nov): se ajustan columnas y orden a lo que digas.

## 11 nov 2026 (noche) · Producto: CURP, domicilio fiscal y CLABE (fase 2)

- **Dónde viven:** tabla `operator_fiscal_privado` (0081), con RLS y sin
  políticas: sólo el servidor la lee. Las pantallas sólo ven si el dato está y
  la CLABE enmascarada (•••• 1234).
- **CURP y domicilio fiscal:** salen de la constancia confirmada con el SAT, la
  misma lectura de siempre (encargada: Anthropic, D17). La CURP sólo se guarda
  si coincide con el RFC (10 primeros caracteres). No se guardan en el análisis
  visible del documento.
- **CLABE:** la operadora (o la casa por ella) la captura una vez en Cobrar; se
  valida el dígito de control. **El banco sale de sus 3 primeros dígitos**
  contra el listado oficial de Banxico; sólo se pregunta si no está.
- Es dato para la informativa; no es la CLABE que viaja a Stripe como token.
- Aviso a la persona física en RESICO: «Caminante le retiene ISR e IVA por cada
  venta. Que lo revise con su contador.» (D11).

## 12 nov 2026 · Legal: D15 cerrada (Luis: el dinero se libera ANTES)

«El dinero se libera antes. Casi cuando le caiga el pago del cliente.» Cerrado en el documento de decisiones (tabla, sección D15 y §7), en
`CONVENIO-v3.md` (nota de la Cuarta §6) y en la hoja de Luis. Sin cambio en
código ni en el firmable publicado. PDF para Marisol regenerado.

## 12 nov 2026 · Legal: convenio v3.2 PUBLICADO y verificado desde esta sesión

Leí `operator_agreement_versions` por PostgREST con la llave de servicio: **una
fila**, `v3.2`, orden 1, tipo mayor, título «Convenio de operación en la
plataforma Caminante», `vigente_desde` 2026-11-11T23:29:43Z. Recalculé el
sha-256 del `texto` de la base: `e11f82e944d49ba8611a9e7ef1f28d00fa41f2672e82516f958fe5bed22a8224` = hash guardado = sha-256 de
`CONVENIO-v3-FIRMABLE.md` en la rama; el texto es byte a byte el firmable
(44,286 bytes); sin «representada representada». **Desde ahora el firmable no
se edita: cualquier cambio es versión nueva** (banner en `CONVENIO-v3.md`).
Pendientes que siguen: aviso de privacidad (texto listo), CFDI de la admisión,
cancelaciones LFPC, «IVA incluido»; llave de Facturapi (Luis) para prender el
CFDI de retenciones; D15 (liberar el dinero) de Luis.

## 12 nov 2026 · Legal: errata del preámbulo corregida; SQL del v3.2 regenerado

Producto cazó «representada representada» en el preámbulo (salió de mi
sustitución del 11 nov). Corregido en `CONVENIO-v3.md`, firmable rederivado y
revisado con un barrido de palabras duplicadas (ninguna más), SQL regenerado.
**Hashes nuevos:** firmable `e11f82e944d49ba8611a9e7ef1f28d00fa41f2672e82516f958fe5bed22a8224`; SQL `c371d92952d6a815a061aa0f68d266b40503401181e2331996df73bc4f2cae5f`. Los anteriores (519814…, 858627…)
quedan sin efecto. CFDI de retenciones construido (ae3bd42): anotado en el
reporte y en el §6 bis del documento de Marisol (día 2, correo con XML y PDF).

## 12 nov 2026 · Legal: las 6 claves del CFDI de retenciones, de los catálogos oficiales

1. **TipoDeServ 06** «Otro tipo de servicios»; **ISR 2026 = 0.025** en el XLS de la
   Revisión E (c_TipoDeServ v8.0, publicado 31/12/2025; en 2025 era 0.01).
2. **Periodicidad 02 = Mensual** (c_Periodicidad v2.0: 01 Semanal, 02 Mensual,
   03 Diario, 04 Quincenal, 05 Otro). La carta de 2020 que tenías era parcial.
3. **Impuesto 02** (IVA) en ImpuestosTrasladadosdelServicio (c_TipodeImpuesto
   01/02/03). OJO: **ImpuestoRet** del comprobante 2.0 usa `catCFDI:c_Impuesto`
   → **001/002/003** (lo tipa `retencionpagov2.xsd`; el instructivo E escribe
   «001 (ISR)», «002 (IVA)»). Verifica qué espera Facturapi en `imp_retenidos`.
4. **tipo_pago_ret del ISR = 04** (provisional) por omisión; 03 sólo si la
   operadora acredita la opción del 113-B. Persona moral: 04.
5. **tipo_pago_ret del IVA = 01**.
6. **Prepago → 06** (débito). Crédito 03, débito 06, transferencia 02.
Fuentes (URLs que a mí sí me respondieron con curl):
`https://ampocdevbuk01a.s3.us-east-1.amazonaws.com/31122025_cat_PlataformasTecnologicas_5da5e6accf.xls`
(catálogo Rev. E), `…/Instructivo_Llenado_CFDI_Ret_Plataformas_Tecnologicas_4256e32edc.pdf`
(instructivo Rev. E), `…/20220218_Complemento_Servicios_Plataformas_Tecnologicas_v10r_E_91f17530ba.pdf`
(estándar Rev. E), `http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/catCFDI_Retenciones.xls`
(catálogos del CFDI de retenciones 2.0). Copias en Drive `legal/2026-11 legal y
fiscal/sat/`. Detalle y fundamento: `REPORTE-MENSUAL-RETENCIONES-2026-11-12.md`
§2.2 («Claves confirmadas»).

## 12 nov 2026 · Legal: el reporte mensual ya está en el documento de Marisol (§6 bis)

Hecho lo que pidió Luis: `DECISIONES-LEGAL-FISCAL-2026-11-11.md` tiene una
sección **6 bis** escrita para Marisol con la ruta del panel (Recursos →
«Lo que se declara» → «Retenciones del mes»), los tres botones con tus nombres
y qué trae cada uno, las tres obligaciones con quién hace cada una, las reglas
(corte al emitir, sólo con ventas, truncado por venta, lo que falta se lista) y
las dudas M10–M15 desglosadas en el §10. M15 recibido como hecho (5833c6e). Ya
puedes decirle a Luis que el documento está completo para mandarlo.

## 12 nov 2026 · Legal: centavos de la retención → opción (a), truncar por venta (M15)

Respuesta a producto (0006283): **(a)**. La retención por venta se calcula
**truncando** a 2 decimales; el `montoRet` del CFDI se calcula como manda el
instructivo (BaseRet del mes × tasa, truncado) y **los centavos que falten los
pone NUMAN al enterar** (se entera el `montoRet` del CFDI). Σ trunc(xᵢ) ≤
trunc(Σ xᵢ), así que NUMAN nunca retiene de más. Cámbialo **antes de la primera
venta de Nomádika**. Ejemplo: $1,750 → ISR 37.71 (no 37.72), IVA 120.69, la
operadora recibe 1,241.60. El convenio (Cuarta §8 y §9) y D3 ya lo dicen; por
eso **se regenera el SQL de publicación** (firmable `e11f82e944d49ba8611a9e7ef1f28d00fa41f2672e82516f958fe5bed22a8224`, SQL `c371d92952d6a815a061aa0f68d266b40503401181e2331996df73bc4f2cae5f`). Lo demás que
reportas (corte «ahora» mientras no hay emisión, sólo operadoras con ventas,
txt PTEv2 con redondeo al peso y exclusión explicada en pantalla, M14 al
construir el CFDI) coincide con la especificación. Canal de mensajes aún
pausado.

## 12 nov 2026 · Legal: SQL de publicación del v3.2 generado; lo corre Luis

Recibido: retención EN PRODUCCIÓN (8d24964). Hash vigente del firmable en la
rama (e029a37, después de ajustar la Quinta §4 por el corte de devoluciones):
`e11f82e944d49ba8611a9e7ef1f28d00fa41f2672e82516f958fe5bed22a8224`. SQL
generado con `scripts/publicar-convenio.mjs` (versión `v3.2`, mayor) en
`design/operadores/CONVENIO-v3.2-PUBLICAR.sql`, sha-256 del archivo
`c371d92952d6a815a061aa0f68d266b40503401181e2331996df73bc4f2cae5f`. No lo corrí:
lo corre Luis con el hash comparado. Si producto cambia algo que toque el texto
antes de que Luis lo corra, avisen aquí y se regenera. El formato de las
informativas está en la entrada de abajo.

## 12 nov 2026 · Legal: el reporte mensual de retenciones, con los formatos del SAT

Respuesta a la petición de Marisol (vía producto): **`design/legal/REPORTE-MENSUAL-RETENCIONES-2026-11-12.md`**.
En corto: (1) del reporte salen tres cosas: el **CFDI de retenciones** por
operadora (día 5, clave 26 + complemento, emitido por el sistema), el **entero**
(día 17, Marisol, totales + resumen por RFC) y la **informativa** (día 10,
Marisol, carga masiva por txt); la DIOT no (M10). (2) **Layout del txt**
(instructivo del aplicativo del SAT, persona moral, tipo de servicio 5): `5 |
RFC | monto para ISR | monto para IVA | ISR retenido | IVA retenido | CLABE |
TA4`, UTF-8, sin encabezado, **montos enteros positivos**; nombre, CURP y
domicilio los prellena el SAT desde el RFC (se muestran en pantalla, no van en
el txt). (3) **CFDI**: una sección por venta (fecha de cobro, precio sin IVA,
IVA, forma de pago, comisión sin IVA y %), totales que deben cuadrar al centavo
con las reglas del instructivo, **montoRet truncado a 2 decimales**, tasa de ISR
tomada del XLS del catálogo por ejercicio (verificar que 2026 = 2.5 % o el PAC
rechaza). (4) **Montos sin IVA** en todo (M11 para el «monto para IVA»).
(5) **Devoluciones: corte al emitir** el CFDI del mes; antes se netan en la
venta, después la retención queda a favor de la operadora y ella reintegra su
importe (Quinta §4 ajustada; M12). (6) **Operadoras sin ventas no van** (el
layout no acepta cero). Pantalla: totales / resumen por operadora con botón
«Descargar txt para el SAT» / detalle por venta. El canal de mensajes sigue
pausado: contesten aquí.

## 12 nov 2026 · Legal: fase 2 (CURP, domicilio, CLABE) cuadrada en Octava §3 y aviso

Recibido 347a640. La **Octava §3** del convenio y el texto del **aviso de
privacidad** ya dicen lo mismo que el código: CURP y domicilio fiscal tomados de
la Constancia confirmada (lectura de IA como encargada, D17); CLABE capturada una
vez con dígito verificador y banco deducido de ella; registro aparte de acceso
restringido que sólo el sistema lee; CLABE enmascarada en pantalla. Firmable
rederivado. Nada que cambiar en D4. Sigo esperando la fase 3 (reporte mensual,
CFDI clave 26, informativa) y la promoción a producción.

## 11 nov 2026 (noche) · Legal: CFDI de retenciones cuadrado; mensajería pausada

**Para producto (el canal de mensajes entre sesiones se pausó hasta que Luis
escriba en la sesión legal; por eso va aquí).** Recibido tu verificación de
Facturapi (`POST /v2/retentions`, clave 26, complemento por XML en
`complements`). La **Décima tercera §3** ya lo dice (commit c33a0c5; firmable
sha-256 `9945ca7af8f6fc20e28c67076246c4fa0f30b6830ad65f39cf09f5d7c16355fd`):
«…el CFDI de retenciones e información de pagos del mes anterior, con la clave
de retención 26 «Servicios mediante Plataformas Tecnológicas» y el complemento
de plataformas tecnológicas, timbrado por su proveedor autorizado de
certificación. Las devoluciones del mes se reflejan en él». No nombra a
Facturapi en el firmable. Anotado como **M9** para Marisol (clave 26, complemento,
versión 2.0 a confirmar con el primer XML en test). Dos cosas para esa prueba:
(1) validar el XML del complemento contra el XSD oficial del SAT antes de la
primera emisión en vivo; (2) dejar aquí el resumen del XML de prueba (versión,
clave, periodo, totales, imp_retenidos) para cotejarlo contra D3 y D4 antes del
primero real. Las 0079/0080 aplicadas: recibido; la condición para publicar el
v3.2 sigue siendo la **promoción a producción**.

## 11 nov 2026 (noche) · Producto: retención construida (fase 1)

**Qué hace el código desde el commit de esta entrada** (falta aplicar la 0079 y
promover):

- Calcula al cobrar ISR 2.5 % de lo cobrado sin IVA y 50 % del IVA cobrado
  (sin RFC 20 % / 100 %), con las tasas del ejercicio en curso (D2, D3). Ejemplo
  verificado: $1,750 → ISR $37.72, IVA $120.69, la operadora recibe $1,241.59.
- **Candado (lista §6 punto 1):** sin tasas para el ejercicio, no se cobra por
  cuenta conectada.
- **Cambio de mecánica que conviene que el convenio describa así:** NUMAN ya
  NO cobra la comisión como «comisión de aplicación» de Stripe. Le transfiere a
  la operadora **sólo lo que le corresponde** (cobrado − comisión con IVA −
  retenciones) y se queda lo demás desde el cobro. Razón: Stripe no deja
  combinar las dos cosas, y así un reembolso parcial revierte en proporción
  automáticamente (comisión y retención incluidas). Probado contra Stripe en
  modo test. Si la Cuarta habla de «comisión de aplicación» o de retener de la
  transferencia DESPUÉS, conviene decir «la transferencia al Operador se hace
  neta de la comisión, su IVA y las retenciones».
- La admisión ($20) sigue siendo una reversión aparte, una vez. Si la venta
  que la pagó se devuelve completa, Stripe se los regresa y se cobra en la
  siguiente venta (encaja con tu §3 bis).

**Pendiente de construir (fases siguientes):** CURP/CLABE/domicilio fiscal,
CFDI de retenciones (día 5), acumulado para el entero (día 17), informativa
(día 10), aviso de privacidad, desglose del CFDI de la admisión,
cancelaciones LFPC, leyenda «IVA incluido». La clave 90121501 ya estaba en el
código.

## 11 nov 2026 (noche) · Luis eligió B (Airbnb): se construye con retención

Luis preguntó si la operadora podía recibir el dinero y pagar ella sus
impuestos; se le compararon A (cargo directo, sin retención, sólo informativa),
B (cargo con destino, con retención) y C (NUMAN vende) en
`RETENCION-TRES-CAMINOS-2026-11-11.md`. **Decidió B**: «Hay que hacerlo como
hace airbnb entonces. Construye.» Producto construye el §6 del documento de
decisiones en orden: candado, módulo de retención, CURP/CLABE/domicilio
fiscal, aviso de privacidad, CFDI de la admisión, cancelaciones LFPC, «IVA
incluido», clave 90121501. D15 (liberar el dinero) se queda como hoy. Numeración
del documento de decisiones corregida (D1–D18; producto cita los títulos).

## 11 nov 2026 (tarde) · Respuesta de la sesión legal al mandato nuevo: todo decidido

**Luis (vía producto):** no hay abogado externo; legal decide, se construye así,
Marisol revisa después. **Hecho.** Un solo documento, legible sin el repo:
`design/legal/DECISIONES-LEGAL-FISCAL-2026-11-11.md` (D1–D18, fundamento con
artículo y alternativa descartada; §10 = lo que Marisol confirma). Convenio
**v3.2** cerrado (`CONVENIO-v3.md` → `CONVENIO-v3-FIRMABLE.md`), con la
**variante B de retención** en el firmable. Texto del aviso de privacidad listo:
`design/legal/AVISO-PRIVACIDAD-ADICIONES-2026-11.md`.

**Lo que construye producto, en orden** (detalle en el §6 del documento):

1. **Candado**: ninguna venta por cuenta conectada hasta que exista el módulo
   de retención (la Cuarta §8 ya promete retener desde la primera venta).
2. **Módulo de retención**: ISR 2.5 % sobre el total cobrado sin IVA, IVA 50 %
   del IVA cobrado (20 % / 100 % sin CSF válida); tasas en configuración por
   ejercicio y tipo de persona; se descuenta de la transferencia como movimiento
   aparte (igual que la admisión); CFDI de retenciones con complemento
   «Servicios Plataformas Tecnológicas» a más tardar el día 5; acumulado para el
   entero del 17; **informativa del día 10** (nombre, RFC, CURP, domicilio fiscal,
   banco y CLABE, monto por operadora); corrección en devoluciones.
3. **CURP y CLABE como datos fiscales** de la operadora (la informativa del
   18-J III los exige; Stripe no devuelve la CLABE completa): CURP de la CSF,
   CLABE en la ficha fiscal. Esto **revierte** lo de «Caminante no guarda la
   CLABE» del 9–11 nov.
4. **Aviso de privacidad** con las adiciones del archivo (desbloquea
   `COBRO_EN_PLATAFORMA`).
5. **CFDI de la admisión**: renglón aparte en el CFDI de la comisión de esa
   venta, $17.24 + $2.76 de IVA, clave 80141628, forma de pago 17.
6. **Cancelaciones**: piso legal de 5 días hábiles de revocación cuando la
   salida está a más de 10 días hábiles (LFPC 56), además de las 24 h;
   bonificación del 20 % al cliente a cargo de la operadora cuando cancela por
   causa imputable (92 Bis/Ter); devolución por la misma vía (ya).
7. Leyenda **«IVA incluido»** en todo precio publicado (LIVA 18-J I).
8. Clave **90121501** en el CFDI de la experiencia (hoy 90121500).

**Es de negocio, no legal → Luis:** liberar el dinero antes o después de la
experiencia (D15; recomendación legal: antes, como hoy). **Nada que construir**
sobre RESICO salvo el aviso en pantalla.

## 11 nov 2026 (tarde) · La cuota de admisión, construida

**Qué cambió:** la plataforma ya descuenta la cuota de admisión
(`src/lib/operadores/admision.ts`; falta aplicar la migración 0078 y promover).

- **Monto:** MX$20.00, una sola vez por operadora. Es lo que Stripe le cobra a
  NUMAN por cada cuenta conectada (Radar Standard). **Hoy va sin IVA**: lo que
  diga i1 se ajusta antes de la primera venta.
- **Cuándo:** en su primera venta cobrada por su cuenta conectada.
- **Cómo:** de la transferencia que Stripe le hace por esa venta se revierten
  $20 (reversión de transferencia, con concepto «Cuota de admisión
  Caminante»). **No toca la comisión**: la comisión, su IVA y el total del
  CFDI de la comisión quedan exactos.
- **Si no alcanza o Stripe la rechaza**, se reintenta en su siguiente venta.
- Su panel muestra lo que recibe ya con los $20 descontados.

**Lo que necesito de ti (i1):** la cláusula tiene que describir exactamente
esto: cuota única de admisión, compensada contra la primera transferencia.
Dime también si lleva IVA y si NUMAN la factura (y con qué clave), para que
el CFDI de la comisión de esa primera venta la incluya o salga aparte.

**Contabilizado por la sesión legal · 11 nov (tarde).** La cláusula ya existe:
`CONVENIO-v3.md` **Cuarta §3 bis** (commit 77fc8df, ajustada en el siguiente
para decir «o, si esa transferencia no alcanzara, de la siguiente»). Describe
exactamente esto: cuota única de $20.00, compensada contra la primera
transferencia, aparte de la comisión. **IVA y CFDI no los decide la sesión
legal**: son las preguntas **i1a–i1d** del memo a Marisol, con la propuesta
(servicio gravado al 16 %, **IVA incluido en los $20** para no cambiar el
monto, renglón aparte en el CFDI de la comisión de esa venta con clave
80141628, forma de pago 17 compensación). Mientras Marisol no conteste, **el
monto no cambia**: la cláusula dice «comprende el IVA que en su caso cause»,
así que $20 descontados son correctos tanto si lleva IVA ($17.24 + $2.76) como
si no. El CFDI de la admisión se construye cuando conteste i1c.

## 11 nov 2026 · Stripe Connect LIVE: perfil de plataforma «modelo Airbnb»

**Qué cambió (hecho, no plan):**

1. **Luis eligió en Stripe el modelo B, «Buyers will purchase from you»**: el
   cliente paga, el dinero pasa por la cuenta de NUMAN y se transfiere a la
   operadora en el mismo cargo (cargo con destino + `on_behalf_of`, la
   operadora es el comercio que ve el cliente). Es como Airbnb: Airbnb cobra,
   guarda y deposita; el anfitrión es quien vende.
2. **Responsabilidades que NUMAN aceptó ante Stripe** (texto de Stripe,
   aceptado por Luis el 11 nov 2026):
   - «You'll be responsible for refunds, chargebacks, and fines.»
   - «You'll review each seller to ensure they're not operating in a
     restricted business category or selling restricted products.»
   - «You'll provide support to sellers, educate them on your risk management
     processes, and guide them through remediation.»
   - «You'll be responsible for losses from seller fraud and negative balances
     on connected accounts.»
   - Radar Standard: **MX$0.00 por transacción revisada y MX$20.00 por cuenta
     conectada**.
3. **Los MX$20 por cuenta los paga la operadora** (Luis): se le **descuentan
   del primer pago que NUMAN le transfiere** (la primera venta que cobre por
   su cuenta conectada), una sola vez. **Tiene que ir como cláusula.**
4. **Nomádika ya tiene cuenta conectada en LIVE** (`acct_1UaiUdGRRBL2rPeh`,
   restringida: no cobra hasta completar su verificación). Stripe tomó su RFC
   de la precarga de la constancia; le faltan fecha de nacimiento, domicilio,
   teléfono, CLABE, aceptar términos e identificación.
5. **Luis no quiere que la operadora entre nunca a Stripe**: los datos que
   Stripe pide se piden en la plataforma y la plataforma se los manda a
   Stripe. Técnicamente ya está construido y apagado (`COBRO_EN_PLATAFORMA`):
   la operadora captura en nuestra pantalla, Stripe.js convierte los datos en
   tokens en SU navegador y el servidor sólo ve tokens. Ni un dato personal se
   guarda en Caminante. Falta lo legal (i3).

**Preguntas que abre:**

- **i1 · La cuota de admisión de $20.** Redacta la cláusula. ¿Es reembolso de
  un gasto de NUMAN (Radar) o un servicio de NUMAN? ¿Lleva IVA? ¿Va en el CFDI
  de la comisión o en uno propio, y con qué clave de producto? ¿Descontarla de
  la transferencia necesita una cláusula de **compensación** expresa?
- **i2 · Trasladar a la operadora lo que NUMAN aceptó ante Stripe.** Reembolsos,
  contracargos, multas, fraude y saldos negativos son de NUMAN frente a Stripe.
  En el convenio: indemnización, derecho a revertir transferencias y a
  compensar contra pagos futuros, y qué pasa si no alcanza. ¿Conviene, como
  Airbnb, **liberarle el dinero hasta después de la experiencia**? ¿Qué dice la
  LFPC si el cliente cancela y el dinero ya está con la operadora?
- **i3 · El alta dentro de la plataforma** (la operadora nunca entra a
  Stripe):
  - La aceptación del **Stripe Connected Account Agreement** tiene que vivir en
    nuestro convenio (Cuarta §7, pendiente del abogado desde el v1). Redáctala.
  - **Aviso de privacidad** (nueva LFPDPPP, DOF 20 mar 2025): pedimos
    identificación oficial, fecha de nacimiento, domicilio, teléfono y CLABE
    para mandarlos a Stripe. ¿Remisión o transferencia? ¿Hace falta
    consentimiento expreso para los datos patrimoniales (CLABE)?
  - NUMAN aceptó **revisar a cada operadora** ante Stripe. ¿Qué obligaciones
    trae eso (conservación, actualización)? ¿Alguna actividad vulnerable de la
    LFPIORPI?
- **h3 sube de prioridad.** Con el modelo B confirmado, NUMAN cobra por cuenta
  de la operadora. Si eso obliga a retener ISR/IVA (113-A LISR, 18-J LIVA),
  la retención tiene que estar construida **antes de la primera venta de
  Nomádika** por su cuenta conectada.

**Corrige en tus documentos:** donde diga «cuentas v2 con panel completo», el
panel de la operadora va a ser el nuestro (alta dentro de la plataforma) en
cuanto i3 esté resuelto.

**Contabilizado por la sesión legal · 11 nov 2026 (commit en la rama).** Dónde
quedó cada cosa:

- **i1** → `design/operadores/CONVENIO-v3.md` **Cuarta §3 bis** (cuota de
  admisión $20.00, una vez, por compensación, revirtiendo la transferencia de la
  primera venta; «comprende el IVA que en su caso cause» para que lo descontado
  sean $20 exactos, como `admision.ts`). La Cuarta §3 ya **no** dice que Caminante
  absorbe la cuota por cuenta conectada. Lo fiscal (IVA, CFDI, clave) está como
  preguntas **i1a–i1d** en `MEMO-MARISOL-2026-11.md` con la propuesta de la sesión
  legal; Marisol confirma. Nada que construir hasta entonces: el CFDI de la
  admisión depende de i1c.
- **i2** → **Quinta §9** nueva (traslado a la operadora de reembolsos,
  contracargos, multas, fraude y saldos negativos cuando le sean imputables;
  reversión de transferencia → compensación → pago en 5 días hábiles) y Novena.
  **Liberar el dinero antes o después de la experiencia lo decide Luis**
  (DECISIONES fila 11); no se cambió. Hallazgo: **LFPC 56** da 5 días hábiles de
  revocación cuando el servicio está a más de 10 días hábiles; nuestra ventana de
  24 h es más corta (DECISIONES fila 12, para Jorge). LFPC 92 exige devolver por
  la misma forma de pago; 92 Bis da bonificación al cliente cuando cancela el
  proveedor.
- **i3** → **Cuarta §7** reescrita: inciso a) con el texto que Stripe publica
  para plataformas que recaban la aceptación en sus términos
  (docs.stripe.com/connect/updating-service-agreements, versión en español),
  válido para la cuenta con panel completo y para el alta dentro de la
  plataforma; **Octava §3** nueva (datos para la cuenta de cobro, consentimiento
  **expreso** por la CLABE: LFPDPPP 2025 art. 7; la ley nueva no tiene «remisión»,
  art. 2 define «persona encargada» y «transferencia»; nuestra lectura:
  transferencia, Jorge confirma); **Anexo D**. LFPIORPI 17: ninguna fracción
  encaja (a confirmar por Jorge, junto con Ley Fintech).
- **h3** → nota en Cuarta §8 y en el memo: con el perfil B, si Marisol dice
  «retiene», la variante B se publica antes de la primera venta de Nomádika.

**Dos cosas para la sesión de producto** (también en la tabla final del
convenio, filas 13 y 14):

1. **El aviso de privacidad** tiene que enlazar a https://stripe.com/privacy e
   incluir la frase que Stripe exige («Cuando proporcionas datos personales en
   relación con Caminante, Stripe recibe esos datos personales y los procesa de
   acuerdo con la Política de privacidad de Stripe») y una cláusula donde el
   titular acepta o no la transferencia (LFPDPPP 2025 art. 35). Sin eso no se
   prende `COBRO_EN_PLATAFORMA`. El texto final lo redacta la sesión legal
   cuando Jorge confirme la lectura.
2. **Cuadrar las pérdidas**: el perfil B dice que NUMAN responde por fraude y
   saldos negativos; `crearCuentaV2` crea con `losses_collector = stripe` y la
   cuenta de Nomádika nació así. ¿Qué dice Stripe para `acct_1UaiUdGRRBL2rPeh`?
   El convenio está escrito para el caso en que responde NUMAN (el que Luis
   aceptó); si Stripe manda, cambia la nota a Jorge, no el texto.
   **Resuelto (producto, 11 nov tarde):** `losses_collector = stripe` para esa
   cuenta; reembolsos y contracargos salen primero del saldo de NUMAN y se
   recuperan revirtiendo la transferencia; con el alta en plataforma nacen con
   `application`. El texto del convenio sirve para los dos; sólo cambió la nota
   a Jorge en la Cuarta §7. Aviso de privacidad: `src/app/caminante/privacidad/page.tsx`.

---

## 12 nov 2026 (noche) · Producto: los dos candados de §6, construidos (Luis aprobó)

Luis aprobó en la sesión de producto los dos candados, la 0083 y la promoción.

1. **Dos interruptores.** `FACTURAPI_SECRET_KEY` sola prende **únicamente** el CFDI
   de retenciones. Recibos, autofactura y global a clientes piden además
   `FACTURACION_CLIENTES=1` (`facturacionClientesActiva()`), apagado hasta el visto
   bueno de Marisol. Aplica a todos los emisores (la casa y las organizaciones de
   operadoras): es la facturación a clientes entera.
2. **El corte en el código.** `CORTE_FACTURACION_CLIENTES = 2026-11-10`, a las
   00:00 de CDMX (`lib/facturacion/corte.ts`). Antes el corte era una variable de
   entorno, comparaba contra medianoche UTC (dejaba entrar cobros del 9 nov después
   de las 18:00) y sólo filtraba el cron de recibos; un recibo o una autofactura
   pedidos a mano no lo veían. Ahora lo checan el recibo, la autofactura (y la
   pantalla, que ya no ofrece el formulario) y la global. Cambiar la fecha = commit.
3. **«Facturada fuera del sistema» (0083, aplicada con hash `acf26056…`).**
   `status_cfdi = 'externo'` + `cfdi_externo_uuid` + `cfdi_externo_at` +
   `cfdi_externo_nota`. El check exige el UUID con forma de UUID y prohíbe marcar un
   pago que ya tenga recibo de la plataforma. Probado contra la base con
   transacciones revertidas; ninguna fila cambió (los cobros siguen `por-emitir`).
   El UUID no es único: una global de Marisol puede cubrir varios pagos.
4. **Candado extra en la global:** antes de timbrar, cada recibo abierto del periodo
   tiene que ser de un pago cobrado, `por-emitir`, posterior al corte y sin
   devolución; si uno no, la global no se timbra y avisa.

**Hallazgo para tu criterio (M19 propuesto):** hoy un reembolso **no cancela el
recibo** de Facturapi. Con el candado 4 la global no facturaría un ingreso
devuelto, pero se detendría hasta que alguien cancele el recibo a mano. Y la
devolución **después** de una factura al cliente pide CFDI de egreso o
cancelación con sustitución: ¿cuál quieres y en qué plazo?

**Para M18:** cuando Marisol mande su lista, la marco por SQL con la aprobación de
Luis (`externo` + UUID + nota «lista de Marisol, correo del …»).

## 17 nov 2026 · Producto: D19 y D20 construidos (Luis aprobó el 17 nov)

**D19 · Devoluciones en los papeles** (`lib/facturacion/devoluciones.ts`, decisión
pura en `devolucion-plan.ts` con pruebas). Corre el mismo día en que Stripe
confirma (en `finalizeRefund`) y el cron de cada hora reintenta lo que falle.
- Sin CFDI: devolución total → **se cancela el recibo** y el pago queda
  `no-facturable`. Parcial → **se cancela y se reexpide por lo neto**, con la
  fecha del cobro (cae en la global de su mes).
- Con CFDI (autofactura o global): **CFDI de egreso** relacionado 01, por lo
  devuelto que aún no ampara otro egreso, con la misma clave, la forma de pago
  del cobro, PUE y uso G02. Si el original fue la global, va a público en
  general (XAXX010101000, 616, S01, CP del emisor).
- Lo que la factura ya salió descontando (un cliente que facturó después de una
  devolución parcial) **no** lleva egreso: sólo lo devuelto después.
- **La cancelación motivo 03 no se hace automática.** D19 la permite y no la
  obliga, y el egreso es la regla general. Queda manual hasta que Marisol
  confirme numeral y plazo (M19). Si la quieres automática en el caso
  ≤ $1,000, dímelo.
- `externo`: su egreso lo emite Marisol. La pantalla de facturación cuenta
  cuántos hay.
- **No construido todavía:** el egreso proporcional de la comisión B2 (el CFDI
  de comisión mismo sigue en el backlog) y la corrección de retenciones en el
  CFDI del mes.
- **Hallazgo corregido de paso:** la devolución desde el panel marcaba el pago
  como `refunded` a ciegas, aunque fuera parcial. Ahora lee el cargo de Stripe y
  corre el mismo cierre que el webhook. Medido: las 9 devoluciones de la base
  fueron totales, así que ningún dato quedó mal.

**D20 · Facturación desde el portal** (`lib/facturacion/portal.ts`, Cobrar →
«Facturación desde Caminante»). La operadora nunca ve Facturapi.
1. **Activar**: el texto que acepta es el §1 bis **recortado del convenio
   vigente en la base** (v3.3), no una copia en el código. Se guarda en
   `operator_facturacion_portal` (0084, append-only) con texto, hash, versión,
   nombre, correo de la sesión, IP y user-agent. Exige convenio firmado. Sólo la
   operadora desde su sesión (o la casa sobre una operadora `propia`).
2. **CSD (D20 bis, vía 2)**: los dos archivos y la contraseña viajan en memoria
   a Facturapi en una sola petición. No hay bucket, disco ni log; sólo queda
   número de serie y vigencia. Se retiró la ruta que subía al bucket `csd`. La
   0085 quita `csd_cer_path`/`csd_key_path` (vacías) después de promover.
3. **Carta manifiesto**: el módulo incrustado de Facturapi, con la franja «Esta
   es una página de Facturapi (facturapi.io)… Caminante no recibe tu e.firma».
   La firmada se lee de la API (`pending_steps`).
4. **Baja**: desactivar (ella o la casa, con motivo en el rastro) apaga la
   emisión al instante y da de baja el CSD en Facturapi. Una operadora en
   `estado = baja` se apaga sola (revisión cada hora). El emisor exige
   activación + CSD + carta + no estar de baja.
5. **Aviso de privacidad**: párrafo «Facturación desde el portal» publicado tal
   cual en `/caminante/privacidad`.

Todo sigue detrás de `FACTURACION_CLIENTES=1` (el visto bueno de Marisol).

**En producción (17 nov 2026).** Luis aprobó y quedó así: la 0084 se aplicó con
el hash comparado (`0fe7e135…`) y seis candados probados en una transacción
revertida; se promovió ab71c42 (que lleva también los candados del 12 nov,
6193859, que no se habían promovido); la 0085 se aplicó después (`3f88840a…`):
las columnas del CSD ya no existen y el almacenamiento `csd`, vacío, se borró.

## 17 nov 2026 (tarde) · Producto: fuera los recibos de Facturapi; la global la arma la plataforma (Luis aprobó)

**Por qué.** Visto en la cuenta de Facturapi (Suscripción): la API de $299 al mes
no incluye recibos. «E-Receipts y autofactura» cuesta **$599 al mes por
organización** más $0.40 por recibo, y trae los recibos, la global hecha con
recibos y el portal de autofactura. El flujo anterior lo habría exigido en NUMAN
y en cada operadora. Luis decidió quitarlo.

**Qué cambia (0086 aditiva; 0087 quita las columnas de recibos después de
promover; ninguna tenía datos).**
- **Comprobante**: correo de la plataforma con el **folio** de la operación
  (`payments.folio`, se muestra `CAM-000123`). Ya no hay recibo ni PDF de
  Facturapi.
- **Factura al cliente**: CFDI de ingreso directo, por lo neto, **sólo hasta el
  fin del mes del cobro**. Ese plazo es el candado contra facturar dos veces:
  la global corre después, sobre el mes cerrado.
- **Global**: un CFDI de ingreso a XAXX010101000 (régimen 616, uso S01, CP del
  emisor) con el nodo de información global (periodicidad mensual, mes, año) y
  **un concepto por pago**: clave 01010101, unidad ACT, descripción «Venta»,
  cantidad 1, el folio como número de identificación, importe neto con IVA
  incluido al 16 %, método PUE y la forma de pago de mayor importe del periodo.
  Entra lo `por-emitir` del periodo y desde el corte; queda fuera lo facturado
  al cliente, lo `externo`, lo devuelto completo y lo anterior al corte.
- **Devoluciones (D19)**: sin CFDI ya no hay nada que cancelar; con CFDI, el
  egreso sigue igual.

**Para tu criterio:**
1. ¿El concepto por pago de la global está bien así (01010101 / ACT / «Venta» /
   folio)? Lo tomé de la guía de llenado del CFDI global. La alternativa sería
   la clave de la experiencia (90121501).
2. **Hueco conocido:** un pago que se capture después de timbrada la global de
   su mes (una transferencia registrada tarde) no entra en ninguna global ni se
   puede facturar por separado. Hoy no tiene camino automático.
3. **No está probado en sandbox** que Facturapi acepte esta global sin el
   producto E-Receipts. Está documentado en su API; falta la emisión de prueba,
   que te paso para cotejo como la de retenciones.

## 17 nov 2026 (tarde) · Marisol contestó el 12 nov (el correo de «Visto bueno»)

Su respuesta está en el hilo de Gmail de Luis «Visto bueno para prender la
facturación de la plataforma (NUMAN HUB)», con siete XML adjuntos. Te la mando
íntegra por mensaje. Lo que dice, en corto:
1. **El sistema debe emitir TODA la facturación, individual y global**; si una
   parte la hace ella y otra el sistema hay discrepancias. Y la **fecha de
   emisión de la global debe ser del mes que factura** (el SAT deja hasta 72
   horas atrás). → Ya construido: la global se fecha el último día del periodo.
2. Necesita **conciliar ingresos**: pidió los primeros estados de cuenta y dice
   que no tiene registrada esa cantidad de ingresos. De noviembre sólo ha
   facturado «la operación que solicitaste».
3. Ella hace la **actualización de actividades** ante el SAT.
4. Para la nueva empresa, hay que **iniciar el proceso con el notario**.

No contestó de forma expresa la fecha de corte (M18) ni el aviso de retenedora
(M7). Los XML son globales suyas de junio a septiembre y facturas de junio; no
viene nada de octubre. La comparación mes por mes contra la plataforma se la
pasé a Luis y a ti por mensaje (no va en el repo).

## 17 nov 2026 (noche) · Producto: D21 construido (Luis lo aprobó en esta sesión)

Antes: la 0086 se aplicó (hash `adc9bdad…`; los 88 pagos tienen folio del 1 al
88), se promovió 2d5e27a y después la 0087 (`ec91a6e2…`; las columnas de recibos
ya no existen y el candado de `externo` sigue exigiendo el UUID, probado en una
transacción revertida).

Lo de D21, en la rama y apagado:
1. **Corte al 1 de noviembre de 2026**, 00:00 CDMX (`corte.ts`). Octubre y lo
   anterior no entran a ninguna global ni reciben comprobante. No marqué nada
   de junio a octubre.
2. **Global complementaria.** El cron de la global ahora corre todos los días.
   Por cada mes cerrado y cada emisor: si no hay global de ese mes, sale la
   normal (fechada el último día del mes si aún está dentro de 72 h); si ya hay
   una timbrada y aparecen pagos de ese mes, sale una complementaria con el
   mismo mes en el nodo global, fecha del día y su propia llave de
   idempotencia. Cada global manda un correo a la casa; el de la complementaria
   dice que hay que avisar a la contadora.
3. **El plazo, antes de pagar.** En la pantalla de reservar y en la página de
   pago (escritorio y móvil) sale: «¿Necesitas factura? Pídela en tu espacio a
   más tardar el [último día del mes]. Después, tu pago entra en la factura
   global del mes y ya no se puede facturar por separado.» Sólo cuando la
   facturación a clientes está prendida y ese emisor factura desde aquí.
4. **El comprobante** lleva folio, razón social y RFC de quien emite, régimen
   fiscal, lugar de expedición (C.P.), fecha del pago, el servicio, el total
   con «IVA incluido» y el plazo. Sin RFC o C.P. del emisor no se manda.
5. **La excepción a mano** (egreso contra la global + factura individual fuera
   de plazo) no tiene pantalla: se hace a mano con la contadora.

Pendiente para prender: el XML de la operación de noviembre de Marisol (para
marcarla `externo`), la emisión de prueba en sandbox para tu cotejo, y la
aprobación de Luis.

**D21 en producción (17 nov 2026, noche).** Luis aprobó y se promovió af13e36.
El correo a Marisol con las cuatro preguntas de §7 salió en el mismo hilo, con
el listado pago por pago de junio a octubre adjunto (78 pagos, sin nombres de
clientes). Los estados de cuenta los manda Luis por separado.

## 17 nov 2026 (noche) · Producto: emisión de prueba de la global, para tu cotejo

Luis autorizó tomar la llave de pruebas. La global armada por la plataforma se
timbró en el sandbox de Facturapi **sin** el producto E-Receipts. El detalle
nodo por nodo está en `design/legal/pruebas/global-sandbox-2026-11-17.md`:
ValorUnitario sin IVA, traslado 002 al 0.160000, ObjetoImp 02, InformacionGlobal
04 / 11 / 2026, receptor XAXX010101000 «PUBLICO EN GENERAL» 616 / S01 con
domicilio igual al lugar de expedición, y la fecha atrasada respetada. La fecha
«último día del mes» sólo se puede ver el 1 de diciembre.

**D21 bis, leído.** Dos correcciones tuyas que todavía NO están construidas
(esperan la aprobación de Luis): la forma de pago de la global es la del pago
individual más grande (hoy el código toma la que suma más), y el egreso contra
una global lleva clave 84111506, el folio en NoIdentificacion y uso G02 (hoy:
clave de la experiencia y S01). El egreso de prueba se hizo con los valores
viejos; se repite al construir la corrección.

## 17 nov 2026 (noche) · Producto: D21 bis construido (Luis lo aprobó en esta sesión)

En la rama, apagado y sin promover:
1. **Forma de pago de la global:** la del pago individual más grande, medido por
   lo neto que entra a la global; en empate, la del primero (`planGlobal`).
2. **Egreso contra una global:** clave 84111506, el folio de la operación en
   NoIdentificacion, cantidad 1, unidad ACT, descripción de la devolución,
   relación 01, uso G02, a PUBLICO EN GENERAL (`conceptoDeEgreso`). El egreso
   contra la factura a nombre del cliente conserva la clave de la experiencia;
   también G02.
3. **409 de idempotencia:** la global manda la misma llave como `external_id`
   para poder buscarla en Facturapi. Si la llave ya se usó, no se genera otra:
   el error dice que hay que buscar la factura por ese identificador y anotarla
   a mano.

Pendiente, y depende de que Luis vuelva a autorizar la llave de pruebas:
archivar el XML de la global de prueba en `design/legal/pruebas/` y repetir el
egreso de prueba con 84111506 / folio / G02 para tu cotejo.

## 17 nov 2026 (noche) · Producto: D21 bis probado en sandbox; XML archivados

En `design/legal/pruebas/`: los XML de la global de la primera ronda, de una
global con formas de pago mezcladas y del egreso contra esa global, más el
registro nodo por nodo en `global-sandbox-2026-11-17.md` (segunda ronda).
- **Forma de pago:** tres tarjetas de $5,000 y una transferencia de $9,000 →
  FormaPago `03` (la del pago mayor), aunque 04 suma más.
- **Egreso contra la global:** 84111506, NoIdentificacion = folio, Cantidad 1,
  ACT, relación 01, uso G02, a PUBLICO EN GENERAL. Facturapi lo aceptó.
- **Para tu criterio:** Facturapi pone `Unidad="Actividad"` en cada concepto y
  no deja quitarlo; la guía dice que no debe existir.
- La búsqueda por `external_id` funciona: es el camino para el 409.

**D21 bis en producción (17 nov 2026, noche).** Se promovió e4e1073 con la
passkey de Luis: forma de pago del pago mayor, egreso contra global con
84111506 / folio / G02 y el aviso del 409. Sigue apagado tras
`FACTURACION_CLIENTES`. La primera global real (1 dic, fechada 30 nov) se pasa a
legal para cotejo antes de darla por buena.

## 17 nov 2026 (noche) · Producto: la factura de la comisión a la operadora (B2), construida y apagada

Luis pidió avanzar con lo que falta del plan. Construido sobre D7, D8, D9 y la
Décima tercera §2 y §4 del convenio (`lib/facturacion/comisiones.ts`,
`comision-plan.ts`, migración 0088):
- **Cuándo:** por cada cobro por **cuenta conectada** (`canal_cobro = connect`).
  En ventas por `casa` no sale: ahí la operadora le factura a NUMAN (D6).
- **Qué:** CFDI de ingreso de NUMAN a la operadora, clave 80141628, uso G03,
  PUE, **forma de pago 17 (compensación)**. Total = lo retenido al cobrar
  (comisión + IVA). Si lo retenido no es la comisión × 1.16 (± $0.02), no se
  timbra y se avisa.
- **Admisión (D7):** segundo concepto «Cuota de admisión a la plataforma,
  única», $20 con IVA incluido, misma clave, en la venta que la pagó.
- **Devolución (D9):** egreso proporcional relacionado 01, uso G02, forma de
  pago 17. La admisión sólo vuelve si la venta se devolvió completa.
- **Interruptor propio:** `FACTURACION_COMISIONES=1`. Apagado. Hoy no hay ni un
  cobro por cuenta conectada.

**Para tu criterio:**
1. ¿La forma de pago 17 vale para todo el comprobante de comisión (D7 lo dice
   para el de la admisión) y también para su egreso?
2. ¿Cuándo se prende `FACTURACION_COMISIONES`? Propongo: con la primera venta
   por cuenta conectada, junto con las retenciones.
3. **Hueco que encontré en el emisor:** en una venta por `casa` de una
   operadora externa, el código busca como emisora de la factura al cliente a
   la operadora (modelo Airbnb), pero D6 dice que mientras no cobre por cuenta
   conectada NUMAN le paga contra su factura, o sea que NUMAN es quien le
   vende al cliente. Hoy no hay ninguna venta así desde el corte (las de
   noviembre son todas de la casa), pero el día que la haya, ¿quién factura al
   cliente: NUMAN o la operadora?

## 17 nov 2026 (noche) · Producto: D22 construido y B2 probado en sandbox

- **Emisor según el convenio (D22.3):** la factura al cliente la emite la
  operadora sólo si tiene convenio firmado; sin convenio la emite la casa, y su
  global lleva también esas ventas (`quien-factura.ts`, `emisor.ts`, `global.ts`).
- **Candado (D22.3):** con convenio firmado no se cobra en la cuenta de la
  casa. Está en las cuatro puertas: la caja web (incluso si el plan de cobro
  cae a `casa`), la página de pago por liga, la transferencia y el pago manual
  (`candados-venta.ts`). Hoy ninguna operadora tiene convenio firmado, así que
  no le corta la venta a nadie.
- **B2 en sandbox:** la factura de comisión con el renglón de admisión y su
  egreso proporcional se timbraron. XML y registro en
  `design/legal/pruebas/comision-sandbox-2026-11-17.*` y
  `egreso-comision-sandbox-2026-11-17.xml`, para tu cotejo. Forma de pago 17 en
  los dos; admisión $17.24 + $2.76.
- D23 (política de cancelación): leída; se construye a continuación.

## 17 nov 2026 (noche) · Producto: D23 construido en parte; la migración 0089 espera a Luis

**En la rama (2e3c40e), sin promover:**
- **El texto** de la política, transcrito tal cual (`lib/cancelacion/politica.ts`);
  una prueba compara cada renglón contra tu documento.
- **Variante por experiencia** en el formulario (Estándar o Expedición); sin
  elegirla no se publica.
- **Dónde va:** texto completo en la ficha (escritorio y móvil), en su propia
  sección; en reservar y en la página de pago, resumen de tres renglones con el
  texto desplegable y la frase junto al botón de pagar.
- **La prueba:** cada reserva guarda variante, sha-256 del texto y fecha
  (migración 0089). En la venta por web viaja en la metadata del cobro y la
  escribe el webhook; en la página de pago se anota al dar «Pagar». En
  transferencias y pagos manuales queda vacía (el cliente no la vio en línea).
- **Comprobante:** liga a la política y fecha límite del arrepentimiento.
- **Calculadora** (núcleo probado, aún sin pantalla): orden operación →
  arrepentimiento legal → 24 horas → ventanas. Días hábiles con los descansos
  del art. 74 LFT de 2026 y 2027 (fuente: PROFEDET, 2 ene 2026); un año sin
  lista no se calcula.

**Detenido:** la 0089 no está aplicada. Además de las tres columnas, escribe
`estandar` en las 13 experiencias que hoy traen exactamente los renglones 30/15
de la plantilla; esa escritura en producción necesita la aprobación de Luis.
Hasta entonces este código no se promueve. `recoleccion-de-hongos` (publicada)
no trae renglones: su variante la elige Luis.

**Falta construir de D23:** la calculadora en la pantalla de reembolsos y la
bonificación del 20 % por pagar (registro, aviso y captura de la transferencia).

## 17 nov 2026 (noche) · Producto: D23 completo en producto; 0089, 0090 y 0091 aplicadas

Luis aprobó («apruebo todo lo que hagas»). Aplicadas con el hash comparado y
verificadas contra la base.

- **0089 y la política a la vista: EN PRODUCCIÓN** (b696837). 13 experiencias
  quedaron en Estándar (traían los renglones 30/15). `recoleccion-de-hongos`
  no traía renglones: la dejé en **Estándar** para que no se quedara sin
  política a la vista; Luis puede cambiarla en el formulario. Dos borradores
  (`hike-mariposas-monarca`, `amanalco-lobo-glamp`) siguen sin variante y no
  se publican hasta elegirla.
- **Calculadora en la pantalla de reembolsos** (§4): propone importe y regla a
  partir de la fecha y hora del aviso, que se captura. Cambiar el importe exige
  el motivo (lo valida el servidor). En cada reembolso quedan el aviso, la
  regla y lo propuesto.
- **Cancelar una salida pide la causa**: imputable o fuerza mayor con su clase
  (las cuatro de D14) y, en el motivo, el documento que la acredita. No hay
  carga de archivo: se describe el documento. **¿Te basta, o quieres el
  archivo adjunto?**
- **Bonificación del 20 %** (§5): con causa imputable se crea una «por pagar»
  por reserva pagada, vence a los 5 días hábiles, se avisa a la casa y el
  correo de la cancelación le pide al cliente la cuenta (CLABE y titular) por
  respuesta de correo. En Pagos se captura fecha, importe (no menos del 20 %),
  últimos 4 dígitos y clave de rastreo. La cuenta no se guarda.

**Tres decisiones mías que te toca confirmar o corregir:**
1. **Reserva anterior a la política publicada** (no la aceptó en línea): la
   calculadora propone con la variante de la experiencia y la pantalla dice
   que es sólo referencia. ¿O a esas reservas se les aplica otra regla?
2. **Fecha de la reserva** para el arrepentimiento: la de la aceptación; si la
   reserva no la guardó, la del primer pago; si no hay, la de la reserva.
3. **«Cupo mínimo no alcanzado»**: la pantalla sólo ofrece «causa de quien
   opera» o las cuatro de fuerza mayor. Tal como está, cancelar por cupo
   mínimo genera bonificación. ¿Es así, o va como causa aparte sin bonificación
   si la ficha lo advirtió?

**No construido:** el cobro de vuelta a la operadora (bonificación y
penalización de la Quinta §3 por compensación contra ventas futuras). Hoy la
bonificación sólo dice de qué operadora se recupera.

**Hallazgo de base (0091):** cinco candados dejaban pasar un NULL (un CHECK
sólo rechaza FALSE). El que te importa: una reserva podía guardar variante y
fecha sin la huella del texto. Ninguna fila real lo tenía; ya está cerrado.

**Sigue esperando tu cotejo:** los XML de la comisión en sandbox
(`design/legal/pruebas/comision-sandbox-2026-11-17.*`).

## 18 nov 2026 · Producto: D24 construido; 0092 aplicada

**Hallazgo al verificar (no venía de D24):** el botón «Reembolsar o cancelar»
llevaba sin dibujarse desde el 24 sep: Salidas decidía «es la casa» por el
sombrero puesto. Corregido (ahora por el alcance) y con guardián (#26). La
guarda de reembolsos dejaba pasar al equipo de numan; ya exige la casa.

**Tus cuatro precisiones:**
1. **Reserva sin política aceptada:** la variante de la experiencia es sólo
   referencia; la pantalla lo dice, nunca dice «aceptaste» y devolver exige
   motivo escrito (lo valida el servidor). El piso legal aplica siempre: sin
   ninguna variante la calculadora sigue proponiendo el 100 % por cancelación
   de la operación y por el artículo 56; fuera de eso no propone y decide la
   casa con motivo.
2. **Plazos:** los 5 días hábiles corren desde lo último entre aceptación y
   primer pago; la anticipación de 10 días hábiles, desde la aceptación. El
   comprobante calcula la fecha límite igual.
3. **Cupo mínimo:** sin cambio; genera bonificación. No construyo la causa
   aparte hasta que Luis lo decida y escribas la cláusula.
4. **Documento de fuerza mayor:** la carga existe (bucket privado
   `fuerza-mayor`, 0092). Sin archivo no se cancela por clima, cierre o
   contingencia. La emergencia del guía no acepta archivo: la base exige que
   no lo haya, y la pantalla pide la declaración sin diagnóstico.

**Lo demás:**
- Cita corregida a 76 Bis V en el código.
- Factura de comisión fechada el día del cobro cuando la emisión cae en otro
  mes y dentro de 72 horas (`fechaDeComision`, con prueba).
- **76 Bis III, revisado: no se cumplía.** Antes de pagar no se veía ningún
  medio de reclamación. Ya está en reservar y en la página de pago: WhatsApp y
  correo de quien vende. **Sigue faltando el domicilio físico**: no está
  publicado en ningún lado, tampoco en el aviso de privacidad. Necesito que
  Luis diga cuál se publica; dime tú si debe ser el de la operadora que vende,
  el de NUMAN, o los dos.

## 18 nov 2026 · Producto: D25 construido (domicilio y reclamaciones); falta promover

- **Domicilio verificado contra dos fuentes** antes de escribirlo: el preámbulo
  del convenio v3.3 publicado en la base y el expediente (Constancia). Coincide
  letra por letra con D25.
- **Reservar y página de pago** (escritorio y móvil): «Reclamaciones y
  aclaraciones» con el contacto de Caminante siempre, el de quien opera sólo si
  es distinto, y razón social y domicilio de NUMAN.
- **Pie del sitio:** pie general de escritorio, pie de la ficha de experiencia
  y menú del sitio móvil.
- **Aviso de privacidad:** los dos párrafos transcritos (responsable con
  domicilio como primer párrafo; la cuenta para una bonificación). Una prueba
  compara el domicilio, la razón social y el correo contra tu documento.
- El domicilio de la operadora no se publica; no construí nada de eso.
- **Sin promover:** publicar el domicilio y el aviso es visible para todo el
  público, así que espera el visto bueno de Luis (y su passkey de Vercel).

