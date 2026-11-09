# NUMAN HUB como plataforma retenedora — altas, calendario y La Caja

**9 nov 2026.** Qué tiene que hacer NUMAN HUB ante el SAT para **retener y
enterar** ISR e IVA a las operadoras, emitir el CFDI de retenciones y presentar
la informativa; y qué cambia en La Caja (`~/Finanzas`) para llevarlo.
Texto legal leído del PDF oficial de la Cámara de Diputados el 9 nov 2026.
**Todo lo marcado ⚠️ lo confirma Marisol** (`MEMO-MARISOL-2026-11.md`).

## 1 · Por qué NUMAN cae en el régimen

- **LIVA 1-A BIS**: «los contribuyentes residentes en México que proporcionen
  los servicios digitales a que se refiere la fracción II del artículo 18-B
  [intermediación entre terceros] … que operen como intermediarios en
  actividades realizadas por terceros afectas al pago del IVA … estarán
  obligados a cumplir con las obligaciones a que se refiere el artículo 18-J».
- **LISR 113-A párrafo segundo**: el ISR de las personas físicas que venden por
  plataformas «se pagará mediante retención que efectuarán las personas morales
  residentes en México … que proporcionen … el uso de las citadas plataformas».
- **LIF 2026 art. 25 fracc. VI y IX**: extiende en 2026 la retención a
  **personas morales** (ISR 2.5 %, IVA 50 %).

Caminante publica experiencias de operadoras, **cobra el precio por su cuenta**
y les deposita: es exactamente el supuesto. Con Stripe Connect (cargo a nombre
de la operadora) quien cobra es Stripe por cuenta de la operadora y el
`application_fee` es de NUMAN: ⚠️ Marisol/Eduardo confirman si eso cambia algo
(pregunta 2 de la respuesta a Ekko del 25 sep). El plan asume que **no**: las
retenciones viajan dentro del `application_fee`.

## 2 · Las tasas (2026)

| Operadora | ISR | IVA | Sin RFC | Fundamento |
|---|---|---|---|---|
| Persona física, prestación de servicios | **2.5 %** del ingreso sin IVA | **50 %** del IVA trasladado (8 % del precio sin IVA) | ISR **20 %** · IVA **100 %** | LISR 113-A III (1 %) sustituido por LIF 2026 25-VI (2.5 %); LIVA 18-J II a); 113-C IV (20 %) |
| Persona moral | **2.5 %** | **50 %** | ISR **20 %** · IVA 100 % si deposita en el extranjero | LIF 2026 25-VI y 25-IX a) — **sólo 2026** salvo que la LIF 2027 lo repita |
| Hospedaje desglosado (si alguna vez) | 4 % | 50 % | 20 % / 100 % | LISR 113-A II |
| Transporte terrestre desglosado | 2.1 % | 50 % | 20 % / 100 % | LISR 113-A I |

Base: **el total que la operadora efectivamente percibe por conducto de la
plataforma, sin IVA**, incluidos pagos adicionales (113-A párrafo tercero). Es
decir, sobre el **precio de la experiencia sin IVA**, no sobre el neto después
de comisión. ⚠️ Marisol confirma la base (bruto cobrado vs neto de comisión).

Ejemplo con la venta de referencia ($1,750 con IVA; base $1,508.62; comisión
20 % = $301.72 + IVA $48.28), operadora persona física con RFC:

| Concepto | Importe |
|---|---|
| Cobrado al cliente | $1,750.00 |
| Comisión NUMAN + IVA (B2) | −$350.00 |
| Retención ISR 2.5 % × $1,508.62 | −$37.72 |
| Retención IVA 50 % × $241.38 | −$120.69 |
| **Depósito a la operadora** | **$1,241.59** |
| NUMAN entera al SAT el día 17 | $158.41 |

(La operadora acredita los $158.41 en su propia declaración; su CFDI al cliente
sigue siendo por $1,750.)

## 3 · Altas y avisos ante el SAT

| # | Obligación | Fundamento | Cómo | Quién |
|---|---|---|---|---|
| 1 | **Inscribirse como retenedora** (actualización de obligaciones en el RFC: «Retenciones de ISR por servicios de plataformas tecnológicas» y «Retenciones de IVA por servicios digitales de intermediación») | LIVA 18-J II d); LISR 113-C | Aviso de actualización de actividades económicas y obligaciones (portal SAT, con e.firma de NUMAN) ⚠️ Marisol dice la ficha exacta | Marisol + Luis (e.firma) |
| 2 | Agregar actividad de **intermediación / comisión mercantil** a la CSF | Congruencia CSF ↔ CFDI 80141628 | Mismo aviso | Marisol |
| 3 | Publicar en el sitio el IVA por separado **o** el precio con la leyenda **«IVA incluido»** | LIVA 18-J fracc. I | Cambio de texto en la página pública (sesión de código) | código |
| 4 | Recabar de cada operadora: nombre/razón social, **RFC, CURP, domicilio fiscal, banco y CLABE** | LIVA 18-J fracc. III | Ya está casi todo en «Mi alta»; falta **CURP** y domicilio fiscal estructurado (sesión de código) | código |

