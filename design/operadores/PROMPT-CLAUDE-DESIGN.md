# Prompt para Claude Design — Funnel de operadores (web + móvil)

> Pega todo lo que va debajo de la línea. Está escrito para que el entregable se
> pueda transcribir verbatim al código.

---

Necesito el funnel completo para dar de alta **operadores externos** en Caminante,
en **escritorio y móvil**. Caminante es una plataforma mexicana de experiencias en
naturaleza; los operadores son guías y operadoras locales que llevan a la gente al
campo usando nuestra infraestructura para vender, cobrar, documentar legalmente y
comunicar.

## Lenguaje visual (esto ya existe, respétalo)

- **Voz:** científico-poeta. Tuteo. Frases cortas. **Sin emojis, en ninguna
  pantalla.**
- **Tipografía:** Geist (y Geist Mono para números, folios, porcentajes).
- **Paleta:** olivo `#637154` · naranja `#FF5D36` (acento, con cuentagotas) ·
  crema `#F7F4EE` · carbón `#1C1C1A` · bosque `#2F4033`.
- **Glassmorphism**: los botones y tarjetas flotantes de Caminante son glassy
  (fondo translúcido + blur + borde de 1px muy tenue). Úsalo.
- **Fotografía de naturaleza** a sangre en el hero y en los cortes de sección,
  siempre con velo/degradado propio para que el texto encima nunca compita.
- Referencia de estilo: nuestra página pública de embajadores
  (`/caminante/embajadores`) y el sistema editorial de la marca.

## Reglas duras del entregable

1. **Cero números inventados.** Donde va un porcentaje de comisión, pon el
   marcador literal `{{TRAMO_1}}`, `{{TRAMO_2}}`, `{{TRAMO_3}}` — los define el
   dueño y yo los sustituyo. Igual con cualquier cifra que no te dé este prompt.
2. **Cero datos de contacto inventados.** El correo real es `uno@numanhub.com`.
3. **Móvil y escritorio de la misma pantalla**, no dos productos distintos.
   Móvil primero: pulgar, una columna, botones de 44px mínimo.
4. **Regreso siempre visible** en móvil (es una app, no una web con botón atrás
   del navegador).
5. Entrega HTML autocontenido por pantalla, con el CSS scopeado bajo un prefijo
   propio (`.opa-`), sin `@import` de fuentes externas.

---

# Pantalla 1 · Landing pública `/caminante/operadores`

La página que convence. Escritorio y móvil.

**1.1 Hero** — foto de naturaleza a sangre. Antetítulo `PARA OPERADORES`.
Titular grande con un acento en itálica naranja. Bajada de 2 renglones. Un solo
botón: **«Aplica como operador»**. Debajo, en chico: «Programa curado. Aplicación
→ llamada de 30 minutos → convenio.»

**1.2 «Tú pones el campo. Nosotros, todo lo demás.»** — dos columnas en
escritorio, apiladas en móvil. Izquierda: lo que hace el operador (guiar, conocer
el lugar, cuidar al grupo). Derecha: lo que hace la plataforma.

**1.3 Lo que construimos por ti** — rejilla de 8 tarjetas glassy, cada una con
un título corto y una línea. Usa exactamente estos:
- **Tu página de experiencia** — hecha con tus fotos y tu itinerario, con las
  cuatro caras del lugar: naturaleza, conservación, comunidades y problemas.
- **Cobro en línea** — pago con tarjeta, links por WhatsApp y transferencias
  registradas. Cada peso, rastreado.
- **Deslinde legal que se genera solo** — tus cláusulas se vuelven un documento
  que el cliente lee y firma en línea, antes de subirse.
- **Expediente médico de cada participante** — alergias, padecimientos, contacto
  de emergencia. Y de quienes viajan con él.
- **Cupos y fechas** — salidas públicas, salidas privadas por link y solicitudes
  de fecha nueva cuando alguien pide la suya.
- **Kit de comunicación** — piezas listas para Instagram por cada experiencia,
  con textos escritos y publicación programada.
- **Encuesta automática** — a cada quien que viajó, 24 horas después de volver.
  Sabes cómo te fue sin preguntar.
- **Tu panel** — ocupación por salida, lista de quién sube, dinero cobrado y lo
  que te toca.

**1.4 Tu marca, no la nuestra** — banda ancha con una foto y un mockup: portal
propio en `caminante.numanhub.com/caminante/o/tu-marca`, con tu logo y tus
colores. Debajo, en tono honesto y sin adornos, un bloque **«En camino»** con:
correos con tu marca · dominio propio · kit y PDF con tu marca · depósito
automático. Diséñalo como una promesa fechada, no como una función disponible.

**1.5 Cómo ganas** — la sección más importante. Titular:
**«Entre más cara la experiencia, más baja nuestra comisión.»**
Tabla de 3 escalones, en Geist Mono, muy legible en móvil:

| Precio por persona | Comisión |
|---|---|
| Hasta $5,000 MXN | `{{TRAMO_1}}` |
| $5,001 – $15,000 MXN | `{{TRAMO_2}}` |
| Más de $15,000 MXN | `{{TRAMO_3}}` |

Debajo, tres líneas de letra chica: «La comisión se congela en cada venta: lo ya
vendido nunca cambia.» · «Te pagamos a los 7 días del regreso.» · «El porcentaje
exacto se cierra en el convenio.»

