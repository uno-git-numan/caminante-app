# Retención de impuestos a las operadoras: tres caminos comparados por simpleza

**11 nov 2026 (noche) · Sesión legal y fiscal, para Luis.** Luis frenó la
construcción con tres preguntas: «¿Qué pasa si le das a la operadora el cash que
le corresponde y ellos retienen su IVA y su ISR? ¿Cómo lo hace Airbnb? Nosotros no
vamos a estar declarando impuestos para la operadora, ¿o sí? Quiero simpleza.»
Esto contesta las tres, compara los tres caminos y recomienda uno. Fuentes:
LISR 106, 113-A, 113-B, 113-C, 113-J; LIVA 1-A BIS, 18-J, 18-K, 18-L, 18-M; LIF
2026 art. 25; CFF 26. Todas leídas del texto oficial.

## Las tres respuestas, cortas

1. **«Darle el cash y que ellos retengan su IVA y su ISR».** Nadie «se retiene a
   sí mismo»; lo que Luis describe es que **la operadora cobre directo y pague
   sus impuestos como cualquier negocio**. Eso **es legal y la ley lo prevé
   expresamente** (LIVA 18-M, segundo párrafo: «el cobro de algunas actividades
   se haya realizado por [la plataforma] y otras directamente por el
   contribuyente»), **pero sólo si NUMAN de verdad no cobra** (camino A). Con el
   cobro como está hoy en Stripe (camino B, el dinero entra a NUMAN), hacerlo
   sería una retención omitida: NUMAN respondería solidariamente «hasta por el
   monto de dichas contribuciones» (CFF 26 fracción I) más accesorios.
2. **Airbnb** cobra por cuenta del anfitrión (camino B) y por eso retiene ISR e
   IVA, le entrega el CFDI de retenciones y entera. **No declara por el
   anfitrión**: él declara lo suyo, o toma la retención como pago definitivo si
   gana $300,000 o menos (LISR 113-B; LIVA 18-M).
3. **NUMAN nunca declara impuestos por la operadora**, en ningún camino. En B
   entera lo que retuvo (obligación propia, igual que un patrón con sus
   empleados) y la operadora sigue declarando lo suyo.

## Los tres caminos

| | **A · Cargo directo** (el cliente paga en la cuenta de Stripe de la operadora; NUMAN sólo cobra su comisión) | **B · Cargo con destino** (hoy: el dinero pasa por NUMAN y se transfiere) | **C · NUMAN vende** (NUMAN factura al cliente; la operadora factura a NUMAN) |
|---|---|---|---|
| ¿Quién cobra al cliente? | La operadora, en su propia cuenta de cobro | NUMAN, por cuenta de la operadora | NUMAN, a nombre propio |
| ¿NUMAN retiene ISR/IVA? | **No** | **Sí**: 2.5 % ISR y 50 % IVA (20 %/100 % sin RFC) | Sólo 1.25 % de ISR si la operadora es RESICO; nada si es actividad empresarial |
| Fundamento | LIVA 18-J II: retiene «**cuando cobren** el precio y el IVA… por cuenta» del prestador; LISR 113-A párrafo 3: sobre «los ingresos que efectivamente perciban… **por conducto**» de la plataforma; 113-A párrafo 4 y LIVA 18-M prevén el cobro directo por la operadora | LISR 113-A y 113-C IV; LIVA 1-A BIS + 18-J II; LIF 2026 25 VI/IX | LISR 106 último párrafo (10 % sólo por servicios profesionales); 113-J (RESICO 1.25 %) |
| Carga mensual de NUMAN | **Informativa del día 10** (nombre, RFC, CURP, domicilio, banco y CLABE, monto; LIVA 18-J III, «aun cuando no hayan efectuado el cobro»); precios con «IVA incluido» (18-J I). Nada más | Informativa del día 10 **+** CFDI de retenciones a cada operadora el día 5 (113-C II; 18-J II c) **+** entero del ISR e IVA retenidos el día 17 (113-C IV; 18-J II b) **+** alta como retenedora (18-J II d) + conservar (113-C V) | Ninguna de plataforma; en cambio NUMAN acumula el 100 % de la venta como ingreso propio |
| Carga de la operadora | Declara como cualquier negocio (ya lo hace quien factura). Si gana ≤ $300,000: opción de pago definitivo, 8 % de IVA sobre lo cobrado directo (18-M) y la tasa de retención como ISR definitivo (113-A párrafo 4) | Recibe neto; acredita lo retenido o lo toma como definitivo (113-B, 18-M) | Factura a NUMAN cada venta; nada más |
| Reembolsos y contracargos | Caen en **su** cuenta de Stripe (NUMAN no los adelanta) | Caen primero en el saldo de NUMAN y se recuperan revirtiendo la transferencia | Todo lo paga NUMAN |
| Lo que pierde NUMAN | Control del dinero (ya no decide cuánto se transfiere); la comisión de Stripe la paga la cuenta de la operadora, así que «NUMAN la absorbe» exige bajar su comisión en esa proporción o cambiar la cláusula | Tres obligaciones mensuales, un módulo, y la responsabilidad solidaria si algo falla | **IVA sobre el total** (acreditable sólo con la factura puntual de la operadora: el dolor de hoy), **ISR sobre el margen** con la deducción atada a su CFDI, **toda la responsabilidad LFPC** (NUMAN es el proveedor), turismo en la CSF de NUMAN, y rompe el modelo Airbnb que Luis decidió |
| Construcción | Cambiar el cargo de «con destino» a «directo» en Stripe; rediseñar cómo se cobra la admisión (no hay transferencia que revertir); exportar la informativa; cerrar la vía (b) para terceros | Módulo de retención completo (cálculo, descuento, CFDI de retenciones, acumulado, informativa) | Nada en Stripe; cambia el convenio entero (deja de ser plataforma) y la facturación |
| Riesgo legal | **Bajo**: lectura amplia de «por conducto»; mitigantes: el dinero nunca entra a NUMAN, la operadora contrata directamente con Stripe, y el 18-M describe exactamente este caso. Marisol confirma el número de la regla de la RMF que lo desarrolla | **Ninguno** si se hace bien; **alto** si se hace mal (solidario) | Fiscalmente limpio pero caro; además el sistema hoy timbra con una clave de turismo que NUMAN no tiene en su CSF |

