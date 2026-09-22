# El MVP de Caminante — qué es, cómo está, y por qué Nomádika no pudo publicar

Medido contra el código y contra la base de producción el **21 sep 2026**. Cada
estado de este documento sale de una consulta o de leer la función, no de
memoria. Donde no pude comprobar algo, lo dice.

---

## 0 · Qué es el MVP

No es una lista de pantallas. Es **una frase que tiene que poder cumplirse sin
Luis en el teclado**:

> Una operadora externa entra a su panel, completa su expediente, publica una
> experiencia, la vende, opera el viaje y se le liquida — y la casa puede
> supervisar cada paso sin meterse a la base.

Todo lo que no sirva a esa frase no es MVP. Todo lo que la rompa es P0, aunque
sea una línea.

Hoy esa frase **se rompe en el paso 3 de 9**, y ahí se queda: no hay salida ni
por el lado de la operadora ni por el de la casa.

---

## 1 · El diagnóstico del paso 3 — el lazo cerrado

Este es el bug que reportaste. No es intermitente ni depende de la sesión: es
estructural, y cualquier operadora nueva lo va a vivir igual.

### La cadena, función por función

**1.** Nomádika tiene su fila en `operators`: `panel_activo = true`,
`estado = 'activa'`. Entra al panel sin problema.

**2.** Pero su solicitud sigue viva en el embudo:

```
operator_applications
  catalina.romero.barragan@gmail.com | status = calling | 25 ago 2026 | docs pedidos: 0
```

**3.** `fetchMiAlta()` (`src/lib/operadores/mi-alta.ts`) decide así:

```ts
const enRecorrido =
  !!solicitud && ["pending", "calling", "docs", "rejected"].includes(solicitud.status);
if (!fila || enRecorrido) {
  if (!solicitud) return null;
  return { estado, operadora: null, candados: [], ... };   // ← operadora en NULL
}
```

`status = 'calling'` está en la lista ⇒ **`operadora: null`**, aunque su fila de
`operators` exista y esté activa.

**4.** La pantalla del expediente (`mi-alta/expediente/page.tsx`) la rebota:

```ts
const operatorId = alta.operadora?.id;
if (!operatorId) redirect("/caminante/admin/mi-alta");
```

**5.** Y ésa es la **única puerta** al expediente. Lo verifiqué: `subirDocumento`
y `declararActividad` sólo se invocan desde `expediente/Expediente.tsx`, que
vive dentro de la página que la rebota. No hay segunda entrada.

**6.** Sin actividad declarada, `actividadListaParaPublicar` devuelve
`no_declarada`, el formulario degrada la experiencia a borrador y la manda…
**al expediente**, que la vuelve a rebotar a «Mi alta».

```
publicar → candado → expediente → rebote → Mi alta → publicar → …
```

Un lazo sin salida. No es un permiso mal puesto: son dos verdades peleadas.
`operators` dice «es operadora activa» y `operator_applications` dice «va en el
paso 02», y la pantalla le cree a la segunda.

### Por qué tú tampoco pudiste desbloquearla

Las dos salidas de emergencia también están cerradas:

- La misma página redirige a la casa antes de nada:
  `if (alta.operadora?.esLaCasa) redirect("/caminante/admin")`.
- `subirDocumento` exige `operadorDelAlcance()`, que para la casa devuelve
  `null` ⇒ *«Solo una operadora sube su expediente.»*

O sea: **nadie puede subir el expediente de Nomádika. Ni ella ni tú.** El único
camino que quedaba era la base a mano, que es justo lo que el MVP debe volver
innecesario.

### Sobre el mensaje «la experiencia no era suya»

Ese texto existe en cuatro lugares (`experiences/actions.ts:69` y `:151`,
`admin/eventos-actions.ts:38`, `experiences/complementos-actions.ts:39`) y todos
salen del mismo gate: `alcanzaExperiencia` / `alcanzaSlug`.

**No pude reproducirlo sin su sesión**, y no voy a afirmar que ya sé cuál de los
cuatro fue. Lo que sí encontré revisando ese gate es un modo de falla real:

