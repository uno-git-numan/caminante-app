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

---

# Segunda ronda (17 nov 2026, noche): D21 bis probado, y los XML archivados

Luis autorizó la llave de pruebas. Los tres XML están en esta carpeta, tal como
los devolvió Facturapi (ambiente Test, sin validez fiscal):

| Archivo | Qué es | UUID de prueba |
|---|---|---|
| `global-sandbox-2026-11-17.xml` | La global de la primera ronda (tres pagos, todos 04) | C838F0E8-4B08-4584-94EB-DBCEB27AA9FD |
| `global-mixta-sandbox-2026-11-17.xml` | Global con formas de pago mezcladas | 77A5BD65-FF0E-4F1E-8190-EE8A4AA29805 |
| `egreso-contra-global-sandbox-2026-11-17.xml` | Egreso contra la global mixta, con los valores de D21 bis | BD6E70BC-0E9E-45F0-8DA8-08BF4B5041C5 |

En los tres: Emisor `NUMAN HUB`, RFC `NHU250826CS8`, RegimenFiscal `601`;
LugarExpedicion `11000`; Moneda MXN.

## Global con formas de pago mezcladas (corrección 1 de D21 bis)

Cuatro pagos: tres con tarjeta de $5,000 (suman $15,000) y una transferencia de
$9,000. La forma que **suma más** es 04; el **pago individual mayor** es la
transferencia. El cuerpo se armó con la regla nueva (`planGlobal`).

- Comprobante: tipo `I`, serie F folio 3, SubTotal `20689.66`, Total
  `24000.00`, **FormaPago `03`**, MetodoPago `PUE`, Fecha `2026-11-15T18:06:04`
  (pedida 48 h atrás).
- InformacionGlobal: Periodicidad `04`, Meses `11`, Año `2026`.
- Receptor: `XAXX010101000`, `PUBLICO EN GENERAL`, 616, `S01`, domicilio `11000`.
- Conceptos: CAM-000083, CAM-000084 y CAM-000085 con ValorUnitario
  `4310.344828`; CAM-000086 con `7758.620690`. Todos 01010101 / 1 / ACT /
  «Venta» / ObjetoImp 02 / traslado 002 Tasa 0.160000.
- Resumen de impuestos: base `20689.66`, IVA `3310.34`.
- Se mandó la llave también como `external_id`; buscar la factura con
  `GET /invoices?external_id=…` devuelve exactamente esa.

## Egreso contra la global (corrección 2 de D21 bis)

- Comprobante: tipo `E`, serie NC folio 2, SubTotal `1293.10`, Total `1500.00`,
  FormaPago `03`, MetodoPago `PUE`, Fecha `2026-11-17T18:06:06`.
- Relacionados: TipoRelacion `01` con el UUID de la global mixta.
- Receptor: `XAXX010101000`, `PUBLICO EN GENERAL`, 616, **UsoCFDI `G02`**,
  domicilio `11000`. Facturapi acepta G02 con régimen 616.
- Concepto: **ClaveProdServ `84111506`**, **NoIdentificacion `CAM-000086`**,
  Cantidad 1, ClaveUnidad `ACT`, Descripcion «Devolución · Experiencia de prueba
  · Nov 20-22», ValorUnitario `1293.103448`, ObjetoImp 02, traslado 002 Tasa
  0.160000 por `206.896552`.
- No lleva nodo InformacionGlobal (Facturapi no lo pide en el egreso).

## Una diferencia con la guía, para criterio de legal

En los tres XML cada concepto trae el atributo **`Unidad="Actividad"`**. La guía
del CFDI global dice que ese campo no debe existir. Lo agrega Facturapi a
partir de la clave de unidad `ACT`, y no deja quitarlo: mandar `unit_name`
vacío contesta 400 «is invalid» y mandarlo nulo, 400 «invalid type». El
sandbox lo timbra así; no sé si el SAT lo valida en Live.
