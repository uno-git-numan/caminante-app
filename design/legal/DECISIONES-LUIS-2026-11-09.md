# Lo que le toca decidir a Luis — sesión legal y fiscal del 9 nov 2026

Siete tareas trabajadas; cada una tiene su documento. Aquí sólo lo que **Luis
decide o hace con sus manos**, en orden de urgencia. Nada de lo de abajo se
manda a Jorge, Marisol o Laura hasta que Luis lo diga.

## Hoy mismo (destraban todo lo demás)

| # | Decisión / acción | Opciones | Dónde está el detalle |
|---|---|---|---|
| 1 | **Mandar el correo a Marisol** (borrador en Gmail: «Caminante · 7 confirmaciones fiscales + exportación del SAT») | Revisar y enviar tal cual · pedir cambios | `design/contabilidad/MEMO-MARISOL-2026-11.md` |
| 2 | **Contratar Facturapi** (plan «API de Facturación CFDI», $299/mes) y subir el CSD de NUMAN | Hoy · esperar a Marisol | `design/contabilidad/FACTURAPI-ALTA-PASOS.md` |
| 3 | ~~**Socios de DRUIDAS**~~ **DECIDIDO 9 nov: (a) espejo de NUMAN** — Luis + Concepción, misma proporción que NUMAN HUB; otros entran por aumento de capital | (b) NUMAN HUB socia y (c) cap table con Mario/León quedaron descartadas | `design/legal/DRUIDAS-CONSTITUCION.md` §2.3 |
| 4 | **Figura y nombre de DRUIDAS** | S.A. de C.V. (recomendada: con socios espejo la S.A.P.I. sobra) · 3 opciones de denominación · domicilio fiscal físico | ídem |
| 5 | **Regla de transición**: NUMAN termina (cobra, factura y paga proveedores de) las salidas ya cobradas; DRUIDAS emite desde que tenga CSD | sí · otra regla | ídem §4 |
| 6 | **Guardar en Drive** `numan/CAMINANTE/legal/` el PDF «Numan Propuesta servicios 27 oct 26.pdf» que Jorge mandó el 3 nov (no está en Drive; hay que cruzarlo con el brief de DRUIDAS) | — | correo de Jorge, 3 nov |

## Esta semana

| # | Decisión / acción | Dónde |
|---|---|---|
| 7 | ~~**Porcentajes de cancelación**~~ **DECIDIDO 9 nov (noche)**: ventanas 30/15 y 60/30 → 100/50/0 %, arrepentimiento 24 h si la salida está a 7+ días, penalización a la operadora 0/10/20/30 %, mín. $500, tope $15,000, fuerza mayor exenta, descontada de la siguiente liquidación | `design/operadores/CONVENIO-v3.md` Quinta |
| 8 | **Mandar el convenio v3 a Jorge** (`CONVENIO-v3.md` + `CONVENIO-v3-FIRMABLE.md`) con la tabla «Lo que falta para publicar». El v2 quedó superado la misma noche por el alta nueva | `CONVENIO-v3.md`, tabla final |
| 8b | ~~Nomádika cobra por cuenta conectada sin retención~~ **Falso, corregido la noche del 9 nov**: verificado en Stripe LIVE, ninguna venta ha pasado por cuenta conectada; a Nomádika NUMAN le paga contra factura de servicios (pregunta h4 a Marisol). No hay nada que pausar ni regularizar | `MEMO-MARISOL-2026-11.md` h |
| 9 | **Mensaje a Cat/Laura (Nomádika)** pidiendo su CSF para saber su régimen (¿RESICO?) | `design/legal/ONBOARDING-FISCAL-OPERADORA-PF.md` |
| 10 | **Alta de NUMAN como retenedora** ante el SAT: lo presenta Marisol con la e.firma de Luis cuando conteste el memo | `design/contabilidad/NUMAN-PLATAFORMA-RETENEDORA.md` §3 |

## 12 nov 2026 · PUBLICAR EL CONVENIO v3.2 (listo; lo corres tú)

La retención ya está en producción (8d24964), que era la condición. El SQL está
generado: `design/operadores/CONVENIO-v3.2-PUBLICAR.sql`. Antes de Run, compara:
`shasum -a 256 design/operadores/CONVENIO-v3.2-PUBLICAR.sql` →
`e46f02bdff71550112a08004957f28e499305f2c1988c1f7e403c5c09814f3da`, y el hash
del texto que el SQL verifica solo es `9a0bdb6d…3de0`. Si el pegado pierde un
carácter, el bloque `DO` del final lo rechaza. Después, verifica por PostgREST
que `operator_agreement_versions` tiene la fila `v3.2`. Desde ese momento las
operadoras pueden firmar en `/caminante/admin/mi-alta/convenio`.

## 11 nov 2026 (noche) · DECIDIDO: camino B (Airbnb, con retención)

Luis: «Hay que hacerlo como hace airbnb entonces. Construye.» La comparación A/B/C
queda en `RETENCION-TRES-CAMINOS-2026-11-11.md`. Le queda a Luis: D15 (liberar el
dinero antes o después; hoy antes), mandar `DECISIONES-LEGAL-FISCAL-2026-11-11.md`
a Marisol, publicar el convenio v3.2 cuando producto confirme el candado, pedir la
CSF de Nomádika, y firmar el alta de retenedora que presente Marisol.

## 11 nov 2026 (tarde) · Cambió el mandato: legal decide, Marisol revisa