```ts
// experienciasDelAlcance
if (error) return [];   // sin poder confirmar de quién es, no se ve nada
```

Un error de lectura devuelve lista vacía, y `alcanzaExperiencia` entonces dice
*«no es tuya»* sobre una experiencia que **sí** es suya. Falla cerrado, que es lo
correcto para la seguridad, pero **miente en el mensaje**: le echa la culpa al
dueño en vez de decir que la consulta falló. Eso hay que separarlo — «no es
tuya» y «no pude verificarlo» no son la misma frase.

---

## 2 · Los pasos del MVP (versión corta — la tabla completa está en §7)

| # | Paso | Estado | Qué falta |
|---|------|--------|-----------|
| 1 | Solicitar y ser aprobada | ✅ funciona | — |
| 2 | Entrar a su panel podado | ✅ funciona | `panel_activo` + nav derivado |
| 3 | **Subir el expediente por actividad** | 🔴 **roto** | el lazo cerrado de arriba |
| 4 | Firmar convenio + anexo de actividad | 🔴 **bloqueado** | no hay texto publicado (§3) |
| 5 | Crear / editar su experiencia | ✅ funciona | atribución se estampa al crear |
| 6 | Publicarla | 🟠 frágil | el candado muerde en 2 de 3 puertas |
| 7 | Venderla y cobrar | 🟠 parcial | la caja no pregunta; 100% cae en Numan |
| 8 | Que se le liquide | 🔴 **no existe** | `operator_payables` vacía, reparto a mano |
| 9 | Operar el viaje (roster, deslinde, encuesta) | ✅ funciona | — |

---

## 3 · Los seis candados dicen que nadie puede armar

`fetchOperadorasPlataforma` mide seis candados por operadora. Medidos hoy:

| Candado | Bloquea | Kéntro | Nomádika | A quién toca |
|---|---|---|---|---|
| Comisión definida | cobrar | ✅ 20% | ❌ sin definir | casa |
| **Convenio firmado** | **armar** | ❌ | ❌ | **casa** |
| CSD fiscal | cobrar | ❌ | ❌ | operadora |
| Stripe Connect | cobrar | ❌ | ❌ | casa |
| Panel activo | armar | ✅ | ✅ | casa |
| Una experiencia publicada | cobrar | ✅ | ✅ | casa |

`puedeArmar` exige los dos candados de «armar». El convenio no está cumplido en
ninguna de las dos ⇒ **`puedeArmar = false` para ambas**.

Y sin embargo las dos tienen experiencia publicada y una ya vendió **$21,000**.

Eso es el hallazgo estructural: **los seis candados son informativos, no
ejecutivos.** Nadie los consulta en la puerta. La ficha dice «no puede armar»
mientras la operadora arma, publica y cobra. Un tablero que se contradice con la
realidad deja de leerse a las dos semanas.

Detalles que lo agravan:

- **El convenio no tiene texto.** `operator_agreement_versions` está vacía, y
  `operator_agreements` también: nadie ha firmado nada porque no hay qué firmar.
  El candado marca `toca: casa` correctamente — es pendiente tuyo (el abogado),
  no de ellas.
- **«Comisión definida» está mal nombrado.** Nomádika tiene `commission_pct`
  NULL y el candado lo llama «sin definir», pero el cobro **sí** resolvió: la
  escala le cobró 20% sobre base en sus 12 ventas ($301.72 cada una). El candado
  debería preguntar *«¿está resuelta?»* —plano **o** escala— no *«¿hay un número
  plano?»*. Tal como está, exige un trato negociado donde la casa ya tiene una
  regla válida.
- **Stripe Connect sin conectar en las dos** (`stripe_account_id` NULL). El
  `checkout.ts` no menciona Connect: el 100% cae en la cuenta de NUMAN. Eso es lo
  que pediste *por ahora*, pero significa que el paso 8 es manual y que nada en
  el sistema registra que ya le depositaste.

---

## 4 · La regla que sale de todo esto