**1.6 Lo que te pedimos** — lista de cinco, honesta y sin suavizar:
seguro de responsabilidad civil vigente · guías con primeros auxilios · protocolo
de emergencia por experiencia · permisos del área donde operas · y el estándar
Caminante (beneficio real a la comunidad local, no dejar rastro, cupo con
criterio). Una línea de cierre: «Si algo te falta, dilo. Varios de estos se
resuelven; esconderlos, no.»

**1.7 Cómo es el proceso** — 4 pasos numerados en línea de tiempo:
Aplicas · Hablamos 30 minutos · Nos compartes tus documentos · Publicamos tu
primera experiencia juntos.

**1.8 Cierre** — foto, una frase de marca y el mismo botón «Aplica como
operador».

---

# Pantalla 2 · Aplicación (4 pasos)

Escritorio y móvil. **Un paso por vista**, con barra de progreso «Paso 2 de 4» y
regreso siempre visible. Los campos exactos:

**Paso 1 · Quién eres** — nombre de la operadora* · nombre del responsable* ·
correo* · WhatsApp* · Instagram o sitio · ciudad y estado*.

**Paso 2 · Qué operas** — tipo de operación* como **radio-cards** (montaña y
senderismo / mar y buceo / cuevas y cañones / naturaleza y observación / cultura
y comunidades / mixta) · descripción de tus experiencias* (textarea) · desde
cuándo operas* (4 opciones: menos de 1 año / 1–3 / 3–10 / más de 10) · salidas al
año* · personas por salida, típico y máximo* · rango de precio por persona*.

**Paso 3 · Cómo cuidas a la gente** — este paso lleva un encabezado propio que
explique por qué se pregunta: *«Aquí es donde de verdad decidimos. Contesta con
la verdad: varias de estas se resuelven, esconderlas no.»*
- Seguro de responsabilidad civil vigente* — 4 opciones: sí vigente / sí pero
  vence pronto / en trámite / no.
- Guías con primeros auxilios* — 4 opciones: todos certificados / algunos / no,
  pero llevamos botiquín / no.
- Cuántos guías por cuántos participantes* (texto corto).
- **¿Han tenido algún incidente en los últimos 3 años?*** (textarea obligatoria),
  con la nota debajo: «Un incidente bien manejado suma. Uno escondido descalifica.»

**Paso 4 · Por qué Caminante** — qué te hace clic (textarea) · cómo nos conociste
(texto) · y **tres casillas obligatorias**, diseñadas como compromisos, no como
letra chica: «Todo cobro pasa por la plataforma» · «Nadie sube a una salida sin
deslinde firmado» · «Toda salida se mide con la encuesta». El botón de enviar
está deshabilitado hasta que las tres estén marcadas.

Diseña además los **estados**: campo con error, envío en curso, y el caso «ya
tienes una solicitud en revisión».

---

# Pantalla 3 · Confirmación

Pantalla completa, sobria, con foto. «Recibimos tu solicitud.» Qué sigue y
cuándo (revisamos y te escribimos para agendar 30 minutos). Botón para volver al
sitio. Versión móvil y escritorio.

---

# Pantalla 4 · Expediente (link privado, tras la llamada)

Aquí sube los documentos. Escritorio y móvil. Diseña una **lista de requisitos
con estado por renglón** (pendiente / en revisión / aprobado / vencido), cada uno
con su zona de subida y, donde aplique, campos de vigencia. Los renglones:

Obligatorios: póliza de responsabilidad civil (aseguradora, número, suma
asegurada, vigencia, y una casilla explícita **«cubre la actividad que opero»**) ·
constancia de situación fiscal · identificación del responsable · acta
constitutiva y poder, si es persona moral · certificados de primeros auxilios de
los guías · protocolo de emergencia por experiencia.

Según la actividad, en una sección aparte y colapsable: RNT (número o «en
trámite») · registro del guía ante SECTUR (NOM-09-TUR-2002) · cumplimiento de
NOM-011-TUR-2001 para turismo de aventura · certificación técnica por actividad ·
permiso del área (área natural protegida, ejido o comunidad, o predio privado).

Arriba de todo, una barra de avance: «4 de 9 completos». Necesito el estado
**vencido** bien resuelto visualmente: una póliza que caducó es lo más peligroso
de la lista.

---

# Pantalla 5 · Bloque de pie del sitio · «¿Quieres trabajar con nosotros?»

Va al final de **todas** las páginas públicas, encima del pie legal. Dos
tarjetas glassy lado a lado en escritorio, apiladas en móvil:
- **Embajador Caminante** — «Vendes a tu comunidad, nosotros operamos.» → aplica
- **Operador Caminante** — «Tú operas, nosotros ponemos la plataforma.» → aplica

Que se distingan a simple vista sin leer: son dos caminos distintos, no dos
botones del mismo.

---

# Pantalla 6 · Tarjeta de revisión en el panel de admin

Interna, escritorio y móvil, con nuestro sistema de admin (fondo crema, tarjetas
con hairlines, píldoras de estado, sin emojis; los estados son puntos de color).
Muestra la solicitud completa y agrupada por los 4 pasos, con las respuestas de
riesgo **destacadas** (seguro, primeros auxilios, ratio, incidentes) porque son
las que se leen primero. Acciones: **Agendar llamada · Pedir expediente ·
Aprobar · Rechazar**, y el estado en que va (pendiente / en llamada / expediente
/ aprobado / rechazado). Incluye el historial de decisiones.
