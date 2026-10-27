# Prompt para Claude Design — «El espacio del grupo» (salida privada, estilo viaje de Airbnb)

> Se pega en el mismo chat donde ya construiste el sitio público móvil
> («Caminante Sitio Público App»), «Mi espacio v2» y el panel («Comunidad»,
> «Admin Salidas v2»). Decisiones de Luis, 26 oct 2026.

---

Busca en este chat lo que ya construiste y tenlo a la vista antes de dibujar:

- **«Caminante Sitio Público App»** (móvil): `.pub-app`, `.pub-head`, `.pub-display`,
  `.pub-eyebrow`, `.pub-expcard`, `.pub-ficha`, `.pub-fecha`, `.pub-chip`, `.pub-cta`
  (`-orange`, `-glass`, `-forest`, `-ghost`, `-sm`), `.pub-buybar`, `.pub-fld`,
  `.pub-dlg`, `.pub-gal`, `.pub-guide`, `.pub-faq`.
- **«Mi espacio v2»** (`.mesp`): `.mesp-trip` (la tarjeta fotográfica de una salida con
  chips pago/deslinde), `.mesp-stchip`, `.mesp-people` / `.mesp-person` / `.mesp-av`,
  `.mesp-invite` / `.mesp-invite-friend` / `.mesp-linkrow`, `.mesp-acc` (acordeones),
  `.mesp-glassbtn`, `.mesp-orange`, `.mesp-toast`, `.mesp-cupo`.
- **«Solicitar nueva fecha»** (`.sol-hero`, `.sol-card`, `.sol-fields`, `.sol-chip`).
- **«Comunidad»** (panel, `.cm*`): la tarjeta `.cmc` con `.met`/`.cmtag`/`.cmnext`, el
  panel lateral `.cmpanel` (`-hd`, `-st`, `-bd`), `.cmwin`, `.sallk`, `.prog`/`.tk2`.
- **«Admin Salidas v2»**: la cápsula de una salida, `.salfoot`, `.salper`, `.sallk`.

**Reusa ese sistema.** Si necesitas una clase nueva, que sea la excepción y dila por su
nombre en el recibo final. Nada de inventar tipografías ni colores: son los de la marca.

---

## Qué es y por qué existe

Cuando alguien pide una fecha para su grupo y decimos que sí, se abre una **salida
privada**: una fecha que no aparece en el sitio, con su propia liga. Hoy esa liga lleva a
la página normal de la experiencia. Queremos que lleve a **un espacio del grupo**, como el
viaje compartido de Airbnb: un lugar donde la anfitriona ve su viaje, invita, ve quién va
entrando y quién ya pagó; donde cada invitado entra con su cuenta, aparta su lugar y firma;
y desde donde salen, uno a uno, todos los mensajes del viaje.

**La regla de fondo:** nadie entra al espacio sin cuenta, y la cuenta exige **celular y
correo**. Con el celular de cada quien podemos escribirle directo (WhatsApp y correo) sin
depender del grupo de WhatsApp, que sigue existiendo como conversación.

**Diseña para teléfono primero.** La anfitriona y los invitados viven en el celular.

---

## Las personas

- **Miranda**, la anfitriona: pidió «Ascenso al Iztaccíhuatl» para 10 personas el 28 de
  noviembre. Cuando le dijimos que sí, se abrió su salida privada «Nov 28–29» con cupo 10.
- **Sus invitados**: entran por la liga que ella les manda. Algunos ya tienen cuenta
  Caminante (viajaron antes), la mayoría no.
- **Luis** (o la operadora): lo gestiona desde el panel. No dibujes nada nuevo del panel
  salvo lo que se pide en la parte D.

---

## A · Lo que recibe Miranda al volverse anfitriona

Al pasar su tarjeta a «Interesado», el sistema le manda **dos mensajes** por WhatsApp y
correo (dibuja los dos como se ven en el teléfono, en una lámina de dos pantallas):

1. **«Eres la anfitriona»**: qué se abrió (experiencia, fecha, cupo 10, precio por
   persona), qué sigue (invitar, apartar, firmar) y la liga de su espacio.
2. **El mensaje para reenviar** a sus amigos o a su grupo, listo para copiar, como el de
   Airbnb: «Hola, estoy armando el Ascenso al Iztaccíhuatl el 28 y 29 de noviembre con
   Caminante. Somos 10 lugares. Entra aquí para apartar el tuyo: caminante.numanhub.com/g/…».

---

## B · El espacio del grupo (lo que ve la anfitriona)

Una sola pantalla larga, estilo viaje de Airbnb, en este orden:

1. **Portada**: foto de la experiencia, nombre, **«Nov 28–29 · Grupo de Miranda»**, chip
   «Salida privada». Debajo, el contador grande: **«4 de 10 lugares apartados»** con su
   barra, y la fecha límite para apartar: «Aparta antes del 14 de noviembre».
2. **Tu lugar** (la tarjeta `.mesp-trip` de ella): estado en tres pasos **entré → pagué →
   firmé**, con el botón que toca («Apartar mi lugar · $14,000» o «Firmar deslinde»).
3. **Invitar**: botón grande **«Invitar a mi grupo»** que copia la liga y abre WhatsApp con
   el mensaje listo (`.mesp-invite`), y la liga visible con «Copiar» (`.mesp-linkrow`).
4. **Quién va** (`.mesp-people`): una fila por persona con avatar de iniciales, nombre y
   su estado como chip: **entró · pagó · firmó**. Miranda arriba con la etiqueta
   «anfitriona». Nunca montos ni datos médicos de otros. Si alguien pagó por varios, se
   ve: «Regina · pagó 3 lugares» y las personas que cubrió debajo, con «pagado por Regina».
