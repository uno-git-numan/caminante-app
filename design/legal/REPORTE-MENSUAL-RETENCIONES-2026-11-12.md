# El reporte mensual de retenciones: qué sale de él y en qué formato

**12 nov 2026 · Sesión legal y fiscal, para producto y para Marisol.** Marisol
pidió «el reporte de las retenciones del mes para presentar las informativas».
Esto dice **qué declaraciones salen del reporte, los campos exactos de cada
una y cómo se tratan devoluciones y operadoras sin ventas**, con la fuente de
cada cosa. Todo lo que no pude leer en una fuente oficial está marcado como
**M10–M14** para Marisol: no se inventa.

**Fuentes leídas hoy, del SAT:** «Guía de llenado de la declaración Informativa
por el uso de plataformas tecnológicas» (v1.3, 51 pp.); «Instrucciones para la
generación del archivo de plataformas tecnológicas» (carga masiva, PTEv2, 11
pp., alojado por el propio aplicativo del SAT); «Instructivo de llenado del CFDI
que ampara retenciones e información de pagos al que se le incorpora el
Complemento de Servicios Plataformas Tecnológicas» (11 pp.); «Guía de llenado
Declaración de retenciones por el uso de plataformas tecnológicas» (15 pp.);
catálogo del complemento (XLS: formas de pago legibles; las claves de tipo de
servicio y las tasas por ejercicio están en el archivo y producto las lee); la
ficha del trámite en sat.gob.mx (regla 12.2.7 de la RMF vigente, día 10).
Leyes: LISR 113-C II, III y IV; LIVA 18-J II b), c) y III.

---

## 1 · Lo que sale cada mes (respuesta a la pregunta 1)

| # | Qué | Cuándo | Quién lo presenta | De dónde sale | Fundamento |
|---|---|---|---|---|---|
| A | **CFDI de retenciones e información de pagos**, uno por operadora, clave 26, con el complemento de plataformas | A más tardar el **día 5** del mes siguiente | **El sistema** lo emite (Facturapi) y se lo entrega a la operadora | Detalle por venta del mes | LISR 113-C II; LIVA 18-J II c) |
| B | **Entero** del ISR retenido y del IVA retenido | **Día 17** del mes siguiente | **Marisol**, en la declaración mensual de NUMAN, bajo las dos obligaciones que da el alta como retenedora (ISR retenciones por plataformas tecnológicas; IVA retenciones por plataformas tecnológicas) | **Totales del mes** + detalle por operadora (RFC, nombre, monto, ISR, IVA) por si el aplicativo lo pide por RFC | LISR 113-C IV; LIVA 18-J II b) |
| C | **Declaración informativa por el uso de plataformas tecnológicas** (informativa de operadoras) | **Día 10** del mes siguiente | **Marisol**, en el aplicativo del SAT (captura manual o **carga masiva por txt**) | Resumen **por operadora** | LISR 113-C III; LIVA 18-J III; RMF regla 12.2.7 |
| — | **DIOT**: no por esto | — | — | Las operadoras no son proveedoras de NUMAN en el modelo B; la DIOT reporta IVA pagado a proveedores | **M10** (Marisol confirma) |

Las tres salen del **mismo** reporte: el detalle por venta alimenta A; los
totales y el resumen por operadora alimentan B y C.

---

## 2 · Campos exactos de cada una (respuesta a la pregunta 2)

### 2.1 · La informativa del día 10 (C): carga masiva por txt

**Formato del archivo** (instructivo PTEv2 del SAT): `.txt`, **UTF-8**, una línea
por operadora, **columnas separadas por pipe `|`**, sin encabezado («de la
primera línea en adelante se ingresarán los registros»). NUMAN es **persona
moral**, así que la estructura es la del inciso a). Nuestro apartado es el **tipo
de servicio 5, «Enajenación de bienes y prestación de servicios con
retención»**. Columnas, **en este orden**:

