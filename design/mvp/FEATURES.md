# Caminante — inventario completo de features y su estatus

Medido el **22 sep 2026** contra el código, contra la base de producción y
contra el sitio en vivo. Cada estatus trae su evidencia. Donde no verifiqué,
lo dice.

## Cómo leer el estatus

| | Significa |
|---|---|
| ✅ **Vivo** | En producción, con uso real medible |
| 🟢 **Listo, sin estrenar** | Construido y funcionando; cero uso todavía |
| 🟠 **Parcial** | Sirve a medias, o sólo por una de sus puertas |
| 🔴 **Roto / bloqueado** | No cumple lo que promete |
| ⚪ **Diseñado, sin construir** | Existe el plan o el cascarón, no la función |
| ⚫ **Muerto** | El código apunta a algo que no existe |

---

## A · Sitio público y descubrimiento

| Feature | Estatus | Evidencia / qué falta |
|---|---|---|
| Inicio, Nosotros, Aprende, Magazine, Privacidad | ✅ | en vivo |
| Catálogo `/experiencias` + ficha `/experiencias/[slug]` | ✅ | 10 experiencias, 6 publicadas |
| Plantilla V2 de la ficha (bloques editables) | ✅ | es la plantilla de todas |
| Calendario público `/calendario` | ✅ | enlazado desde 3 pantallas |
| Destinos data-driven `/destinos/[estado]` | 🟠 | `destinos` = 3 renglones; editor + IA (Fase 2) sin construir |
| Buscador `/search` | 🟠 | busca en `listings` (2 renglones), **no en `experiences`** |
| Comparador `/compare/activities`, `/compare/packages` | ⚫ | corre sobre `listings`; nada del sitio lo enlaza |
| `/listings/[listingId]` | ⚫ | **404 en producción** |
| Trip builder `/trips/new`, `/trips/[id]`, `/hub`, `/checkout` | ⚫ | **consulta `trips`, `trip_items`, `bookings` — las tres NO existen en la base** |
| `/admin/bookings/requests` | ⚫ | mismo subsistema muerto |
| `/admin/listings` | 🟠 | 126 líneas vivas sobre una tabla de 2 renglones |
| Avísame / lista de espera (`/api/avisame`) | 🟢 | construido |
| Invitar `/invitar/[slug]` | 🟢 | |
| Solicitar fecha `/solicitar/[slug]` + grupos privados | ⚪ | `slot_requests` = 0; 0018 escrita sin aplicar |
| Regalos | ⚪ | tabla `gifts` = 0, sin pantalla |

> **⚫ El subsistema muerto más grande del repo.** `src/lib/trips`, `src/lib/bookings`
> y siete rutas consultan cuatro tablas que no existen. `/trips/new` responde 200
> y no puede funcionar. Es de la dirección vieja tipo OTA. Regla de la casa: lo
> obsoleto se elimina en el mismo ciclo — y aquí no hay datos que migrar.

---

## B · Venta y pago

| Feature | Estatus | Evidencia / qué falta |
|---|---|---|
| Reservar `/reservar/[slug]` + Stripe Checkout | ✅ | **70 pagos · $742,400 cobrados** |
| Webhook de pagos (`checkout.session.completed`) | ✅ | idempotente por `provider_ref` |
| Niveles de precio (habitación compartida/sencilla) | ✅ | viaja en `tier_label` |
| Cupo y disponibilidad | ✅ | un solo hogar (`data.capacity`), invariante #19 |
| `seats_taken` | 🔴 | **0 con 12 lugares vendidos**; columna que nadie mantiene |
| Complementos (agregables) | 🟢 | 2 definidos, **0 vendidos** (`reservation_complements` = 0) |
| Cobro manual / link de pago por persona | ✅ | `/admin/cobro` |
| Reembolsos + cancelar salida | ✅ | 6 reembolsos reales |
| Atribución del operador congelada al vender (0016) | ✅ | las 12 ventas de Nomádika la traen |
| Motor de comisión (2 escalas, mínimo $250, tope 20%) | ✅ | invariantes 17 y 18; $3,620.64 congelados |
| Comisión congelada en `payments.platform_fee_mxn` | ✅ | 12 de 12 |
| `payments.platform_fee_pct_frozen` | ⚫ | NULL en 70/70, **ni una lectura ni escritura en todo `src/`** |
| **Stripe Connect — bifurcación de cobro** | 🔴 | **sin construir**: `createCheckout` no lo menciona |
| Stripe Connect — alta de cuenta y estado | 🟢 | construido; 0 de 3 operadoras conectadas |
| `operadorListo` (gate de venta por Connect) | 🔴 | su encabezado promete 3 puertas; **ninguna lo llama** |
| Webhook de cuentas conectadas | 🟠 | el route acepta 2 secretos; `STRIPE_WEBHOOK_SECRET_CONNECT` ausente |
| Columna de cuenta destino en `payments` | ⚪ | no existe: cuando Connect prenda, ningún renglón dirá a qué cuenta cayó |

