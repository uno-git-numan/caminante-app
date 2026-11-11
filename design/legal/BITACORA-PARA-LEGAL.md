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
