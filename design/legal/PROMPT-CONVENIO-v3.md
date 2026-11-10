# Prompt para la sesión legal · Convenio v3

Pegar completo en la sesión legal. Escrito el 9 nov 2026, después de promover el
alta de operadoras nueva (commit 8486047).

---

Necesito el **convenio v3**: el convenio de operación completo, listo para
publicarse y firmarse en `/caminante/admin/mi-alta/convenio`. Hoy NINGUNA
operadora puede cobrar por cuenta conectada porque no hay un solo convenio
publicado (`operator_agreement_versions` está vacía); éste es el candado que
detiene todo.

Parte de `design/operadores/CONVENIO-v2.md`, que hiciste hoy. Horas después se
cambió en producción el alta de operadoras, y varias cláusulas del v2 ya dicen
lo contrario de lo que el sistema hace. Lo de abajo está verificado en el código
y ya está decidido por Luis: no lo reabras; si algo te parece mal, dilo y para.

## 1 · Facturar ya no es condición para cobrar

Para cobrar por cuenta conectada bastan **cuatro** cosas: cuenta de cobro
verificada por el procesador, saber si es persona física o moral, convenio
firmado y comisión definida (`src/lib/operators/listo-para-vender.ts`). El CSD y
los datos fiscales salieron del candado. Facturar desde la plataforma es un paso
**opcional y posterior** («Cobrar → Facturación desde Caminante · opcional»).

**El flujo de facturas que quiere Luis** (corrección del 9 nov): NUMAN le
factura a la operadora **su comisión** con Facturapi, con los datos fiscales de
la operadora bien capturados; la operadora les factura a sus clientes, en una
global a **público en general** lo que nadie pidió. Hoy ninguna operadora cobra
por cuenta conectada: NUMAN cobra todo y a Nomádika le paga por transferencia
contra su factura de servicios. El convenio describe el modelo de plataforma
que va a arrancar, no el de hoy.

Contradicen esto:
- **Décima tercera §1**: da por hecho que el portal timbra. Reescribir: el
  Operador **siempre** está obligado a facturarle a su cliente. Puede hacerlo
  desde el portal (si prende la facturación y carga su CSD, y con la
  autorización para timbrar en su nombre) o por sus propios medios. Si factura
  por fuera, Caminante no emite ni responde por esos comprobantes.
- **Décima tercera §7**: «mientras no tenga CSD vigente no puede cobrar». Quitar.
  El CSD vigente sólo es requisito para usar la facturación del portal.
- **Anexo F**: quitar «CSD vigente» como requisito y **quitar la CLABE**.
  Caminante no guarda la cuenta bancaria, que va directo al procesador (lo dice
  la propia Cuarta §7). Dejarla en el anexo contradice al convenio.

## 2 · Física o moral primero, y el expediente nuevo (Anexo B)

El expediente se pide según el tipo de persona. La fuente única es `GENERALES`
en `src/lib/operadores/actividades.ts`; el Anexo B la transcribe, sin agregar
documentos.

**Obligatorios, física y moral:**
1. Registro Nacional de Turismo (SECTUR) vigente.
2. Identificación oficial: la de la persona física, o la del representante
   legal de la moral. INE o pasaporte; la vigencia se pide por año.
3. Constancia de Situación Fiscal (no vence; ver §4).
4. Póliza de responsabilidad civil vigente: anual, o contratada por integrante
   por día de salida.
5. Póliza colectiva de seguro de accidentes y enfermedades, emitida por una
   aseguradora autorizada.

**Opcionales:** identificación de quien opera en campo; acta constitutiva y
poder del representante (**sólo** a morales, y opcional; a una persona física
nunca se le pide).

**Por actividad:** la credencial de guía SECTUR (NOM-09) de la modalidad y los
requisitos técnicos del catálogo, que viven en los anexos por actividad.

## 3 · Lo que dejó de pedirse como documento

Primeros auxilios (lo implica la credencial SECTUR), protocolo de emergencia,
inventario del botiquín y bitácora. El botiquín pasó a ser una **declaración**
en el anexo por actividad, marco v2 (`src/lib/operadores/subconvenio-doc.ts`:
Quinta «Botiquín» y Sexta «Seguros de cada salida»).

Alinear la **Sexta** del convenio:
- Punto 3 (capacitación vigente en primeros auxilios) y punto 5 (protocolo de
  seguridad): la obligación de operar con seguridad puede quedarse; lo que ya
  no existe es el papel que se entrega. Que no parezca que se exige un
  documento que el expediente no pide.
- Punto 2 (seguro de RC): que diga lo mismo que el anexo. La RC y la póliza
  colectiva cubren a todas las personas de cada salida, todos los días; vale la
  anual o la de por integrante por día; aseguradora autorizada; se entrega
  cuando Caminante la pida.