5. **Pagar por alguien más** (acordeón): «¿Quieres cubrir el lugar de alguien del grupo?»
   → eliges a quién de la lista de los que ya entraron y pagas por ellos. Cada quien su
   lugar es lo normal; esto es la excepción, dibujada como acordeón cerrado.
6. **El viaje**: itinerario resumido, qué incluye, la mochila (acordeones; sale de la
   experiencia, no se escribe aquí).
7. **Lo que viene**: la fila de mensajes de preparación con sus fechas (14, 7, 5, 2 y 1
   día antes) y el punto de encuentro cuando esté puesto; «te llega por WhatsApp y correo».
8. **El grupo de WhatsApp**: si la operadora pegó la liga, un botón «Abrir el grupo»; si
   no, no aparece.
9. **Pie**: contacto de la operadora («Luis · Caminante») por WhatsApp y correo.

**Estados de la portada** (dibuja los cuatro, pequeños, en una lámina aparte): abierto
(hay lugares), **cupo lleno**, **venció la fecha límite sin juntar el mínimo** (dice que
la operadora se va a comunicar; no cancela sola), y **ya viajaron** (el espacio se vuelve
recuerdo: fotos, encuesta, «volver a salir»).

**El precio:** si la experiencia tiene precio fijo, se muestra fijo. Si el precio sale del
cotizador por tamaño de grupo, muestra «**$X por persona** si van 10 · cambia si cambia el
grupo» con un ⓘ que lo explica en una línea. Dibuja las dos variantes.

---

## C · Lo que ve un invitado

1. **La portada de invitación** (antes de entrar): foto, «**Miranda te invita** al Ascenso
   al Iztaccíhuatl · 28–29 nov», «4 de 10 lugares apartados», precio por persona, y un
   solo botón: **«Entrar al grupo»**. Debajo, en chico: «Vas a crear tu cuenta Caminante
   (celular y correo). El deslinde lo llenas antes de salir».
2. **Crear cuenta, un paso**: botones **«Continuar con Apple»** y **«Continuar con
   Google»** arriba (llenan nombre y correo solos); debajo, el formulario corto: nombre,
   **celular (obligatorio)**, correo. Un solo botón: «Entrar». Si ya tiene cuenta, «Ya
   tengo cuenta · entrar». El celular se verifica con un código que llega por WhatsApp:
   dibuja esa pantalla (seis casillas, «te mandamos un código a +52 55 ••• 1234»).
3. **El espacio, versión invitado**: lo mismo que B pero sin «Invitar» ni «Pagar por
   alguien más», y con **su** tarjeta de lugar arriba: **entré → pagué → firmé**. El
   diseño **incentiva a pagar**: el botón de apartar es lo más visible de la pantalla,
   el contador dice cuántos lugares quedan, y la fecha límite se lee sin buscarla.
4. **Cupo lleno**: ve el grupo igual, pero el botón dice «Cupo lleno · avísame si se abre
   un lugar» (lista de espera).

Dibuja también el **estado feo**: entró, no ha pagado, faltan 3 días para la fecha límite
(el recordatorio que le llega por WhatsApp y cómo se ve su tarjeta con «faltan 3 días»).

---

## D · Lo que cambia en el panel (sólo esto)

1. **La tarjeta del grupo en el CRM** (`.cmc`): la tarjeta de Miranda en «Interesado» se
   vuelve tarjeta de grupo: chip «Anfitriona», `.cmnext` **«4 de 10 entraron · 2
   pagaron»** con barra `.prog`. Cada invitado que entra es su propia tarjeta (`.cmc`)
   con origen «Grupo de Miranda», directamente en «Interesado» con «Falta pagar».
2. **En el panel lateral de la tarjeta de Miranda** (`.cmpanel-bd`), un bloque nuevo **«Su
   espacio»**: la liga del espacio con «Copiar», la fecha límite y el mínimo (editables,
   `.mini-form`), quién es la anfitriona, y la lista corta de quién entró con su estado.
3. **En la cápsula de la salida** (Admin Salidas v2), el mismo bloque «Su espacio» debajo
   del roster, con «Abrir el espacio como lo ve el grupo».

---

## Datos reales para las láminas

- Experiencia: **Ascenso al Iztaccíhuatl**, operada por Caminante. Fecha **Nov 28–29**.
- Anfitriona: **Miranda Castillo**, 10 lugares, pidió el 20 de octubre.
- Entraron: Miranda (anfitriona, pagó, firmó), Regina Bueno (pagó 3 lugares: ella, Sofía
  Ruiz y Daniel Mora, los dos sin firmar), Carla Estrada (entró, no ha pagado), Ximena del
  Valle (entró, no ha pagado). 4 de 10 lugares apartados.
- Precio: $14,000 por persona (dibuja también la variante «si van 10 · cambia si cambia el
  grupo»). Fecha límite: 14 de noviembre. Mínimo: 6.
- Operadora: Luis · Caminante · +52 55 1202 0565 · uno@numanhub.com.

---

## Entrega

Un solo HTML con las láminas en este orden: A (los dos mensajes), B (espacio de la
anfitriona), B-estados (los cuatro), B-precio variable, C1 (portada de invitación), C2
(crear cuenta + código), C3 (espacio del invitado), C4 (estado feo + cupo lleno), D (las
tres piezas del panel). Teléfono para A–C; escritorio para D.

Al final, el **recibo**: qué componentes reusaste de cada pantalla anterior y qué clases
nuevas creaste, con su nombre y para qué.