| # | Columna | Tipo y reglas (del instructivo) | Lo que pone el sistema |
|---|---|---|---|
| 1 | Tipo de servicio | Numérico, 1 posición | `5` |
| 2 | RFC | 12 o 13 posiciones, mayúsculas; debe existir en el SAT; genérico `XAXX010101000` si no tiene | RFC de la CSF validada |
| 3 | Monto de las operaciones para ISR | Numérico hasta 12 posiciones, **número entero positivo, no acepta cero** | Base del mes **sin IVA**, redondeada a pesos (ver §3) |
| 4 | Monto de las operaciones para IVA | Ídem | Ver §3 y **M11** |
| 5 | ISR retenido | Ídem, entero, > 0 | Suma del mes, a pesos |
| 6 | IVA retenido | Ídem, entero, > 0 | Suma del mes, a pesos |
| 7 | CLABE interbancaria | Alfanumérico 18, **opcional** en el layout (en la guía de captura manual sí se pide) | La CLABE de la ficha fiscal |
| 8 | Tipo de actividad | Alfanumérico 3: `TA1` transporte, `TA2` entrega de bienes, `TA3` enajenación, `TA4` prestación de servicios | `TA4` |

Si la operadora tiene RFC genérico nacional, **después** del tipo de actividad se
agregan: Nombre(s), Apellido paterno, Apellido materno, CURP, Entidad
federativa (clave 01–32), Calle, Número exterior, Número interior, Código
postal, Colonia, Localidad o municipio. Con RFC real, **nombre, CURP y domicilio
los prellena el SAT desde el RFC** (guía v1.3, pp. 25–26): por eso el layout no
los lleva, pero el reporte en pantalla **sí** los muestra, porque la ley los pide
(18-J III) y porque la captura manual los enseña. «Institución financiera» se
prellena desde la CLABE. «Domicilio del inmueble» sólo existe para hospedaje:
**vacío** para nosotros.

**Lo que no pude verificar (M11–M12):** la ficha vigente del trámite cita la
regla **12.2.7 de la RMF 2026**, que según EY amplió la información a «datos
bancarios y transaccionales» por vendedor; los tres documentos técnicos que
enlaza (características técnicas, guía de llenado e instructivo de carga masiva
actuales) dieron **404** hoy. El layout de arriba es el publicado por el propio
aplicativo del SAT. Si el aplicativo pide columnas nuevas, el reporte ya trae
todos los datos; sólo cambia el orden del txt. Marisol lo ve al presentar la
primera.

### 2.2 · El CFDI de retenciones del día 5 (A): un comprobante por operadora

Lo que el instructivo del SAT exige, nodo por nodo, y lo que el sistema manda a
Facturapi:

**Comprobante de retenciones** (sección de arriba):

| Campo | Regla del SAT | Sistema |
|---|---|---|
| CveRetenc | **26** «Servicios mediante Plataformas Tecnológicas» (c_CveRetenc) | 26 |
| Receptor nacional: RFCRecep | RFC inscrito en el SAT (o genérico) | RFC de la operadora |
| Periodo: MesIni = MesFin, Ejerc | Un mes; ejercicio > 2018 y ≤ año de emisión | Mes reportado |
| Totales: montoTotOperacion | **= MonTotServSIVA** del complemento (suma de precios sin IVA) | Base del mes |
| montoTotGrav | = montoTotOperacion | Ídem |
| montoTotExent | **siempre 0.00** | 0.00 |
| montTotRet | = Σ montoRet de ImpRetenidos | ISR + IVA retenidos |
| ImpRetenidos (uno por impuesto): 01 ISR | BaseRet = montoTotOperacion (no hay efectivo); **montoRet = BaseRet × tasa del catálogo c_TipoDeServ para el ejercicio**, **truncado a 2 decimales** | 2.5 % para 2026 (D2) |
| ImpRetenidos: 02 IVA | BaseRet = Σ Importe de ImpuestosTrasladadosdelServicio; **montoRet = BaseRet × 50 %, truncado a 2 decimales** (100 % si RFC genérico) | 50 % (D2) |

