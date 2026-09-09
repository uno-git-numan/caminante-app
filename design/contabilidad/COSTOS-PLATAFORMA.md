# Qué cuesta correr la plataforma

**8 sep 2026.** Precios leídos de las páginas oficiales ese día. Tipo de cambio
**16.951 MXN/USD** (frankfurter.dev, 8 sep). Mediciones contra la base de
producción, no estimadas: 58 pagos, ticket promedio **$13,118**, 1,585 MB en
Storage, 4 puntos de llamada a la API de Anthropic.

Este documento existe porque el cotizador y la tabla de comisiones se diseñaron
contra un solo costo —Stripe— y la plataforma tiene más.

---

## 1 · Lo urgente no es el dinero, son dos límites que ya rebasamos

**Vercel Hobby prohíbe el uso comercial.** Textual en la documentación: *"the
Hobby plan restricts users to non-commercial, personal use only"*
(`vercel.com/docs/plans/hobby`, actualizado 31 ago 2026). El sitio cobra con
Stripe en LIVE desde el 1 jul. Esto no es una cuota que se agota: es una causa
de suspensión de cuenta, y la suspensión tira el sitio y el webhook de pagos con
él. **Subir a Pro ($20 USD/mes) es regularizar, no optimizar.**

Hobby además limita el cron a una corrida diaria — por eso el publicador de
redes dispara una vez al día. Ese techo es de producto, no sólo de facturación.

**Supabase Free da 1 GB de Storage y tenemos 1,585 MB.** Medido recorriendo los
buckets: 852 archivos en `experiences`. El otro techo del plan Free son 5 GB de
egress al mes, y las fotos se sirven **directo desde Storage** (sólo un archivo
del repo usa `next/image`), así que cada vista de una página de experiencia
gasta ese egress. No pude medir el egress real —vive en el dashboard de
Supabase, al que no tengo acceso—; **hay que mirarlo antes de decidir nada más.**

---

## 2 · El piso fijo cuando salgamos de los planes gratis

| Servicio | Plan | USD/mes | MXN/mes |
|---|---|---:|---:|
| Vercel | Pro, 1 asiento | $20 | $339 |
| Supabase | Pro | $25 | $424 |
| Resend | Pro, 50k correos | $20 | $339 |
| Facturapi | API de Facturación CFDI | — | $299 |
| | | | **$1,401** |

Facturapi ya está en MXN con IVA. Es el único que no tiene versión gratis: en
cuanto se timbre el primer CFDI son $299/mes + $0.60 por timbre.

**$1,401/mes es el costo de existir**, con cero ventas. Es menos que una sola
comisión de una reserva promedio.

## 3 · Lo variable

| Concepto | Costo | Sobre qué |
|---|---|---|
| Stripe | 3.6% + $3 + IVA ≈ **4.9%** | cada cobro, sobre la base sin IVA |
| Timbre CFDI | $0.60 | cada factura |
| WhatsApp *utility* | ≈ $0.14 | cada mensaje de plantilla |
| WhatsApp *marketing* | ≈ $0.74 | cada mensaje promocional |
| Anthropic (Opus 4.8) | ≈ $42 **techo** | cada experiencia nueva |

El techo de la IA sale de sumar los `max_tokens` de los cuatro puntos de llamada
—`prellenar` 16k, `ficha-ia` 12k, `kit-captions` 8k × 5 lotes,
`fusionar-deslinde` 12k— a $5/$25 por millón. El consumo real es menor; **no lo
medí, y para medirlo hay que leer `usage` de las respuestas y guardarlo.** Aun
en el techo, la IA es ruido: una experiencia nueva cuesta menos que una comida.

Supabase Pro incluye 250 GB de egress ($0.09/GB después) y Vercel Pro 1 TB
($0.15/GB después). A nuestro tamaño ninguno de los dos se toca.

## 4 · Cómo se diluye

Ticket promedio $13,118. El fijo se reparte entre las reservas del mes:

| reservas/mes | fijo | IA | Stripe | otros | **total** | **% del ticket** |
|---:|---:|---:|---:|---:|---:|---:|
| 15 (hoy) | $93 | $3 | $643 | $1 | **$740** | **5.64%** |
| 100 | $14 | $2 | $643 | $1 | **$660** | **5.03%** |
| 500 | $4 | $1 | $643 | $1 | **$649** | **4.95%** |

**La conclusión es que casi no hay economía de escala que ganar, porque casi
todo el costo ya es Stripe.** Entre 15 y 500 reservas al mes el costo baja 0.7
puntos porcentuales. El piso variable no baja de ~4.9% por diseño: es la tarifa
de la tarjeta.

Dicho al revés: **la infraestructura no es el problema. Stripe es el 87% del
costo de la plataforma hoy, y el 99% a escala.** La palanca real de unit
economics no es cambiar de plan, es negociar la tasa de Stripe o mover volumen a
transferencia.

---

## 5 · Qué le hace esto a las comisiones

La escala recomendada **15/13/11/9/8** se propuso contra un piso de 4.9%
(Stripe solo). Con el costo TOTAL de hoy —5.64%— sigue de pie:

| ticket | VENTA | PLATAFORMA hoy | PLATAFORMA nueva | brecha | margen sobre costo |
|---:|---:|---:|---:|---:|---:|
| $5,000 | 19.2% | 18.8% | 14.2% | 5.0 pp | 8.6 pp |
| $13,118 | 17.7% | 16.5% | 12.7% | 5.0 pp | 7.1 pp |
| $16,000 | 17.2% | 15.9% | 12.2% | 5.0 pp | 6.7 pp |
| $32,000 | 15.6% | 13.4% | 10.6% | 5.0 pp | 5.0 pp |
| $50,000 | 15.0% | 12.0% | 9.8% | 5.2 pp | 4.2 pp |

Los tramos son marginales, así que **el 8% del último tramo nunca es la tasa
efectiva**: ni a $50,000 baja de 9.8%. El margen más delgado de la tabla —4.2
puntos sobre el costo total— sigue siendo positivo y sólo aplica a tickets que
hoy no vendemos.

Y arregla lo que estaba al revés: la escala de hoy sólo se separa 1.2 puntos de
VENTA en el ticket promedio, es decir casi no premia que el operador traiga a su
cliente. La nueva se separa **5 puntos parejos en todo el rango**.

## 6 · Dos huecos que esto destapa

1. **El cotizador no cobra nada por la plataforma.** En las experiencias propias
   no hay comisión, así que los $1,401/mes y el 4.9% de Stripe salen del margen
   de la experiencia sin aparecer en el costeo. Stripe sí está; el fijo no.
2. **Nadie mide el consumo de la IA.** Las respuestas traen `usage` y se tira.
   Sin eso, el "techo de $42" se queda en techo.

## 7 · Cuándo brinca cada plan

| Servicio | Se sale del gratis cuando… | Estado |
|---|---|---|
| Vercel | el uso es comercial | **ya** (Stripe LIVE desde el 1 jul) |
| Supabase | >1 GB Storage ó >5 GB egress/mes | **ya** (1,585 MB) |
| Resend | >3,000 correos/mes ó >100/día | ~90 correos/mes de reservas; brinca cuando el boletín pase de ~2,500 suscriptores (hoy 66 contactos) |
| Facturapi | al primer timbre | pendiente de la cuenta y el CSD |
