# La pantalla «Encuesta» se vuelve una LÍNEA DE TIEMPO DE SALIDAS

Propuesta para pasar a Claude Design. Escrita el 26 ago 2026.
Todos los números de este documento están verificados contra la base.

---

## 1 · Qué está mal hoy

La pantalla se llama «Encuesta» pero hace tres trabajos que no se parecen, uno
debajo del otro, en una sola columna sin jerarquía:

1. **Link de grupo** de encuesta, por salida terminada.
2. **Deslindes pendientes**, agrupados por experiencia.
3. **Satisfacción**: quién falta de responder y qué dijeron.

El desorden no es de estilo, es de **modelo**. Los tres bloques hablan de lo
mismo —una salida— pero cada uno agrupa por una cosa distinta: el primero por
salida, el segundo por experiencia, el tercero por experiencia otra vez. Quien
la usa tiene que reconstruir en su cabeza a qué viaje pertenece cada cosa.

Y hay un trabajo que la pantalla **no** hace y debería: no existe ningún lugar
donde ver **todas las salidas de todas las experiencias en una sola línea de
tiempo**. Hoy para saber qué viene esta semana hay que entrar experiencia por
experiencia (`/admin/eventos/<slug>`).

## 2 · La idea

**Una salida es un evento con un antes y un después.** Antes se persiguen firmas;
después se lee cómo fue. Es el mismo objeto en dos momentos, y por eso la
pantalla se parte por tiempo, no por tipo de trabajo:

```
        PRÓXIMAS  ·  4 salidas                 PASADAS  ·  6 salidas
        ─────────────────────────              ─────────────────────
        cápsula por salida                     cápsula por salida
        (checklist de despegue)                (veredicto)
```

Cada cápsula se abre y adentro están **las personas** de esa salida, con sus
acciones: recordar por correo, copiar el link, mandarlo por WhatsApp.

**El nombre de la pantalla deja de ser «Encuesta» y pasa a ser «Salidas».** Lo que
se administra son salidas; la encuesta es una de las cosas que les pasa.

## 3 · Lo que la base SÍ puede alimentar (verificado)

Esto es lo que hay hoy en producción, contado el 26 ago:

| dato | realidad |
|---|---|
| salidas | 11 · **5 futuras, 6 pasadas** |
| reservas activas | 47 reservas / **64 personas**, y **todas** tienen salida |
| feedbacks | 41, y **las 41 traen `slot_id` propio** |
| respondidos | 14 con estrellas y NPS · promedio **4.64** |
| testimonios con permiso | 9 (todos `approved`) |
| quieren repetir | 10 |
| dijeron qué faltó | 1 |

⚠️ **El hallazgo que hace viable todo esto:** `experience_feedback.slot_id`
existe y está lleno en las 41 filas — incluidas las **6 que entraron por el link
abierto y no tienen reserva** (un acompañante que no compró su lugar). Agrupar
por salida no necesita ningún join ni deja a nadie fuera. Si se agrupara por
reserva, esas 6 respuestas reales desaparecerían de la pantalla.

## 4 · La cápsula de una salida PRÓXIMA

No es una tarjeta informativa: es un **checklist de despegue**. La pregunta que
contesta es «¿esta salida puede viajar?».

```
┌────────────────────────────────────────────────────────────┐
│  Trekking Barrancas del Cobre            en 43 días        │
│  Oct 8–11 · Chihuahua · operada por Nomádika               │
│                                                            │
│   6 de 8 lugares          4 de 6 deslindes                 │
│   ▓▓▓▓▓▓░░                ▓▓▓▓░░                           │
│                                                            │
│   ⚠ 2 personas sin firmar                                  │
│   ✓ Encuesta armada                                        │
└────────────────────────────────────────────────────────────┘
```

**Qué lleva y por qué:**

- **Cuenta regresiva** («en 43 días», «mañana», «hoy»). Es lo que decide si hay
  que preocuparse: dos firmas pendientes a 43 días no son nada; a dos días, sí.
- **Ocupación** (personas / cupo). Operativa, no financiera — esta pantalla la ve
  también el operador externo y el dinero vive en Panorama.
- **Deslindes firmados / totales**, en barra. Es el número que la pantalla existe
  para mover.
- **Alerta de encuesta apagada.** Si la salida va a viajar sin encuesta activa, la
  cápsula lo dice **antes**, no después. Esto nace de un incidente real: hongos
  viajó el 26 jul con 18 personas y **nadie recibió encuesta**; la casilla estaba
  apagada y el único síntoma fue el silencio.
- **Quién opera**, cuando no es la casa.

**Orden:** la más cercana arriba. Las que tienen algo pendiente se marcan; las
que están completas se ven tranquilas y se pueden ignorar.

## 5 · La cápsula de una salida PASADA

Aquí la pregunta es otra: «¿cómo estuvo y qué aprendimos?».

```
┌────────────────────────────────────────────────────────────┐
│  Recolección de hongos                   hace 31 días      │
│  26 jul · Xalatlaco, Edo. de México                        │
│                                                            │
│   ★ 4.6            NPS +67          9 de 18 respondieron   │
│   promedio         8 prom · 1 pas               50%        │
│                                                            │
│   ↓ Lo más bajo: Comida (3.5)                              │
│   ✎ 2 testimonios listos para publicar                     │
│   ↻ 4 quieren repetir                                      │
└────────────────────────────────────────────────────────────┘
```

