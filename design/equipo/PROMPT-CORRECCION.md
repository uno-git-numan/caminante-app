# Prompt de corrección · lámina «Equipo» (Caminante)

Vas a corregir la lámina «Equipo» que ya entregaste (el archivo único `Equipo -un solo archivo-.html`). No es un rediseño: **reusa tus mismos componentes** (`Persona`, `Alta`, `Transferir`, `Rendimiento`, `FilaNuman`, `FilaCam`, `Cuenta`, `Pastilla`, `Dentro`, `PSwitch`, `PInput`, `PCheck`, `PBtn`, `PEyebrow`) y cambia sólo lo que se pide. Al final dame un **recibo**: lista de qué componentes reusaste sin tocar, cuáles cambiaste y qué cambió en cada uno. Si algo de aquí te obliga a empezar un componente de cero, dilo en el recibo en vez de hacerlo en silencio.

Lo que ya está bien y NO se toca: la tarjeta de persona (avatar + nombre + correo + «Desde el…», los cuatro interruptores con su explicación, el aviso «Entra y mira, no toca» cuando todo está apagado, la baja con confirmación y la regla «Transferir primero» cuando hay cartera, la tarjeta plegable en la casa y abierta en la operadora), el alta con sus validaciones (correo incompleto, @numanhub.com para la casa, «ya está en el equipo», «elige para quién trabaja»), las bajas plegadas con «Lo que atribuyó hasta ese día sigue siendo suyo», el modo operadora acotado a ella con el aviso «Tus cobros, tus devoluciones y tu convenio siguen siendo tuyos», y el ledger de comisiones con líneas negativas por devolución.

## 1 · Rendimiento vive DENTRO de Equipo (lo principal)

Hoy la nav trae dos entradas, «Equipo» y «Rendimiento». Quita la segunda. Rendimiento es una **sección dentro de la pantalla de Equipo**, y sólo existe para `uno@numanhub.com`:

- Debajo de la cabecera de Equipo («Quién trabaja aquí, y qué puede.») va un **segmento de dos pestañas**: `Personas | Rendimiento`. Usa el mismo control de pestañas que ya usas dentro de Rendimiento para `numan | Caminante` (no inventes otro).
- `Personas` es lo que hoy es la pantalla de Equipo (tarjetas, alta, bajas). `Rendimiento` es lo que hoy es la pantalla aparte, tal cual, con su propio segmento interno `numan | Caminante`.
- La pestaña `Rendimiento` **no se dibuja** cuando quien mira no es `uno@numanhub.com`. Muéstralo: en el estado «Casa · Luis» se ve el segmento; en un estado nuevo «Casa · otro admin» (agrega ese estado a la pastilla de la lámina) la pantalla de Equipo es sólo Personas, sin segmento, sin hueco.
- En el modo operadora tampoco hay Rendimiento (la operadora no ve comisiones de nadie).

## 2 · Rendimiento tiene navegación de mes

Hoy dice «Septiembre de 2026 · corte el 5 de octubre» fijo. Agrega **‹ mes ›** a la izquierda del título del mes (flechas del sistema de diseño, no texto). Estados que deben verse:

- **Mes en curso**: «Septiembre de 2026 · corte el 5 de octubre · lo que va del mes». La flecha › está deshabilitada.
- **Mes cerrado** (agosto): «Agosto de 2026 · cerrado el 5 de septiembre». Los números no cambian nunca: es una foto.
- **Mes sin movimiento** (julio): el mismo encabezado y una línea calma: «Nadie atribuyó nada en julio.» Sin tabla vacía.

## 3 · Las cuatro facultades: nombre y texto canónicos

Los nombres que usan el panel y la base son éstos; cámbialos en el switch de Persona, en el de Alta y donde se listen:

| clave | nombre | qué hace | de quién |
|---|---|---|---|
| `onboarding` | Onboarding de operadoras | Toma solicitudes, hace la llamada, revisa y aprueba documentos y actividades, acompaña hasta la firma. | numan |
| `clientes` | Clientes y embajadores | El CRM, WhatsApp, links de cobro, encuestas **y el alta de embajadores**. | operadora |
| `armar` | Armar experiencias | Crear, editar y publicar experiencias, fechas, cupos y precios. | operadora |
| `campo` | Operar en campo | Los rosters completos, con los datos médicos de quien viaja. Sólo quien opera la salida. | operadora |

Hoy «da de alta embajadores» está bajo **Armar**; va bajo **Clientes**. Y «acompaña hasta la primera venta» es «acompaña hasta la firma» (la venta ya no es del onboarding).

## 4 · La cabecera del panel dice lo que dice el panel real

Tu `.mode` dice «Casa · Luis» / «Equipo numan · Ana». En producción la cabecera dice **«Modo admin»** para la casa y, para el equipo, **«Equipo · Ana»** (sin «numan»: si además trabaja para Kéntro, la pastilla de al lado es la que dice a nombre de quién mira). Cámbialo. Y no redefinas `.ahead`, `.nav` ni `.page` en tu bloque de estilos: ya viven en el panel y tu copia se queda vieja. Tu `<style>` debe traer sólo lo que es nuevo de esta lámina (las reglas `.eq*`).

## 5 · El alta: los dos campos en una fila

En `Alta` usas `.fldrow` para poner Correo y Nombre lado a lado, pero `.fldrow` sólo existe dentro de `.embed`, así que en tu propia lámina se ven apilados. Dale a esa fila una clase propia de esta lámina (`.eqfields`, dos columnas de 620px hacia arriba, una columna abajo) y quita `.fldrow`.

## 6 · Persona en la casa: qué se ve plegada

Cuando la tarjeta está plegada en la casa se ve nombre, correo, «Desde el…», los chips de para quién trabaja y la línea «Hoy». Falta **un resumen de facultades**: agrega, después de los chips, «3 de 4 prendidas» (o «Sin facultades · entra y mira» cuando todo está apagado), para que Luis vea de un vistazo a quién le falta algo sin abrir cada tarjeta.

## 7 · Datos: la línea «Hoy» cuando todavía no hay atribución

La atribución (cartera de operadoras, tarjetas, grupos) se construye después de esta pantalla. Muestra el estado en que **nadie tiene nada todavía**: «Todavía sin operadoras en su cartera» / «Todavía sin tarjetas», y comprueba que en ese estado el botón «Transferir cartera» no aparece y la baja se ofrece directa (sin «Transferir primero»). Ya lo haces cuando la cartera es cero; sólo agrega ese estado a la lámina para que se vea, con una persona recién dada de alta (hoy).

## 8 · Lo que sigue igual

Los mismos datos de ejemplo (Ana Ruiz, Diego Mora, Paula Rey, Nomádika, Kéntro, Caminante), las mismas cifras del ledger (10% de la comisión de numan; 3% del cobrado sin IVA por grupo cerrado; 1% de los clientes de sus embajadoras), el corte el día 5, la pastilla de estados de la lámina. Entrega el mismo formato: un solo archivo HTML.
