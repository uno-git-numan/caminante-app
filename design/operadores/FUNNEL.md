# Funnel de OPERADOR — definición

> Documento de producto. Es la fuente de la que sale el prompt de Claude Design
> (`PROMPT-CLAUDE-DESIGN.md`) y, después, la implementación.

## Por qué no puede ser el funnel de embajadores

| | Embajador | Operador |
|---|---|---|
| Qué hace | **Vende** a su audiencia | **Opera** la experiencia en campo |
| Quién guía | Caminante | **Él** |
| Riesgo si falla | Reputacional | **Físico y legal**: gente en montaña, mar o cueva |
| Qué firma el cliente | El deslinde de Caminante | **Un deslinde a nombre del operador**, cobrado y facturado por NUMAN como comercializador |
| Acceso al sistema | Ninguno | **Panel**: reservas, datos médicos, dinero |
| Aprobar significa | Fila en `operators` | Fila en `operators` **+ acceso de admin** |

Aprobar a un operador es darle **llaves**. La aplicación tiene que sostener esa
decisión, y hoy no la sostiene: `/caminante/signup?tipo=operador` crea la cuenta
y pide acceso **sin preguntar nada**.

## El principio del diseño: dos puertas, no una

El error obvio sería pedir los 40 datos en la aplicación pública. Mata la
conversión y además pide documentos a alguien que quizá ni encaja.

- **Puerta 1 · Aplicación** (pública, ~15 campos): lo suficiente para decidir
  **si vale la llamada**. Nada de subir archivos todavía.
- **Puerta 2 · Expediente** (privado, por link tras la llamada): los documentos
  duros. Aquí sí, todo.

Nadie llega al panel sin cruzar las dos.

---

## Las 6 etapas

### E0 · Landing `/caminante/operadores`
La página que vende el trato. Qué es ser operador, qué construimos por él, cómo
gana, qué le cobramos, qué le exigimos. Botón único: **Aplica como operador**.

### E1 · Aplicación (pública, sin cuenta)
Formulario de 4 pasos. Cae en `operator_applications` con status `pending`.
Correo de confirmación al aplicante + aviso a Luis.

### E2 · Revisión y llamada (30 min)
Luis ve la solicitud en `/admin/solicitudes`. Decide: llamada, o «por ahora no»
amable. En la llamada se cierra la comisión y se habla de lo que **no** existe
todavía (ver «Honestidad obligada»).

### E3 · Expediente (link privado, con token)
Sube documentos. Hasta que el expediente esté completo y vigente, no hay alta.

### E4 · Convenio
Comisión pactada por escrito, cláusula de indemnización, quién responde por qué.
⚠️ El tratamiento fiscal lo valida el contador **antes del primer convenio**.

### E5 · Alta en plataforma
El onboarding interno que **ya existe**: `/admin/operadores/nuevo` (marca,
colores, entidad legal, trato, atribución de experiencias).
⚠️ **Regla que cuesta dinero:** asignar el operador **ANTES** de la primera
venta. La atribución se congela reserva por reserva y no se rellena hacia atrás.

### E6 · Primera salida acompañada
Su primera experiencia pasa por los gates que ya existen (`listaParaPublicar`):
deslinde activo con cláusulas + encuesta activa con categorías y etiqueta de
locación. No es burocracia nueva: es el mismo candado que Caminante se aplica.

---

## E1 · Los 15 campos de la aplicación

**Paso 1 · Quién eres**
1. Nombre de la operadora / marca *
2. Nombre del responsable *
3. Correo *
4. WhatsApp *
5. Instagram / sitio web
6. Ciudad y estado base *

**Paso 2 · Qué operas**

7. Tipo de operación * (una): `montaña y senderismo` · `mar y buceo` ·
   `cuevas y cañones` · `naturaleza y observación` · `cultura y comunidades` ·
   `mixta`
8. Describe tus experiencias * (textarea) — a dónde llevas gente y qué hacen ahí
9. ¿Desde cuándo operas? * (una): `menos de 1 año` · `1–3 años` · `3–10 años` ·
   `más de 10`
10. Salidas al año * (rango) y **personas por salida** (típico y máximo) *
11. Rango de precio por persona * — **este dato define su escalón de comisión**

**Paso 3 · Cómo cuidas a la gente** (el filtro real)

12. ¿Tienes **seguro de responsabilidad civil** vigente? * (una):
    `sí, vigente` · `sí, pero vence pronto` · `en trámite` · `no`
13. ¿Tus guías tienen **primeros auxilios / atención en zonas remotas**? *
    (una): `todos certificados` · `algunos` · `no, pero llevamos botiquín` · `no`
14. ¿**Cuántos guías** por cada cuántos participantes? * (texto corto)
15. ¿Han tenido **algún incidente** en los últimos 3 años? * (textarea, obligatoria)
    — Se pregunta a la cara y se dice por qué: *«Un incidente bien manejado suma;
    uno escondido descalifica.»*

