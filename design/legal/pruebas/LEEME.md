# CFDI de retenciones — emisión de PRUEBA (sandbox de Facturapi)

**11 nov 2026, 18:54 (CDMX).** Emitido con la llave de PRUEBA de la organización
NUMAN HUB en Facturapi, con los mismos módulos que producción
(`src/lib/fiscal/cfdi-retenciones.ts`, catálogo confirmado por la sesión legal).
**No tiene validez fiscal ni se envió al SAT.**

- Receptor: la persona de prueba oficial del SAT (ESCUELA KEMPER URGATE,
  EKU9003173C9), no una operadora real.
- Dos ventas de noviembre: $1,508.62 sin IVA (tarjeta de crédito) y $754.31
  (débito), comisión 20 %.
- UUID de prueba 89876b8d-8832-4682-81a9-4891b84d35a8.

Lo que el XML confirma: Retenciones **2.0**, CveRetenc **26**, emisor NUMAN HUB
601 con su CSD (00001000000725993952), ImpuestoRet **001/002**, TipoPagoRet
**04** (ISR provisional) y **01** (IVA), montos **truncados** (ISR 56.57, IVA
181.03), complemento Plataformas Tecnológicas **1.0** con Periodicidad 02,
TipoDeServ 06, FormaPagoServ 03/06, IVA 02 al 0.160000, comisión 0.200.

Hallazgo: Facturapi **rechaza** `totales.monto_tot_grav` y `totales.monto_tot_ret`
aunque su OpenAPI los lista; los deriva él (MontoTotGrav 2262.93, MontoTotRet
237.60 en el XML). El código ya no los manda.