**Complemento Servicios Plataformas Tecnológicas** (Versión 1.0):

| Campo | Regla del SAT | Sistema |
|---|---|---|
| Periodicidad | Clave de c_Periodicidad | Mensual (clave del catálogo; producto la lee) |
| NumServ | = número de secciones DetallesDelServicio | Ventas del mes |
| MonTotServSIVA | = Σ PrecioServSinIVA | Base del mes |
| TotalIVATrasladado | = Σ Importe de ImpuestosTrasladadosdelServicio | IVA cobrado del mes |
| TotalIVARetenido | = montoRet del IVA | |
| TotalISRRetenido | = montoRet del ISR | |
| DifIVAEntregadoPrestServ | = TotalIVATrasladado − TotalIVARetenido (sin efectivo) | |
| MonTotalporUsoPlataforma | = Σ Importe de ComisionDelServicio | Comisión del mes (**M13**: sin IVA; la admisión de $20 **no** va aquí) |
| MonTotalContribucionGubernamental | Σ ImpContrib; sólo si hay contribución gubernamental | No aplica: se omite |
| **Por cada venta** (DetallesDelServicio): FormaPagoServ | c_FormaPagoServ del complemento: 01 efectivo, 02 transferencia, 03 tarjeta de crédito, 04 monedero, 05 dinero electrónico, 06 tarjeta de débito, 07 tarjeta de servicios, 08 intermediario pagos, 09 premios/bonificaciones | La forma real con la que pagó el cliente (03 / 06 / 02) — **M14** |
| TipoDeServ | c_TipoDeServ; **todas las ventas del CFDI con la misma clave** | «Otro tipo de servicios» (producto toma la clave y la **tasa de ISR por ejercicio** del XLS del catálogo; si la columna de 2026 no dice 2.5 %, se detiene y avisa) |
| SubTipServ | Sólo si el catálogo lo pide para ese tipo (Personal/Compartido/Plus/Cancelación son de transporte) | Se omite |
| RFCTerceroAutorizado | Opcional | Se omite |
| FechaServ | **Fecha en que el cliente paga**; debe caer en el mes del periodo | Fecha del cobro en Stripe |
| PrecioServSinIVA | Precio sin IVA | Base de esa venta (cobrado ÷ 1.16) |
| ImpuestosTrasladadosdelServicio: Base, Impuesto, TipoFactor, TasaCuota, Importe | Base = PrecioServSinIVA; Impuesto = IVA (clave de c_TipodeImpuesto de retenciones); TipoFactor «Tasa»; TasaCuota de c_TasaCuota (0.160000); Importe = Base × TasaCuota; **sin negativos** | IVA de esa venta |
| ComisionDelServicio: Base, Porcentaje, Importe | Importe obligatorio y > 0 | Comisión de esa venta sin IVA, su % y su base |

**Claves confirmadas el 12 nov 2026 en los catálogos oficiales** (XLS de la
Revisión E del complemento, publicado por el SAT el 31/12/2025 en su portal
nuevo, y XLS de catálogos del CFDI de retenciones 2.0 en omawww.sat.gob.mx;
copias en Drive `legal/2026-11 legal y fiscal/sat/`):

