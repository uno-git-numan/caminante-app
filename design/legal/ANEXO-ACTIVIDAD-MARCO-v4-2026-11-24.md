# El anexo por actividad, marco v4: la póliza de accidentes ya no se entrega (D31)

**24 nov 2026 · Sesión legal y fiscal, para código.** Sustituye al marco v3
(`ANEXO-ACTIVIDAD-MARCO-v3-2026-11-23.md`) **cuando se publique el convenio
v3.6**, no antes: la Séptima nueva cita la Cláusula Sexta, punto 2 bis, que
sólo existe en la v3.6. Cambia **una sola cláusula, la Séptima**. Todo lo
demás es idéntico al v3, letra por letra. La clasificación de los 54
documentos del catálogo no cambia.

## 1 · Qué se entrega y qué se declara

**La regla.** Se **entrega** antes de la primera salida lo que:

- **a)** acredita a una persona: credencial, certificación o licencia;
- **b)** es un permiso o autorización de un tercero sobre el sitio;
- **c)** es una póliza de seguro;
- **d)** es un certificado con vigencia que emite un tercero sobre una nave,
  un animal o un equipo del que depende la vida.

Se **declara** lo que produce la propia operadora: prácticas, planes,
protocolos, ratios, bitácoras propias y la existencia de equipo. En la duda:
si lo emite un tercero, se entrega; si lo escribe ella, se declara.

Fundamento: la norma obliga a «contar con» manuales, bitácoras y programas
(NOM-011-TUR-2001, 6.1 y 6.2), no a entregarlos; y pide permisos, guías
acreditados y seguros para operar (6.1 c, 6.3 g; convenio, Sexta §2 a §4).

**Excepción al inciso c), desde el 24 nov (D31).** La póliza de accidentes y
gastos médicos de los participantes ya no se entrega: Luis la quitó del
expediente. Queda como documento **opcional**. Los seguros específicos de
buceo y de paracaidismo y la póliza de responsabilidad civil se siguen
entregando.

**La propuesta de código, revisada.** De acuerdo con todo lo que puso en «se
entregan». **Tres pasan de «se declaran» a «se entregan»**, por el inciso d):

| Documento | Actividad | Por qué se entrega |
|---|---|---|
| `hidrostatica-tanques` | buceo, buceo-cavernas | Prueba con vigencia que hace un tercero; un tanque sin prueba es el riesgo mayor |
| `analisis-aire` | buceo, buceo-cavernas | Análisis de laboratorio con vigencia |
| `mantenimiento-reguladores` | buceo, buceo-cavernas | Servicio anual hecho por técnico autorizado |

**Lista completa, para que no quede nada a interpretación:**

| Se entregan antes de la primera salida | Inciso |
|---|---|
| Credencial NOM-09 de la modalidad (`nom09-*`) | a |
| `rescate-montana`, `rescate-aguas-rapidas`, `cert-agencia`, `cert-cuevas`, `licencia-fmp`, `licencia-piloto`, `guia-micologo`, `empacador` | a |
| `permiso-predio`, `permiso-inah`, `permiso-anp`, `permiso-ejido` | b |
| `seguro-buceo`, `seguro-paracaidismo` | c |
| `aeronavegabilidad`, `embarcacion`, `veterinario`, `hidrostatica-tanques`, `analisis-aire`, `mantenimiento-reguladores` | d |

| Se declaran en el anexo |
|---|
| `ratio-guias`, `comunicacion`, `comunicacion-satelital`, `radio-vhf`, `plan-aclimatacion`, `plan-escape`, `plan-mareas`, `plan-mar`, `plan-nocturno`, `camara-hiperbarica` |
| `doble-aseguramiento`, `protocolo-agua`, `protocolo-identificacion`, `protocolo-fogata`, `regla-tercios`, `pronostico-hidrologico`, `distancias-minimas`, `manejo-animal`, `residuos-agua`, `clase-rio` |
| `bitacora-epp`, `revision-anclajes`, `revision-balsas`, `mantenimiento-mecanico`, `monturas` |
| `chalecos`, `flotacion`, `cascos`, `cascos-jinete`, `neopreno`, `triple-luz`, `lineas-guia`, `oxigeno-emergencia`, `vehiculo-apoyo` |

