# Catálogo de actividades y expedientes

> **BORRADOR — 9 sep 2026.** Los documentos de abajo están anclados en la norma
> mexicana real (ver §4), pero **el equipo de Luis los va a revisar y corregir**.
> Esta lista existe para que la arquitectura se pueda construir hoy: el código
> lee de aquí, así que cambiar un documento después será editar una fila, no
> reprogramar.

## 1 · Cómo funciona

Una operadora declara **qué actividades hace** al mandar su solicitud (paso 0).
De esa declaración salen tres cosas:

1. **Su expediente** (paso 2): los documentos generales, una sola vez, más un
   apartado por cada actividad declarada.
2. **Qué puede publicar**: una experiencia de buceo no se publica si el
   expediente de buceo no está aprobado. No se borra — se queda en borrador.
3. **Qué subconvenios firma**: cada actividad tiene su anexo de buenas prácticas
   (§3), y el convenio general obliga a cumplirlos.

Una actividad puede estar en cuatro estados: **no declarada · incompleta ·
en revisión · aprobada**. Solo *aprobada* habilita publicar.

## 2 · Los documentos

### 2.0 Generales — se piden una vez y sirven para todas las actividades

| Documento | Por qué | Vence |
|---|---|---|
| Registro Nacional de Turismo (RNT) vigente | Es lo que habilita legalmente a operar como prestador de servicios turísticos | sí |
| Identificación oficial del responsable legal | Saber con quién se firma | sí |
| Acta constitutiva y poder del representante *(si es persona moral)* | — | no |
| Constancia de Situación Fiscal | Ya se pide para facturar | sí |
| Póliza de **responsabilidad civil** vigente | Cubre daños a terceros | sí |
| Póliza de **gastos médicos / accidentes personales** para participantes | Ver §5 — es el hueco más grande que tenemos hoy | sí |
| Certificado de **primeros auxilios** del guía responsable | La NOM-09 lo exige para acreditarse | sí |
| Protocolo de emergencia y evacuación | Qué se hace cuando algo sale mal, por escrito | no |
| Inventario del botiquín | Todas las actividades lo llevan; el contenido cambia por actividad | no |
| Bitácora de incidentes | Sin historial no hay mejora | no |

### 2.1 Por actividad

Cada actividad **suma** a lo general. La credencial NOM-09-TUR-2002 es por
modalidad: un guía acreditado en senderismo no está acreditado en buceo.

| Actividad | Qué se le suma |
|---|---|
| **Senderismo y caminata** | Credencial NOM-09 modalidad senderismo · ratio guía/participantes declarado · medio de comunicación en zona sin señal |
| **Alta montaña y alpinismo** | Credencial NOM-09 modalidad alta montaña · **bitácora de vida del EPP** (cuerdas, arneses, cascos: fecha de fabricación y de primer uso) · certificación de rescate en montaña · comunicación satelital · plan de aclimatación |
| **Escalada en roca** | Credencial NOM-09 modalidad escalada · bitácora de vida del EPP · revisión de anclajes fijos · cuerdas dinámicas dentro de vida útil |
| **Rappel** | Credencial NOM-09 · bitácora de vida de cuerdas estáticas y arneses · doble sistema de aseguramiento |
| **Cañonismo** | Credencial NOM-09 modalidad cañonismo · cuerdas estáticas con bitácora · trajes de neopreno · **consulta de pronóstico hidrológico el día de la salida** · plan de escape por tramo |
| **Descenso de ríos (rafting)** | Credencial NOM-09 modalidad descenso de ríos · certificación de **rescate en aguas rápidas** del guía · chalecos salvavidas certificados con bitácora · cascos · revisión de balsas · clasificación del río declarada |
| **Kayak de mar o lago** | Credencial NOM-09 modalidad kayak · chalecos certificados · radio VHF · plan de mareas y viento · embarcación de apoyo |
| **Buceo autónomo** | Credencial NOM-09 modalidad buceo · certificación de agencia del guía (PADI/NAUI/SSI/CMAS) vigente · **prueba hidrostática y visual de tanques** · mantenimiento de reguladores y compresor · análisis de calidad de aire · oxígeno de emergencia · plan con la **cámara hiperbárica más cercana** · seguro de buceo |
| **Buceo en cavernas** | Todo lo de buceo autónomo · certificación específica de cuevas · líneas guía y carretes · regla de tercios documentada |
| **Espeleísmo** | Credencial NOM-09 modalidad espeleísmo · triple fuente de luz por persona · cuerdas con bitácora · permiso del propietario o autoridad · **permiso INAH si hay vestigios** |
| **Ciclismo de montaña** | Credencial NOM-09 modalidad ciclismo · cascos certificados · bitácora de mantenimiento mecánico · vehículo de apoyo · kit de reparación |
| **Cabalgata** | Certificado veterinario y de herrería vigente de los animales · monturas revisadas · cascos para jinetes · plan de manejo animal |
| **Observación de naturaleza** | Credencial NOM-09 modalidad turismo de naturaleza · distancias mínimas de aproximación · permiso de área natural protegida si aplica |
| **Recolección micológica** | Guía micólogo identificable y su respaldo académico · protocolo de identificación y descarte · permiso del ejido o propietario |
| **Campamento y pernocta** | Permiso del predio · manejo de residuos y agua · protocolo de fogata y su prohibición por temporada · plan nocturno de emergencia |
| **Paracaidismo** | Licencia de la Federación Mexicana de Paracaidismo · certificado de aeronavegabilidad AFAC de la aeronave · piloto con licencia vigente · **empacador certificado y bitácora del paracaídas de reserva** · seguro específico de la actividad |