## 4 · Calendario mensual (lo que NUMAN hace cada mes)

| Cuándo | Qué | Fundamento |
|---|---|---|
| Durante el mes | Cada cobro de operadora calcula ISR e IVA retenidos (configuración por tipo de persona y año) | 113-A, 18-J |
| **Día 5** del mes siguiente | **CFDI de retenciones e información de pagos** a cada operadora, con complemento «Servicios Plataformas Tecnológicas» (un complemento por `TipoDeServ`; CveRetenc 26 ⚠️) — documento **R1** | LISR 113-C II; LIVA 18-J II c) |
| **Día 10** | **Declaración informativa** de operadoras (datos del 18-J III + monto por operadora) | LIVA 18-J III |
| **Día 17** (NUMAN: **día 22** por el sexto dígito del RFC — el acuse manda) | **Entero** de ISR retenido y de IVA retenido por plataformas (declaraciones de retenciones; Marisol las presenta con las del mes) | LISR 113-C IV; LIVA 18-J II b) |
| Anual | La operadora recibe el acumulado; NUMAN conserva la evidencia de retención y entero | 113-C V |

Riesgo que vale la pena decir: para plataformas **residentes** no aplica el
bloqueo del 18-H BIS (113-D lo limita a extranjeras), pero sí las multas del
CFF por no retener/no enterar y la **no deducibilidad** del pago a la operadora
sin retención (LISR 27 V).

## 5 · Qué cambia en La Caja (~/Finanzas) — spec para la sesión de código

Hoy La Caja lleva IVA e ISR de NUMAN y de Luis, y el `ingresos.csv` de ventas.
Para llevar la plataforma como retenedora hace falta:

1. **`fiscal/calendario.md`**: tres filas nuevas para NUMAN — día 5 (CFDI de
   retenciones), día 10 (informativa de plataformas), día 17/22 (entero de
   retenciones ISR e IVA plataformas). El `/lunes` y `/impuestos` las levantan.
2. **`impuestos_seguimiento.csv`**: dos obligaciones nuevas por periodo para
   NUMAN: `ret-isr-plataformas` y `ret-iva-plataformas` (línea de captura +
   pago + acuse, igual que IVA/ISR).
3. **Carpeta** `NUMAN-HUB_NHU250826CS8/retenciones/<año>/<MM>/` con los XML+PDF
   de los **CFDI de retenciones emitidos** (R1) por operadora, y el acuse de la
   informativa. Los emite el portal (Facturapi) y los drena a La Caja el mismo
   write-back de la Fase 5 del MAPA (`cfdi_invoices.tipo = 'retencion'`).
4. **`ingresos.csv`**: por venta de operadora, columnas `comision_mxn`,
   `iva_comision_mxn`, `ret_isr_mxn`, `ret_iva_mxn`, `liquidado_mxn` — o mejor:
   el ingreso de NUMAN es **sólo la comisión** (B2); el bruto de la operadora
   no es ingreso de NUMAN. Un `liquidaciones.csv` por operadora con
   cobrado − devuelto − comisión − retenciones = depositado, que cuadre con el
   SPEI del estado de cuenta (hoy la conciliación bancaria ya cruza SPEIs).
5. **`/cierre-mes`**: en el briefing a Marisol, bloque «Plataforma»: suma de
   retenciones del mes por operadora (base, ISR, IVA), lista de R1 emitidos,
   y la informativa lista para el día 10.
6. **`categorias.md`**: categoría `impuestos-retenidos-plataforma` (pasivo, no
   gasto) para los enteros; y el egreso del SPEI a operadoras como
   `liquidacion-operadora` (no es gasto de NUMAN: es dinero de terceros).

Mientras DRUIDAS no exista y no haya cobro de operadora externa nuevo, **no hay
nada que retener**: la única venta externa de 2026 (Nomádika, $21,000 en sep,
liquidada sin retención) ⚠️ Marisol dice si se corrige con un entero
extemporáneo + R1 o se deja (pregunta 2 a Ekko: «¿aplica también a lo ya
cobrado por la casa para Nomádika?»).
