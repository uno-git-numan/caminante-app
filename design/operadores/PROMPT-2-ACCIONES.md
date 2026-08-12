# Prompt 2 para Claude Design — Las acciones de la tarjeta de revisión

> Continuación del funnel de operadores. Pega todo lo que va debajo de la línea.

---

Sigamos con el funnel de operadores de Caminante. La **tarjeta de revisión** ya
quedó: se lee la solicitud agrupada en cuatro pasos, con el paso de riesgo
arriba y en naranja, y abajo cuatro botones — **Agendar llamada · Pedir
expediente · Aprobar · Rechazar**.

El problema es que esos cuatro botones no llevan a ningún lado, y ahí es donde
vive toda la decisión. Necesito **lo que pasa al picarlos**, en móvil (390) y
escritorio (1440), y necesito que el entregable sea **clickeable de verdad**.

Mismo lenguaje visual de la tarjeta: crema, carbón, olivo, naranja con
cuentagotas, Geist y Geist Mono, hairlines, píldoras de estado con punto de
color, **sin emojis**. El contacto único sigue siendo `uno@numanhub.com`.

## Requisito nuevo y no negociable: el prototipo funciona

Entrégalo como **un solo HTML autocontenido** donde los botones de verdad
responden:

- Las cuatro acciones **abren su hoja** (móvil: hoja que sube desde abajo;
  escritorio: modal centrado con velo).
- Cada hoja se puede **cancelar** y **confirmar**, y al confirmar la tarjeta
  **cambia de estado** frente a los ojos: la píldora se mueve, el historial gana
  un renglón, los botones disponibles cambian.
- Un **toast** de confirmación tras cada acción.
- **Nada de `alert()`, `confirm()` ni `prompt()` del navegador**: todo con
  nuestros propios componentes.
- Vanilla JS, sin librerías, sin peticiones a ningún servidor. Los datos van
  dentro del archivo.
- Incluye un pequeño control para **reiniciar el prototipo** al estado inicial,
  así se puede recorrer el flujo varias veces.

Usa la misma solicitud de ejemplo que ya diseñaste: **Sierra Alta Expediciones**,
Marisol Aguirre, Valle de Bravo, seguro «sí, pero vence pronto», primeros
auxilios «algunos», 2 guías por cada 12, y el incidente del tobillo declarado.

## La máquina de estados

```
PENDIENTE ──Agendar llamada──▸ EN LLAMADA ──Pedir expediente──▸ EXPEDIENTE ──Aprobar──▸ APROBADO
    │                              │                                │
    └──────────────────────────────┴────── Rechazar ────────────────┴──────────▸ RECHAZADO
```

Reglas que el prototipo debe respetar:
- **Aprobar** está deshabilitado mientras el expediente no esté completo. No lo
  escondas: muéstralo apagado, con la razón al lado.
- **Rechazar** está disponible siempre, en cualquier estado previo.
- Un estado ya alcanzado no se repite: en EXPEDIENTE, «Pedir expediente» se
  convierte en «Reenviar link».

---

# Hoja 1 · Agendar llamada

La llamada es de **30 minutos por Google Meet**. Diseña **dos variantes** de esta
hoja, porque el sistema puede estar configurado de dos maneras:

**Variante A · con agenda de Google conectada** (la normal). No se elige la hora:
se le manda a la persona **el link de agenda de Google** y ella escoge su hueco;
Google crea el evento con su Meet y nos invita a los dos. La hoja muestra:
- Un bloque de resumen: a quién se le manda (nombre + correo), duración 30 min,
  y el nombre de la agenda conectada.
- Un **mensaje editable** que va en el correo, ya redactado en voz de marca —
  dos o tres renglones que digan que nos interesó su solicitud y que la llamada
  es para conocerse y cerrar números.
- **Vista previa del correo** dentro de la hoja, plegable.
- Botón primario **«Enviar invitación»**, secundario «Cancelar».

**Variante B · sin agenda conectada** (estado de configuración faltante).
En lugar del bloque anterior, un aviso sobrio: «Falta conectar la agenda de
Google» con un enlace **«Configurar»**, y como salida de emergencia un botón
**«Abrir Google Calendar»** que crea el evento a mano con los datos ya
prellenados. Que se vea como una carencia de configuración, no como un error.

**Después de confirmar** (variante A), la tarjeta pasa a **EN LLAMADA** y aparece
en ella un bloque nuevo: «Invitación enviada el 09/08 · esperando que agende»,
que después se convierte en «Llamada el 14/08, 11:00 · Meet» con el link
copiable. Diseña los dos momentos.

