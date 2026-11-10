# DRUIDAS — constitución de la operadora de turismo

**9 nov 2026 · sesión legal y fiscal.** Preparación para Jorge Zubarán (Ekko).
Nace de la decisión del 9 nov (`design/contabilidad/MAPA-FACTURACION.md` §0.1):
DRUIDAS opera las experiencias propias de Caminante y factura al cliente;
NUMAN HUB queda como plataforma y factura sólo su comisión.

> ⚠️ **Este documento NO se manda a Jorge todavía.** Lleva decisiones que son de
> Luis (figura, domicilio, nombre; **socios ya decididos el 9 nov: espejo de NUMAN**).
> Las pendientes están marcadas **DECIDE LUIS**. Cuando
> él las conteste, se limpia y se manda con el correo del final. Regla:
> `feedback-pasar-decisiones-por-luis`.

Contexto que Jorge ya tiene: la guía «EKKO — 12 Estructura del grupo» (29 sep
2026, Drive `numan/CAMINANTE/legal/`) ya le planteó Druidas como «empresa de
operación de experiencias y turismo», con las preguntas 1–4 (forma societaria),
34 (riesgo de alta montaña) y 35–36 (transición y contrato NUMAN→Druidas).
El 3 nov Ekko mandó «Numan - Propuesta de Servicios» (PDF «Numan Propuesta
servicios 27 oct 26.pdf», en el correo de Jorge; **no está en Drive**: Luis lo
guarda en `Drive/numan/CAMINANTE/legal/` para cruzarlo con esto).

---

## 1 · Qué es DRUIDAS y qué no

| | DRUIDAS | NUMAN HUB |
|---|---|---|
| Papel | **Operadora** de las experiencias propias (Caminante; y Kéntro si Concha lo decide: hoy Kéntro conserva su RFC KHO230512AB1) | **Plataforma**: software, cobro por cuenta de terceros, comisión |
| Factura | CFDI al cliente por el total de la experiencia (B1), con su CSD, desde el portal | CFDI a cada operadora por comisión + IVA (B2); CFDI de retenciones (R1) |
| Ante el SAT | Actividades de **turismo** desde el alta | Servicios de plataforma/intermediación; **ya no necesita turismo** |
| Permisos del sector | RNT, seguro, guías certificados, convenios con ejidos/CONANP | Ninguno de turismo |
| En la plataforma | Una fila de `operators` con `propia = true`, cuenta conectada de Stripe, organización propia en Facturapi | `es_la_casa` |

**Por qué nace:** la CSF de NUMAN tiene 15 actividades, todas de medios y
software; ninguna de turismo (hallazgo de Eduardo Magnani, 22 jul 2026). En
vez de meter turismo a NUMAN, el turismo nace en su propia sociedad, con el
riesgo de campo separado del software (pregunta 34 de la guía a Ekko).

## 2 · Lo que se le pide a Jorge (brief)

### 2.1 Objeto social — propuesta

Redactado amplio para que **la CSF pueda traer todas las actividades desde el
primer día** y no haya que ampliar después:

1. La organización, promoción, comercialización y operación de **excursiones,
   expediciones, caminatas, ascensos de montaña, travesías, campamentos,
   retiros y experiencias en la naturaleza**, en México y en el extranjero.
2. La prestación de servicios de **agencia de viajes y operadora turística**:
   diseño y venta de paquetes, reservación y contratación de hospedaje,
   alimentos, transporte, guías y actividades por cuenta propia o de terceros.
3. Los servicios de **guías de turistas** y de guías especializados (montaña,
   buceo, naturaleza), y la capacitación y certificación de guías.
4. La prestación de servicios de **hospedaje** en campamentos, cabañas,
   albergues y glamping, propios o arrendados.
5. El **transporte turístico** de pasajeros por tierra y por agua, con vehículos
   propios o arrendados, con los permisos que correspondan.