**Dos precisiones:**

- **Permisos que no aplican.** `permiso-inah` y `permiso-anp` dependen del
  sitio. La operadora necesita poder declarar «no aplica a mis salidas»; esa
  declaración queda en el anexo (Cláusula Cuarta). Sin esa opción, el candado
  de la salida le exigiría un permiso que no existe.
- **Un documento nuevo en el catálogo** se clasifica con la regla de arriba.
  Si no es evidente, pregunten antes de publicarlo.

## 2 · El marco v4 (texto fijo; se transcribe tal cual)

Variables que pone código: `{nombre}` (de la actividad), `{norma}` (como hoy,
con sus dos variantes), `{lista_entregan}` y `{lista_declaran}`.

- En `{lista_entregan}`, cada renglón termina, si vence: «Debe estar vigente
  el día de cada salida; se entrega con su fecha de vencimiento.» Si no vence:
  «No caduca; se actualiza cuando cambie.»
- En `{lista_declaran}`, cada renglón lleva sólo el nombre y su porqué.
- Si una actividad no tiene nada en una de las dos listas, la cláusula dice
  en su lugar: «Esta actividad no pide documentos propios en este apartado.»

> # Anexo por actividad — {nombre}
> del Convenio de operación en la plataforma Caminante
>
> **Primera. Objeto.** Este anexo precisa, para la actividad de {nombre} y
> sólo para ella, lo que el Operador debe acreditar, declarar y mantener
> vigente para publicarla, venderla y operarla en la plataforma. Forma parte
> integrante del Convenio (Cláusula Sexta, «Anexos por actividad»).
>
> **Segunda. Norma aplicable.** {norma} El Operador declara conocerlas y
> cumplirlas.
>
> **Tercera. Para publicar y vender.** Para publicar y vender esta actividad
> basta el expediente de arranque del Anexo B del Convenio, que son la
> Constancia de Situación Fiscal y la identificación oficial, y la firma del
> Convenio y de este anexo. El Registro Nacional de Turismo se entrega dentro
> de los 30 días naturales siguientes a la firma del Convenio, con la
> constancia de inscripción o el acuse de su trámite.
>
> **Cuarta. Antes de la primera salida.** El Operador entregará los
> documentos siguientes antes del inicio de la primera salida de esta
> actividad y los mantendrá vigentes en cada salida. Cada uno se revisa uno
> por uno; ninguno se da por bueno por antigüedad ni por confianza. Sin ellos
> la salida no se realiza. Cuando un permiso no aplique a sus salidas, el
> Operador lo declara así en la plataforma, bajo protesta de decir verdad, y
> esa declaración forma parte de este anexo.
>
> {lista_entregan}
>
> **Quinta. Lo que el Operador declara.** El Operador declara, bajo protesta
> de decir verdad, que cuenta con lo siguiente para esta actividad, que lo
> mantiene al día y que lo aplica en cada salida. No se entrega a la
> plataforma: el Operador lo conserva y lo exhibe a Caminante cuando se lo
> pida, y siempre después de un incidente.
>
> {lista_declaran}
>
> Declara además que cuenta con los manuales de seguridad y de atención de
> emergencias, el manual de operación para sus guías, el programa de
> capacitación de su personal y el reglamento interno que las normas
> aplicables le exijan.
>
> **Sexta. Botiquín.** El Operador declara y acepta que en cada salida de
> esta actividad lleva un botiquín completo y adecuado a la actividad, al
> número de participantes y a la duración de la salida, revisado y con su
> contenido vigente, y que el guía responsable sabe usarlo. Esta declaración
> sustituye la entrega de un inventario: es una obligación de cada salida, no
> un papel que se entrega una vez.
>
> **Séptima. Seguros de cada salida.** La póliza de responsabilidad civil
> debe cubrir cada salida, todos los días que dure, y estar emitida por una
> aseguradora autorizada. Vale una póliza anual o una contratada por
> integrante y por día. En los dos casos, antes del inicio de cada salida
> debe constar en la plataforma una póliza vigente para los días de esa
> salida: la anual se sube una vez, con su fecha de vencimiento; la
> contratada por salida se sube antes de cada una. Los seguros contra
> accidentes y gastos médicos de las personas de cada salida se rigen por la
> Cláusula Sexta, punto 2 bis, del Convenio: el Operador cuenta con los que
> la norma le exija y no los entrega; la plataforma sólo informa al cliente
> que una salida cuenta con seguro de accidentes mientras conste en ella una
> póliza vigente para los días de esa salida.
>
> **Octava. Vigencias.** Un documento vencido **no cuenta como entregado**.
> La plataforma avisa a 30 y a 7 días del vencimiento. Una salida sólo se
> realiza si los documentos de las Cláusulas Cuarta y Séptima están vigentes
> el día en que inicia. Si faltan o están vencidos, el Operador los
> regulariza antes de la salida; si no lo hace, la salida no se realiza y su
> cancelación le es imputable conforme a la Cláusula Quinta del Convenio.
> Mientras un documento esté vencido, Caminante puede suspender la
> publicación y la venta de nuevas salidas de esta actividad.
>
> **Novena. Alcance.** Este anexo no autoriza ninguna otra actividad. Ofrecer
> una distinta exige su propio anexo y su propio expediente.
>
> **Décima. Responsabilidad.** Nada en este anexo traslada a Caminante la
> operación, la seguridad ni el cumplimiento de la actividad, que son y
> siguen siendo responsabilidad exclusiva del Operador (Convenio, Cláusulas
> Primera y Novena).
>
> **Décima primera. Vigencia.** Este anexo entra en vigor al suscribirse y
> dura lo que dure el Convenio. Se versiona y se vuelve a firmar con el mismo
> procedimiento y los mismos plazos que el Convenio (Cláusula Décima segunda)
> y con la misma firma electrónica (Cláusula Décima sexta).

