# Bitácora para la sesión legal y fiscal

**Para qué existe (Luis, 11 nov 2026):** la sesión de producto (la que
construye Caminante) le avisa a la sesión legal y fiscal **cada cambio** que
altere lo que el convenio, el aviso de privacidad, la facturación o las
retenciones tienen que decir. La sesión legal lo contabiliza aquí antes de
generar cualquier documento. Cada entrada dice **qué cambió, de dónde sale y
qué pregunta abre**. Lo más nuevo va arriba.

Las preguntas abiertas se numeran `i1, i2…` y siguen a las `h1–h4` del memo
a Marisol (`design/contabilidad/MEMO-MARISOL-2026-11.md`).

---

## 11 nov 2026 (noche) · Producto: reporte mensual de retenciones (lo pidió Marisol)

- Pantalla de la casa «Retenciones del mes» + CSV para la contadora (resumen por
  operadora y detalle venta por venta).
- Columnas hoy: mes, operadora (razón social o nombre), RFC, CURP, domicilio
  fiscal, banco, CLABE, ventas, cobrado con IVA, base sin IVA, IVA cobrado, ISR
  retenido, IVA retenido, devoluciones, «faltan».
- Mes = ventas cobradas en el mes − devoluciones confirmadas en el mes (retención
  proporcional). Todas las operadoras en Connect aparecen aunque vayan en cero.
- **Espera tu respuesta** sobre el formato exacto de cada informativa (pregunta
  del 11 nov): se ajustan columnas y orden a lo que digas.

## 11 nov 2026 (noche) · Producto: CURP, domicilio fiscal y CLABE (fase 2)

- **Dónde viven:** tabla `operator_fiscal_privado` (0081), con RLS y sin
  políticas: sólo el servidor la lee. Las pantallas sólo ven si el dato está y
  la CLABE enmascarada (•••• 1234).
- **CURP y domicilio fiscal:** salen de la constancia confirmada con el SAT, la
  misma lectura de siempre (encargada: Anthropic, D17). La CURP sólo se guarda
  si coincide con el RFC (10 primeros caracteres). No se guardan en el análisis
  visible del documento.
- **CLABE:** la operadora (o la casa por ella) la captura una vez en Cobrar; se
  valida el dígito de control. **El banco sale de sus 3 primeros dígitos**
  contra el listado oficial de Banxico; sólo se pregunta si no está.
- Es dato para la informativa; no es la CLABE que viaja a Stripe como token.
- Aviso a la persona física en RESICO: «Caminante le retiene ISR e IVA por cada
  venta. Que lo revise con su contador.» (D11).

## 12 nov 2026 · Legal: fase 2 (CURP, domicilio, CLABE) cuadrada en Octava §3 y aviso

Recibido 347a640. La **Octava §3** del convenio y el texto del **aviso de
privacidad** ya dicen lo mismo que el código: CURP y domicilio fiscal tomados de
la Constancia confirmada (lectura de IA como encargada, D17); CLABE capturada una
vez con dígito verificador y banco deducido de ella; registro aparte de acceso
restringido que sólo el sistema lee; CLABE enmascarada en pantalla. Firmable
rederivado. Nada que cambiar en D4. Sigo esperando la fase 3 (reporte mensual,
CFDI clave 26, informativa) y la promoción a producción.

## 11 nov 2026 (noche) · Legal: CFDI de retenciones cuadrado; mensajería pausada

**Para producto (el canal de mensajes entre sesiones se pausó hasta que Luis
escriba en la sesión legal; por eso va aquí).** Recibido tu verificación de
Facturapi (`POST /v2/retentions`, clave 26, complemento por XML en
`complements`). La **Décima tercera §3** ya lo dice (commit c33a0c5; firmable
sha-256 `9945ca7af8f6fc20e28c67076246c4fa0f30b6830ad65f39cf09f5d7c16355fd`):
«…el CFDI de retenciones e información de pagos del mes anterior, con la clave
de retención 26 «Servicios mediante Plataformas Tecnológicas» y el complemento
de plataformas tecnológicas, timbrado por su proveedor autorizado de
certificación. Las devoluciones del mes se reflejan en él». No nombra a
Facturapi en el firmable. Anotado como **M9** para Marisol (clave 26, complemento,
versión 2.0 a confirmar con el primer XML en test). Dos cosas para esa prueba:
(1) validar el XML del complemento contra el XSD oficial del SAT antes de la
primera emisión en vivo; (2) dejar aquí el resumen del XML de prueba (versión,
clave, periodo, totales, imp_retenidos) para cotejarlo contra D3 y D4 antes del
primero real. Las 0079/0080 aplicadas: recibido; la condición para publicar el
v3.2 sigue siendo la **promoción a producción**.

