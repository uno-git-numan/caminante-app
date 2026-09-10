# Anexo E — el subconvenio por actividad

### Borrador · 10 de septiembre de 2026 · pendiente de revisión legal

Acompaña al **Convenio de operación en la plataforma Caminante**, Cláusula Sexta,
apartado «Anexos por actividad».

---

## Por qué existe

El convenio general dice cómo se cobra, cómo se paga y quién responde. Eso no
cambia entre una caminata y un descenso a una caverna.

Lo que sí cambia es **qué hay que acreditar para tener derecho a llevar gente**.
La NOM-09-TUR-2002 acredita guías **por modalidad**: estar acreditado en
senderismo no acredita para buceo. Un anexo por actividad es la forma de que el
papel diga lo mismo que el sistema, y de que aprobar a una operadora no signifique
aprobarle todo lo que se le ocurra ofrecer después.

## La decisión que lo hace sostenible: NO se redacta, se genera

Dieciséis actividades × un documento a mano = dieciséis documentos que se
separan del sistema el día que alguien edite el catálogo y olvide el .md. Ese
desfase no falla ruidosamente: **firma al Operador un anexo que pide papeles
distintos de los que la pantalla le pide**, y nadie se entera hasta que hay un
accidente y un abogado compara los dos textos.

Por eso el texto del anexo se **arma** con `textoDelAnexo(actividad)`
(`src/lib/operadores/subconvenio-doc.ts`) a partir de:

- el **marco** de abajo, que es igual para todas y sí está escrito a mano;
- la **norma** de esa actividad, del catálogo;
- sus **documentos propios**, con el porqué de cada uno y si vence o no;
- los **generales** que esa actividad vuelve críticos.

El catálogo (`actividades.ts`) es la misma fuente de la que sale el expediente
que ve el Operador. Si mañana el equipo legal agrega un documento a cañonismo,
el anexo de cañonismo lo dice solo — y como una versión firmada es inmutable,
para que aplique hay que **publicar una versión nueva y volver a firmar**, que es
exactamente lo que debe pasar cuando cambia lo que se exige.

## El marco (igual para toda actividad)

> **Anexo por actividad — {ACTIVIDAD}**
> del Convenio de operación en la plataforma Caminante
>
> **Primera. Objeto.** Este anexo precisa, para la actividad de {ACTIVIDAD} y sólo
> para ella, lo que el Operador debe acreditar y mantener vigente para
> publicarla y venderla en la plataforma. Forma parte integrante del Convenio.
>
> **Segunda. Norma aplicable.** {NORMA}, además de las normas oficiales
> mexicanas y disposiciones que resulten aplicables a la actividad. El Operador
> declara conocerlas y cumplirlas.
>
> **Tercera. Expediente de la actividad.** El Operador entregará y mantendrá
> vigentes los documentos siguientes. Cada uno se revisa uno por uno; ninguno se
> da por bueno por antigüedad ni por confianza.
>
> {DOCUMENTOS PROPIOS — nombre, para qué sirve, si vence}
>
> **Cuarta. Del expediente general.** Además, esta actividad vuelve críticos los
> siguientes documentos generales, que se entregan una sola vez y sirven para
> todas: {GENERALES}.
>
> **Quinta. Vigencias.** Un documento vencido **no cuenta como entregado**. La
> plataforma avisa a 30 y a 7 días. Vencido un documento indispensable, la
> actividad se suspende hasta regularizarlo; las salidas ya vendidas se operan y
> se honran, y lo que se suspende es publicar y vender lo nuevo.
>
> **Sexta. Alcance.** Este anexo no autoriza ninguna otra actividad. Ofrecer una
> distinta exige su propio anexo y su propio expediente.
>
> **Séptima. Responsabilidad.** Nada en este anexo traslada a Caminante la
> operación, la seguridad ni el cumplimiento de la actividad, que son y siguen
> siendo responsabilidad exclusiva del Operador (Convenio, Cláusulas Primera y
> Novena).
>
> **Octava. Vigencia.** Este anexo entra en vigor al suscribirse y dura lo que
> dure el Convenio. Se versiona y se vuelve a firmar con el mismo procedimiento
> y los mismos plazos que el Convenio.

## Lo que falta decidir, y de quién es

| # | Pregunta | De quién |
|---|---|---|
| 1 | ¿El anexo se firma al **declarar** la actividad o al **aprobarla**? Declarar antes deja constancia de a qué se comprometió mientras junta papeles; aprobar después evita firmas de actividades que nunca despegan | Luis |
| 2 | ¿Un anexo vencido suspende **la actividad** o **al Operador**? El borrador dice la actividad, congruente con «lo aprobado sigue vendiendo» | Luis (confirmar) |
| 3 | ¿Las cifras de vida útil del equipo (cuerdas, arneses) entran al anexo, o se quedan en «bitácora de vida»? Hoy el catálogo **no pone números** a propósito | Equipo técnico |
| 4 | ¿Hace falta anexo para las actividades de riesgo bajo (observación de naturaleza), o basta el convenio general? | Abogado |
| 5 | ¿El anexo debe llevar la póliza y su suma asegurada mínima por actividad? Hoy la póliza se pide, pero **no se verifica su vigencia contra la aseguradora** — ver §5 de `CATALOGO-ACTIVIDADES.md` | Luis + abogado |
| 6 | **Cuatro actividades no tienen norma en el catálogo**: cabalgata, recolección micológica, campamento y pernocta, y **paracaidismo**. Su anexo lo dice con todas sus letras («no tiene una norma oficial mexicana específica») en vez de inventar una. Paracaidismo llama la atención: hay regulación aeronáutica y de la SICT que probablemente aplica. **No se agrega al catálogo hasta que alguien la confirme** | Equipo técnico + abogado |

## Lo que ya quedó resuelto

- **Por actividad, no global.** Que el buceo esté a medias no detiene el
  senderismo aprobado. Vive en el candado (`candado-actividad.ts`), en la 0058 y
  ahora también en el papel.
- **Inmutable.** Una versión firmada no se edita: corregir es publicar otra y
  volver a firmar. Mismo trato que el convenio (0050) y que los deslindes de
  cliente.
- **Se congela lo que se firmó.** El anexo guarda el hash del texto que se pintó
  en pantalla y la lista de documentos exigidos ese día. Cambiar el catálogo
  después no reescribe lo que alguien aceptó.