**Lo que cambió respecto del marco v3, y por qué:**

| Cláusula | Cambio |
|---|---|
| Séptima | Sólo la póliza de responsabilidad civil debe constar en la plataforma antes de cada salida. Los seguros contra accidentes y gastos médicos se rigen por el convenio (Sexta, punto 2 bis): no se entregan |

**Por qué.** El 24 nov Luis quitó del expediente la póliza colectiva de
accidentes y enfermedades. El marco v3 obligaba a que constara en la
plataforma antes de cada salida, y la plataforma ya no tiene dónde subirla
como obligatoria. La obligación de tener ese seguro no desaparece: la pone la
norma (NOM-011-TUR-2001, 6.1 c), no Caminante.

**Para código:**

- **Versión.** Es marco nuevo: quien haya firmado un anexo con el v3 vuelve a
  firmar.
- **Orden.** Primero el convenio v3.6, luego este marco. Mientras no se
  publiquen, lo vigente es v3.5 con marco v3, que pide una póliza que ya no se
  puede subir como obligatoria. Lo mejor es que ninguna operadora firme el
  anexo en ese intervalo; si alguna firma, vuelve a firmar el v4.
- **La Octava no cambia.** «Los documentos de las Cláusulas Cuarta y Séptima»
  ahora son, de la Séptima, sólo la póliza de responsabilidad civil.
- **La póliza opcional.** Para que una operadora pueda decirle a sus clientes
  que la salida lleva seguro, necesita dónde subir la póliza de accidentes
  como documento **opcional** con fecha de vencimiento (puede ser el mismo
  renglón `poliza-gm`, que conserva las filas ya subidas). La regla está en
  `DESLINDE-ESTANDAR-2026-11-19.md`, «Seguro (cláusula 9)».

## Fuentes

- Convenio v3.6 preparado (sin publicar): Sexta, puntos 2 y 2 bis, y Anexo B.
- NOM-011-TUR-2001, 6.1, 6.2 y 6.3 (releída el 24 nov).
- Catálogo `src/lib/operadores/actividades.ts` tras el commit 60e1ea8.
- No leí la NOM-05-TUR-2003 de buceo ni la regulación aeronáutica.