**Qué lleva, y por qué cada cosa:**

- **Estrellas promedio JUNTO A la tasa de respuesta.** Nunca el promedio solo.
  4.6 de 9 respuestas sobre 18 personas es una cosa; 4.6 de 17 sobre 18 es otra
  muy distinta, y el número grande solo no las distingue. **La regla de esta
  pantalla es que ningún promedio se muestra sin su denominador.**
- **NPS** desglosado en promotores / pasivos / detractores. Con 14 respuestas en
  total, el número agregado miente si no se ve de cuántos sale.
- **Lo más bajo** — la categoría peor calificada de `section_ratings`. El promedio
  esconde justo lo que hay que arreglar; esto lo saca a la superficie.
- **Testimonios listos para publicar** (`testimonial_consent` + `publish_status`).
  Es el puente al Kit de comunicación: hoy hay 9 aprobados y no hay ningún lugar
  que lo diga.
- **Quieren repetir** (`rebook_interest`). Son leads calientes, hoy invisibles.
- **«Qué faltó»** (`improve_text`), si alguien escribió. Es el texto más valioso
  de toda la encuesta y hoy está enterrado.

**Orden:** la más reciente arriba.

## 6 · Adentro de la cápsula: las personas

Al picar, la cápsula se expande (no navega a otra página: se pierde el contexto
de la lista). Adentro, **la misma lista de personas** en los dos casos, cambiando
solo la columna de la derecha:

**Próxima** → estado del deslinde + acciones
```
JD  John David O Donnell      Pendiente    [✉ Recordar] [Copiar link] [WhatsApp]
FE  Fabiola Escobosa          Pendiente    [✉ Recordar] [Copiar link] [WhatsApp]
MQ  Monica Quintero           ✓ 26 ago
```

**Pasada** → lo que contestó
```
MQ  Monica Quintero    ★ 5   NPS 10   «El bosque huele distinto…»   ✎ publicable
RB  Regina Bueno       ★ 4   NPS 8    —
SR  Sylvia Rivera      sin responder                    [✉ Recordar] [Copiar link]
```

Pie de la cápsula, según el caso:
- Próxima: **Ver roster** · **Recordar a todos los que faltan**
- Pasada: **Link de grupo de la encuesta** (generar / copiar) · **Recordar a todos**

## 7 · Decisiones que quiero que revises

**a · El nombre.** Propongo **«Salidas»**. Si prefieres conservar «Encuesta» en el
menú, la pantalla igual se organiza así, pero el nombre va a mentir un poco.

**b · El traslape con `/admin/eventos/<slug>`.** Ahí ya hay una tabla de salidas
por experiencia, con Ocupación · Encuesta · Estado · Roster. No propongo
borrarla: sigue la regla de la casa —«el formulario CREA, el dashboard OPERA»—
y esa tabla es donde se **editan** las fechas de UNA experiencia. La pantalla
nueva es donde se **operan** las de TODAS. Vale la pena que lo confirmes, porque
si no, quedan dos lugares que se parecen.

**c · Salidas sin nadie.** De las 11 salidas, solo 6 tienen reservas. Propongo
que las vacías se colapsen en una línea («3 salidas próximas sin reservas») en
vez de gastar una cápsula cada una.

**c-bis · Una experiencia SIN salidas no es un pendiente.** DECIDIDO: una
experiencia puede vivir publicada sin ninguna fecha planeada, con «solicitar
grupo» siempre abierto — siempre está disponible para venderse. Así que ni esta
pantalla ni la de Experiencias deben empujar a «agregarle fechas»: lo que
corresponde mostrar es que su canal abierto es la solicitud de grupo, y cuántas
solicitudes tiene esperando.

**d · Qué NO va aquí.** Dinero. Esta pantalla la ve el operador externo con su
alcance podado, y su ingreso vive en Panorama. Meter monto por salida obligaría a
podar una superficie más, sin ganar nada para el trabajo que esta pantalla hace.

## 8 · Para Claude Design

Lo que hace falta dibujar:

1. **La cabecera con los dos grupos** (Próximas / Pasadas) y sus conteos.
2. **La cápsula próxima**, con sus dos barras de progreso, la cuenta regresiva y
   la fila de alertas.
3. **La cápsula pasada**, con la fila de métricas (estrellas · NPS · tasa de
   respuesta) y la fila de hallazgos.
4. **El estado abierto** de cada una, con la lista de personas y los botones.
5. **Los estados vacíos**: sin salidas próximas, salida sin reservas, salida
   pasada sin ninguna respuesta.
6. **Glassmorphism** en las cápsulas, como el resto de Caminante.

Notas duras para el dibujo:

- Un promedio **nunca** se dibuja sin su denominador al lado.
- Las alertas (sin firmar, sin encuesta) son del color de acento, no rojas de
  error: son pendientes, no fallas.
- La cápsula cerrada tiene que poder **barrerse en un segundo**: si todo está en
  orden, no debe pedir atención.
