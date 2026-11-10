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