> Las cifras concretas se dejaron fuera a propósito. «Cuerdas de menos de seis
> años» es un ejemplo que dio Luis, no un dato verificado: la vida útil real
> depende del fabricante y del uso registrado. Por eso lo que se pide es la
> **bitácora de vida del equipo**, que es lo auditable, y el número exacto se
> fija en el subconvenio de cada actividad cuando el equipo lo confirme.

## 3 · Los subconvenios

El convenio general **no** enumera las prácticas de cada actividad — sería
ilegible y habría que reabrirlo cada vez que se agregue una. En su lugar:

- Cada actividad tiene un **anexo de buenas prácticas** versionado.
- El convenio general lleva una cláusula donde el Operador declara que leyó y
  acepta los anexos **de las actividades que declaró**, y se obliga a cumplirlos.
- Al declarar una actividad nueva, se acepta su anexo. La aceptación se guarda
  con fecha y versión, igual que el convenio.

## 4 · De dónde salen estos documentos

- **RNT** — Registro Nacional de Turismo, SECTUR. Es el trámite que habilita
  legalmente a operar; gratuito, en `rnt.sectur.gob.mx`.
- **NOM-09-TUR-2002** — acredita guías especializados **por modalidad**:
  naturaleza y aventura, incluyendo buceo, buceo en cavernas, descenso de ríos,
  kayak, senderismo, alta montaña, escalada, ciclismo de montaña, cañonismo y
  espeleísmo. Exige curso de primeros auxilios.
- **NOM-05-TUR-2003** — buceo: obliga a seguro de responsabilidad civil y daños
  a terceros, y a guías con credencial vigente reconocida por la Secretaría.
- **NOM-012-TUR-2016** (y su proyecto de reemplazo PROY-NOM-012-TUR-2022) —
  seguridad, información, operación y equipamiento del servicio de buceo.

## 5 · El hueco del seguro

Es el punto más débil de todo el expediente y conviene decirlo claro: **hoy no
hay forma de verificar una póliza mexicana por API.** Las aseguradoras no
exponen consulta pública de vigencia, y la CNSF publica el padrón de
instituciones autorizadas, no las pólizas de sus clientes.

Lo que sí se puede sostener sin inventar nada:

1. Que la póliza se **suba como documento** y se capturen a mano los cuatro
   datos que importan: aseguradora, número de póliza, vigencia y suma asegurada.
2. Que la aseguradora se valide contra el **padrón de la CNSF** — eso descarta
   al menos una carta de una compañía que no existe.
3. Que la **vigencia sea una fecha en la base**, no una casilla: el expediente
   caduca solo y avisa antes, como ya caduca el CSD.
4. Que se pida una **constancia o certificado de la aseguradora a nombre de
   Caminante como tercero interesado** — es el mecanismo que sí existe en el
   mercado y lo emite la aseguradora, no el operador.

Verificar la póliza llamando a la aseguradora sigue siendo un paso humano.
Diseñarlo como automático sería mentir.
