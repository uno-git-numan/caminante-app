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