---

## C · Registro, deslinde y participantes

| Feature | Estatus | Evidencia |
|---|---|---|
| Deslinde data-driven `/deslinde/[slug]` | ✅ | **61 registros firmados** |
| Registro `/registro/[slug]` | ✅ | |
| Participantes múltiples + dependientes | ✅ | `dependents` = 4 |
| Perfil médico reutilizable | ✅ | `medical_profiles` = 60 |
| Gate duro deslinde + encuesta antes de publicar | ✅ | `flujo-venta.ts`, 3 puertas incluida la caja |
| Fusión del deslinde del operador | 🟢 | construido (`/api/admin/fusionar-deslinde`), sin estrenar |
| Retiros de participantes | 🟢 | `participant_withdrawals` = 1 |

---

## D · Operación de la salida

| Feature | Estatus | Evidencia |
|---|---|---|
| Roster `/admin/roster/[slotId]` | ✅ | |
| Impresión del roster | ✅ | arreglado: 789 px → 718 px de hoja A4 |
| CSV del roster | ✅ | |
| Salidas (`experience_slots`) | ✅ | 14 salidas |
| Cierre automático de salidas (cron diario) | ✅ | |
| Aviso de cupo honesto (cron diario) | ✅ | disparó solo con 2 lugares |
| Mensajes a la salida | 🟢 | `slot_messages` = 0 |
| Punto de encuentro / teléfono del guía | 🟢 | columnas vacías en la única salida revisada |
| WhatsApp (webhook + conversaciones) | 🟠 | 1 conversación, 6 mensajes |
| Panel móvil del guía `/admin/m` | 🟢 | construido |

---

## E · Post-viaje

| Feature | Estatus | Evidencia |
|---|---|---|
| Encuesta nativa `/feedback/[token]` | ✅ | **64 respuestas** |
| Encuesta por salida `/feedback/salida/[token]` | ✅ | |
| Envío automático +24h (cron) | ✅ | |
| Tablero de encuesta `/admin/encuesta` | ✅ | |
| Las tres cuentas de una salida (pagados ≠ lista ≠ firmas) | ✅ | el desfase se avisa, no se cuadra |

---

## F · Panel de la casa

| Feature | Estatus | Evidencia |
|---|---|---|
| Panorama `/admin` | ✅ | |
| Comunidad (CRM biblioteca) | ✅ | 77 contactos |
| Reservas / Pagos | ✅ | 68 reservas |
| Dinero | ✅ | lee comisión congelada, no recalcula |
| Rentabilidad | ✅ | |
| Cotizador + motor de costeo | ✅ | `experience_costs` = 36 |
| Proveedores | ✅ | 2 |
| Experiencias (alta/edición) | ✅ | |
| **Partir de una que ya existe** (copiar) | ✅ | contrato explícito de qué no viaja |
| Pre-llenar con IA (PDF → ficha) | ✅ | |
| Eventos / Salidas | ✅ | |
| Accesos | ✅ | redirect a Solicitudes |
| Preview e impresión de ficha | ✅ | |
| CRM persona × salida (6 etapas) | ⚪ | `crm_cards` = 0, `crm_calls` = 0 |
| `/admin/support` | ⚫ | **stub de 8 líneas**, sólo un título |
| `/admin/payouts` | ⚫ | **stub de 8 líneas**, sólo un título |

---

## G · Plataforma de operadores

