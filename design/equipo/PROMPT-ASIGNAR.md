# Prompt para Claude Design — «Quién lo lleva» (Asignar / Tomar en Comunidad)

> Se pega en el mismo chat donde construiste el panel de Caminante y la lámina
> «Equipo» (la corregida, con el segmento Personas | Rendimiento).

---

Busca en este chat lo que ya construiste y tenlo a la vista antes de dibujar:

- **«Equipo»** (la lámina corregida): `Persona`, `Transferir` (el `.upfecha.eqcol`
  con «A quién» y las opciones «Todas / Algunas»), `Para` (los chips de para
  quién trabaja), `.pchip` con avatar de iniciales, `PBtn`, `PCheck`, `PEyebrow`,
  y los datos de ejemplo `EQ` (Ana Ruiz · numan · onboarding; Diego Salas ·
  Caminante y Kéntro · clientes/armar/campo; Mariana Ortiz · las dos; Teresa
  Ibarra sin facultades; Sofía Lara y Tomás Vega, de Nomádika).
- **Plataforma → Comunidad** (`plataforma.dc.html`): el pipeline de operadoras
  por etapa (Llegó · En llamada · Expediente · Listo · Vendiendo · Dormido · Se
  salieron), la tarjeta de operadora y el **cajón** que se abre con «Agendar la
  llamada» (`.act-row`, `.cmwin`, `.verdict casa`, `.gnhint`).
- **numan → Comunidad** (`comunidad.dc.html`): «Por contestar» arriba (las
  solicitudes de fecha y los embajadores, `.sec` + `.subtitle`), el tablero CRM
  (`.cmboard`, `.cmcol`, `.cmcol-hd`, `.cmc` con `.cmgrip`, `.cmtag`, `.cmnext`)
  y la biblioteca.

**Te pido una cosa nueva, pequeña, en esas dos pantallas: que se vea quién lleva
cada cosa, y que se pueda asignar o tomar.** No es una pantalla nueva ni un
rediseño. Reusa tus componentes; si necesitas una clase nueva, que empiece por
`.asg` y dila por su nombre en el recibo. No redefinas nada del panel
(`.ahead`, `.nav`, `.page`, `.cmc`, `.act-row`…): tu `<style>` trae sólo lo nuevo.

---

## Por qué existe

El equipo (0070) ya entra al panel con facultades, y el libro de atribuciones
(0071) ya sabe quién lleva qué: **solicitudes** de operadora y **operadoras**
(numan · onboarding), **tarjetas** del CRM y **grupos** (operadora · clientes).
Hoy el libro se llena solo de dos formas: **tomar es actuar** (quien agenda la
llamada o mueve una tarjeta se la queda si nadie la tenía) y «Transferir
cartera» desde Equipo. Lo que falta es verlo donde se trabaja y poder decidirlo
ahí: Luis quiere asignar desde Comunidad sin ir a Equipo, y alguien del equipo
quiere tomar una solicitud sin tener que actuar sobre ella primero.

Reglas que ya existen y la pantalla sólo refleja:

- **Un titular a la vez.** Nadie arrebata: si ya la lleva otro, la casa la
  reasigna (es una decisión) o el titular la pasa; el equipo no la toma.
- **Una sola puerta** para poder llevar algo: persona activa, con la facultad
  del objeto (`onboarding` para solicitudes y operadoras; `clientes` para
  tarjetas y grupos) y del lado correcto (numan para lo de numan; trabajar para
  ESA operadora para lo suyo). **La lista de «a quién» sólo trae a quien pasa
  esa puerta**; nunca se muestra a alguien que no puede llevarlo con el botón
  deshabilitado.
- **La casa asigna, no toma.** Para la casa el verbo es «Asignar a…» /
  «Pasar a…». Para el equipo, «Tomar» (si nadie la lleva) o «Pasar a…» (si la
  llevo yo). Si la lleva otro, el equipo sólo lo ve.
- **Lo devengado hasta hoy sigue siendo de quien la tenía.** Al pasar algo, la
  misma frase de `Transferir`: «Lo devengado hasta hoy sigue siendo de Ana.
  Desde mañana, lo nuevo es de quien la recibe.»

## Dónde va y cómo se ve

### 1 · La línea «Lo lleva» (las dos pantallas)

En la **tarjeta de operadora** del pipeline y en la **tarjeta `.cmc`** del CRM,
una línea discreta al final, con el `.pchip` de quien la lleva:

- Con titular: `[AR] Ana Ruiz · desde el 4 ago`.
- Sin titular: `Nadie la lleva todavía` en `.mut`, sin avatar, sin punto rojo.
  No es una alarma: las solicitudes son libres.
- Titular dado de baja (estado feo): `Sin nadie desde el 12 sep · la llevaba
  Mariana Ortiz` — así se ve que se quedó suelta y de dónde viene.