| Campo | Clave | Fuente |
|---|---|---|
| TipoDeServ | **06** «Otro tipo de servicios» | c_TipoDeServ v8.0 (Rev. E). Para el **ejercicio 2026**: ISR **0.025** (2.5 %), IVA 50 % del trasladado; vigente desde 01/01/2026 (en 2025 era 0.01). Cuadra con la LIF 2026 art. 25 VI |
| Periodicidad | **02** «Mensual» | c_Periodicidad v2.0 del CFDI de retenciones: 01 Semanal, **02 Mensual**, 03 Diario, 04 Quincenal, 05 Otro |
| Impuesto (en ImpuestosTrasladadosdelServicio, del complemento) | **02** IVA | c_TipodeImpuesto del CFDI de retenciones: 01 ISR, 02 IVA, 03 IEPS |
| ImpuestoRet (en ImpRetenidos, del comprobante 2.0) | **001** ISR, **002** IVA | El esquema `retencionpagov2.xsd` tipa `ImpuestoRet` con `catCFDI:c_Impuesto` (001/002/003), no con el catálogo de retenciones; el instructivo E lo escribe así («001 (ISR)», «002 (IVA)») |
| TipoPagoRet del ISR | **04** «Pago provisional ISR» por omisión; **03** «Pago definitivo ISR plataformas» sólo para la operadora que acredite haber optado por el pago definitivo | LISR 113-A párrafo 3: «esta retención tendrá el carácter de pago provisional»; 113-B: la opción de definitivo es de la persona física (≤ $300,000, con aviso); la plataforma no la conoce salvo que la operadora se lo diga. Persona moral: siempre 04 |
| TipoPagoRet del IVA | **01** «Pago definitivo IVA» | Única clave de IVA en c_TipoPagoRet (01 IVA, 02 IEPS, 03 ISR definitivo, 04 ISR provisional) |
| FormaPagoServ | 03 tarjeta de crédito · 06 tarjeta de débito · **06 también para tarjeta prepago** · 02 transferencia | c_FormaPagoServ v2.0; no existe «prepago»: 04 «Monedero electrónico» es el de vales y 05 «Dinero electrónico» el de fondos de pago electrónico; una prepago de red bancaria se carga como débito (**M16**, Marisol confirma) |
| ComisionDelServicio/@Porcentaje | Fracción con 3 decimales (20 % ⇒ 0.200) | XSD del complemento (verificado por producto) |
| TasaCuota del IVA | 0.160000 | c_TasaCuota v3.0 (Rev. E) |

Dos consecuencias de diseño que salen de estas reglas:

1. **Todo es por venta** (una sección por cada cobro). El reporte tiene que
   conservar, por venta: fecha de cobro, precio sin IVA, IVA, forma de pago,
   comisión sin IVA y su porcentaje. Ya está en `payments` (0079) salvo la forma
   de pago y el porcentaje, que producto verifica.
2. **No hay negativos ni fechas fuera del mes**: una devolución **no** se
   reporta como renglón negativo. Ver §3.

### 2.3 · El entero del día 17 (B)

Lo entera Marisol en la declaración mensual de NUMAN. Lo que el sistema le da:
**ISR retenido total del mes** y **IVA retenido total del mes** (a centavos), más
el **resumen por operadora** (RFC, nombre o razón social, base sin IVA, IVA
cobrado, ISR retenido, IVA retenido, número de ventas), porque la «Declaración
de retenciones por el uso de plataformas tecnológicas» del SAT se captura **por
RFC** (su guía: RFC, monto total del ingreso del mes, ISR retenido, IVA
retenido; carga masiva por txt con esas cuatro columnas). **M10**: Marisol dice
en cuál de los dos aplicativos entera NUMAN como persona moral residente (la
declaración mensual con las dos obligaciones nuevas, o la de «retenciones por el
uso de plataformas»); el reporte sirve para los dos.

---

## 3 · Montos, IVA y devoluciones (respuesta a la pregunta 3)

**Montos.** En el CFDI de retenciones todo va **sin IVA** (montoTotOperacion =
MonTotServSIVA; el IVA cobrado va aparte en TotalIVATrasladado). En la
informativa, «Monto de las operaciones para ISR» es «el importe total de los
ingresos que cobró la plataforma por cuenta del prestador» y «Monto de las
operaciones para IVA» es «el importe total cobrado por la plataforma a nombre
del prestador» (guía v1.3, p. 26); la guía no dice si el segundo lleva IVA.
**Decisión**: los dos se reportan como la **base sin IVA del mes**, igual que el
CFDI de retenciones, para que las tres declaraciones cuadren entre sí; **M11**:
Marisol confirma si «para IVA» debe ir con IVA (entonces = base × 1.16). Los
dos campos van **en pesos enteros** (el layout no acepta decimales) y **mayores
que cero**: se redondean al peso.