| Feature | Estatus | Evidencia / qué falta |
|---|---|---|
| Embudo público `/operadores` + `/operadores/aplicar` | ✅ | 1 solicitud (Nomádika) |
| Alta manual de operador | ✅ | 3 filas |
| Rol operador con panel podado | ✅ | `panel_activo`; nav derivado de ADMIN_NAV |
| Alcance por operador (poda de datos y datos médicos) | ✅ | `alcance.ts` |
| **Expediente por actividad** | 🔴 | **lazo cerrado**: no puede subir ni ella ni la casa |
| Catálogo de actividades y requisitos | ✅ | |
| Revisión del expediente por la casa | 🟢 | pantalla existe; `operator_documents` = 0 |
| **Convenio + anexos de actividad** | 🔴 | `operator_agreement_versions` vacía: no hay texto que firmar |
| Candado de publicación por actividad | 🟠 | muerde en 2 de 3 puertas; la caja no pregunta |
| Dispensa explícita del candado | ⚪ | hoy el brinco existe como ausencia de revisión |
| Programa de embajadores | 🟢 | `ambassador_applications` = 0 |
| Perfil público `/operador/[slug]` | 🟠 | Nomádika 200, **Kéntro 404** (`is_public = false`, sin bio) |
| Cobros a operadoras / liquidación | 🔴 | `operator_payables` = **0** pese a $21,000 vendidos y ya depositados |
| Los 6 candados de la ficha | 🟠 | **informativos, no ejecutivos**: dicen `puedeArmar = false` para las dos mientras ambas publican y una vendió |

---

## H · White-label — la operación completa del operador

Hoy el white-label es **color en cuatro pantallas del funnel**. Para que sea
"toda la operación de un operador" faltan doce superficies más. Ésta es la
lista completa, no sólo lo construido.

### H.1 · Lo que ya está vestido

| Superficie | Estatus | Nota |
|---|---|---|
| Ficha `/experiencias/[slug]` | ✅ | F1 en producción |
| Reservar `/reservar/[slug]` | ✅ | dos clases: conviven Tailwind y CSS propio |
| Registro / deslinde `/registro/[slug]` | ✅ | |
| Éxito de pago `/reserva/exito` | ✅ | |
| Motor de tema (`themeCssFor`, 2 colores → 12 vars) | ✅ | deriva con `color-mix()` |
| Validación de marca (`marca.ts`) | ✅ | rechaza hex inválido en la puerta |
| Portal del operador `/o/[slug]` | 🔴 | **404 en Kéntro Y en Nomádika** |

> **🔴 Los dos portales están caídos.** `/o/[slug]` devuelve 404 sin
> `branding.colors`, y les quité los colores semilla que nadie aprobó (pintaban
> las páginas de venta con `#9a3b2d` y `#ff5d36`). Quitarlos fue correcto;
> dejarlo así no. Ésta es exactamente la tarea **#103**: el panel tiene que
> avisar cuando la marca está incompleta, porque una marca a medias no degrada
> — **apaga una página entera sin decir nada**.

### H.2 · Lo que falta para una operación blanca de verdad

