---
paths:
  - "src/lib/kit/**"
  - "src/lib/social/**"
  - "src/lib/ai/**"
  - "src/lib/newsletter/**"
  - "src/lib/email/**"
  - "src/app/caminante/admin/kit/**"
  - "src/app/caminante/admin/comunicacion/**"
  - "src/app/caminante/admin/social/**"
---

# Kit de comunicación, redes y boletín

Fuente de verdad de las fórmulas: **`Drive/CAMINANTE/playbook/04-FORMULAS.md`**,
extraídas del benchmark real de @enmarcha.mx.

## Dos sistemas visuales conviven — no mezclarlos

**Promocional (P1–P10)**: vende una salida con un cartel. Marca en toda lámina,
CTA.

**Editorial (E1–E8)**: cuenta una historia en secuencia y **jamás vende**. Marca
mínima, foto e idea, naranja con cuentagotas.

⚠️ **NAMESPACE `edu-` es regla dura.** Claude Design entregó clases genéricas
(`.slide`, `.photo`, `.mark`) que colisionaban de frente con el promocional. Todo lo
editorial va prefijado. **Las láminas E conservan ADEMÁS la clase `.slide`** porque
el exportador rasteriza `[data-piece="X"] .slide`.

**Prueba de no-regresión obligatoria al tocar este CSS**: la huella de estilos
computados de `[data-piece="P1"]` debe quedar idéntica (147 elementos, mismo hash).

## Nada de fuentes por URL

El export serializa a SVG y **las fuentes por URL se pierden**. Se usa la Geist
embebida en base64 (`DECK_FONTS`). Mismo gotcha en los PDF: Chrome print-to-PDF
descarta web fonts por URL.

## Los captions

**§1 Anatomía**: gancho ≤90 car. → contexto → tensión/dato → **CIERRE CON PREGUNTA,
en TODOS los captions sin excepción**. El CTA va DESPUÉS y jamás la sustituye.

**§6 Los 3 porqués** (obligado): safe (el dato) → real (lo que implica) → **raw (la
verdad humana)**. **La pregunta del cierre SIEMPRE sale del tercero, nunca del
primero.** Medido: 7.8K likes con pregunta existencial vs ~1.2K con dato solo.

Los 3 porqués son **nota interna**: `captionToText` NUNCA los publica. Si la IA no
devuelve `cierre`, se deja vacío — **no se fabrica**.

**§2/§3 Palabra-trigger** solo en P4–P6 y E4. El set `CON_TRIGGER` **filtra la
respuesta** aunque la IA se despiste.

## Generación por LOTES, no de un jalón

Las 18 piezas en una llamada tardan **101.6s** y la función muere a los 60
(tope de Hobby, no se puede subir). El bucle vive en el cliente,
`LOTE_CAPTIONS`=4, **guardado incremental con MERGE** — si un lote falla, lo
anterior ya está en la base.

⚠️ **Se queda OPUS, no Sonnet.** Medido: Sonnet fue **más lento** (39.5s vs 14.2s,
3.7× más tokens) y además **inventó una especie** que no estaba en el resumen.

## La foto nunca contradice el texto

El reparto es un **ledger global** que da fotos únicas por slot.
**Fondo NEUTRO (`paisaje`+`cielo`) es el único válido detrás de CIENCIA.**
Foto-sujeto (`gente`/`comunidad`/`detalle`) solo en retratos y postales.

Si no alcanzan fotos únicas → **menos láminas o pendiente**, y el pill lo dice a la
cara: «Faltan fotos» vs «Falta insumo». Nada de medias piezas: gate de ≥2 láminas.

⚠️ **E5 solo retrata PERSONAS con saber escrito.** La heurística `guias()` también
devuelve items sueltos de los splits, que en hongos son **variedades de hongo** —
salían retratadas como personas con su nombre repetido como cita. **Jamás una cita
inventada.**

## La ficha científica exige FUENTE

Sin fuente el dato no entra. La IA de la ficha **jamás inventa**: lo que falte queda
como arreglo vacío, y el merge en cliente solo acepta lo que trae texto+fuente.

## Publicación

El cron es **diario, 19:00 UTC ≈ 1pm CDMX** (tope de Hobby). La hora guardada en
`scheduled_at` **solo marca el DÍA** (se normaliza a 08:00 UTC); por eso la UI
muestra «~1:00 p.m.», la hora real. Antes mostraba «2:00 a.m.» y **la etiqueta
mentía**.

El **scheduler es GLOBAL**: `busyDates` lee los días vivos de toda la cola. Sin eso
cada campaña se calculaba sola y dos caían el mismo día — pasó con Hongos.

⚠️ **`publish.ts` y el cron de publicar son camino crítico: CERO cambios.** Esa es
la frontera. Las métricas viven en **tabla aparte** por la misma razón: algo
secundario jamás debe poder romper la cola.

**Métrica ausente = `null`, que NO es 0** (permiso faltante ≠ midió cero).

## Correo

Remitente por defecto de TODO correo a cliente: **`Luis · Caminante`**. Un correo
firmado por una PERSONA cae más seguido en Principal que en Promociones. Medido.

Las plantillas de boletín se extrajeron **VERBATIM**: son HTML de CORREO (tablas,
CSS inline, 600px, `bgcolor` en los `<td>`). **No las «modernices».**

⚠️ **Toda URL se absolutiza** antes de salir: en un correo no hay documento base y
un `src` relativo no resuelve en ningún cliente.

**Envío real = DOS PASOS** con token HMAC atado al conteo de destinatarios. Si
alguien se da de baja entre paso y paso, se aborta y se re-confirma.

⚠️ **Los mockups han traído DATOS INVENTADOS dos veces** (una guía que no existe, un
domicilio fiscal falso, salidas que no son nuestras). **Verifica cada dato contra la
fuente real antes de codificar.**