6. La organización de eventos, talleres, cursos y programas **educativos,
   científicos, de bienestar y de conservación** vinculados a las experiencias.
7. La producción, edición y comercialización de **contenido** (fotográfico,
   audiovisual, editorial) derivado de las experiencias.
8. La adquisición, arrendamiento y administración de **equipo** de montaña,
   campamento, buceo y vehículos.
9. La celebración de convenios con **comunidades, ejidos, áreas naturales
   protegidas, operadores locales, científicos y universidades**.
10. Participar en el capital de otras sociedades, obtener financiamiento,
    otorgar garantías, registrar y licenciar marcas, y en general todo acto
    conexo (cláusula genérica habitual).

🔸 *Para Jorge:* confirmar que el objeto cubra **viajes al extranjero**
(Sardine run, Sudáfrica 2026) y la venta de **seguros de viaje** como
intermediaria, o si eso exige registro aparte.

### 2.2 Actividades económicas para la CSF (alta en el RFC)

La lección de NUMAN: **el acta permitía turismo y la CSF no lo declaraba**. La
lista se entrega al notario/contadora para que las registre en la inscripción
misma. Descripciones del catálogo de actividades del SAT (basado en SCIAN;
⚠️ **Marisol confirma la redacción exacta y la clave de cada una en el Anexo 6
de la RMF vigente al momento del alta**, y fija la **actividad preponderante**):

| Actividad (descripción SCIAN) | Clave SCIAN de referencia | Para qué |
|---|---|---|
| **Organización de excursiones y paquetes turísticos** | 561520 | La experiencia misma: es lo que se factura con 90121501 |
| Agencias de viajes | 561510 | Reventa de hospedaje/transporte de terceros |
| Otros servicios de reservaciones | 561590 | Reservar por cuenta del cliente |
| Transporte turístico por tierra | 487110 | Sprinters/vans (complemento transporte, 78111800) |
| Transporte turístico por agua | 487210 | Pangas, embarcaciones (Mag Bay, Ensenada) |
| Campamentos y albergues recreativos | 721210 | Glamping/campamentos propios |
| Cabañas, villas y similares | 721190 | Hospedaje desglosado (90111501) |
| Otros servicios recreativos prestados por el sector privado | 713998 | Guía, actividades (90121701) |
| Servicios de guías de turistas *(si el catálogo la trae separada)* | — | ídem |
| Producción de videoclips, comerciales y otros materiales audiovisuales | 512190 | Contenido |

**Preponderante propuesta:** organización de excursiones y paquetes turísticos.

### 2.3 Figura y régimen — propuesta, DECIDE LUIS

| Tema | Propuesta | Por qué | Fuente |
|---|---|---|---|
| Figura | **S.A. de C.V.** (igual que NUMAN). Con socios espejo ya no hace falta la S.A.P.I.; sólo si Luis quiere dejar preparados pactos para una entrada futura | La S.A.P.I. admite pactos de socios en estatutos (veto, tag/drag, vesting) sin forzar la ley; la S.A. simple basta si los socios son los mismos de NUMAN | LGSM; LMV 12–13 (S.A.P.I.) |
| Régimen fiscal | **601 General de Ley PM** | RESICO PM (626) queda excluido si un socio participa en otra sociedad donde tenga el control o sean partes relacionadas: Luis es socio de NUMAN | LISR 206 fracc. I (texto oficial, verificado 9 nov) |
| Capital mínimo | El que fije la notaría; sin mínimo legal | — | LGSM 89 |
| Domicilio fiscal | **Físico y verificable** (no el particular) | Marisol, 2 sep 2026: vigilancia a factureras | guía Ekko §4 |
| Administración | **Administrador único (Luis)**, como en NUMAN; socios espejo, sin consejo | pregunta 28 de la guía | — |