| Superficie | Estatus | Por qué importa |
|---|---|---|
| **Logo en el funnel** | ⚪ | F1 fue sólo color; hoy el cliente ve el logo de Caminante mientras paga |
| **Correos al cliente** (confirmación, encuesta, recordatorio) | ⚪ | F2. Hoy TODO sale como "Luis · Caminante" — el cliente del operador recibe correo de otra marca |
| **El deslinde en PDF/web** | ⚪ | `/deslinde/[slug]` no tiene tema; el documento legal del operador sale vestido de Caminante |
| **La encuesta** `/feedback/[token]` | ⚪ | sin tema |
| **El roster impreso** | ⚪ | lo que el guía lleva al cerro |
| **El Kit de comunicación** (18 piezas) | ⚪ | F4. Las piezas sociales del operador salen con la marca de la casa |
| **Dominio propio** | ⚪ | F3. Hoy todo vive bajo `caminante.numanhub.com` |
| **Favicon y OG image** | 🟢 | el contrato los tiene (`faviconUrl`, `ogImageUrl`); ninguna pantalla los usa |
| **Tipografía propia** | 🟢 | el contrato la tiene (`font.family`, `font.cssUrl`); sin usar |
| **`poweredBy` discreto/visible** | 🟢 | capturado en los dos operadores; falta que alguna pantalla lo respete |
| **El panel del operador** | ⚪ | entra a un panel que dice Caminante; es su herramienta diaria |
| **El CFDI** | ⚪ | emisor, logo y razón social del operador (depende de F0 fiscal) |
| **WhatsApp saliente** | ⚪ | remitente y firma |
| **Aviso de marca incompleta** (#103) | 🔴 | **urgente**: 2 de 2 operadores ya lo pisaron |

> **La regla que hace falta escribir.** Hoy "vestido" se decide superficie por
> superficie, a mano, y por eso hay cuatro vestidas y doce desnudas. Un
> white-label real necesita lo contrario: **toda superficie que un cliente del
> operador pueda ver nace vestida**, y desvestirla es la excepción que se
> justifica. Sin esa inversión, cada pantalla nueva vuelve a salir de blanco y
> nadie se entera hasta que el operador lo ve.

---

## I · Comunicación y crecimiento

| Feature | Estatus | Evidencia |
|---|---|---|
| Kit de comunicación (18 piezas por experiencia) | ✅ | **107 posts** |
| Captions IA por lotes | ✅ | lotes de 4, guardado incremental |
| Banco de fotos tipificado (8 slots) | ✅ | |
| Ficha científica con fuente obligatoria | ✅ | |
| Serie E (E1–E8) | ✅ | |
| OAuth Instagram + publicador nativo | ✅ | `social_accounts` = 1 |
| Programar campaña (M1/M2 desde la salida) | ✅ | |
| Cola de publicación + cron diario | ✅ | |
| Métricas / insights | ✅ | `social_insights` = 32 |
| Reporte semanal (cron lunes) | ✅ | |
| Refresh de tokens (cron) | ✅ | |
| Boletín / newsletter | 🟠 | `newsletters` = 1; plantillas de Claude Design pendientes |
| Baja de suscripción `/api/unsubscribe` | ✅ | |
| Remitente "Luis · Caminante" (deliverability) | ✅ | default de todo correo a cliente |
| Sync a Notion | ✅ | `notion_sync_log` = 123 |

---

## J · Dinero y fiscal

| Feature | Estatus | Evidencia |
|---|---|---|
| Conciliación Stripe (comisión real 4.23%) | ✅ | |
| Comisión como COSTO de la experiencia | ✅ | modelo cerrado |
| Precio desde el neto (ecuación, no markup) | ✅ | |
| **Facturación CFDI (Facturapi)** | 🔴 | **apagada en producción**; código F1–F3 completo esperando F0 |
| CFDI emitidos | 🔴 | **0 de 70**; `status_cfdi = 'por-emitir'` en todos |
| CSD cargado | 🔴 | NULL en las 3 operadoras, **incluida la casa** |
| Autofactura del cliente (token firmado) | 🟢 | construida, gateada |
| Catálogos SAT (régimen, uso CFDI, validación RFC/CP) | ✅ | |
| Actividad de turismo dada de alta en el SAT | ⚠️ | **por verificar contra la CSF antes de timbrar** |
| Liquidación al operador | 🔴 | `operator_payables` = 0 |

---

## K · Infraestructura y guardarraíles

| Feature | Estatus | Evidencia |
|---|---|---|
| 19 invariantes en `prebuild` | ✅ | tumban el deploy |
| Roles + login (3 métodos) | ✅ | |
| RLS sin políticas + cliente de servicio | ✅ | |
| Tablas append-only con triggers | ✅ | el service-role no los brinca |
| 7 crons en Vercel | ✅ | cerrar-salidas, encuestas, cupo, social ×3, reporte |
| `/api/health` | ✅ | |
| Rama única de deploy + promoción | ✅ | |
| Prueba de "ni un pixel" (no-regresión de estilos) | ✅ | |
| Verificador de clases inventadas | ✅ | `clases-inventadas.py` |

---

## Resumen

Contado sobre los 139 renglones de este documento:

| | Cuántos |
|---|---|
| ✅ Vivo | 80 |
| 🟢 Listo, sin estrenar | 15 |
| ⚪ Diseñado, sin construir | 15 |
| 🔴 Roto o bloqueado | 12 |
| 🟠 Parcial | 9 |
| ⚫ Muerto | 7 |
| ⚠️ Por verificar | 1 |

**Lo que dice este conteo:** Caminante no está incompleto por falta de
construcción — hay 80 features vivos y cobrando, y $742,400 pasaron por ellos.
Está incompleto en **tres costuras concretas**:

1. **El operador no puede terminar su alta solo** (§G) — el expediente es un
   lazo cerrado y el convenio no tiene texto.
2. **El dinero no llega a su cuenta ni sale su factura** (§B, §J) — Connect sin
   bifurcación, CFDI apagado, liquidación fuera del sistema.
3. **Su marca viste 4 de 16 superficies** (§H) — y los dos portales están en 404.

Aparte, **7 features muertos y 2 stubs** son peso que confunde el mapa y se
borran sin migrar nada: el subsistema `trips`/`bookings` completo (4 tablas
inexistentes), `/admin/support`, `/admin/payouts` y
`payments.platform_fee_pct_frozen`.
