# Caminante: diagnóstico y propuesta de simplificación (19 nov 2026)

Meta de Luis: **el lunes 23 de noviembre** una operadora externa se da de alta de
punta a punta (cuenta de cobro, documentos, experiencia, cobrar, facturar) sin
que nadie la lleve de la mano. Y que la plataforma sea más simple para él y
para las operadoras. Lo que no sea esencial se guarda para versiones futuras.

Este documento es la foto de lo que hay y la propuesta de corte. **Nada se ha
cambiado todavía**: primero se acuerda con Luis qué se queda y qué se va.

---

## 1 · El tamaño de lo que hay (medido hoy)

| Qué | Cuánto |
|---|---|
| Código | 539 archivos, 99,070 líneas |
| Pantallas | 73; **41 son del panel** |
| Migraciones de base | 92 |
| Tareas automáticas (crons) | 12 |
| Formulario de una experiencia | **17 secciones, 134 campos**, 1,876 líneas |
| Catálogo de documentos del expediente | 5 generales + carpetas por actividad, ~60 documentos distintos |
| Candados antes de poder vender | 6 (deslinde, encuesta, actividad aprobada, convenio, cuenta de cobro, política) |

Operadoras en la base hoy: Caminante (la casa), Kéntro (propia) y **Nomádika
(la única externa)**. Ninguna tiene convenio firmado. Nomádika tiene cuenta de
cobro creada pero sin poder cobrar, y no tiene porcentaje de comisión puesto.
Experiencias: 13 publicadas, 3 borradores.

## 2 · Todo lo que hace la plataforma, por área

**Lo que ve el cliente**
- Sitio: inicio, experiencias, ficha, destinos, calendario, nosotros, aprende,
  magazine, embajadores, perfil de operadora, portal de marca de operadora.
- Comprar: reservar, página de pago por liga, códigos de descuento,
  complementos, regreso de pago.
- Después de pagar: registro y deslinde, Mi espacio, facturas, encuesta,
  espacio del grupo privado, invitar, solicitar fecha.
- Cuenta: entrar con correo, contraseña, Google; código de acceso.

**Lo que ve la casa (panel)**
- Panorama, Experiencias, Salidas, Pagos, Comunidad (CRM, tablero, por
  contestar), Comunicación (Kit de piezas, redes, cola de publicación,
  boletín), Recursos (cotizador, rentabilidad, proveedores), Equipo y
  Rendimiento, Facturación, Accesos.
- Plataforma: operadoras, pipeline de solicitudes, liquidaciones,
  retenciones, expediente por operadora.
- Cobro por WhatsApp, links especiales, transferencias, reembolsos,
  cancelaciones, bonificaciones.

**Lo que ve la operadora**
- Mi alta en 4 pasos (nos conocemos, expediente, convenio, armar y cobrar),
  marca, equipo, cobrar, facturación desde el portal.
- El mismo panel recortado a sus experiencias.

**Lo que corre solo**
- Cerrar salidas, encuestas, cupo honesto, recordatorios del grupo,
  comprobantes, factura global, retenciones, publicar en redes, métricas de
  redes, tokens de redes, reporte semanal, confirmar salidas.

## 3 · Dónde está el peso que estorba

1. **Dar de alta una experiencia.** 134 campos en 17 secciones. Mezcla lo que
   hace falta para vender (título, fecha, precio, cupo, fotos, deslinde) con lo
   editorial (ficha científica, banco de fotos tipificado, bloque destacado,
   guías, mochila, cierre) y con lo de comunicación.
2. **El expediente.** Pide documentos por cada actividad (hasta ~60 tipos).
   Para una operadora nueva es la parte más lenta del alta.
3. **El panel.** 41 pantallas. Para operar una salida se usan 3 o 4.
4. **Seis candados encadenados.** Cada uno nació de un problema real, pero
   juntos hacen que nadie sepa qué le falta para vender.