## Recomendación: **A**, cargo directo

Es el más simple para los dos sin violar nada: NUMAN no retiene, no emite CFDI
de retenciones, no entera, no se da de alta como retenedora; la operadora cobra
su dinero y paga lo suyo como ya debe. Lo único que queda de obligación de
plataforma es la **informativa mensual del día 10** (por eso **sí** se conservan
CURP y CLABE: la decisión D4 no cambia) y la leyenda «IVA incluido».

**Condiciones para que A sea A** (si falta una, se vuelve B y vuelve la
retención):

1. **El dinero no entra a NUMAN.** El cargo se crea en la cuenta conectada de la
   operadora y NUMAN sólo recibe su comisión (`application_fee`). Esto vale igual
   con el alta dentro de la plataforma (`COBRO_EN_PLATAFORMA`): que NUMAN recabe
   los requisitos y responda ante Stripe por saldos negativos es un contrato
   privado con Stripe, no cobrar por cuenta de la operadora; la respuesta **no
   cambia**.
2. **La vía (b) del convenio (NUMAN cobra por transferencia o en efectivo por
   cuenta de una operadora sin cuenta conectada) se cierra para terceros.** Ahí
   NUMAN sí cobra por cuenta y retendría. Se deja sólo para las experiencias
   propias. Ojo: hoy el candado deja pasar a una operadora sin cuenta
   (`requiereConnect`); con A eso se cierra.
3. **Comisión de Stripe.** En un cargo directo la cuenta de la operadora paga la
   comisión del procesador. La Cuarta §3 dice que Caminante la absorbe dentro de
   su comisión. **Luis decide** (es de negocio): (i) NUMAN baja su `application_fee`
   en el costo del procesador, estimado o exacto, para que la operadora reciba lo
   mismo que hoy; o (ii) se cambia la Cuarta §3 y la operadora paga el procesador
   (y la comisión de plataforma baja o no). Mi recomendación: (i), porque es lo
   que ya decidiste el 9 nov y lo que el cotizador asume.
4. **La admisión de $20** no puede revertirse de una transferencia porque no la
   hay. Se cobra como cargo único en la primera venta (producto dimensiona cómo).
   La cláusula sólo cambia «revirtiendo esa cantidad de la transferencia» por
   «descontándola de esa venta».

**Qué cambia en el convenio v3.2 si Luis elige A** (lo hago en cuanto decida;
nada se publica antes): Cuarta §1(a) se queda (ya describe que el resto «entra
directamente a la cuenta del Operador»); Cuarta §1(b) sólo para experiencias
propias o desaparece; §3 según el punto 3; §3 bis «de esa venta»; **§8 vuelve a
no retener**, con el texto honesto: «Caminante no cobra por cuenta del Operador:
el cliente paga en la cuenta de cobro del Operador y Caminante recibe únicamente
su comisión; por ello Caminante no retiene ISR ni IVA, el Operador cumple sus
obligaciones fiscales por sus ventas (LIVA 18-K a 18-M; LISR 113-A), y
Caminante presenta al SAT la información mensual de operadores (LIVA 18-J
fracción III)»; §9 ejemplo vuelve a $1,400 (o menos el procesador, según el
punto 3); Quinta §9 se simplifica (reembolsos y contracargos nacen en la cuenta
de la operadora); Décima tercera §3 (CFDI de retenciones) se quita; Anexo F
conserva CURP y CLABE por la informativa. El documento de decisiones cambia
D1–D5 por «A» y deja D4 (informativa) y D6 (pagos a Nomádika hoy) como están.

**Si Luis elige B**, todo queda como está en v3.2 y se construye el módulo.

**C no se recomienda**: es lo que hace sufrir hoy (la factura de Nomádika para
poder acreditar), carga a NUMAN con IVA e ISR sobre dinero que no es suyo y con
toda la responsabilidad frente al cliente, y deshace el modelo Airbnb.

## Lo que Marisol confirma de este documento

- El número de la regla de la RMF 2026 que desarrolla el cobro directo por el
  oferente en operaciones por plataforma (la ley lo prevé en LIVA 18-M y LISR
  113-A párrafo 4; la regla da el procedimiento).
- Que la LIF 2026 art. 25 VI/IX (personas morales) sólo opera «mediante
  retención» cuando la plataforma cobra, y que en A una persona moral (DRUIDAS,
  Kéntro) simplemente declara lo suyo.
