# PROPUESTA — Cobros, retenciones y facturación con operadores externos

Para revisión del despacho (Jorge Zubarán, legal · Eduardo, fiscal-contable).
NUMAN HUB S.A. de C.V. · 18 ago 2026

Este documento describe **lo que proponemos hacer**, no preguntas abiertas. Al
final hay una lista corta de lo que necesitamos que validen o corrijan.

---

## 1 · Qué es la plataforma y qué cambia

Caminante vende experiencias de naturaleza. Hoy **todas son propias**: Numan
contrata proveedores, cobra al cliente y factura ella. No hay terceros.

Lo que estamos por habilitar: **operadores externos** —guías y operadoras
locales— que publican SU experiencia en la plataforma. Ahí Numan deja de vender
lo suyo y pasa a intermediar.

Entendemos que con eso Numan queda como **plataforma tecnológica** para efectos
del Título IV, Capítulo II, Sección III de la LISR y del artículo 18-J de la
LIVA, con obligación de retener y enterar.

---

## 2 · El flujo que proponemos

1. El cliente paga con tarjeta en la plataforma.
2. **El cobro nace en la cuenta de Stripe DEL OPERADOR** (cargo directo). El
   operador es quien vende frente al cliente.
3. Numan retiene automáticamente, en el mismo cobro, tres conceptos:
   - su **comisión** por intermediación,
   - el **ISR** que la ley le obliga a retener,
   - el **IVA** que la ley le obliga a retener.
4. El resto se deposita directo en la cuenta del operador. **El ingreso del
   operador nunca pasa por las cuentas de Numan.**
5. **El operador emite el CFDI al cliente**, con su propio sello (CSD), desde el
   motor de facturación de la plataforma.
6. **Numan emite al operador** el CFDI de su comisión y la **constancia de
   retención**.
7. Numan entera las retenciones al SAT antes del día 17 del mes siguiente.

### Por qué cargo directo y no que el dinero pase por Numan

Es la decisión de arquitectura más importante y la tomamos por dos razones:

- **Fiscal:** Numan solo reconoce como ingreso su comisión, que es lo que
  entendimos de la junta del 22 de julio.
- **PLD:** Numan **nunca custodia el ingreso de terceros**. Lo único que retiene
  es su propia comisión y el impuesto que la ley la obliga a retener y enterar
  —dinero que no es del operador ni de Numan, sino del fisco, y por un plazo
  corto y trazable.

Si el dinero pasara por Numan y de ahí se transfiriera, tendríamos custodia de
fondos ajenos, con lo que eso implica en materia de prevención de lavado.

---

## 3 · Retenciones — cómo las vamos a calcular

Entendemos que la reforma publicada el **7 de noviembre de 2025** extendió la
retención a personas morales, que antes no la tenían.

| Operador | ISR | IVA |
|---|---|---|
| Persona **moral** con RFC | 4% | 8% |
| Persona **física** con RFC · servicios | 2.5% (subió de 1% en LIF 2026) | 8% |
| Persona **física** con RFC · hospedaje | 4% | 8% |
| **Sin RFC** (cualquiera) | 20% | 16% |

### Tres reglas de la casa que proponemos

**A · Solo operamos con operadores que tengan RFC.** El caso «sin RFC» (20% y
16%) no va a existir: sin RFC no puede emitir CFDI al cliente, que es requisito
del modelo. El sistema no deja vender a un operador sin datos fiscales
completos.

**B · Arrancamos SOLO con personas morales.** Su tasa es **4% plana**, sin la
distinción servicios-vs-hospedaje. Eso nos permite empezar sin depender de una
clasificación que todavía no tenemos resuelta. Las personas físicas entran en una
segunda etapa, cuando ustedes nos confirmen el punto 4 de la lista final.

**C · Ante la duda, se retiene la tasa MÁS ALTA.** El riesgo es asimétrico:
retener de menos deja a Numan como **corresponsable solidaria**; retener de más
se lo acredita el operador en su declaración. Preferimos el error recuperable.

### Cómo se congela

La retención se calcula **al momento del cobro** y se guarda junto a la venta,
igual que la comisión. Nunca se recalcula: las tasas cambian —el ISR de servicios
pasó de 1% a 2.5% este año— y una venta debe poder explicarse con las reglas que
regían el día que ocurrió.

---

## 4 · Facturación

Por venta de operador se emiten **dos** CFDI:

1. **Operador → cliente**, por el total de la experiencia, con el CSD del
   operador. Cada operador entrega su sello y la plataforma timbra a su nombre.
2. **Numan → operador**, por la comisión de intermediación.

Más la **constancia de retención** que Numan emite al operador.

Para las experiencias **propias** de Numan nada de esto aplica: Numan vende,
Numan factura, y no hay retención porque no hay tercero.

---

## 5 · Qué necesitamos de ustedes

1. **¿El flujo de la sección 2 es correcto?** Sobre todo: que el ingreso del
   operador no pase por Numan y que Numan solo reconozca su comisión.
2. **¿Confirman las tasas de la sección 3**, y que a personas morales se les
   retiene 4% plano sin distinguir tipo de servicio?
3. **¿Cómo se documenta la retención** cuando el cobro nace en la cuenta del
   operador? Nos preocupa que el comprobante de Stripe muestre una sola línea de
   «comisión de plataforma» que en realidad contiene comisión + retenciones.
4. **Servicios (2.5%) vs hospedaje (4%) para persona física.** Nuestras
   experiencias incluyen una noche de hospedaje además de guía, alimentos y
   transporte, vendidas como un solo paquete. ¿Qué tasa aplica?
5. **Claves de CFDI**: clave de producto y uso de CFDI para (a) la experiencia
   turística que factura el operador y (b) la comisión que factura Numan.
6. **Reembolsos**: al cancelar una venta ya timbrada, ¿se cancela el CFDI ante el
   SAT o se emite nota de crédito? ¿Y qué pasa con la retención ya enterada?
7. **PLD**: ¿el esquema de cargo directo nos deja fuera del análisis de actividad
   vulnerable, o de todas formas hay obligaciones de identificación de clientes?
8. **Impuesto sobre plataformas tecnológicas**: en la junta se mencionó que ya
   aplica. ¿Cuál es la tasa correcta para nuestro giro?

---

## Anexo · Estado del sistema

- **Hoy en producción:** cobro con tarjeta (Stripe, cuenta de NUMAN HUB), 41
  ventas históricas, todas de experiencias propias.
- **Construido y sin encender:** motor de facturación CFDI (Facturapi) para
  experiencias propias. Espera el CSD de NUMAN HUB.
- **En construcción:** Stripe Connect, facturación multi-emisor, retenciones.
- **Volumen real:** 41 ventas totales. En la junta se mencionó ~500 facturas
  diarias como expectativa; **eso no es el volumen actual** y conviene
  corregirlo para dimensionar bien.