---

# Hoja 2 · Pedir expediente

Aquí se le manda el link privado para subir documentos. La hoja debe permitir
**elegir qué se le pide**, porque no todos operan lo mismo: a una operadora de
montaña no se le pide certificación de buceo.

- **Siempre obligatorios**, ya marcados y no desmarcables: póliza de
  responsabilidad civil, constancia de situación fiscal, identificación del
  responsable, certificados de primeros auxilios, protocolo de emergencia.
- **Según la actividad**, casillas que se marcan a criterio: acta constitutiva y
  poder · RNT · registro del guía ante SECTUR (NOM-09-TUR-2002) ·
  NOM-011-TUR-2001 de turismo de aventura · certificación técnica por actividad ·
  permiso del área (área natural protegida, ejido o comunidad, predio privado).
- Un contador vivo: **«Le pedirás 7 documentos»**.
- El **link privado** generado, visible y con botón de copiar, y una nota de que
  vence en 30 días.
- Mensaje editable + vista previa del correo, igual que la hoja anterior.

**Después de confirmar**, la tarjeta pasa a **EXPEDIENTE** y gana un bloque de
avance: **«2 de 7 recibidos»** con la lista renglón por renglón y su estado
(pendiente / en revisión / aprobado / **vencido**). El estado *vencido* tiene que
gritar más que los otros: una póliza caducada es lo más peligroso de la lista.
Cada renglón recibido lleva su acción de **ver** y de **aprobar o rechazar** ese
documento.

---

# Hoja 3 · Aprobar

**Esta es la que da llaves.** Aprobar crea al operador y le abre el panel, donde
va a ver reservas, datos médicos de clientes y dinero. La hoja tiene que pesar
lo que pesa, sin volverse un trámite.

Diseña una **lista de verificación previa**, cada renglón con su palomita o su
cruz:
- Expediente completo y vigente
- Convenio firmado
- Comisión pactada — con un campo para el porcentaje. Usa el marcador
  `{{TRAMO_2}}` como valor de ejemplo; los números reales los pone el dueño.

Debajo, un bloque de consecuencia, redactado sin dramatismo pero claro:
> Al aprobar se crea el operador y se le da acceso al panel. **Asígnalo a sus
> experiencias antes de la primera venta**: la atribución se congela reserva por
> reserva y no se rellena hacia atrás.

Y una casilla final de confirmación consciente antes de que el botón primario se
encienda. Si algún renglón de la verificación está en cruz, el botón sigue
apagado y la hoja dice cuál falta.

**Después de confirmar**, la tarjeta pasa a **APROBADO** y muestra: el operador
creado con su dirección pública, un botón **«Completar alta»** que lleva al
onboarding de marca y colores, y otro **«Asignar experiencias»** marcado como el
siguiente paso urgente.

---

# Hoja 4 · Rechazar

Sobria y breve. Dos partes claramente separadas:
- **Motivo interno** (no lo ve el aplicante): opciones rápidas —no cumple el
  estándar de seguridad · sin seguro ni intención de contratarlo · fuera de
  nuestra geografía · no hay encaje por ahora · otro— más una nota libre.
- **El correo que sí ve**, amable y sin causar daño, con una línea que le diga
  que puede volver a aplicar cuando cambie lo que faltaba. Editable, con vista
  previa.

**Después de confirmar**, la tarjeta pasa a **RECHAZADO**, se apagan las acciones
y el historial registra quién decidió, cuándo y con qué motivo.

---

# Pantalla extra · El correo de invitación a la llamada

Diséñalo como **correo de verdad**, no como pantalla web: 600px de ancho, tablas,
CSS en línea, tipografía con respaldo del sistema, y que se lea bien en el
teléfono. Sello de Caminante chico arriba, saludo por su nombre, dos o tres
renglones cálidos, un botón grande **«Elegir mi horario»** y, debajo, la misma
liga en texto plano por si el botón no carga. Pie con el contacto real.

Con este mismo armazón después haremos los otros tres (expediente, bienvenida y
«por ahora no»), así que déjalo como plantilla reutilizable.

---

# Y una pantalla de lista

Para cerrar el circuito: la **bandeja de solicitudes de operador** en el panel,
móvil y escritorio. Filas compactas con nombre, ciudad, fecha, píldora de estado
y las dos o tres señales de riesgo asomadas sin abrir. Filtros por estado arriba.
Y su estado vacío, que también hay que diseñarlo.
