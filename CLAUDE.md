# CLAUDE.md — Caminante

**Lee esto completo antes de tocar nada.** Es el índice; el detalle vive en
`.claude/rules/`, que se carga solo cuando trabajas en el área correspondiente.

Master plan (estrategia y visión) en Notion:
https://app.notion.com/p/378b0498350f813e806bcb8bf4404a7f
Si algo importante cambia, actualízalo **ahí y aquí**.

## Qué es

Caminante = la expansión de NUMAN al mundo natural: plataforma de experiencias en
naturaleza + contenido educativo + conservación. Voz «científico-poeta». Las
**4 caras** de cada lugar: 🌿 Naturaleza · 🌊 Conservación · 🤝 Comunidades ·
⚠️ Problemas.

**En vivo:** https://caminante.numanhub.com · **Stripe en LIVE desde el 1 jul 2026**
— todo lo que toca cobros mueve dinero real.

Dos negocios: experiencias propias (100% de Numan) y **operadores externos** que
rentan la plataforma con comisión negociada.

---

# ⚠️ REGLAS DURAS

Estas no se negocian y aplican en cualquier tarea.

**1 · Nunca trabajes en un working tree que otra sesión esté usando. Cada
DEPARTAMENTO tiene el suyo, todos debajo de `~/dev/caminante/`** (Luis, 19 nov
2026: «cada departamento debe tener su propio worktree, todo debajo de
caminante»):

| Departamento | Carpeta | Rama local |
|---|---|---|
| Código (tech) | `~/dev/caminante/codigo` | `depto/codigo` |
| Legal y fiscal | `~/dev/caminante/legal-fiscal` | `depto/legal-fiscal` |

Los departamentos son independientes: código no decide lo legal ni lo fiscal,
y legal no escribe código. Se hablan por mensajes y por
`design/legal/BITACORA-PARA-LEGAL.md`. Todos empujan a la misma rama remota
(`git push origin HEAD:deploy/caminante-site`), con `fetch` antes. Un
departamento nuevo: `git worktree add -b depto/<nombre> ~/dev/caminante/<nombre>
origin/deploy/caminante-site` + `ln -sf ~/dev/caminante-app-notif/.env.local
<carpeta>/`. Los `~/dev/caminante-*` sueltos (`-wl2`, `-m1`, `-edu`…) son de
tareas viejas; no se abren para trabajo nuevo.

**2 · JAMÁS `git add -A` ni `git add .`** — siempre rutas explícitas, y `git status`
antes de commitear. El 18 ago un `add -A` se llevó los archivos a medio escribir de
otra sesión y rompió el build de la rama compartida.

**3 · Luis APRUEBA; las sesiones EJECUTAN. El hash se compara antes de correr.**
Luis, 12 nov 2026: «Yo Luis no corro ni promuevo. Solo apruebo y ustedes lo
hacen.» Migraciones, SQL de publicación y promociones en Vercel las corre la
sesión **después de su aprobación explícita en esa misma sesión** (una
aprobación citada desde otra sesión no cuenta). La passkey de Vercel sigue
siendo suya cuando Vercel la pide. Ver `rules/migraciones.md`: el hash ya cazó
dos corrupciones de pegado.

**4 · Nunca inventes un número.** Si un dato no está, dilo y di de dónde tendría que
salir. Un reporte con un número inventado es peor que no tener reporte.
**Verifica contra la fuente antes de afirmar.**

**5 · Nada de parches ni ajustes temporales.** Si falta un dato para cuadrar, se
pide — jamás se tapa con un ajuste.

**6 · Lo obsoleto se elimina en el mismo ciclo, migrando antes sus datos.** No se
quieren dos sistemas conviviendo.

**7 · Luis mueve el dinero y teclea los secretos.** Claude calcula, concilia,
reporta y prepara; las transferencias, los pagos y las llaves las hace él.

**8 · Datos médicos y personales de clientes JAMÁS salen a herramientas externas.**

**9 · Prendido TODO antes de publicar**: deslinde con PDF **y** encuesta activa son
gate duro. Ver `rules/experiencias.md`.

