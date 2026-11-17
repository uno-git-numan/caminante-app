# Emisión de prueba de la factura global sin recibos — sandbox de Facturapi, 17 nov 2026

**Qué se probó.** Que la API de Facturapi que ya se paga ($299/mes) acepta la
factura global armada por la plataforma como un CFDI de ingreso normal, **sin**
el producto «E-Receipts y autofactura» ($599/mes por organización). Organización
NUMAN HUB, ambiente **Test** (`livemode: false`: no va al SAT, no consume
timbres). Luis autorizó tomar la llave de pruebas; se usó dentro de la página de
Facturapi y no se guardó en ningún lado.

**El cuerpo** es el que arma `crearFacturaGlobal` (`lib/facturacion/facturapi.ts`):
tres pagos de ejemplo (folios CAM-000079, CAM-000080 y CAM-000081 por $11,500,
$2,550 y $8,000 con IVA incluido), forma de pago 04, PUE, nodo global mensual
de noviembre de 2026 y fecha de emisión pedida 48 horas atrás.

## Resultado: aceptada

`POST /v2/invoices` → 200, `status: valid`, tipo I, total $22,050.00, serie F
folio 1, UUID de prueba `C838F0E8-4B08-4584-94EB-DBCEB27AA9FD`.

Leído del XML que devolvió Facturapi:

| Nodo | Valor |
|---|---|
| Comprobante | TipoDeComprobante `I` · SubTotal `19008.62` · Total `22050.00` · FormaPago `04` · MetodoPago `PUE` · LugarExpedicion `11000` · Exportacion `01` |
| Fecha | `2026-11-15T17:54:23` (hora local): la fecha pedida, 48 h atrás. Facturapi **respeta la fecha atrasada** |
| InformacionGlobal | Periodicidad `04` · Meses `11` · Año `2026` |
| Receptor | Rfc `XAXX010101000` · Nombre `PUBLICO EN GENERAL` · RegimenFiscalReceptor `616` · UsoCFDI `S01` · DomicilioFiscalReceptor `11000` (= LugarExpedicion) |

| Concepto | ClaveProdServ | NoIdentificacion | Cantidad | ClaveUnidad | Descripcion | ValorUnitario (sin IVA) | ObjetoImp | Traslado |
|---|---|---|---|---|---|---|---|---|
| 1 | 01010101 | CAM-000079 | 1 | ACT | Venta | 9913.793103 | 02 | 002 · Tasa · 0.160000 · 1586.206897 |
| 2 | 01010101 | CAM-000080 | 1 | ACT | Venta | 2198.275862 | 02 | 002 · Tasa · 0.160000 · 351.724138 |
| 3 | 01010101 | CAM-000081 | 1 | ACT | Venta | 6896.551724 | 02 | 002 · Tasa · 0.160000 · 1103.448276 |

Lo que legal pidió ver, todo presente: ValorUnitario sin IVA, traslado 002 al
0.160000, ObjetoImp 02 y el nodo InformacionGlobal 04/mes/año. La fecha «último
día del mes» no se puede probar hasta el 1 de diciembre (hoy el 30 de noviembre
es futuro); lo que sí quedó probado es que la fecha atrasada se respeta.

## La llave de idempotencia

- Misma llave después de un timbrado exitoso → **409** «The idempotency key is
  already being used by another request». No timbra dos veces, pero tampoco
  devuelve la factura anterior: hay que ir a buscarla.
- Misma llave después de una petición **rechazada** (400 por un dato inválido) →
  se puede volver a usar y timbra. Un error de validación no quema la llave.

Consecuencia para el código: si una global se timbró y la plataforma no alcanzó
a anotarla, el reintento contesta 409 y no duplica; el mensaje tiene que decir
«revisar en Facturapi si quedó timbrada».

## El egreso contra la global (D19)

`POST /v2/invoices` con `type: "E"`, público en general, relacionado 01 con el
UUID de la global de prueba → 200, tipo E, total $1,500.00, UUID de prueba
`8DB5C439-73BE-490F-BFFC-62DB8016BB58`. Facturapi lo acepta sin nodo global.

⚠️ Esta prueba se hizo con la clave de la experiencia (90121501) y uso S01,
**antes** de leer D21 bis, que pide clave 84111506, el folio en
NoIdentificacion y uso G02. Hay que repetirla con esos valores cuando se
construya la corrección.
