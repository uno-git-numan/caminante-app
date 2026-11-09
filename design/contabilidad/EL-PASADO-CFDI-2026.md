# El pasado — cuadrar los CFDI de 2026 emitidos por fuera

**9 nov 2026.** Antes del primer timbre del sistema hay que saber qué ya se
declaró. Marisol ha emitido los CFDI de 2026 de NUMAN HUB con su propia
herramienta, sin registro en Drive ni en la base (`MAPA-FACTURACION.md` §0.6).

## Qué se le pide (va en el correo de las 7 confirmaciones)

La **exportación del portal del SAT** de facturas emitidas por NUMAN HUB en
2026 (UUID, fecha, receptor, total, estado, global sí/no) y los XML si los
tiene. Se guarda en
`Drive/CONTABILIDAD/NUMAN-HUB_NHU250826CS8/2026/cfdi-emitidos-sat/` (carpeta
creada hoy con un `LEEME.md` que dice el formato).

## Qué hace la sesión de código con el archivo

1. Lee el CSV y los 82 `payments` cobrados (y los 9 devueltos).
2. Cruza por **total y fecha ±3 días**; empates ambiguos se listan, no se
   adivinan.
3. Cruce limpio → `payments.status_cfdi = 'emitido'` + fila en `cfdi_invoices`
   con el UUID (sin XML si no lo hay; se baja del SAT después).
4. CFDI global de Marisol en el mes → los pagos de ese mes sin CFDI propio →
   `publico-general`.
5. Lo que no cruce queda `por-emitir` y se decide con Marisol uno por uno
   (emitir a NUMAN ahora, meter en la global del mes, o `no-facturable`).
6. Resultado en un CSV de conciliación que se devuelve a Marisol y se archiva
   en la misma carpeta de Drive.

## Lo que ya sabemos que no cuadra

- La base dice 82 cobros ($894,275); el `ingresos.csv` de La Caja traía 48
  filas por emitir ($466,000) al 26 oct. Son dos contadores distintos del
  mismo hecho: el cruce los unifica.
- El CFDI de comisiones de BBVA salió a XAXX010101000 (no acreditable): asunto
  aparte, ya en manos de Luis con el ejecutivo.