Los tres bugs de esta semana —el cupo en tres lugares, el candado que creía que
la casa era `operator_id IS NULL`, y este lazo— son **el mismo bug**:

> Dos lugares afirmando el mismo hecho, y las pantallas creyéndole a distintos.

El cupo vivía en `capacity` y en dos textos. La casa vivía en `es_la_casa` y en
«no tiene operador». La capacidad de subir expediente vive en `operators` y en
`operator_applications`. Cada vez, el síntoma fue una pantalla perfectamente
sana diciendo algo falso.

Cada paso del MVP tiene que poder contestar: **¿cuál es el único lugar donde
vive este hecho, y quién lo deriva?**

---

## 5 · Stripe Connect — diagnóstico

Medido el 22 sep 2026 contra el código y contra la base.

### 5.1 · La bifurcación de cobro no existe

`createCheckout` **no menciona Connect en ninguna línea**. No hay
`transfer_data`, no hay `on_behalf_of`, no hay `application_fee_amount`, no hay
cargo directo sobre la cuenta conectada. El 100% de cada venta entra a NUMAN HUB
y se reparte a mano.

El propio módulo lo dice, y es honesto:

```
⚠️ ESTE MÓDULO NO COBRA. Solo da de alta la cuenta y lee su estado. El cobro
sigue corriendo por `createCheckout` sin un solo cambio — esa bifurcación es
A3/F1.3 y va al final…
```

**Conclusión operativa:** conectar la cuenta de Stripe de una operadora **hoy no
cambia a dónde va un solo peso**. Lo que existe es el alta de la cuenta y la
lectura de su estado; el cobro sigue siendo el de siempre. No está roto — está
sin construir, y es la mitad que falta.

### 5.2 · El gate que más dinero cuida no lo consulta nadie

`operadorListo` (`src/lib/operators/listo-para-vender.ts`) verifica las cinco
condiciones sin las cuales una venta por Connect saldría mal: Stripe habilitado,
CSD cargado y vigente, datos fiscales del emisor, convenio firmado y comisión
pactada. Su encabezado dice:

> Lo consultan los mismos tres lugares que hoy consultan `deslindeListo`:
> 1. publicar desde el formulario  2. publicar desde el dashboard  3. cobrar

**Medido: ninguno de los tres lo llama.** Los únicos call sites son la pantalla
de cobros, `connect-actions.ts`, `connect.ts` y `convenio-actions.ts` — todos de
administración, ninguno en la puerta.

Hoy no hace daño porque `requiereConnect` devuelve `false` para todos (nadie
tiene `stripe_account_id`). Pero es exactamente la trampa que el propio archivo
describe: el día que alguien conecte su cuenta, el gate que debía detener una
venta con `commission_pct` en NULL no va a estar ahí. Es documentación que
miente sobre su propio cableado — y se lee como garantía.

### 5.3 · El segundo webhook

El route ya está preparado para dos secretos y prueba ambos
(`STRIPE_WEBHOOK_SECRET` y `STRIPE_WEBHOOK_SECRET_CONNECT`). Eso está bien
resuelto.

Pero `STRIPE_WEBHOOK_SECRET_CONNECT` **está ausente en `.env.local`** y falta
confirmar Vercel. Sin ese endpoint, `account.updated` nunca llega y
`stripe_charges_enabled` se queda congelado en lo que diga la base — que es
justo lo que el comentario advierte: *«el gate seguiría creyendo que un operador
puede cobrar cuando Stripe ya lo apagó»*.

### 5.4 · Un peso sin domicilio

`payments` tiene 21 columnas y **ninguna dice a qué cuenta de Stripe cayó el
dinero**. Mientras todo entra a NUMAN da igual. En el momento en que Connect
prenda, cada renglón va a ser ambiguo: no habrá forma de saber, leyendo la
tabla, si ese pago entró a la casa o a la operadora.

Es el mismo bug de familia de todo este documento — un hecho sin un solo hogar —
sólo que este todavía no ha nacido. Hay que darle domicilio **antes** de prender
Connect, no después.