**Devoluciones: corte al emitir.** El complemento no admite negativos y exige
que cada FechaServ caiga en el mes del periodo. Por eso:

- Una devolución (total o parcial) **antes de emitir el CFDI del mes de la
  venta** (es decir, hasta el día en que se emite, a más tardar el 5 del mes
  siguiente) se **neta en esa venta**: la venta se reporta por lo efectivamente
  cobrado después de la devolución; si fue total, **no se reporta**. Es lo que
  hace `retencionVigente` = retenido × (1 − devuelto/cobrado), con el corte en
  la emisión.
- Una devolución **después de emitido el CFDI y enterado el impuesto** **no
  corrige el mes original ni se resta del mes en curso**: la retención ya
  enterada queda **a favor de la operadora** (su CFDI de retenciones la ampara y
  ella la acredita) y la operadora **reintegra a Caminante ese importe** junto
  con su parte, por compensación (convenio, Quinta §4 y §9, ajustados hoy).
  Caminante no pierde nada y el SAT no recibe un negativo.
- **M12**: si Marisol prefiere la otra vía (cancelar y sustituir el CFDI del mes
  original y compensar lo enterado de más en el siguiente entero), se cambia el
  corte; el reporte ya guarda lo necesario (venta, fecha de devolución, importe).

**Diseño de producto que se queda:** «ventas del mes − devoluciones del mes»
vale **sólo** para devoluciones de ventas del mismo mes (o anteriores al corte);
una devolución de una venta de un mes ya emitido **no** entra con signo negativo
en el mes en curso.

---

## 4 · Operadoras sin ventas en el mes (respuesta a la pregunta 4)

**No van.** El layout exige montos **enteros positivos, «no acepta cero»**, y la
frase del 18-J III «aun cuando no hayan efectuado el cobro» se refiere a
operaciones en las que la plataforma intermedió **sin cobrar** (los apartados
«sin retención» del aplicativo: tipo de servicio 6), no a operadoras sin
operaciones. Caminante no tiene ventas «sin cobrar» (toda venta pasa por el
cobro): sólo se reportan operadoras con al menos una venta cobrada en el mes,
en el tipo de servicio 5. Si un mes no hay ninguna venta de ninguna operadora,
Marisol decide si presenta la informativa en ceros o sin registros (**M10**).

---

## 5 · El reporte, entonces

**Construido (producto, 12 nov):** panel → Recursos (plataforma) → «Lo que se declara» → «Retenciones del mes». Botones: **«Descargar txt para el SAT (informativa)»**, **«Resumen CSV para la contadora»** (con fila TOTAL), **«Detalle venta por venta»**. Lo que diseñé abajo, nivel por nivel:

1. **Totales del mes** (para el entero): ISR retenido, IVA retenido, base sin
   IVA, IVA cobrado, número de ventas, número de operadoras; y los mismos
   totales de **devoluciones netadas** antes del corte, para que Marisol vea qué
   se restó.
2. **Resumen por operadora** (para la informativa y para el entero por RFC), en
   el orden del txt: tipo de servicio (5), RFC, monto para ISR, monto para IVA,
   ISR retenido, IVA retenido, CLABE, tipo de actividad (TA4); y a la vista
   (no en el txt): nombre o razón social, CURP, domicilio fiscal, banco,
   número de ventas, comisión del mes, y el folio del CFDI de retenciones
   emitido. **Botón «Descargar txt para el SAT»** con exactamente esas 8
   columnas separadas por `|`, UTF-8, sin encabezado, montos enteros.