5. **Dos sombreros y tres roles** en el panel, con reglas distintas por cada uno.

## 4 · Lo que de verdad detiene el lunes (no es de simplificar: son llaves)

Aunque el panel fuera perfecto, hoy una operadora externa **no puede** hacer el
recorrido completo, por cosas que sólo Luis puede destrabar:

| Paso | Estado real | Qué falta |
|---|---|---|
| Cuenta de cobro dentro de la plataforma | Construida, **apagada** | Prender `COBRO_EN_PLATAFORMA` en Vercel |
| Cobrar a la cuenta de la operadora | Construido y probado | Operadora con cuenta habilitada y comisión puesta |
| Retención de impuestos al cobrar | Construido | Llave **Live** de Facturapi en Vercel (`FACTURAPI_SECRET_KEY`) |
| Factura al cliente desde el portal | Construido, **apagado** | `FACTURAPI_USER_KEY`, `FACTURAPI_KEY_SECRET`, `FACTURACION_CLIENTES=1` |
| Factura de la comisión a la operadora | Construido, **apagado** | `FACTURACION_COMISIONES=1` |
| Convenio | Publicado (v3.3) | Que la operadora lo firme; ponerle su % |
| Cláusula de cupo mínimo | En la rama | Aprobación de la migración 0093 |

Las llaves las teclea Luis en Vercel; después hay que reconstruir y promover.
La contadora pidió revisar el corte antes de prender la factura a clientes de
la casa; para la operadora externa eso no aplica igual (ella factura con su
propio sello), pero el interruptor hoy es uno solo.

## 5 · Propuesta: qué se queda, qué se guarda

**Principio:** se GUARDA, no se borra. Lo que se va queda detrás de un solo
interruptor, fuera de la vista, y vuelve en una versión futura sin reconstruir.
Borrar código con dinero vivo debajo, en cuatro días, es el riesgo que no vale.

### 5.1 · El recorrido de la operadora, en 5 pasos

1. **Quién eres.** Sube tu constancia fiscal; de ahí salen razón social, RFC,
   régimen y domicilio. (Ya se hace.)
2. **Tus documentos.** El mínimo que la ley exige, no el catálogo completo.
   (Lo define legal; ver §6.)
3. **Firma el convenio.** (Ya existe.)
4. **Tu cuenta de cobro.** Dentro de Caminante, sin ver al procesador.
5. **Tu primera experiencia**, en un formulario corto.

### 5.2 · La experiencia en corto

**Se queda en el formulario (lo que hace falta para vender):**
título y lugar · una descripción · portada y hasta 5 fotos · actividad ·
qué incluye y qué no · punto de encuentro · fechas, cupo y precio · política
de cancelación (Estándar por defecto) · grupo mínimo (opcional).

**Se pone solo, sin preguntar:**
deslinde con las cláusulas de la casa para esa actividad · encuesta estándar ·
datos de contacto de la operadora.

**Se guarda en «Más detalle», cerrado y opcional:**
ficha científica, banco de fotos tipificado, bloque destacado, guías y
aliados, itinerario por día, mochila, preguntas frecuentes, cierre, niveles
de precio, complementos.

### 5.3 · El panel de la casa

**Se queda a la vista:** Salidas · Pagos · Experiencias · Operadoras.

**Se guarda (fuera del menú, siguen funcionando por su liga):** Comunicación
(Kit, redes, boletín) · tablero del CRM · Equipo y Rendimiento · cotizador ·
rentabilidad · proveedores · embajadores · magazine y aprende.

**No se toca (corre solo o es de ley):** cobro, reembolsos, cancelación,
comprobantes, retenciones, encuestas, deslinde, facturación.

### 5.4 · Los candados

Siguen existiendo (cuidan dinero y seguridad), pero la operadora ve **una sola
lista** de «esto te falta para vender», con el botón que lo resuelve en cada
renglón, en vez de enterarse uno por uno.

## 6 · Lo que hay que decidir antes de empezar

