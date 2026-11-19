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