### 5.5 · Una columna muerta

`payments.platform_fee_pct_frozen`: **NULL en los 70 renglones**, y `grep` no
encuentra una sola lectura ni escritura en todo `src/`. Nunca se usó. Es el
duplicado de `platform_fee_mxn` que la 0037 quitó de `operators` y que aquí
sobrevivió.

Se elimina —migrando nada, porque no tiene nada— en cuanto lo autorices.

### 5.6 · Estado de las tres operadoras

| | Kéntro | Nomádika | Numan · Caminante |
|---|---|---|---|
| `stripe_account_id` | — | — | — |
| `stripe_charges_enabled` | false | false | false |
| `csd_subido_at` | — | — | — |
| `rfc` | ✅ | ✅ | ✅ |

Connect está a **0% de uso**. Nadie ha completado el onboarding porque nadie lo
ha empezado.

---

## 6 · Facturación — diagnóstico

### 6.1 · Está apagada en producción, y lo verifiqué

`https://caminante.numanhub.com/caminante/facturacion` responde hoy:

> «La facturación electrónica estará disponible muy pronto. Si necesitas tu CFDI
> ahora, escríbenos y con gusto lo emitimos a mano.»

Eso es `facturacionActiva()` devolviendo `false` porque `FACTURAPI_SECRET_KEY`
no existe en el entorno. El código F1–F3 está completo —autofactura con token
firmado, catálogos del SAT, validación de RFC/régimen/CP, reenvío del CFDI— y
correctamente gateado detrás de esa bandera. No está roto: está esperando F0.

### 6.2 · La cifra que importa

```
62 pagos cobrados · $742,400.00
cfdi_invoices: 0 renglones
payments.status_cfdi: 'por-emitir' en los 70
```

**Tres cuartos de millón cobrados y cero CFDI emitidos por el sistema.** La
tabla lo sabe y lo dice —«por-emitir» en todos— lo cual es lo correcto: no
miente, acumula. Pero es una deuda fiscal que crece con cada venta y hoy se
salda a mano, fuera del sistema.

### 6.3 · Ni siquiera la casa puede timbrar

`csd_subido_at` está en NULL en **las tres** filas de `operators`, incluida
«Numan · Caminante». O sea: el bloqueo no es de las operadoras externas. NUMAN
HUB tampoco puede timbrar lo suyo.

F0 es: cuenta de Facturapi + CSD cargado a esa organización. Las dos cosas son
tuyas y ninguna la puedo hacer yo.

### 6.4 · Lo que hay que verificar antes de timbrar el primer CFDI

Tenemos registrado que **el SAT no tiene dada de alta la actividad de turismo
para NUMAN HUB** (sólo medios y software). Si eso sigue así, los CFDI saldrían
con una clave de producto —`90121500`, agencias y operadores de excursiones— que
no corresponde a las actividades registradas del emisor.

No lo verifiqué contra la CSF en esta sesión. **Hay que confirmarlo antes de
prender F0**, no después del primer timbrado.

---

## 7 · Los diez pasos, actualizados

| # | Paso | Estado | Qué falta |
|---|------|--------|-----------|
| 1 | Solicitar y ser aprobada | ✅ | — |
| 2 | Entrar a su panel podado | ✅ | — |
| 3 | **Subir el expediente** | 🔴 roto | el lazo cerrado (§1) |
| 4 | Firmar convenio + anexo | 🔴 bloqueado | no hay texto publicado |
| 5 | Crear / editar su experiencia | ✅ | — |
| 6 | Publicarla | 🟠 frágil | candado en 2 de 3 puertas |
| 7 | **Que el cobro entre a SU cuenta** | 🔴 **sin construir** | la bifurcación A3 (§5.1) |
| 8 | Que se le liquide | 🔴 no existe | `operator_payables` vacía |
| 9 | **Que el cliente reciba su CFDI** | 🔴 apagado | F0: Facturapi + CSD (§6) |
| 10 | Operar el viaje | ✅ | — |

---

## 8 · Orden de construcción, revisado

