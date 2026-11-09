# Onboarding fiscal de operadoras persona física — texto para «Mi alta»

**9 nov 2026.** Qué le decimos a una operadora que es persona física antes de
que venda por Caminante, y qué le pedimos. Fundamento: LISR 113-A a 113-C, LIVA
18-J (vía 1-A BIS), LIF 2026 art. 25 fracc. VI. ⚠️ Las tasas y la regla de RESICO
las confirma Marisol (`MEMO-MARISOL-2026-11.md`, preguntas a y c) antes de
publicar este texto. El texto se transcribe a la lámina de «Mi alta» (paso
«nos conocemos» / expediente fiscal) por la sesión de código.

## El texto (voz Caminante: claro, sin jerga, sin asustar)

> ### Tu situación fiscal como operadora
>
> Caminante cobra tus experiencias por tu cuenta y te deposita lo tuyo. Por ley,
> eso nos convierte en **plataforma tecnológica** ante el SAT, y a ti te pide
> tres cosas. Las explicamos una por una.
>
> **1 · Tu régimen fiscal.** Tienes que estar dada de alta en el **Régimen de las
> actividades empresariales con ingresos a través de plataformas tecnológicas**
> (clave **625** en tu Constancia de Situación Fiscal). Puede convivir con otros
> regímenes (sueldos, honorarios, arrendamiento), pero **no con RESICO**: si hoy
> estás en RESICO, el SAT no permite combinarlo con ingresos por plataformas; tu
> contador te cambia de régimen antes de tu primera venta aquí. Es un trámite en
> el portal del SAT (aviso de actualización de actividades y obligaciones).
>
> **2 · Las retenciones.** De cada venta tuya, Caminante retiene y entera al SAT
> por ti:
> - **ISR: 2.5 %** del precio de la experiencia sin IVA.
> - **IVA: la mitad** del IVA que trasladas (8 % del precio sin IVA).
>
> Las retenciones **no son un costo extra**: son impuestos tuyos que nosotros
> pagamos por adelantado. Cada mes, antes del día 5, recibes de Caminante un
> **CFDI de retenciones** con el detalle; con él los acreditas en tu
> declaración. Si no nos das tu RFC, la ley nos obliga a retener **20 % de ISR y
> el 100 % del IVA**: por eso el RFC es obligatorio antes de vender.
>
> **3 · Tu opción de pago definitivo.** Si **todos tus ingresos del año anterior
> no pasaron de $300,000**, puedes pedirle al SAT que las retenciones sean tu
> impuesto final: no presentas declaración mensual por estas ventas ni haces
> deducciones sobre ellas. Se pide con un aviso dentro de los 30 días de tu
> primer ingreso y se mantiene 5 años. Lo decides con tu contador; nosotros
> retenemos igual en los dos casos.
>
> **Tú sigues facturando a tu cliente.** Caminante timbra, con tu sello (CSD) y
> a tu nombre, la factura de cada venta cuando el cliente la pide, y la factura
> global de lo que nadie pidió. Tú no haces nada: sólo subes tu CSD aquí.
>
> **Lo que subes en este paso:**
> - **Constancia de Situación Fiscal** reciente (menos de 3 meses), donde se
>   vea el régimen 625.
> - **CSD** (archivo `.cer`, archivo `.key` y su contraseña). La contraseña va
>   directo al timbrador; no se guarda en Caminante.
> - **CURP** y **CLABE** de la cuenta donde recibes tus depósitos (la ley nos
>   pide reportarlos al SAT cada mes junto con lo que te cobramos).
>
> Caminante no da asesoría fiscal; esto es lo que la ley nos obliga a hacer y a
> pedirte. Si algo no cuadra con lo que te dice tu contador, escríbenos antes de
> publicar tu primera experiencia.

## Lo que el sistema hace con esto (para la sesión de código)

- El gate `listo-para-vender` exige, para `tipo_persona = fisica`: régimen
  **625** presente en la CSF cargada (campo `regimen_fiscal`), **RFC**, CURP,
  CLABE, CSD (.cer + .key). Rechaza `626` (RESICO) y vacío con el mensaje: «Tu
  CSF trae RESICO; cámbiate al régimen 625 antes de vender».
- Las tasas viven en **configuración por tipo de persona y año**
  (`retenciones.config`), nunca quemadas: 2026 PF 2.5 % / 50 %; PM 2.5 % / 50 %;
  sin RFC 20 % / 100 %.
- La liquidación muestra: cobrado − devuelto − comisión(+IVA) − ret. ISR − ret.
  IVA = depositado, con la liga al CFDI de retenciones del mes.

## Nomádika — el primer caso real

Laura Catalina Romero Barragán, RFC **ROBL990531HI3**, persona física. En la
base faltan régimen, CP fiscal y tipo de persona; **no sabemos en qué régimen
está hoy**. Hasta saberlo no se le puede retener bien ni emitirle R1.

**Mensaje para Laura/Cat (lo manda Luis por WhatsApp):**

> Cat, para poder facturar bien las salidas de Nomádika por Caminante
> necesitamos tu situación fiscal al día: ¿me mandas tu Constancia de Situación
> Fiscal reciente (la bajas del SAT con tu RFC y contraseña)? Lo importante es
> ver en qué régimen estás: por ley, vender por una plataforma pide el régimen
> 625 (plataformas tecnológicas) y no es compatible con RESICO. Si estás en
> RESICO, te decimos exactamente qué aviso presentar. También vamos a empezar
> a retenerte ISR e IVA por ley (2.5 % y la mitad del IVA) y te daremos cada
> mes el CFDI de retenciones para que lo acredites. Te explico con calma en
> llamada si quieres.

Pendiente de la respuesta: régimen actual → si RESICO, fecha del cambio; con
eso Marisol decide qué hacer con los $21,000 cobrados en septiembre sin
retención (`NUMAN-PLATAFORMA-RETENEDORA.md` §5).