Luis: «Jorge ya no existe… quiero que legal tome esas decisiones con su criterio
y vayamos construyendo así». Todo lo que arriba decía «Jorge» o «Marisol
confirma» quedó **decidido** en `DECISIONES-LEGAL-FISCAL-2026-11-11.md`. Lo que
le queda a Luis de esa lista: **mandar ese documento a Marisol** (sustituye al
correo de preguntas, o lo acompaña), **D15** (liberar el dinero antes o después:
es de negocio), publicar el convenio v3.2 con el hash cuando producto confirme
el candado de retención, pedir la CSF de Nomádika, y firmar con la e.firma el
aviso de retenedora que presente Marisol. Las filas 11–13 de abajo quedan así:
11 → sigue siendo de Luis (D15); 12 → decidido por legal (piso legal + 24 h);
13 → ya no aplica: el correo a Marisol lleva el documento de decisiones.

## Agregadas el 11 nov 2026 (bitácora de la sesión de producto, preguntas i1–i3)

| # | Decisión / acción | Dónde |
|---|---|---|
| 11 | **¿Liberar el dinero a la operadora antes de la salida (como hoy, a propósito) o después de la experiencia (como Airbnb)?** Con el perfil B que aceptaste en Stripe, NUMAN responde por reembolsos y saldos negativos: si la operadora ya dispuso y hay que devolver, el hueco lo cubre NUMAN y lo persigue. Liberar después reduce ese riesgo; liberar antes le da el anticipo a la operadora. No lo cambié | `CONVENIO-v3.md` Cuarta §6, nota 🔸 |
| 12 | **Ventana de arrepentimiento vs. LFPC 56**: la ley da al cliente 5 días hábiles para revocar una compra fuera del establecimiento (la web lo es), salvo que el servicio esté a 10 días hábiles o menos. Tus 24 h (salida a 7+ días) son más cortas cuando la salida está a más de 10 días hábiles. Propuesta: «24 horas, o el plazo mayor que la ley conceda al cliente». Lo decide Jorge contigo; no cambié los números | `CONVENIO-v3.md` Quinta, nota 🔸 i2 |
| 13 | **¿Agrego la pregunta i1 (IVA y CFDI de la cuota de admisión) al correo a Marisol** antes de que lo mandes? Son cuatro renglones; ya están en el memo | `MEMO-MARISOL-2026-11.md` sección i |
| 14 | **Decidido y redactado sin preguntarte** (era tu instrucción a la sesión de producto): cuota de admisión $20 una sola vez por compensación (Cuarta §3 bis); aceptación del contrato de Stripe dentro del convenio con el texto que Stripe exige (Cuarta §7 a); traslado de reembolsos/contracargos/multas/fraude a la operadora cuando le sean imputables (Quinta §9); consentimiento expreso por la CLABE (Octava §3). Jorge revisa los cuatro | `CONVENIO-v3.md`, tabla final filas 9–15 |
| 15 | **Para la sesión de producto, no para ti:** el aviso de privacidad tiene que enlazar al de Stripe con la frase que Stripe exige y llevar la cláusula de aceptación de la transferencia (LFPDPPP 2025 art. 35) antes de prender `COBRO_EN_PLATAFORMA`; y cuadrar en Stripe si la cuenta de Nomádika quedó con pérdidas a cargo de Stripe o de NUMAN | bitácora, respuesta del 11 nov |

## Lo que NO le toca a Luis (ya quedó listo o es de otros)

- La sesión de código tiene spec para: tasas por configuración (año × tipo de
  persona), gate 625/RESICO en «Mi alta», CURP y CLABE en el expediente, leyenda
  «IVA incluido», R1 por Facturapi, cruce del CSV del SAT, y los cambios de La
  Caja (`NUMAN-PLATAFORMA-RETENEDORA.md` §5). **Nada se construye hasta que
  Marisol conteste a, b y c.**
- Jorge: 10 puntos de exigibilidad en la tabla final del convenio v2 + el brief
  de DRUIDAS cuando Luis decida 3–5.
- Marisol: las 7 confirmaciones + exportación del SAT a
  `Drive/CONTABILIDAD/NUMAN-HUB_NHU250826CS8/2026/cfdi-emitidos-sat/`.

## Dónde quedó todo

| Tarea | Archivo en el repo | Drive | Notion |
|---|---|---|---|
| 1 DRUIDAS | `design/legal/DRUIDAS-CONSTITUCION.md` | `numan/CAMINANTE/legal/` | página «Caminante · Legal y fiscal (nov 2026)» |
| 2 Memo Marisol | `design/contabilidad/MEMO-MARISOL-2026-11.md` | `CONTABILIDAD/` | ídem |
| 3 El pasado | `design/contabilidad/EL-PASADO-CFDI-2026.md` | `CONTABILIDAD/NUMAN-HUB_…/2026/cfdi-emitidos-sat/LEEME.md` | ídem |
| 4 Facturapi | `design/contabilidad/FACTURAPI-ALTA-PASOS.md` | `CONTABILIDAD/` | ídem |
| 5 Retenedora | `design/contabilidad/NUMAN-PLATAFORMA-RETENEDORA.md` | `CONTABILIDAD/` + `~/Finanzas/docs/` | ídem |
| 6 Onboarding PF | `design/legal/ONBOARDING-FISCAL-OPERADORA-PF.md` | `numan/CAMINANTE/legal/` | ídem |
| 7 Convenio | `design/operadores/CONVENIO-v2.md` | `numan/CAMINANTE/legal/` | ídem |