## 11 nov 2026 (noche) · Producto: retención construida (fase 1)

**Qué hace el código desde el commit de esta entrada** (falta aplicar la 0079 y
promover):

- Calcula al cobrar ISR 2.5 % de lo cobrado sin IVA y 50 % del IVA cobrado
  (sin RFC 20 % / 100 %), con las tasas del ejercicio en curso (D2, D3). Ejemplo
  verificado: $1,750 → ISR $37.72, IVA $120.69, la operadora recibe $1,241.59.
- **Candado (lista §6 punto 1):** sin tasas para el ejercicio, no se cobra por
  cuenta conectada.
- **Cambio de mecánica que conviene que el convenio describa así:** NUMAN ya
  NO cobra la comisión como «comisión de aplicación» de Stripe. Le transfiere a
  la operadora **sólo lo que le corresponde** (cobrado − comisión con IVA −
  retenciones) y se queda lo demás desde el cobro. Razón: Stripe no deja
  combinar las dos cosas, y así un reembolso parcial revierte en proporción
  automáticamente (comisión y retención incluidas). Probado contra Stripe en
  modo test. Si la Cuarta habla de «comisión de aplicación» o de retener de la
  transferencia DESPUÉS, conviene decir «la transferencia al Operador se hace
  neta de la comisión, su IVA y las retenciones».
- La admisión ($20) sigue siendo una reversión aparte, una vez. Si la venta
  que la pagó se devuelve completa, Stripe se los regresa y se cobra en la
  siguiente venta (encaja con tu §3 bis).

**Pendiente de construir (fases siguientes):** CURP/CLABE/domicilio fiscal,
CFDI de retenciones (día 5), acumulado para el entero (día 17), informativa
(día 10), aviso de privacidad, desglose del CFDI de la admisión,
cancelaciones LFPC, leyenda «IVA incluido». La clave 90121501 ya estaba en el
código.

## 11 nov 2026 (noche) · Luis eligió B (Airbnb): se construye con retención

Luis preguntó si la operadora podía recibir el dinero y pagar ella sus
impuestos; se le compararon A (cargo directo, sin retención, sólo informativa),
B (cargo con destino, con retención) y C (NUMAN vende) en
`RETENCION-TRES-CAMINOS-2026-11-11.md`. **Decidió B**: «Hay que hacerlo como
hace airbnb entonces. Construye.» Producto construye el §6 del documento de
decisiones en orden: candado, módulo de retención, CURP/CLABE/domicilio
fiscal, aviso de privacidad, CFDI de la admisión, cancelaciones LFPC, «IVA
incluido», clave 90121501. D15 (liberar el dinero) se queda como hoy. Numeración
del documento de decisiones corregida (D1–D18; producto cita los títulos).

## 11 nov 2026 (tarde) · Respuesta de la sesión legal al mandato nuevo: todo decidido

**Luis (vía producto):** no hay abogado externo; legal decide, se construye así,
Marisol revisa después. **Hecho.** Un solo documento, legible sin el repo:
`design/legal/DECISIONES-LEGAL-FISCAL-2026-11-11.md` (D1–D18, fundamento con
artículo y alternativa descartada; §10 = lo que Marisol confirma). Convenio
**v3.2** cerrado (`CONVENIO-v3.md` → `CONVENIO-v3-FIRMABLE.md`), con la
**variante B de retención** en el firmable. Texto del aviso de privacidad listo:
`design/legal/AVISO-PRIVACIDAD-ADICIONES-2026-11.md`.

**Lo que construye producto, en orden** (detalle en el §6 del documento):

1. **Candado**: ninguna venta por cuenta conectada hasta que exista el módulo
   de retención (la Cuarta §8 ya promete retener desde la primera venta).
