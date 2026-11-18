# Emisión de prueba de la factura de comisión (B2) y de su egreso — sandbox de Facturapi, 17 nov 2026

**Qué se probó.** El CFDI de la comisión de NUMAN a la operadora con el renglón
de la cuota de admisión, y el egreso proporcional por una devolución de la
mitad. Organización NUMAN HUB, ambiente **Test** (sin validez fiscal, no va al
SAT). El cuerpo es el que arma `lib/facturacion/comisiones.ts`. Como receptor
se usó el contribuyente de pruebas del SAT (ESCUELA KEMPER URGATE,
EKU9003173C9, régimen 601, C.P. 26015), no una operadora real.

Los dos XML están en esta carpeta, tal como los devolvió Facturapi.

## `comision-sandbox-2026-11-17.xml` — factura de comisión con admisión

- Comprobante: tipo `I`, serie F folio 4, SubTotal `367.24`, Total `426.00`,
  **FormaPago `17`**, MetodoPago `PUE`, LugarExpedicion `11000`.
- Emisor: NUMAN HUB, NHU250826CS8, régimen 601.
- Receptor: EKU9003173C9, régimen 601, UsoCFDI `G03`, domicilio 26015.
- Concepto 1: ClaveProdServ `80141628`, Cantidad 1, ClaveUnidad `E48`,
  «Comisión de plataforma · Experiencia de prueba · Nov 20-22 · operación
  CAM-000101», ValorUnitario `350.000000`, ObjetoImp 02, traslado 002 Tasa
  0.160000 por `56.000000`. Es decir, $406.00 con IVA: lo retenido al cobrar.
- Concepto 2: `80141628`, 1, `E48`, «Cuota de admisión a la plataforma, única»,
  ValorUnitario `17.241379`, ObjetoImp 02, traslado 002 Tasa 0.160000 por
  `2.758621`. Es decir, $20.00 con IVA incluido ($17.24 + $2.76), como dice D7.
- Total de impuestos trasladados: `58.76`.
- UUID de prueba: B78C3307-0AFC-4F86-8374-C75F7D63F8DD.

## `egreso-comision-sandbox-2026-11-17.xml` — egreso proporcional

Devolución de la mitad de la venta ($875 de $1,750): vuelve la mitad de la
comisión con IVA ($203.00). La admisión no vuelve en una devolución parcial.

- Comprobante: tipo `E`, serie NC folio 3, SubTotal `175.00`, Total `203.00`,
  **FormaPago `17`**, MetodoPago `PUE`.
- Relacionados: TipoRelacion `01` con el UUID de la factura de comisión.
- Receptor: el mismo, UsoCFDI `G02`.
- Concepto: `80141628`, 1, `E48`, «Devolución de comisión · Experiencia de
  prueba · Nov 20-22 · operación CAM-000101», ValorUnitario `175.000000`,
  traslado 002 Tasa 0.160000 por `28.000000`.
- UUID de prueba: 07F5A393-7261-4D1D-BCC2-35BB97E2EA7C.
