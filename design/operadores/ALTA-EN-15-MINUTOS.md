# El alta en 15 minutos

**Meta (Luis, 9 nov 2026):** que una operadora pase de llenar la solicitud a
poder cobrar tan rápido como se abre una cuenta de Revolut, unos 15 minutos de
su tiempo. **La regla:** ningún dato que se pueda sacar de un documento, del
procesador o de otro dato se le pide a la operadora.

El inventario completo de lo que hoy se le pide (52 datos y pasos, con
archivo y línea) se hizo el 9 nov 2026 sobre el commit 2d67be4. Aquí sólo va
lo que se puede automatizar, ordenado por cuánto tiempo le quita al camino
hacia el primer cobro.

## Construido el 9 nov 2026 (commits cef03c3 y e5786dd)

Luis dijo sí a las tres decisiones de abajo (la llamada queda **como interruptor**, hoy obligatoria). Construido: 1 (comisión por omisión), 2 y 3 (revisión automática y envío solo), 4 (interruptor `ALTA_LLAMADA`), 5, 7, 9 (fechas y CSD leídos), 12 y 13 (Stripe precargado) y la liga rota. Falta: 6 y 8 (leer el nombre de la INE para precargar la firma), 10, 11, 14, 15–18.

### Constancia (cef03c3)

**La constancia fiscal llena sola** el RFC, la razón social, el régimen, el
código postal y física/moral, en cuanto el SAT la confirma
(`src/lib/operadores/fiscal-de-csf.ts`). Antes se tecleaban en 5 lugares
distintos. Con dos regímenes de negocio no se adivina: la pantalla ofrece sólo
los de su constancia.

## Lo que más tiempo le quita: las esperas de la casa

Hoy el camino al primer cobro tiene cuatro pasos de la casa. La operadora no
puede hacer nada mientras tanto.

| # | Hoy | Automatización | Decide |
|---|---|---|---|
| 1 | **La casa pone la comisión a mano**, y sin ella la operadora ni siquiera puede firmar. Además **ninguna pantalla escribe `comision_desde`**: sólo existe por un backfill de SQL (0047). | Toda operadora nueva entra a la **escala pública** (`commission_pct` en NULL), y `comision_desde` se escribe **solo, al firmar el convenio**. La casa sólo interviene si negocia otra tasa. | **Luis** |
| 2 | **Revisión de documentos**: la pantalla promete «entre tres y cinco días hábiles». | **Pre-revisión con IA** de cada documento, como ya hace la constancia: tipo correcto, nombre que coincide, fechas vigentes. Lo que sale limpio se **aprueba solo**, y la casa revisa sólo lo dudoso. | **Luis** (cuánto riesgo acepta) |
| 3 | «Mandar a revisión» es un botón que la operadora tiene que apretar. Si no lo aprieta, nadie se entera de que ya subió todo. | Se manda solo cuando la actividad tiene todo. | — |
| 4 | Llamada y aprobación de la solicitud. Hasta que la casa aprueba, no hay panel. | Llamada **opcional**: aprobar en automático a quien cumple un perfil mínimo, y que la llamada sea de bienvenida, no un requisito. Al aprobar, mandarle la **liga de entrada** por correo, para que no tenga que crear su cuenta a mano con el mismo correo. | **Luis** |

## Lo que se lee de los documentos que ya sube

| # | Dato | Hoy | De dónde sale |
|---|---|---|---|
| 5 | **Física o moral** | Se pregunta en **4 pantallas** | Del RFC de su constancia (ya se escribe solo). Se pregunta sólo si todavía no sube la constancia, y por eso **la constancia va primero en el expediente**. |
| 6 | **Vigencia de la INE** (año) | Se elige en un selector | Lectura con IA de la INE: nombre, año de vigencia y CURP. Además se cruza el nombre contra la constancia, en el caso de una persona física. |
| 7 | **Vencimiento de RNT, pólizas y credencial NOM-09** | Se teclea la fecha | Lectura con IA: fechas de vigencia, aseguradora, número de póliza. La persona sólo confirma. |
| 8 | **Nombre de quien firma** el convenio | Se teclea | Se precarga de la INE, o de la constancia si es persona física. El correo ya sale de la sesión. |
| 9 | **RFC y vencimiento del CSD** | Se teclea la fecha | Del propio archivo `.cer`, que trae el RFC y la fecha de vencimiento. |
| 10 | **Ciudad y estado** | Se teclean en la solicitud | Del código postal de su constancia (catálogo de códigos postales del SAT). |
| 11 | **Antigüedad** | Se teclea en la solicitud | De la «fecha de inicio de operaciones» de su constancia. |