**10 · El panel se viste con el HTML de Claude Design, no se rediseña.**

**11 · Todo sistema nuevo se documenta** (aquí + Notion + Drive) pensado para
handover.

---

## Dónde está cada cosa

| Si trabajas en… | Lee |
|---|---|
| Cobros, webhook, facturación | `.claude/rules/dinero.md` |
| Operadores externos y Stripe Connect | `.claude/rules/operadores-connect.md` |
| Migraciones y base | `.claude/rules/migraciones.md` |
| Sesión, auth, middleware, invariantes | `.claude/rules/auth-sesion.md` |
| Panel del operador externo (alcance) | `design/panel-operador/README.md` |
| Experiencias, deslinde, salidas | `.claude/rules/experiencias.md` |
| Kit, redes, captions, boletín | `.claude/rules/kit-comunicacion.md` |
| Móvil y diseño | `.claude/rules/movil-y-diseno.md` |

**Planes y entregables de diseño:** `design/` — el plan de Connect
(`design/contabilidad/PLAN-CONNECT-MULTIEMISOR.md`), el contrato del sitio móvil
(`design/publico-movil/PATRON.md`), el funnel de operadores, los handoffs.

Estas reglas se cargan **solas** cuando abres archivos del área. No hace falta
pedirlas.

---

## Cómo correr

**npm y node NO están en el PATH.** Usa fnm:

```
export PATH="/Users/luisdelarosa/Desktop/acting/caminante/.tools/fnm-data/node-versions/v22.22.0/installation/bin:$PATH"
```

- **Next 16.1.6 usa webpack, NO Turbopack.** Los scripts ya traen `--webpack`.
  No lo quites.
- `.env.local` tiene las llaves (gitignored). **Local y producción usan la MISMA
  base de Supabase.**
- ⚠️ **Dos `tsc`/`build` concurrentes deadlockean el FS sandboxeado** → procesos en
  estado `U`/`E` que ni `kill -9` mata (solo reboot). Corre uno a la vez, en tu
  propio worktree, o **deja que el build de Vercel sea el verificador de tipos**.
- El proyecto no vive en Documents/iCloud a propósito (dev server lentísimo).

## Deploy

```
git push origin HEAD:deploy/caminante-site   # → preview en Vercel
```

Luego **promover desde la UI de Vercel** (menú «…» → Promote to Production).

- **Todas las sesiones trabajan sobre UNA rama: `deploy/caminante-site`.** Haz
  `fetch` antes de empujar y promueve el tip integrado.
- ⚠️ Local `main` y `origin/main` tienen **historias no relacionadas**. **Nunca
  force-push a main.**
- Si `git push` falla con HTTP 400 o «sideband disconnect», no es el tamaño:
  `git config http.version HTTP/1.1`.
- GitHub `uno-git-numan/caminante-app` (cuenta de usuario, no org) · Vercel
  `uno-1425s-projects/caminante-app`.
- **Vercel captura las env vars al construir**: tras guardar una key nueva, rebuild
  antes de promover.

## Verificar

`npm run verificar` corre el guardián de invariantes (8 reglas, cada una nacida de
un incidente). Corre solo en cada `prebuild` y **tumba el deploy** si se rompe una.

Preferencia de verificación: **build de Vercel** (aislado y fiel) > `tsc` local en
tu worktree > el Browser pane, que en páginas pesadas va a un twin poco fiable.

---

## Estado (24 ago 2026)

**En producción:** experiencias v2 data-driven · registro y deslinde nativos ·
cobro web con Stripe LIVE · transferencias y pago manual · panel de admin completo
(escritorio y móvil) · Kit de comunicación con publicador nativo a Instagram ·
boletín · programa de embajadores · portales de operador white-label ·
**white-label F1** (el funnel del cliente se viste del operador) ·
**rol «operador»**: el mismo panel, podado a sus experiencias
(`design/panel-operador/`) · **Stripe Connect A1 y A2**.

**El cobro sigue corriendo por `createCheckout` sin cambios.** La bifurcación a
cargo directo es lo último que se toca, a propósito.

