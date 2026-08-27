# Prompt para Claude Design — «Comunidad» (vista del OPERADOR)

> Se pega en el mismo chat donde ya construiste el panel de Caminante:
> el Dashboard, Admin Salidas v2, Admin Experiencias v3 y Caminante Admin App.

---

Busca en este chat lo que ya construiste y tenlo a la vista antes de dibujar:

- **«Caminante Admin — Dashboard»** — el sistema del panel de escritorio:
  `.page`, `.sec`, `.sec-head` (eyebrow con `//`, `.display` con remate en itálica
  naranja, `.desc`), `.card`, `.pad`, `.kpis`/`.kpi`, `.chip` con sus variantes
  (`c-pub`, `c-draft`, `c-sol`, `c-conf`, `c-paid`, `c-canc`), `.pchip` (la
  píldora de persona con avatar de iniciales), `.prog` con `.tk2` y su fracción,
  `.filters`, `.empty`, `.act-row`, `.mini-form`, `.subtitle`, y los expandibles
  `.xhead` / `.xbody` / `.chev2`.
- **«Admin Salidas v2»** — la cápsula que se abre, `.salfoot`, `.salper` (fila de
  persona con acciones), `.salnew`/`.salstep`/`.salpick` (el alta por pasos).
- **«Admin Experiencias v3»** — `.exsem` (el semáforo de una línea), `.ex3` (tres
  cifras), `.exd` (píldora con punto y tres estados).

**Te pido una pantalla nueva: «Comunidad».** Reusa ese sistema. Si necesitas una
clase nueva, que sea la excepción y dila por su nombre en el recibo final.

---

## Qué es Comunidad y por qué existe

El panel ya contesta cuatro preguntas: *cómo va todo* (Panorama), *qué vendo*
(Experiencias), *quién viene el sábado* (Salidas), *qué entra y sale* (Recursos).
Falta la quinta: **¿quién es la gente?**

Comunidad es para **administrar, cuidar, dar seguimiento y dar servicio**. Tiene
dos mitades que no se parecen:

1. **El pipeline** — quién está preguntando y todavía no paga. Es un tablero de
   trabajo: se mueve, se le escribe, se le presiona.
2. **La gente** — quién ya viajó. Es un directorio de cuidado: a quién le debes
   una respuesta, quién quedó encantado y no ha vuelto.

**Diseña para el OPERADOR PROMEDIO**, no para la casa. Un operador ve solo lo
suyo: sus experiencias, sus clientes, sus mensajes. No hay selector de operador,
no hay comisiones, no hay vista de plataforma. (La vista de la casa viene después
y no la dibujes.)

---

## MITAD 1 · El pipeline

**La unidad es PERSONA × SALIDA, no persona.** Alguien puede estar interesado en
Barrancas y ser ya viajero de Hongos. Las etapas 3 a 6 son sobre *un viaje
concreto*: su grupo, su lista de equipaje, su pago. Cada tarjeta dice de qué
salida habla.

Seis etapas. Las dos últimas son automáticas.

| # | Etapa | Qué pasa aquí | Cómo se sale |
|---|---|---|---|
| 1 | **Llegó** | Entró una solicitud. Se le escribe y se le agenda llamada. | manual |
| 2 | **En conversación** | La llamada está agendada o ya ocurrió. | manual |
| 3 | **Interesado** | Dijo que sí. Ahora se cobra: recordatorios, grupo, link para invitar amigos. | **automática al pagar** |
| 4 | **Pagado** | Cayó el pago. | automática |
| 5 | **Preparando** | Recordatorios programados antes del viaje. | automática al viajar |
| 6 | **Viajó** | Pasa a «La gente». | — |

Necesito ver **cómo se ve el tablero completo** y **cómo se ve una tarjeta
abierta en cada una de las etapas 1, 3 y 5**, que son las que tienen trabajo.

### La tarjeta cerrada

Compacta, se barre con el ojo: nombre · de qué salida habla · cuántas personas ·
de dónde llegó (solicitud de grupo · WhatsApp · un embajador) · cuánto lleva
esperando · y **la siguiente acción con su fecha**, que es lo único que de verdad
importa: *«Llamada el jue 4 sep, 6 pm»*, *«Sin contactar desde hace 3 días»*.

Una tarjeta que lleva demasiado tiempo sin moverse tiene que **verse mal**. Es el
estado que más importa de toda la pantalla: un prospecto olvidado no avisa.

### Etapa 1 abierta · escribir y agendar

Dos cosas, en este orden:

**a) El mensaje.** Dos canales, y **no se comportan igual** — esto no es un
detalle de implementación, cambia lo que puedes dibujar:

- **Correo:** el operador redacta libre. Campo de asunto y cuerpo.
- **WhatsApp:** si la persona escribió primero, hay 24 horas de texto libre. Si
  no, Meta **solo** deja escribir con una **plantilla aprobada por ellos**: el
  operador NO redacta, **elige plantilla y llena sus huecos**. Dibuja los dos
  estados y que se entienda cuál está activo y por qué. Es la regla que más se va
  a topar en el uso real.

**b) La llamada.** ⚠️ **El sistema NO crea la reunión.** Cada operador ya tiene
su cuenta de Google o de Zoom y genera la liga allá — muchos prefieren Zoom. Aquí
sólo la **pega**, junto con fecha y hora. No dibujes ningún botón de «generar
Meet»: prometería algo que no hacemos.