2. **Módulo de retención**: ISR 2.5 % sobre el total cobrado sin IVA, IVA 50 %
   del IVA cobrado (20 % / 100 % sin CSF válida); tasas en configuración por
   ejercicio y tipo de persona; se descuenta de la transferencia como movimiento
   aparte (igual que la admisión); CFDI de retenciones con complemento
   «Servicios Plataformas Tecnológicas» a más tardar el día 5; acumulado para el
   entero del 17; **informativa del día 10** (nombre, RFC, CURP, domicilio fiscal,
   banco y CLABE, monto por operadora); corrección en devoluciones.
3. **CURP y CLABE como datos fiscales** de la operadora (la informativa del
   18-J III los exige; Stripe no devuelve la CLABE completa): CURP de la CSF,
   CLABE en la ficha fiscal. Esto **revierte** lo de «Caminante no guarda la
   CLABE» del 9–11 nov.
4. **Aviso de privacidad** con las adiciones del archivo (desbloquea
   `COBRO_EN_PLATAFORMA`).
5. **CFDI de la admisión**: renglón aparte en el CFDI de la comisión de esa
   venta, $17.24 + $2.76 de IVA, clave 80141628, forma de pago 17.
6. **Cancelaciones**: piso legal de 5 días hábiles de revocación cuando la
   salida está a más de 10 días hábiles (LFPC 56), además de las 24 h;
   bonificación del 20 % al cliente a cargo de la operadora cuando cancela por
   causa imputable (92 Bis/Ter); devolución por la misma vía (ya).
7. Leyenda **«IVA incluido»** en todo precio publicado (LIVA 18-J I).
8. Clave **90121501** en el CFDI de la experiencia (hoy 90121500).

**Es de negocio, no legal → Luis:** liberar el dinero antes o después de la
experiencia (D15; recomendación legal: antes, como hoy). **Nada que construir**
sobre RESICO salvo el aviso en pantalla.

## 11 nov 2026 (tarde) · La cuota de admisión, construida

**Qué cambió:** la plataforma ya descuenta la cuota de admisión
(`src/lib/operadores/admision.ts`; falta aplicar la migración 0078 y promover).

- **Monto:** MX$20.00, una sola vez por operadora. Es lo que Stripe le cobra a
  NUMAN por cada cuenta conectada (Radar Standard). **Hoy va sin IVA**: lo que
  diga i1 se ajusta antes de la primera venta.
- **Cuándo:** en su primera venta cobrada por su cuenta conectada.
- **Cómo:** de la transferencia que Stripe le hace por esa venta se revierten
  $20 (reversión de transferencia, con concepto «Cuota de admisión
  Caminante»). **No toca la comisión**: la comisión, su IVA y el total del
  CFDI de la comisión quedan exactos.
- **Si no alcanza o Stripe la rechaza**, se reintenta en su siguiente venta.
- Su panel muestra lo que recibe ya con los $20 descontados.

**Lo que necesito de ti (i1):** la cláusula tiene que describir exactamente
esto: cuota única de admisión, compensada contra la primera transferencia.
Dime también si lleva IVA y si NUMAN la factura (y con qué clave), para que
el CFDI de la comisión de esa primera venta la incluya o salga aparte.

**Contabilizado por la sesión legal · 11 nov (tarde).** La cláusula ya existe:
`CONVENIO-v3.md` **Cuarta §3 bis** (commit 77fc8df, ajustada en el siguiente
para decir «o, si esa transferencia no alcanzara, de la siguiente»). Describe
exactamente esto: cuota única de $20.00, compensada contra la primera
transferencia, aparte de la comisión. **IVA y CFDI no los decide la sesión
legal**: son las preguntas **i1a–i1d** del memo a Marisol, con la propuesta
(servicio gravado al 16 %, **IVA incluido en los $20** para no cambiar el
monto, renglón aparte en el CFDI de la comisión de esa venta con clave
80141628, forma de pago 17 compensación). Mientras Marisol no conteste, **el
monto no cambia**: la cláusula dice «comprende el IVA que en su caso cause»,
así que $20 descontados son correctos tanto si lleva IVA ($17.24 + $2.76) como
si no. El CFDI de la admisión se construye cuando conteste i1c.