1. **¿Quién entra el lunes?** Nomádika o una operadora nueva; persona física o
   empresa; qué actividad. Cambia qué documentos y qué prueba de punta a punta.
2. **¿Las llaves de facturación van este fin de semana?** Sin ellas el lunes
   puede darse de alta y cobrar, pero no facturar.
3. **¿De acuerdo con la lista de §5?** Qué mover de «se queda» a «se guarda» o
   al revés.

## 7 · Cómo lo haría, si se aprueba

- **Jueves y viernes:** formulario corto de experiencia; lista única de «te
  falta»; menú reducido; expediente mínimo según legal.
- **Sábado:** recorrido completo con una operadora de prueba en el ambiente de
  pruebas (alta, cuenta de cobro, experiencia, cobro, factura).
- **Domingo:** corregir lo que salga; promover.
- **Lunes:** la operadora real, con Luis mirando.

---

## 8 · Lo que contestó legal el mismo día (D27; `design/legal/MINIMO-LEGAL-ALTA-OPERADORA-2026-11-19.md`)

Esto afina la propuesta de §5 y la lista de llaves de §4.

### 8.1 · El expediente, en tres momentos

La ley obliga a TENER los documentos, no a entregarlos antes de vender.

| Cuándo | Qué | 
|---|---|
| **Para publicar y vender** | Constancia fiscal reciente · identificación de quien firma · convenio firmado · anexo de la actividad firmado. **Nada más.** |
| **Antes de la primera salida de cada actividad** (y vigente en cada salida) | Póliza de accidentes y gastos médicos · póliza de responsabilidad civil · credencial del guía · autorización del sitio si aplica |
| **En 30 días desde la firma** | Registro Nacional de Turismo |
| **No se suben, se declaran en el anexo** | Manuales, programas, bitácoras, reglamento interno, botiquín |

Igual para persona física y moral; sólo cambia de quién es la identificación.

Dos condiciones:
1. **El candado no desaparece: se mueve a la SALIDA.** Sin póliza, guía o
   permiso la salida no se realiza, y el sistema avisa antes a la operadora y a
   la casa.
2. **Necesita el convenio v3.4**, porque el v3.3 publicado dice que no se vende
   una actividad sin expediente aprobado. La v3.4 está escrita y SIN publicar:
   espera el sí de Luis en la sesión de legal. Mientras no se publique, el
   candado completo de hoy se queda en producción.

### 8.2 · La experiencia: tres campos más

A la lista corta de §5.2 le faltan tres datos que la ley pide en la oferta:
**hora de inicio y de término (o duración) · nivel de exigencia · edad mínima.**
Y si cobra anticipo, el importe y la fecha límite del saldo.

El sistema pone solo: quién opera, «IVA incluido», política de cancelación y
mínimo si aplica, reclamaciones, «Incluye seguro de accidentes durante la
salida» y una liga para leer el deslinde antes de pagar. El itinerario día por
día no es obligatorio. El registro y deslinde por participante no se simplifica.

### 8.3 · Las llaves, ya en orden

**Sí o sí antes del primer cobro en la cuenta de la operadora:**
- Convenio firmado y % de comisión puesto.
- Constancia validada y cuenta de cobro habilitada.
- `FACTURAPI_SECRET_KEY` (Live) y `FACTURACION_COMISIONES=1`. La contadora ya dio
  el visto bueno a la llave el 12 nov; la retención ya está en producción.

**Opcional para el lunes (la operadora puede facturar por su cuenta mientras):**
- Factura al cliente desde el portal: `FACTURAPI_USER_KEY`,
  `FACTURAPI_KEY_SECRET`, `FACTURACION_CLIENTES`, y que ELLA suba su sello y
  firme la carta manifiesto.
- Ojo: no puede salir un comprobante de la CASA sobre el pago de noviembre que
  la contadora ya facturó. O Luis consigue el folio fiscal de esa factura y se
  marca, o se separa el interruptor en dos (operadoras / casa). Si el folio no
  llega, se separa.