Lo que sí pasa, y quiero verlo dibujado, es que esa liga pegada se reparte sola:

1. entra al mensaje **por los dos canales** — correo Y WhatsApp. No es «uno u
   otro»: al solicitante le llega por ambos, porque es la cita y no se puede
   perder.
2. el cliente recibe un **«agregar a mi calendario»**: archivo .ics más liga de
   Google Calendar. Sirve en cualquier calendario y no exige conectar nada.
3. la llamada aparece **en la agenda del operador**, dentro de esta misma
   pantalla. No hay integración con Google: es una lista propia. Dibújala.

O sea: el operador hace UN trabajo —pegar la liga y poner la hora— y de ahí
salen el mensaje, el calendario del cliente y su propia agenda.

### Etapa 3 abierta · cobrar

Aquí se pelea la venta. Necesito:

- **El grupo de WhatsApp.** ⚠️ **Meta no permite crear grupos por API — nadie
  puede.** El operador crea el grupo en su teléfono y **pega el link de
  invitación una sola vez**; el sistema lo guarda y lo mete en los mensajes de
  aquí en adelante. Dibuja el estado «sin grupo todavía» y el estado «grupo
  puesto», y que el primero no parezca un error: es lo normal al principio.
- **El link para invitar amigos.** Ya existe: es un link privado de esa salida.
  Se copia y se manda. Botón de copiar con su confirmación.
- **Recordatorios de pago.** Mandar ahora, o programar para una fecha.
- **Cuánto falta:** cuántos lugares apartó, cuánto suman, qué se ha pagado.

### Etapa 5 abierta · preparar

Mensajes **programados** antes del viaje: la lista de equipaje, «compra tus
vuelos», el punto de encuentro. Se ven como una fila de tiempo: qué se manda,
cuándo, y cuáles ya salieron. Los envíos son **por día**, no por hora — dibújalo
con esa granularidad y no prometas «a las 6:15 pm».

### Estados que hay que dibujar

- **El tablero vacío.** Hoy hay literalmente **cero solicitudes**: es el estado
  que el operador nuevo ve el primer día, y no es un error. Debe explicarle de
  dónde van a llegar (el formulario de grupo de su experiencia, su WhatsApp, sus
  embajadores) y no regañarlo. Usa `.empty`.
- **Una tarjeta fría** — sin mover desde hace días.
- **Una tarjeta que se cayó**, con su motivo. Perder es un dato, no un vacío:
  quiero que se vea por qué.

---

## MITAD 2 · La gente

Hoy esto es una tabla de 60 renglones ordenada por fecha, con una columna
«Etapa» que dice *Lead* en las 60 — incluida la persona que gastó $32,000. Por
eso no sirve: no diferencia.

**No abre en orden alfabético. Abre en grupos accionables.** Éstos son los
números **reales de producción**, no de ejemplo:

- **Te deben algo ahora — 7.** Reservas vivas sin deslinde firmado.
- **Encantados y sin volver — 16.** Contestaron la encuesta como promotores y
  sólo han hecho un viaje. Es el activo comercial más grande y hoy ninguna
  pantalla lo dice.
- **Se les debe una respuesta — 1.** Un detractor.
- **Ya repitió — 1.** De 47 personas que han viajado. Ese número es una meta, no
  un dato: dale el peso de una meta.

Y abajo, **los 47**, buscables. Total histórico **$684,650**; **20 de 41**
encuestas contestadas.

Cada persona es una píldora compacta que se expande a su ficha: contacto,
viajes con fecha y monto, gasto total, deslindes firmados, qué contestó en la
encuesta, sus acompañantes, y los botones de **WhatsApp** y **correo**.

⚠️ **Los nombres que uses son inventados** — usa «Ana Robles», «Diego Palma»,
«Mariana Ortiz». Los datos personales de clientes reales no salen de nuestros
sistemas. Los conteos y montos de arriba sí son verdaderos.

---

## Lo que NO va

- **Reservas no vive aquí.** Se llama «Pagos» y vive dentro de Recursos, con el
  dinero. No la dibujes.
- **Nada de comisiones, escalones ni operadores.** Ésta es la vista del operador
  viendo a SUS clientes.
- **Ningún dato inventado fuera de los nombres.** Si un número no está arriba,
  déjalo como hueco visible.

---

## Cómo quiero la entrega

- HTML autocontenido, ancho de escritorio, con el CSS del panel **reusado**.
- **Todos los estados en la misma lámina**: el tablero con trabajo y el tablero
  vacío; WhatsApp con ventana abierta y WhatsApp obligando plantilla; con grupo y
  sin grupo; una tarjeta fría y una caída.
- **Un recibo de qué reusaste**: las clases del panel que aplicaste tal cual, y
  las que tuviste que inventar con el motivo de cada una. Si la segunda lista
  sale larga, empezaste de cero en vez de partir de lo que ya hiciste.
- **Tus tres decisiones explicadas:** cómo resolviste seis etapas en un ancho de
  escritorio sin que parezca un Trello genérico; cómo se ve la diferencia entre
  «puedo escribir libre» y «tengo que usar plantilla» sin dar una clase de la API
  de Meta; y cómo hiciste que los cuatro grupos de «La gente» se lean como
  trabajo pendiente y no como estadísticas.