### P0 — que una operadora llegue sola hasta publicar
1. Romper el lazo del expediente (§1).
2. La casa puede declarar y subir por la operadora, registrado como tal.
3. Separar «no es tuya» de «no pude verificarlo».
4. La dispensa de Kéntro, antes de que `correr-entre-volcanes` se despublique sola.

### P1 — que el dinero no mienta
5. La tercera puerta del candado de actividad (`createCheckout` + `/reservar`).
6. **Cablear `operadorListo` a las tres puertas que su propio encabezado promete.**
   Hacerlo ANTES de construir la bifurcación de cobro, no después: es el gate
   que impide vender con comisión en NULL.
7. Darle domicilio al peso: columna de cuenta destino en `payments` (§5.4).
8. Registrar en `operator_payables` lo que ya depositaste.
9. Eliminar `platform_fee_pct_frozen` (columna muerta, §5.5).

### P2 — prender Connect de verdad (A3)
10. `STRIPE_WEBHOOK_SECRET_CONNECT` + el segundo endpoint, verificado con un
    `account.updated` real.
11. La bifurcación en `createCheckout`: cargo directo o destination charge, con
    `application_fee_amount` derivado del MISMO motor de comisión que hoy
    congela `platform_fee_mxn`. Un solo motor, dos caminos.
12. Probarlo de punta a punta en modo test con una cuenta conectada de prueba,
    antes de tocar a Kéntro o a Nomádika.

### P3 — prender facturación (F0 → F4)
13. F0 (tuyo): cuenta Facturapi + CSD, y **confirmar la actividad del SAT** (§6.4).
14. Timbrar una venta real de prueba y verificar el XML contra la CSF.
15. Decidir qué pasa con los 62 pagos históricos en «por-emitir».

### P4 — las mentiras conocidas
16. `seats_taken`.
17. Aviso de marca incompleta (#103).

---

## 9 · Lo hecho (22 sep 2026)

Cinco commits en `deploy/caminante-site`, los cinco con build verde en Vercel.
Nada promovido a producción todavía: **la 0060 se aplica primero**.

| Commit | Qué cerró |
|---|---|
| `8663233` | El marketplace muerto: `trips`/`bookings`/`listings`, 7 rutas y 2 libs sobre 4 tablas que no existen, más 2 stubs |
| `e1673c8` | Las primeras pruebas del repo: 64 sobre comisión, cupo, copia, gate de Connect, marca, flujo y convenio |
| `227f386` | §1 entero: la fila manda, la casa sube por la operadora, la dispensa como objeto (0060) |
| `2490b29` | §5.2: `candadosDe`, una puerta para las tres, + invariante #20 |
| `4088e22` | §H: la marca a medias degrada en vez de apagar; `mi-alta/marca` y `mi-alta/cobrar` |
| `d7cac0c` | Los tres correos que faltaban después de aprobar |

**Lo que cambia para una operadora:** puede completar su expediente sola (o la
casa por ella), conectar su Stripe y subir su CSD desde su panel, capturar su
marca, y cada candado que le toca lleva su puerta. Y se entera por correo
cuando algo avanza.

**Lo que cambia para el dinero:** la caja pregunta por los tres candados, no
por uno. ⚠️ Al promover, `correr-entre-volcanes` deja de vender hasta que
exista su dispensa — a propósito: hoy vende porque el sistema no se dio cuenta.

### Lo que sigue bloqueado, y en quién

| Bloqueo | Quién |
|---|---|
| Aplicar la 0060 (`sha256 e84fa259…60b2`) | Luis |
| Fecha de la dispensa de Kéntro (máx. 90 días) | Luis |
| Staging: proyecto Supabase aparte + llaves | Luis |
| Connect habilitado en Stripe + `crear-webhook-connect.sh` | Luis |
| Texto del convenio cerrado por el abogado | Luis |
| Vercel Pro · Supabase Pro · Resend Pro | Luis |
| La bifurcación de cobro por Connect | yo, en cuanto haya staging |
| El guion E2E «Operadora Cero» | yo, en cuanto haya staging |