**DECIDIDO (Luis, 9 nov 2026) — socios: (a) espejo de NUMAN.** Firman el acta
**Concepción Orvañanos Corcuera y Luis de la Rosa Orvañanos**, los mismos socios
y en la misma proporción que NUMAN HUB (instrumento 107,629, Notaría 1 CDMX,
18 ago 2025; Jorge toma los porcentajes de esa acta, que es un escaneo sin texto
en `~/Expediente-NUMAN/corporativo/`). Mario, León o quien sea entran, si entran,
por aumento de capital cuando haya acuerdo firmado. Consecuencias:

- Basta la **S.A. de C.V.** (no hace falta S.A.P.I.: no hay socio operativo con
  veto ni vesting que pactar).
- Administrador único: Luis, como en NUMAN.
- Documentos para la notaría: los mismos de los dos socios que ya se usaron en
  2025 (identificación, CURP, CSF y comprobante de domicilio vigentes).
- DRUIDAS y NUMAN son **partes relacionadas** (LISR 179): el contrato de
  servicios NUMAN→DRUIDAS va a la escala pública y queda documentado (§5).

El PDF de estructura (sep 2026) ilustraba Druidas con *Mario 56 · Luis 30 ·
Concha 14*, «no es propuesta cerrada». Las opciones que se compararon, para el
historial:

- **(a) Espejo de NUMAN** — Luis y Concepción, mismos porcentajes que NUMAN. **← elegida.**
  Más rápido (los mismos documentos de identidad); deja la entrada de Mario,
  León o quien sea para un aumento de capital posterior.
- **(b) NUMAN HUB como socia mayoritaria + Luis** — holding de facto: los
  dividendos de DRUIDAS suben a NUMAN (sin ISR adicional entre PM vía CUFIN) y
  la relación «partes relacionadas» queda explícita y ordenada. Jorge lo
  preguntó como opción 4 de la guía (tenedora).
- **(c) Cap table nuevo con Mario/León** — exige cerrar primero la negociación
  (Cat y León: cero equity decidido el 28 sep; Mario: sin acuerdo escrito).
  Retrasa la constitución semanas o meses.

Se recomendó **(a) o (b) ahora** y la entrada de otros socios por aumento de
capital cuando haya acuerdo firmado; Luis eligió (a). Lo que importa para la caja es
que DRUIDAS exista con CSD antes de la temporada alta (Sardine run nov 2026
ya se vendió por NUMAN; ver §4).

**DECIDE LUIS — nombre.** «Druidas» a secas puede estar tomado; se piden 3
opciones a la SE en orden: *Druidas Expediciones*, *Druidas Operadora de
Experiencias*, *Caminante Druidas*. La marca «Caminante» está en trámite ante
el IMPI a nombre de Luis: licencia a DRUIDAS (pregunta 15 de la guía).

## 3 · Checklist con tiempos (ruta crítica)

Tiempos realistas CDMX, en semanas desde que Luis decide socios y nombre. Los
tramos presenciales los hace Luis (o apoderado) — Claude prepara.