3. **Detalle por venta** (lo que va al complemento): fecha de cobro, operadora,
   precio sin IVA, IVA, forma de pago, comisión sin IVA y %, ISR retenido, IVA
   retenido, devolución (fecha e importe) y si quedó dentro o fuera del corte.

Reglas transversales: tasas del ejercicio (D2); truncado a 2 decimales en los
montoRet del CFDI (regla del SAT), redondeo a pesos sólo en el txt; todo
derivado de `payments`, nunca escrito a mano; el mes se cierra al emitir los
CFDI (el corte), y lo que cambie después va al mes siguiente o a la operadora,
nunca al mes cerrado.

---

## 6 · Lo que Marisol confirma (M10–M14)

| # | Duda | Dónde pega |
|---|---|---|
| M10 | Aplicativo del entero para NUMAN (declaración mensual con las obligaciones de retenedora, o «retenciones por el uso de plataformas»); y si en un mes sin ventas se presenta la informativa en ceros. DIOT: confirmar que las retenciones a operadoras no van ahí | §1, §4 |
| M11 | «Monto de las operaciones para IVA» en la informativa: ¿base sin IVA (como se reporta) o con IVA? | §3 |
| M12 | Devoluciones después del corte: ¿se queda la retención a favor de la operadora (como se decidió) o se cancela y sustituye el CFDI y se compensa en el siguiente entero? | §3 |
| M13 | MonTotalporUsoPlataforma / ComisionDelServicio: comisión **sin** IVA; la cuota de admisión no se incluye | §2.2 |
| M14 | FormaPagoServ por venta: la forma real del cliente (03/06/02) y no 08 «Intermediario pagos» | §2.2 |
| M16 | Tarjeta **prepago** en FormaPagoServ: 06 (débito), no 04 ni 05 | §2.2 |
| M15 | **Centavos: truncar por venta.** El SAT valida `montoRet` del CFDI como BaseRet **del mes** × tasa, **truncado** a 2 decimales; retener por venta redondeando puede dejar a NUMAN con hasta n centavos retenidos de más frente a lo que certifica. **Decidido (legal, 12 nov):** la retención por venta se calcula **truncando** (nunca se retiene de más); el `montoRet` del CFDI se calcula del total del mes como manda el instructivo, y los centavos que falten entre la suma de lo retenido por venta y ese `montoRet` **los pone NUMAN al enterar**. La operadora acredita lo que dice su CFDI. Marisol confirma que prefiere esto a devolver centavos | §2.2 |

**Centavos (M15, decidido el 12 nov).** La retención se calcula **por venta,
truncando a 2 decimales** (1,508.62 × 2.5 % = 37.7155 → **37.71**; IVA 241.38 ×
50 % = 120.69). El `montoRet` del CFDI se calcula como manda el instructivo:
BaseRet del mes × tasa, truncado. Como Σ trunc(xᵢ) ≤ trunc(Σ xᵢ), la suma de lo
retenido por venta nunca supera lo que el CFDI certifica, y la diferencia (a lo
más un centavo por venta) **la pone NUMAN al enterar**: se entera el `montoRet`
del CFDI, no la suma. Alternativas descartadas: redondear por venta y emitir el
CFDI con la suma (el PAC lo rechaza o el SAT lo observa, porque la regla es
truncado del total); o redondear por venta y devolver los centavos a la
operadora a fin de mes (un movimiento más por nada). El ejemplo de D3 ($37.72)
queda en **$37.71** y la operadora recibe **$1,241.60**.

Y para producto, **tres verificaciones antes de la primera emisión real**: la
clave y la tasa 2026 de «Otro tipo de servicios» en el XLS del catálogo (si la
tasa del catálogo no es 2.5 %, el PAC rechaza el CFDI y hay que parar); la
clave de Periodicidad mensual; y el truncado (no redondeo) de montoRet.