## Lo que el procesador (Stripe) vuelve a pedir

| # | Hoy | Automatización |
|---|---|---|
| 12 | La cuenta de cobro se crea **vacía**: sólo correo, nombre comercial y país. En su verificación, Stripe le vuelve a pedir razón social, RFC, código postal y teléfono. | **Precargar la cuenta** con lo que ya sabemos. Las cuentas v2 aceptan `registered_name`, `id_numbers` con `mx_rfc`, teléfono y, para persona física, nombre y apellidos (verificado en los tipos de stripe-node 20.4.1). Stripe sólo le pediría lo que no tenemos: identificación, CLABE y aceptar su contrato. |
| 13 | La cuenta se crea **al primer clic**. Si en ese momento faltaba la constancia, ya no se le agrega nada después. | **Actualizar la cuenta** cuando la constancia se confirma (mientras Stripe no la haya verificado). |
| 14 | La INE se sube dos veces: al expediente y a Stripe. | Sólo se elimina con el alta dentro de la plataforma (`COBRO_EN_PLATAFORMA`, apagada), que manda a Stripe la INE que ya está en el expediente. |

## Lo que se pregunta dos veces

| # | Dato | Dónde se repite | Qué hacer |
|---|---|---|---|
| 15 | Seguro de RC, primeros auxilios, número de guías por grupo | En la solicitud **y** en el expediente | Quitarlos de la solicitud. Primeros auxilios ya ni se pide en el expediente: lo implica la credencial SECTUR. |
| 16 | Los tres compromisos (cobro, deslinde, encuesta) | Casillas en la solicitud **y** aceptación en el convenio | Quitarlos de la solicitud. |
| 17 | Firma del convenio + **una firma por cada anexo** de actividad | Una firma por documento | **Una sola firma** para el convenio y todos sus anexos, y otra sólo cuando se agregue una actividad nueva. |
| 18 | «Cómo nos conociste» | Se teclea | De la cookie de atribución, cuando existe. |

## Lo que está roto y apareció en el inventario

- **La liga de «Pedir expediente» da 404.** El correo manda a
  `/caminante/operadores/expediente/<token>`, y esa ruta no existe
  (`src/lib/admin/operadores-app-actions.ts:211`).
- **El candado de comisión del panel no coincide con el de cobro.** El del
  panel sólo acepta un `commission_pct`; el de cobro también acepta
  `comision_desde`, que es el caso de la escala.
- **`pasos.ts` dice que el convenio se abre al aprobar una actividad**, y
  ningún código lo exige.

## El recorrido que queda

1. **Solicitud** (2 min): nombre de la marca, quién es, correo, WhatsApp,
   actividades y una descripción.
2. **Aprobación** automática o en la llamada. Le llega la liga de entrada.
3. **Expediente** (5–8 min): sube la constancia, la INE, el RNT, las dos
   pólizas y la credencial de cada actividad. Todo se lee solo; ella sólo
   confirma lo leído.
4. **Firma** (1 min): una firma, con su nombre ya puesto.
5. **Cuenta de cobro** (3–5 min): Stripe ya trae sus datos; ella sube su
   identificación, pone su CLABE y acepta.
6. **Arma su experiencia** y cobra.

## Qué tiene que decidir Luis

1. **Comisión por omisión:** ¿toda operadora nueva entra a la escala pública y
   la comisión arranca al firmar? (Quita el paso manual que hoy impide firmar.)
2. **Aprobación automática de documentos** cuando la IA y las fuentes oficiales
   los confirman. ¿Sí, o la casa sigue revisando todo?
3. **¿La llamada sigue siendo requisito?**