| # | Paso | Quién | Tiempo | Depende de | Salida |
|---|---|---|---|---|---|
| 1 | Decisiones de §2.3 (socios ✅ 9 nov; faltan figura, nombre, domicilio) | **Luis** | día 0 | — | este doc limpio → Jorge |
| 2 | Autorización de denominación ante la SE (3 opciones) | Jorge/notaría | 2–5 días hábiles | 1 | oficio de denominación |
| 3 | Proyecto de estatutos (objeto §2.1, veto de seguridad, cláusulas de salida) | Jorge | 1 semana | 1 | borrador para firma |
| 4 | Firma del acta ante notario + **inscripción al RFC por el fedatario** (el notario puede inscribir a la PM al protocolizar) | Luis + Concepción, notaría | 1 día (cita) | 2, 3; identificaciones, CSF y comprobante de domicilio vigentes de Luis y de Concepción; CURP | acta + **RFC** |
| 5 | Inscripción en el Registro Público de Comercio | notaría | 1–3 semanas | 4 | boleta de inscripción (la piden los bancos) |
| 6 | **e.firma de la PM** — cita en el SAT, va el representante legal con su propia e.firma vigente + acta + comprobante de domicilio | **Luis** | cita a 1–3 semanas | 4 | .cer/.key de DRUIDAS |
| 7 | **Alta de actividades y obligaciones** (§2.2) si no quedaron en la inscripción; Opinión de cumplimiento | Marisol | mismo día que 6 | 6 | CSF con turismo |
| 8 | **CSD** (Certifica, con la e.firma) | **Luis** (nunca Claude) | 1 día | 6 | .cer/.key del CSD + contraseña |
| 9 | Cuenta bancaria empresarial (BBVA, misma banca que NUMAN) | Luis | 1–3 semanas | 4, 5 (RPC), 6 | cuenta + CLABE |
| 10 | Buzón tributario, contraseña SAT, alta de Marisol como contadora | Marisol | 1 día | 6 | — |
| 11 | **Facturapi**: organización DRUIDAS dentro de la cuenta de NUMAN (plan API es multi-RFC), subir CSD (Luis), carta manifiesto con e.firma | Luis + Claude | 1 día | 8; cuenta Facturapi ya abierta (tarea 4) | `operators.facturapi_org_id` |
| 12 | **Stripe**: cuenta conectada Express tipo empresa desde «Mi alta» (KYC: acta, RFC, CLABE, representante) | Luis | 2–7 días | 4, 9 | `stripe_account_id` |
| 13 | Fila `operators` de DRUIDAS (`propia = true`, datos fiscales, `comision_desde`), convenio NUMAN↔DRUIDAS firmado | sesión de código + Luis | 1 día | 7, 11, 12 | lista para vender |
| 14 | **RNT** (Registro Nacional de Turismo) de DRUIDAS como agencia/operadora; hoy NUMAN no lo tiene | Luis/Claude | 2–6 semanas (trámite gratuito ante SECTUR/estatal) | 4, 7 | constancia RNT |
| 15 | Seguro de accidentes/RC a nombre de DRUIDAS (NOM-011-TUR) | Luis | 1–3 semanas | 4 | póliza |
| 16 | IMSS patronal cuando contrate (guías, equipo) | Marisol | al primer empleado | 4 | registro patronal |

**Ruta crítica realista:** 4 a 8 semanas hasta tener RFC + e.firma + CSD (pasos
1–8); banco y Stripe pueden ir en paralelo. **El cuello de botella es la cita
del SAT para la e.firma de la PM** (paso 6): pedirla el mismo día que se firma
el acta. ⚠️ Marisol confirma si con la inscripción por fedatario (paso 4) la
cita de e.firma sale más rápido y si las actividades del §2.2 pueden ir desde
esa inscripción.

## 4 · Transición: las ventas propias de 2026

Hechos (base al 9 nov, `MAPA` §1): 82 cobros, $894,275, 100 % por el canal
`casa`, **0 CFDI emitidos por el sistema**; Marisol ha emitido CFDI 2026 por
fuera, sin registro (tarea 3 pide la exportación del SAT).

**Regla propuesta (DECIDE LUIS, Marisol valida):** el emisor de cada venta
propia lo decide la **fecha del cobro**:

| Cobro | Emisor del CFDI al cliente | Proveedores facturan a | Comisión de plataforma |
|---|---|---|---|
| Antes de que DRUIDAS tenga CSD (todo 2026 hasta hoy) | **NUMAN HUB**, como hasta hoy (lo que Marisol ya emitió se respeta; lo `por-emitir` lo decide ella: emitir a NUMAN o global de NUMAN) | NUMAN HUB | **No hay** (NUMAN se vende a sí misma: asiento interno, no CFDI) |
| Desde que DRUIDAS tiene CSD | **DRUIDAS** (B1) | DRUIDAS | NUMAN → DRUIDAS (B2) por la escala pública |

Lo que hay que decidir con Jorge/Eduardo (pregunta 35 de la guía):