## 4 · La Constancia de Situación Fiscal

No vence. Al subirla, la plataforma la **lee con un servicio de inteligencia
artificial** y la valida contra el validador del SAT (RFC, nombre, régimen,
fecha de emisión). Se considera reciente si tiene **90 días o menos** (decisión
de Luis, 9 nov 2026). Si el Operador cambia de régimen, domicilio o razón
social, sube una nueva.

- Escribirlo en la **Décima tercera §7**, en lugar de «CSD vigente».
- **Datos personales**: los documentos del Operador (no los de sus clientes) se
  procesan con herramientas automatizadas, incluido un proveedor externo de IA.
  Decide dónde va (Octava o un párrafo nuevo) para que el Operador lo sepa y lo
  acepte. Los datos de salud de los participantes **jamás** pasan por ahí. Eso
  ya es regla del sistema y conviene que el convenio lo diga.

## 5 · La cuenta de cobro, como existe hoy

Dato técnico para la Cuarta §7, no una decisión tuya:
- La cuenta se crea en el procesador (Stripe) con **su propio panel completo**:
  Accounts v2, `dashboard: "full"`, con `fees_collector` y `losses_collector` =
  Stripe (`src/lib/payments/connect.ts`, `crearCuentaV2`).
- El cobro es un **cargo con destino con `on_behalf_of`**: el Operador es el
  comercio que ve el cliente; el procesador separa la comisión en el mismo acto
  (`src/lib/payments/connect-cobro.ts`).
- El Operador completa la verificación en la pantalla del propio procesador y
  ahí acepta su contrato.

Verifica que el enlace de la Cuarta §7 a) (https://stripe.com/connect-account/legal/full)
siga siendo el que corresponde a ese tipo de cuenta. La pregunta 7 de Jorge
(saldos negativos) cambia con `losses_collector = stripe`: déjale el dato
técnico y no la cierres tú.

## 6 · Retenciones: no prometer lo que el sistema no hace

Hoy el sistema **no retiene ISR ni IVA**. Sólo retiene comisión + IVA de la
comisión (`retencionDe` en `src/lib/payments/connect-cobro.ts`). Y el RFC ya no
es condición para cobrar. La Cuarta §8 y la §9 (la liquidación con ISR e IVA
retenidos, y el ejemplo de $1,241.59) describen algo que hoy no ocurre.

No lo resuelvas en el convenio: va con Marisol, en una pregunta aparte. Lo que
sí te toca es que el v3 **no se publique diciendo algo falso**. Propón la
redacción para los dos casos (sistema reteniendo / todavía sin retener) y
marca cuál depende de la respuesta de Marisol.

## 7 · Sin cambio

Comisión (escala A/B, tope 20 %, mínimo $250, congelamiento, complementos,
descuentos, fecha de arranque), modelo Airbnb, y la comisión del procesador
dentro de la de Caminante.

## Lo que decide Luis (pregúntaselo ANTES de redactar)

Las ventanas de cancelación del cliente y la penalización a la operadora que
cancela (Quinta y Anexo C), pendientes desde el 13 ago. Preséntaselas como
preguntas cortas, con la propuesta del v2 como opción por defecto. No las des
por confirmadas.

Kéntro está en **standby**: no lo uses de ejemplo ni prepares nada para que
firme.

## Entregables

1. `design/operadores/CONVENIO-v3.md`: documento de trabajo, con la tabla «qué
   cambió del v2» y los 🔸 que sigan abiertos (Jorge / Marisol / Luis).
2. `design/operadores/CONVENIO-v3-FIRMABLE.md`: el mismo texto **sin notas,
   banners ni 🔸**, listo para `scripts/publicar-convenio.mjs`. El script
   rechaza un archivo que diga «revisión legal», que traiga 🔸 o que diga «no
   ser un documento firmable». El título es la primera línea `# `.
3. Anexo B y Anexo F actualizados. El anexo por actividad (marco v2) y el
   convenio no se contradicen.
4. Una lista corta para Luis con lo que falta para publicar, y de quién es cada
   cosa.

**Conserva los nombres de cláusula que cita el código**: Cuarta §7 (aceptación
del contrato del procesador; `connect-actions.ts`, `alta-cobro.ts`), Quinta
(política de cancelación; `reembolsos.ts`, `liquidaciones.ts`) y Sexta
«Anexos por actividad» (`candado-actividad.ts`, `subconvenio-doc.ts`). Si
renumeras, dilo en la lista para que se actualicen.

**No publiques ni corras SQL.** La publicación la hace Luis, o la autoriza, con
el hash comparado. Nunca inventes un número: donde no hay dato, dilo y di de
dónde tendría que salir.