En la tarjeta `.cmc` cabe poco: sólo el avatar de iniciales en la esquina
(como `.cmgrip` pero al otro lado), y el nombre completo en el cajón. Sin
titular no se dibuja nada en la tarjeta cerrada.

### 2 · El control, en el cajón (las dos pantallas)

Dentro del cajón de la operadora (junto a «Agendar la llamada») y dentro de la
tarjeta CRM abierta, **una fila `.act-row`** con la línea «Lo lleva» y un solo
botón a la derecha, según quién mira:

| quién mira | nadie la lleva | la llevo yo | la lleva otro |
|---|---|---|---|
| **Casa** | `Asignar a…` | — | `Pasar a…` |
| **Equipo con la facultad** | `Tomar` | `Pasar a…` | (sólo se ve) |
| **Equipo sin la facultad** | (sólo se ve) | — | (sólo se ve) |

`Asignar a…` y `Pasar a…` abren, **en el mismo cajón, sin modal**, el bloque
de `Transferir` reducido a lo que aplica: el `<label class="sel">A quién` con
la lista de quien puede llevarla, y los dos botones (`Asignar` / `Pasar` en
`accent`, `Cancelar` en `ghost`). Sin «Todas / Algunas»: aquí es una cosa.
Con la lista vacía, el `.gnhint` de siempre: «Nadie más en el equipo puede
llevar operadoras. Da de alta a alguien primero.»

`Tomar` no abre nada: un clic, y la línea cambia a `[AR] Ana Ruiz · desde hoy`
con un `.verdict si` breve: «Ya la llevas tú.»

### 3 · «Por contestar» (numan → Comunidad)

Las solicitudes de fecha y los embajadores de «Por contestar» son tarjetas
libres. Ahí el control va **en la tarjeta misma**, no en un cajón: la línea
«Lo lleva» y el botón `Tomar` (equipo con `clientes`) o `Asignar a…` (casa).
Cuando alguien la toma, la tarjeta no se mueve de columna: sólo cambia la
línea. La solicitud contestada sigue siendo la misma tarjeta.

### 4 · El sombrero acota la lista

Con el sombrero en **Caminante**, la lista de «a quién» para una tarjeta trae a
quien trabaja para Caminante (Diego, Mariana); con el sombrero en **Kéntro**,
a quien trabaja para Kéntro (Diego). Una tarjeta de Nomádika, vista por la
casa, sólo ofrece a Sofía y Tomás. Muéstralo con el mismo dato en dos
sombreros.

## Estados que tienen que verse

Agrega a la pastilla de la lámina (la misma `Pastilla` de Equipo) quién mira:
**Casa · Luis**, **Ana · numan** (onboarding), **Diego · Caminante** (clientes),
**Teresa · numan** (sin facultades).

1. **Pipeline, casa**: Nomádika la lleva Ana; Senderos Tláloc sin nadie;
   Cumbres del Ajusco «sin nadie desde el 12 sep · la llevaba Mariana Ortiz».
   Cajón de Senderos abierto con `Asignar a…` desplegado: la lista trae a Ana
   y a Mariana, no a Diego ni a Teresa.
2. **Pipeline, Ana**: Senderos con `Tomar`; Nomádika con `Pasar a…` (la lleva
   ella); Río Claro la lleva Mariana → sólo se ve, sin botón.
3. **Pipeline, Teresa**: todo se ve, ningún botón. Ni deshabilitado: no está.
4. **CRM, casa, sombrero Caminante**: tarjeta «Familia Ortega · Nevado de
   Toluca» abierta con `Pasar a…` (la lleva Diego); lista: Mariana. Tarjeta
   «Colegio Alameda» sin nadie, `Asignar a…`.
5. **CRM, Diego**: «Colegio Alameda» con `Tomar`; después del clic, la línea
   «Lo lleva: Diego Salas · desde hoy» y el `.verdict si`.
6. **Por contestar, casa**: una solicitud de fecha sin nadie con `Asignar a…`;
   un embajador ya tomado por Diego.
7. **Tarjeta cerrada `.cmc`** con y sin avatar, una junto a otra, para ver que
   la de nadie no trae hueco.

## Lo que NO cambia

Nada de Equipo ni de Rendimiento. Nada del tablero (columnas, arrastre,
«Pagado» automático). Nada del cajón de la operadora salvo la fila nueva.
Ningún dinero: aquí no se ven comisiones, sólo quién lleva qué.

## Entrega

Un solo archivo HTML, como Equipo. Y el **recibo**: qué componentes reusaste sin
tocar, cuáles cambiaron y qué cambió, y la lista de clases nuevas `.asg*`. Si
algo te obligó a empezar un componente de cero, dilo ahí.