1. **Salidas cobradas por NUMAN que ocurren después del cambio** (p. ej.
   Sardine run 26–29 nov; Izta de Miranda 28–29 nov): o NUMAN opera y factura
   esas salidas hasta el final (más simple: «cobro, factura y proveedores
   quedan en NUMAN»), o NUMAN cede el contrato a DRUIDAS y le transfiere el
   dinero con un contrato de cesión. **Propuesta: NUMAN las termina.** Cambiar
   de emisor a mitad de una salida ya cobrada es ruido fiscal sin beneficio.
2. **Deslindes firmados** con NUMAN como entidad: siguen válidos para esas
   salidas; las nuevas se firman con DRUIDAS (el deslinde lee `ENTIDAD` de la
   operadora dueña: cambio de dato, no de obra).
3. **Marcas**: licencia de «Caminante» (Luis → DRUIDAS y NUMAN) antes del
   primer CFDI de DRUIDAS, para que el uso de la marca tenga papel.
4. **Precio de transferencia NUMAN→DRUIDAS**: la misma escala pública (tarea 2,
   pregunta g). Partes relacionadas por LISR 179; documentación LISR 76 fracc.
   IX/XII (Marisol confirma si el umbral de $13 M de ingresos exime a DRUIDAS
   del estudio).
5. **Los $103,500 de «Hacienda y hongos»** atribuidos a NUMAN y no a Kéntro
   (jul 2026): quedan en NUMAN; es ingreso propio de 2026 y está bien donde
   está (`caminante-onboarding-operador`).

## 5 · Qué cambia en NUMAN cuando DRUIDAS exista

- La fila `numan-caminante` deja de ser operadora; NUMAN es sólo `es_la_casa`.
- NUMAN **no** da de alta turismo en el SAT. Marisol valora agregar a su CSF una
  actividad de **intermediación/comisión mercantil** (hoy sólo trae medios y
  software) para que el CFDI con clave 80141628 sea congruente con la CSF.
- NUMAN se da de alta como **retenedora** (tarea 5).

## 6 · Correo para Jorge (se manda cuando Luis conteste §2.3)

> Jorge: ya decidimos separar la operación turística en una sociedad nueva,
> DRUIDAS, y dejar a NUMAN HUB sólo como plataforma (es la pregunta 1 y la 35
> de la guía que te mandamos el 29 de septiembre). Te adjunto el brief con:
> objeto social propuesto, lista de actividades para que la CSF nazca con
> turismo (no queremos repetir lo de NUMAN), socios y figura ya decididos, y
> el checklist con tiempos. Lo que necesitamos de ti: (1) proyecto de
> estatutos y gestión notarial con inscripción al RFC por el fedatario, (2)
> que el objeto cubra viajes al extranjero y la intermediación de seguros,
> (3) contrato de licencia de marca Caminante y (4) el contrato de servicios
> NUMAN→DRUIDAS (comisión por la escala pública + mantenimiento). ¿Nos das
> tiempos y honorarios de este paquete aparte de la propuesta del 27 de
> octubre, o ya está dentro?

---

**Decisiones que le tocan a Luis antes de mandar esto:** ~~socios (a/b/c)~~
**socios decididos el 9 nov: espejo de NUMAN**; faltan figura (S.A. recomendada
tras la decisión de socios), nombre (3 opciones), domicilio fiscal, y la regla de
transición del §4 (que NUMAN termine las salidas ya cobradas).

**Fuentes verificadas el 9 nov 2026:** LISR 206 fracc. I (RESICO PM) y LISR
76/179 (texto oficial Cámara de Diputados, última reforma DOF 01-04-2024);
guía «EKKO — 12 Estructura del grupo» (29 sep 2026); `MAPA-FACTURACION.md`
§0.1 y §1; `expediente-numan-documentos` (CSF de NUMAN, 15 actividades).
Las claves SCIAN son de referencia: la clave del SAT la fija Marisol en el alta.