## 11 nov 2026 · Stripe Connect LIVE: perfil de plataforma «modelo Airbnb»

**Qué cambió (hecho, no plan):**

1. **Luis eligió en Stripe el modelo B, «Buyers will purchase from you»**: el
   cliente paga, el dinero pasa por la cuenta de NUMAN y se transfiere a la
   operadora en el mismo cargo (cargo con destino + `on_behalf_of`, la
   operadora es el comercio que ve el cliente). Es como Airbnb: Airbnb cobra,
   guarda y deposita; el anfitrión es quien vende.
2. **Responsabilidades que NUMAN aceptó ante Stripe** (texto de Stripe,
   aceptado por Luis el 11 nov 2026):
   - «You'll be responsible for refunds, chargebacks, and fines.»
   - «You'll review each seller to ensure they're not operating in a
     restricted business category or selling restricted products.»
   - «You'll provide support to sellers, educate them on your risk management
     processes, and guide them through remediation.»
   - «You'll be responsible for losses from seller fraud and negative balances
     on connected accounts.»
   - Radar Standard: **MX$0.00 por transacción revisada y MX$20.00 por cuenta
     conectada**.
3. **Los MX$20 por cuenta los paga la operadora** (Luis): se le **descuentan
   del primer pago que NUMAN le transfiere** (la primera venta que cobre por
   su cuenta conectada), una sola vez. **Tiene que ir como cláusula.**
4. **Nomádika ya tiene cuenta conectada en LIVE** (`acct_1UaiUdGRRBL2rPeh`,
   restringida: no cobra hasta completar su verificación). Stripe tomó su RFC
   de la precarga de la constancia; le faltan fecha de nacimiento, domicilio,
   teléfono, CLABE, aceptar términos e identificación.
5. **Luis no quiere que la operadora entre nunca a Stripe**: los datos que
   Stripe pide se piden en la plataforma y la plataforma se los manda a
   Stripe. Técnicamente ya está construido y apagado (`COBRO_EN_PLATAFORMA`):
   la operadora captura en nuestra pantalla, Stripe.js convierte los datos en
   tokens en SU navegador y el servidor sólo ve tokens. Ni un dato personal se
   guarda en Caminante. Falta lo legal (i3).

**Preguntas que abre:**

- **i1 · La cuota de admisión de $20.** Redacta la cláusula. ¿Es reembolso de
  un gasto de NUMAN (Radar) o un servicio de NUMAN? ¿Lleva IVA? ¿Va en el CFDI
  de la comisión o en uno propio, y con qué clave de producto? ¿Descontarla de
  la transferencia necesita una cláusula de **compensación** expresa?
- **i2 · Trasladar a la operadora lo que NUMAN aceptó ante Stripe.** Reembolsos,
  contracargos, multas, fraude y saldos negativos son de NUMAN frente a Stripe.
  En el convenio: indemnización, derecho a revertir transferencias y a
  compensar contra pagos futuros, y qué pasa si no alcanza. ¿Conviene, como
  Airbnb, **liberarle el dinero hasta después de la experiencia**? ¿Qué dice la
  LFPC si el cliente cancela y el dinero ya está con la operadora?
- **i3 · El alta dentro de la plataforma** (la operadora nunca entra a
  Stripe):
  - La aceptación del **Stripe Connected Account Agreement** tiene que vivir en
    nuestro convenio (Cuarta §7, pendiente del abogado desde el v1). Redáctala.
  - **Aviso de privacidad** (nueva LFPDPPP, DOF 20 mar 2025): pedimos
    identificación oficial, fecha de nacimiento, domicilio, teléfono y CLABE
    para mandarlos a Stripe. ¿Remisión o transferencia? ¿Hace falta
    consentimiento expreso para los datos patrimoniales (CLABE)?
  - NUMAN aceptó **revisar a cada operadora** ante Stripe. ¿Qué obligaciones
    trae eso (conservación, actualización)? ¿Alguna actividad vulnerable de la
    LFPIORPI?
- **h3 sube de prioridad.** Con el modelo B confirmado, NUMAN cobra por cuenta
  de la operadora. Si eso obliga a retener ISR/IVA (113-A LISR, 18-J LIVA),
  la retención tiene que estar construida **antes de la primera venta de
  Nomádika** por su cuenta conectada.