**Paso 4 · Por qué Caminante**

16. ¿Qué te hace clic de Caminante? (textarea)
17. ¿Cómo nos conociste? (texto)
18. Casillas de compromiso — **las tres obligatorias**:
    - Todo cobro pasa por la plataforma
    - Nadie sube a una salida sin deslinde firmado
    - Toda salida se mide con la encuesta

> El honeypot (`web`, `tabIndex={-1}`) va igual que en embajadores.

### Por qué estos y no otros

- **11 (precio)** no es curiosidad: la comisión escala por precio, y sin él la
  llamada empieza a ciegas.
- **12, 13, 14** son las tres que de verdad separan a un operador serio de uno
  improvisado, y las tres se pueden contestar en 15 segundos sin buscar papeles.
- **15** es la pregunta incómoda a propósito. Es la que más información da.
- **18** son las tres reglas duras del sistema. Que las acepte **antes** de la
  llamada ahorra la conversación entera cuando no está dispuesto.

---

## E3 · El expediente (lo que sí exigimos en papel)

Ninguno se pide en la aplicación pública. Todos, antes del alta.

### Obligatorios, sin excepción
| Documento | Por qué |
|---|---|
| **Póliza de responsabilidad civil vigente** — aseguradora, número, suma asegurada, vigencia y **que cubra la actividad concreta** | El turismo de aventura suele venir **excluido** en pólizas genéricas. Es el documento que más se finge. |
| **Constancia de situación fiscal (RFC)** | La factura la emite NUMAN como comercializador; su entidad tiene que existir. |
| **Identificación del responsable** (INE/pasaporte) y, si es persona moral, **acta constitutiva + poder** | Quién firma y quién responde. |
| **Certificados de primeros auxilios de los guías** que salgan con nuestros clientes | Vigencia visible. |
| **Protocolo de emergencia por experiencia** | Evacuación, comunicación sin señal, hospital más cercano, **quién decide abortar la salida**. |

### Obligatorios según la actividad
| Documento | Cuándo |
|---|---|
| **RNT — Registro Nacional de Turismo** (o folio en trámite) | Prestadores de servicios turísticos. Caminante mismo lo trae «en trámite», así que **en trámite se acepta declarado**. |
| **NOM-09-TUR-2002** — registro del guía ante SECTUR | Guías generales y especializados. |
| **NOM-011-TUR-2001** — seguridad e higiene en turismo de aventura | Montaña, buceo, cañonismo, espeleología, rafting. |
| **Certificación técnica por actividad** | Buceo (PADI/NAUI/SSI), alta montaña, cuerdas, espeleo. |
| **Permiso del área** | ANP → CONANP. Ejido o comunidad → acta de acuerdo. Predio privado → autorización. En México esto es lo que más se salta y lo que más problema da. |

### El estándar Caminante (no es un papel, es criterio)
Se evalúa en la llamada y en la primera salida:
- **Las 4 caras**: puede hablar de naturaleza, conservación, comunidad y problemas
  del lugar — no solo de la actividad.
- **Beneficio local real**: a quién de la comunidad le entra dinero por su salida.
- **No dejar rastro**: qué hace con la basura, con los senderos, con la fauna.
- **Cupo con criterio**: un grupo grande no cabe en cualquier lugar.

---

## Honestidad obligada en la llamada (y en la página)

La página **no promete** lo que no existe. Hoy sí hay: página de experiencia,
cobro en línea, deslinde generado y firmado, expediente médico, cupos, fechas
privadas, kit de comunicación con captions y publicación programada, PDF y
flyers, encuesta automática, panel con ocupación/roster/dinero, portal propio con
su marca.

Todavía **no**: correos con su marca, dominio propio, Kit y PDF con su marca,
Stripe Connect (el dinero llega completo a NUMAN y se transfiere a mano), panel
recortado por operador. Se dicen como **«en camino»**, nunca como disponibles.

---

## Comisión

Escala **inversa al precio por persona**: entre más cara la experiencia, más baja
la comisión. Tres escalones.

⚠️ **Los porcentajes los define Luis.** No se inventan ni se estiman: hasta que
los dé, la tabla va con los tramos marcados y sin número.

Lo que sí es cierto hoy y puede escribirse: la comisión se **congela por venta**
(migración 0016), así que un cambio futuro nunca toca lo ya vendido; y el pago es
**a los 7 días del regreso**, igual que embajadores.

---

## Datos

**Migración `0035_operator_applications`** (aditiva; la aplica Luis a mano):
tabla espejo de `ambassador_applications` — campos de arriba, `status`
(`pending|calling|docs|approved|rejected`), `operator_id` al aprobar,
`decided_at`, índice único parcial **una pendiente por correo**, RLS sin policies
(solo service-role).

Aprobar = `ensureOperador` (que ya calcula el slug) + acceso al panel. Rechazar =
correo amable, y puede volver a aplicar.