**Puede esperar:** aviso de retenedora al SAT (mes siguiente a la primera
retención), CFDI de retenciones (día 5), informativa (día 10), registro de
turismo (30 días), migración 0093.

El párrafo del aviso de privacidad sobre el procesador de pagos ya está
publicado (verificado en el sitio el 19 nov), así que `COBRO_EN_PLATAFORMA`
no tiene pendiente legal.

---

## 9 · Avance

**19 nov · Alta rápida de experiencia (en la rama, sin promover).**
`/admin/experiencias/nueva` abre ahora una pantalla de 5 tarjetas y 17 campos
(antes 17 secciones y 134). De ahí sale la experiencia completa, en borrador,
con su primera fecha. El editor completo queda a un clic. La ficha pública
enseña horario, exigencia y edad mínima. Vista en el servidor local: la
pantalla se dibuja con el estilo del panel y dice junto todo lo que falta.
No probado todavía: guardar de verdad (necesita sesión) y publicar.

Pendiente de esta pieza: el texto estándar del deslinde, que es de legal.
Sin él, la experiencia nace con el deslinde apagado y hay que completarlo en
el editor completo antes de publicar.

**23 nov · Todo lo anterior está EN PRODUCCIÓN (`b070711`).** Migración 0093
aplicada (hash comparado, 11 candados probados). Promovido en tres tandas el
mismo día, cada una con el build de Vercel en verde.

- **Menú esencial de la casa.** Con el sombrero de una operadora: Salidas ·
  Experiencias · Pagos · Más. Con el de numan: Operadoras · Más. Nada se
  borró: «Más» lista lo que salió del frente (`admin/mas`,
  `admin/plataforma/mas`) y una prueba comprueba que no se perdió ninguna
  sección. El menú de la operadora externa no se tocó.
- **«Esto te falta para vender», una sola lista** arriba de los cuatro pasos de
  Mi alta (`lib/operadores/lo-que-falta.ts`, puro). Sale de los mismos seis
  candados que ve la casa y del expediente; dice a quién le toca cada renglón y
  lleva su liga. Vista en producción con Nomádika: 4 de 6; le tocan el
  expediente (3 documentos) y la firma; la cuenta de cobro es de la casa
  mientras `COBRO_EN_PLATAFORMA` esté apagada.
- **Alta rápida probada de punta a punta en producción** con un borrador de
  prueba (borrado después, dos veces): guarda, crea la primera fecha, la vista
  previa enseña precio, horario, exigencia, edad, incluye y política; en
  Salidas se guardó un grupo mínimo y la ficha lo enseñó («Mínimo 4 personas ·
  se confirma a más tardar el 1 de marzo»).
- **Hueco encontrado y cerrado en esa prueba:** la experiencia creada por la
  casa nacía sin dueña y no aparecía en «Experiencias». Ahora la casa elige la
  operadora en la primera tarjeta (ver `.claude/rules/experiencias.md`).

**Lo que NO se ha probado:** el recorrido con la sesión de una operadora
externa (su alta, su firma, su primera experiencia y un cobro). No hay cuenta
de prueba de operadora y local y producción comparten base.

**Lo que sigue detenido, y por quién:**
- Convenio v3.4 sin publicar (Luis con legal). De él depende sacar el
  expediente en tres momentos; el candado de publicación no se relaja antes.
- Llaves en Vercel (Luis): `FACTURAPI_SECRET_KEY` Live y
  `FACTURACION_COMISIONES=1` antes del primer cobro en cuenta de operadora.
- La cuenta de cobro de la operadora: la abre la casa (o se prende
  `COBRO_EN_PLATAFORMA`).
- Quién entra, con qué actividad y qué comisión.
- El menú de la operadora externa (siete pestañas) no se redujo: toca el
  candado del alta y no se movió el día del alta.