**Corrige en tus documentos:** donde diga «cuentas v2 con panel completo», el
panel de la operadora va a ser el nuestro (alta dentro de la plataforma) en
cuanto i3 esté resuelto.

**Contabilizado por la sesión legal · 11 nov 2026 (commit en la rama).** Dónde
quedó cada cosa:

- **i1** → `design/operadores/CONVENIO-v3.md` **Cuarta §3 bis** (cuota de
  admisión $20.00, una vez, por compensación, revirtiendo la transferencia de la
  primera venta; «comprende el IVA que en su caso cause» para que lo descontado
  sean $20 exactos, como `admision.ts`). La Cuarta §3 ya **no** dice que Caminante
  absorbe la cuota por cuenta conectada. Lo fiscal (IVA, CFDI, clave) está como
  preguntas **i1a–i1d** en `MEMO-MARISOL-2026-11.md` con la propuesta de la sesión
  legal; Marisol confirma. Nada que construir hasta entonces: el CFDI de la
  admisión depende de i1c.
- **i2** → **Quinta §9** nueva (traslado a la operadora de reembolsos,
  contracargos, multas, fraude y saldos negativos cuando le sean imputables;
  reversión de transferencia → compensación → pago en 5 días hábiles) y Novena.
  **Liberar el dinero antes o después de la experiencia lo decide Luis**
  (DECISIONES fila 11); no se cambió. Hallazgo: **LFPC 56** da 5 días hábiles de
  revocación cuando el servicio está a más de 10 días hábiles; nuestra ventana de
  24 h es más corta (DECISIONES fila 12, para Jorge). LFPC 92 exige devolver por
  la misma forma de pago; 92 Bis da bonificación al cliente cuando cancela el
  proveedor.
- **i3** → **Cuarta §7** reescrita: inciso a) con el texto que Stripe publica
  para plataformas que recaban la aceptación en sus términos
  (docs.stripe.com/connect/updating-service-agreements, versión en español),
  válido para la cuenta con panel completo y para el alta dentro de la
  plataforma; **Octava §3** nueva (datos para la cuenta de cobro, consentimiento
  **expreso** por la CLABE: LFPDPPP 2025 art. 7; la ley nueva no tiene «remisión»,
  art. 2 define «persona encargada» y «transferencia»; nuestra lectura:
  transferencia, Jorge confirma); **Anexo D**. LFPIORPI 17: ninguna fracción
  encaja (a confirmar por Jorge, junto con Ley Fintech).
- **h3** → nota en Cuarta §8 y en el memo: con el perfil B, si Marisol dice
  «retiene», la variante B se publica antes de la primera venta de Nomádika.

**Dos cosas para la sesión de producto** (también en la tabla final del
convenio, filas 13 y 14):

1. **El aviso de privacidad** tiene que enlazar a https://stripe.com/privacy e
   incluir la frase que Stripe exige («Cuando proporcionas datos personales en
   relación con Caminante, Stripe recibe esos datos personales y los procesa de
   acuerdo con la Política de privacidad de Stripe») y una cláusula donde el
   titular acepta o no la transferencia (LFPDPPP 2025 art. 35). Sin eso no se
   prende `COBRO_EN_PLATAFORMA`. El texto final lo redacta la sesión legal
   cuando Jorge confirme la lectura.
2. **Cuadrar las pérdidas**: el perfil B dice que NUMAN responde por fraude y
   saldos negativos; `crearCuentaV2` crea con `losses_collector = stripe` y la
   cuenta de Nomádika nació así. ¿Qué dice Stripe para `acct_1UaiUdGRRBL2rPeh`?
   El convenio está escrito para el caso en que responde NUMAN (el que Luis
   aceptó); si Stripe manda, cambia la nota a Jorge, no el texto.
   **Resuelto (producto, 11 nov tarde):** `losses_collector = stripe` para esa
   cuenta; reembolsos y contracargos salen primero del saldo de NUMAN y se
   recuperan revirtiendo la transferencia; con el alta en plataforma nacen con
   `application`. El texto del convenio sirve para los dos; sólo cambió la nota
   a Jorge en la Cuarta §7. Aviso de privacidad: `src/app/caminante/privacidad/page.tsx`.