**Desde el 26 ago:** el **deslinde del operador se FUSIONA** con el nuestro en vez
de reemplazarlo (regla e invariante #11 en `.claude/rules/experiencias.md`), las
cláusulas saben si son obligatorias y de quién son, el formulario avisa cuando el
precio que se muestra no es el que se cobra, y una experiencia nueva hereda el
contacto de SU dueño. Migración **0043** aplicada.

**Desde el 27 ago:** **Comunidad** sustituyó a «Personas» en la nav — la
biblioteca de los 60 que dejaron rastro está EN PRODUCCIÓN (lista densa, origen
en humano, cumpleaños por «hoy y los próximos 30»). El **tablero CRM** está
diseñado y con base de datos lista, pero NO construido: `crm_cards` está vacía y
un kanban con arrastre que no arrastra nada es un control muerto.

Migraciones **0044, 0045 y 0046** aplicadas (bajas de participante · el CRM y el
punto de encuentro POR SALIDA · los regalos con token). El **roster ya resta las
bajas**: el deslinde firmado conserva a quien se dio de baja, la lista no.

⚠️ **La comisión no cambia con un descuento** (Luis, 27 ago): se calcula normal
sobre lo cobrado. Operador y casa lo absorben en proporción.

⚠️ **Aplicar migraciones: usa curl leyendo el archivo, no el navegador.** Mandar
el SQL por trozos a una pestaña perdió 8 caracteres en silencio; el candado del
hash lo cazó. El token de la Management API sí se puede sacar del navegador — si
llega corrupto falla con 401, que es un fallo seguro.

**Siguiente:** A3, facturación multi-emisor con Facturapi. Y en Comunidad: el
tablero, el editor de etiquetas, «Unificar ciudades», el regalo, y mandar a
aprobar las plantillas de WhatsApp a Meta (tardan días).

⚠️ **Corrección (25 ago 2026):** aquí decía que el plan multi-organización era «un
requisito, no un detalle», como si fuera caro y aparte. **No lo es.** El plan base
—«API de Facturación CFDI», $299 MXN/mes + $0.60 por timbre— YA es multi-RFC y no
cobra por emisor adicional. Los planes que amarran a un solo RFC son los otros
(Facturación Web, E-Receipts y Autofactura, Facturapi para Stripe): NO contratar
ésos aunque el nombre suene a lo nuestro.

**Estado real:** la 0019 está APLICADA y verificada; el código de facturación vive
en la rama y está apagado por `FACTURAPI_SECRET_KEY`. Los datos fiscales de NUMAN ya
están en `operators` (RFC NHU250826CS8 · razón social **NUMAN HUB**, exacta y SIN
«S.A. de C.V.» · régimen 601 · CP 11000), leídos de la CSF.

**Bloqueado por Luis:** la cuenta de Facturapi, la llave, el CSD, y —lo importante—
que el SAT registre la actividad de turismo: las 15 actividades de la CSF son de
medios y software, y el CFDI timbraría con clave 90121500 (organización de viajes).
Ver `.claude/rules/dinero.md` y la memoria `caminante-facturacion-cfdi`.

**Y antes de facturar:** hay **49 pagos cobrados sin CFDI** según la base contra 31
en el ledger de contabilidad. Esa diferencia se cuadra ANTES de emitir.

**Comisión de operadores — FIJA desde el 23 nov 2026** (Luis: «que no se quede
la comisión escalonada y sea fija del 8% para todos parejo»): **8 %** si la
operadora trae al cliente y **12 %** si lo trae Caminante, sobre el importe sin
IVA, más IVA. Sin tramos, sin mínimo por reserva, **sin comisión pactada por
operadora** (convenio v3.5, Tercera §2: tarifa única; `operators.commission_pct`
ya no se lee). El cobro con tarjeta va dentro. Vive en un solo lugar:
`lib/operadores/comision.ts` (`TASA`). El techo del 20 % sigue (CHECK de la 0047
e invariante 17) como límite de una modificación futura. `comision_desde` sigue
siendo la fecha desde la que cada operadora genera comisión, y se escribe sola
al firmar. Lo ya cobrado no cambia: se congeló en cada venta. Qué deja: con el
8 %, después de Stripe (4.89 % de la base, medido en 19 pagos) quedan ~3 puntos;
con el 12 %, ~7. Cuentas completas en D29 de
`design/legal/DECISIONES-LEGAL-FISCAL-2026-11-11.md`.

⚠️ **No hay ni un convenio firmado todavía** — el primero está por firmarse. Hasta
entonces la comisión devengada es $0, y eso es correcto, no un pendiente.

⚠️ **PENDIENTE DE LUIS · $12,440 de utilidad que no existen (28 ago 2026).** La
salida «Ago 29-30» de Hacienda San Andrés tiene **11 personas pagadas** y dos
costos capturados que suponen **9**: hospedaje ($4,650 c/u) y caminata ($1,250
c/u), más el buffer del 5% que hereda el error. El costo real es $100,716 y no
$88,276; el margen real es 20.4% y no el 30.2% que muestra el panel.

**Esas dos filas se recapturan A MANO.** No se convierten solas: la tarifa
unitaria sólo existe dentro del TEXTO del concepto («9 x $4,650») y parsearla
para mover un número de dinero es adivinar. Al recapturarlas se decide si eran
9 u 11.

La **0049** (aplicada) hace que no vuelva a pasar: `experience_costs` guarda la
TARIFA y no el producto, con cuatro modos —`unico`, `por_persona`,
`desde_personas` (escalones) y `porcentaje` (el buffer)— y el total se resuelve
al leer contra el roster real. Se congela cuando la salida se va, para que un
reembolso tardío no reescriba un mes ya cerrado. Las 35 filas existentes
quedaron todas en `unico`: aplicarla no movió ni un número.

⚠️ Ojo con los dos ejes: **`tipo`** (fijo/variable/buffer) decide el EQUILIBRIO;
**`modo`** decide CÓMO se calcula el monto. No se deducen uno del otro.

## El expediente en tres momentos (23 nov 2026)

Convenio **v3.5 publicado el 23 nov** (Anexo B). Ya no se pide todo antes de
vender:

| Momento | Qué | Qué detiene |
|---|---|---|
| **Arranque** | constancia fiscal + identificación (y convenio y anexo firmados) | publicar y vender |
| **Antes de la primera salida** | pólizas, credencial del guía, permisos, certificados de terceros | la SALIDA, no la venta |
| **30 días desde la firma** | Registro Nacional de Turismo | nada todavía (Caminante puede suspender) |
| **Se declara en el anexo** | planes, protocolos, bitácoras, equipo | nada: no se sube |

`lib/operadores/actividades.ts` (`Momento`, `momentoDeGeneral`,
`momentoDePropio`; la clasificación es de legal, D30) · `expediente.ts`
(`completo` y `faltanTotal` hablan del ARRANQUE; `paraSalir`, `rnt`,
`todoEntregado`) · `candado-actividad.ts` (publicar = arranque + anexo) ·
`para-salir.ts` (qué le falta a cada salida; lo enseña Salidas, la lista de Mi
alta y un correo diario a 14, 7, 3 y 1 día, cron `documentos-de-salida`) ·
`subconvenio-doc.ts` (marco **v3** del anexo, texto de legal generado desde su
archivo; una prueba lo compara) · **0094** `operator_no_aplica` (la operadora
declara que el permiso del INAH o de área protegida no aplica a sus salidas).
Detalle en `.claude/rules/operadores-connect.md`.

## El alta en cinco pasos: armar es libre (23 nov 2026)

Luis, recorriendo el alta como operadora: primero lo suyo («un taste chingón
de la página») y lo demás al final, «un tipo de freemium». La operadora nunca
le paga a Caminante: sólo la comisión por venta.

| Paso | Qué | Qué abre |
|---|---|---|
| 01 Tu marca | logo y colores (opcional) | su página con su cara |
| 02 Tu experiencia | alta rápida + «Ver mi página» | nada: es libre |
| 03 Tus documentos | constancia + identificación | — |
| 04 El convenio | una firma | PUBLICAR |
| 05 Tu cuenta de cobro | donde recibe su dinero | VENDER |

- `lib/operadores/pasos.ts` (puro): `PASOS`, `pasosHechos`, `pasoActual`. Los
  pasos NO son fila india: cada uno sabe solo si está hecho; «aquí estás» es
  el primero que falta. La solicitud y la llamada ya no son un paso: son la
  pantalla de quien espera respuesta y, después, un plegable al pie.
- **Experiencias se abre con el panel**, no con la firma: el candado
  `convenio` pasó de `bloquea: "armar"` a `"cobrar"` (`operadoras.ts`).
- ⚠️ **La regla que cumplía el menú cerrado se mudó a la puerta**: una
  operadora no se publica sola sin convenio (`candadosDe`,
  `publicaLaOperadora`; sólo al publicar por PRIMERA vez, una dispensa la
  abre). La casa sí puede publicar lo de una operadora sin convenio (D6).
- **La llamada sólo es forzosa con menos de un año** (`ALTA_LLAMADA=opcional`
  en Vercel desde el 23 nov; `llamadaObligatoriaPara`). Con un año o más la
  solicitud se aprueba al llegar y entra directo a su panel.
- **Al aprobar sale UN correo**, la bienvenida con el camino completo.
- **«Tus documentos ya están aprobados: sigue la firma»** (`emailConvenioPorFirmar`
  con `documentosAprobados`) sale desde `lib/operadores/aviso-convenio.ts`
  cuando se aprueba el documento que COMPLETA el arranque y no hay firma. Lo
  llaman los tres lugares donde un documento pasa a aprobado (`csf.ts`,
  `revision-ia.ts`, `resolverDocumento`). Sin estado: la marca es la
  transición (antes incompleto, ahora completo, según `armarExpediente`), así
  que una póliza aprobada después no lo repite. Calla si la casa no ha
  publicado convenio. Pendiente: avisar a quien YA firmó cuando se publica una
  versión nueva, y los casos en que el arranque se completa sin aprobar nada
  (elegir física/moral al final, reemplazar un opcional rechazado).
- El riel de cinco columnas y el choque `.paso.sel` / `.adm .sel` viven en
  `mi-alta/pasos-css.ts`, fuera de la hoja generada de la lámina.

## El espacio del grupo (27 oct 2026)

Una salida privada tiene su **espacio** en `/caminante/g/<token>`: la anfitriona
invita y ve quién entra; cada invitado entra con su cuenta (correo + contraseña
al instante, Google o Apple; celular pedido, no verificado desde el 7 nov),
aparta su lugar y firma. Código en `lib/grupo/`; reglas en
`.claude/rules/experiencias.md` («Salidas privadas»). **0073 APLICADA el 28
oct.** ⚠️ **7 nov 2026: se quitó el código de verificación del celular** —
dejaba fuera a toda persona nueva (ver `rules/experiencias.md`) y la liga
mágica por correo dejó de ser PKCE (`rules/auth-sesion.md`). El primer grupo
real es el de Miranda (Izta, 28–29 nov), abierto el 29 oct. Memoria:
`caminante-espacio-del-grupo`.

**Link de pago especial (29 oct 2026):** dentro de cada salida en Salidas, un
link con descuento en % o monto fijo para una persona, con el porqué escrito en
la reserva. **Desde el 3 nov** ese link (y el del cobro por WhatsApp) es una
**página de Caminante** `/caminante/pago/<token>` que manda a Stripe al tocar
«Pagar» y vuelve al deslinde; y hay **códigos de descuento por salida** (botón
«Código de descuento» en la cápsula de cada salida; **cada salida tiene los
suyos**, no hay catálogo en Recursos — Luis, 4 nov) que la persona teclea en
`/reservar`. Migración **0074** (ver `.claude/rules/dinero.md`).

## El panel de operadora (24 sep 2026)

⚠️ **numan es el SOFTWARE; Caminante es una OPERADORA** (de Druidas, igual que
Kéntro; Nomádika es la única externa). La pastilla de la cabecera es un
**sombrero por operadora** (cookie, 0069 `operators.propia`): cambia QUÉ SE
MIRA, nunca QUIÉN SOY (invariantes #22 y #23). Esto corrige la sección de
abajo, que decía «Caminante es la PLATAFORMA; NUMAN es una operadora».

**Mi alta** está en producción con los cuatro pasos de la lámina «Panel
Operadora» (nos conocemos · expediente por actividad en acordeones · convenio
con firma dentro · armar y cobrar con los seis candados), el panel punteado
mientras el alta no cierra (#24), la casa actuando por cada operadora con
`?operadora=`, y **sin la palabra «Stripe» en ninguna pantalla** (#25). El alta
de la cuenta de cobro DENTRO de la plataforma está construida y **apagada**
(`COBRO_EN_PLATAFORMA`, ver `.claude/rules/operadores-connect.md`).

Documentación de handover: Notion «Caminante · Panel de operadora: alta,
expediente y cobro (sistema)» y el doc homónimo en Drive `numan/CAMINANTE/`.

**El equipo (0070 + 0071, 26 sep 2026):** tercer rol `equipo` con facultades
que la casa prende y apaga, pantalla de la lámina «Equipo» en producción, y el
libro de atribuciones (`staff_atribuciones`): tomar es actuar, todo se
transfiere, el pago congela `vendedor_id`. **Rendimiento** (27 sep): pestaña
dentro de Equipo sólo para uno@numanhub.com; comisiones DERIVADAS (10% numan
por tramo del libro, 3% Caminante por grupo cerrado); lo sin dato sale «sin
registro», nunca $0. Ver `.claude/rules/auth-sesion.md`.

## El panel de la PLATAFORMA (28 ago 2026)

**Caminante es la PLATAFORMA; NUMAN es una operadora — la propia.** Una pastilla
en la cabecera cambia de sombrero, y el sombrero se DEDUCE de la ruta (`x-ruta`),
no llega por prop: con prop, una pantalla nueva que olvidara pasarla se dibujaría
con el nav del otro sombrero y se vería normal.

    Caminante → /caminante/admin/plataforma · Panorama · Experiencias ·
                Comunidad · Recursos
    NUMAN     → /caminante/admin (el de siempre) · Panorama · Experiencias ·
                Comunicación · Comunidad · Recursos · Salidas

Paralelos a propósito: lo que cambia no es dónde vive cada cosa, es la unidad.
Con NUMAN, Comunidad son los clientes; con Caminante, las operadoras.

⚠️ **SOLICITUDES YA NO EXISTE.** Traía cuatro tipos revueltos y dos no eran de
NUMAN: aprobar una operadora y abrir un panel son de la casa → Pipeline de
Caminante. El cliente que pide fecha y el embajador → ARRIBA del tablero del CRM
de NUMAN (`comunidad/PorContestar.tsx`), que es donde acaban convertidos en
tarjeta. Una bandeja aparte es una pestaña que hay que acordarse de visitar.

**Experiencias se ordena por ESTADO DE VIDA, no por nombre.** El grupo que
justifica la pantalla es «en el aire»: publicada y sin fecha futura. Se ve viva
—está en el sitio y tiene histórico— y nadie puede reservarla.

**En Recursos, tres de los cinco bloques son HUECOS MARCADOS a propósito**: no
hay tabla de proveedores de la plataforma (la `providers` que existe es del
andamio viejo del marketplace), ni de impuestos, ni del expediente. Se dice en
pantalla en vez de rellenarse.

⚠️ **AL TRANSCRIBIR UN ENTREGABLE, VERIFICA ESTILOS COMPUTADOS, NO EL DOM.** La
pastilla salió a producción rota: el entregable la dibuja con `<button>`, aquí
tiene que ser `<Link>`, y las cuatro reglas apuntaban sólo a `button` — los `<a>`
quedaron sin una sola regla («NUMAN» invisible, oscuro sobre oscuro). El DOM
estaba perfecto. Y antes de escribir cada pantalla, **compara las clases que vas
a usar contra admin-css.ts**: en la segunda tanda seis eran inventadas por mí.

**Pendiente conocido:** ningún operador tiene `convenio_firmado_at`; independizar
el DNS de Squarespace. La operadora de la casa se llama `numan-caminante` y
debería llamarse sólo «Numan».
