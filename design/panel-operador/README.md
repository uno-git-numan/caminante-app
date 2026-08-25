# El panel del operador — el mismo tablero, solo con su información

**En producción desde el 24 ago 2026.** Migración `0042` aplicada.

## El problema que resuelve

Aprobar a un operador externo lo daba de alta en `admin_whitelist`. Esa tabla no
tiene niveles: **quien está ahí es la casa**. O sea que el socio que sube a un
cerro con 11 personas quedaba con acceso a las 31 pantallas del panel:

- el ledger completo de la plataforma y la rentabilidad por salida,
- los payouts y la comisión de **los otros** operadores,
- el CRM entero de Caminante,
- y la columna **«Alergias / condiciones / dieta»** de todos los caminantes de
  todas las salidas.

Nada en el panel filtraba por operador. No había por qué: no existía el concepto.

## Tres roles

| rol | de dónde sale | qué ve |
|---|---|---|
| `admin` (la casa) | `admin_whitelist.is_active` | todo, como siempre |
| `operador` | `operators.panel_activo` (0042) | el mismo panel, podado a **sus experiencias** |
| `caminante` | cualquier sesión que no sea ninguno | nada del panel |

**La casa manda**: si el correo está en la whitelist, es casa aunque también
exista en `operators`. No es un detalle — la fila «Numan · Caminante» trae el
correo de Luis, y sin esa precedencia entraría a su propio panel filtrado a sí
mismo.

**Por qué `panel_activo` y no «existe en `operators`»**: los **embajadores**
también viven en esa tabla (se les crea la fila para atribuirles ventas) y un
embajador vende, no opera. Derivar el panel de existir le habría abierto uno a
cada embajador aprobado. La columna nace en `false`: la migración no cambió
nada para nadie hasta prenderla a mano.

## Dos cerrojos independientes

### 1 · La puerta — `lib/auth/panel-operador.ts`

Lista **blanca** de rutas, evaluada en el layout del panel contra la cabecera
`x-ruta` que pone el middleware (los layouts no reciben el pathname).

Blanca y no negra a propósito: con una lista de lo prohibido, la pantalla que
alguien agregue el mes que viene nacería visible para todos los operadores sin
que nadie lo decidiera. Así nace cerrada.

Un operador entra a: Panorama · Eventos (+ ficha) · Reservas · Personas ·
Roster · Encuesta · Comunicación · Kit · experiencias (nueva y las suyas) ·
preview / print / social.

Fuera, y por qué:

- **`/admin/recursos`** (y `/admin/dinero`, que redirige ahí) — es la cascada de
  rentabilidad: costos por salida, proveedores con nombre, egresos, el payout de
  cada operador, el cobro manual. Aunque se filtrara a sus salidas seguiría
  siendo la estructura de costos de la casa. Su dinero lo ve en Panorama.
- **`/admin/m`** (panel-app móvil) — su pestaña «Más» trae solicitudes, el
  catálogo de operadores y el cobro. Hasta que eso esté podado, el operador entra
  por el panel de escritorio. ⚠️ El índice del panel redirige al panel-app en
  teléfono; ese redirect quedó **condicionado a la casa**, si no sería un bucle:
  índice → /m → rebote → índice.
- solicitudes · operadores · payouts · facturación · proveedores · listings ·
  soporte · cobro · accesos · social-cola — administración de la plataforma.

### 2 · El alcance — `lib/auth/alcance.ts`

Se resuelve **una vez por request** desde la sesión (memoizado con `cache` de
React) y las consultas lo preguntan. No es un parámetro que alguien pueda
olvidar de pasar.

> **REGLA v1, una sola y a propósito: el alcance de un operador son SUS
> EXPERIENCIAS** (`experiences.operator_id`). De ahí cuelga todo lo demás —
> salidas, reservas, pagos, registros, encuesta, personas, kit.

La alternativa era mezclar dos criterios (experiencias para lo operativo,
`reservations.operator_id` para el dinero). Es más fino y más frágil: dos reglas
conviviendo terminan divergiendo, y aquí divergir significa enseñarle a alguien
datos que no son suyos.

⚠️ Consecuencia conocida: si una experiencia cambia de dueño, su historial se va
con ella. Cuando pase de verdad se decide; hoy no hay ni un caso.

**Dónde se aplica la poda**: justo después de traer las filas y **antes de la
primera agregación**. Por eso los ~200 renglones de cálculo de Panorama no se
tocaron — cuentan lo que haya en los arreglos. Un KPI nuevo sale filtrado sin
enterarse de que el filtro existe.

## La lección que costó dos vueltas

**Podar la consulta principal de una pantalla no basta. Hay que recorrer TODAS
las que esa pantalla dispara.**

La Encuesta dispara tres. Con las dos primeras podadas, la prueba con sesión
real de operador en el preview seguía mostrando **«Recordar deslinde a
jmartinezdv@gmail.com»** sobre volcanes: nombre y correo de un cliente de la
casa. La tercera (`fetchDeslindesPendientes`) vive en otro módulo y no aparece
en los imports que uno mira primero.

Y hay que revisar lo que la pantalla puede **disparar**, no solo lo que muestra:

- `generarLinkEncuestaSalida` recibía el `slotId` en un input oculto y solo pedía
  `isCurrentUserAdmin`. Genera el link que recoge las respuestas de una salida.
- `pendientesEncuesta()` sin `experienceId` significa «TODAS las experiencias».
  Un clic en «Reenviar a todos» le habría escrito a los clientes de Caminante
  desde el panel de un operador.

## Qué NO se abrió, y no es descuido

`isCurrentUserAdmin()` **conserva su significado exacto: «la casa»**. Eso es
deliberado: lo llaman dos docenas de server actions, y hacerle significar «puede
entrar al panel» las habría abierto TODAS de un plumazo sin que nadie revisara
ninguna. Siguen siendo de la casa:

registrar pagos · cancelar reservas · asignar operadores · mover comisiones ·
facturación · convenios · payouts · cobro manual · publicar en las redes de
Caminante · el boletín.

En Reservas, los botones de dinero se **esconden** para el operador: un botón que
rebota se lee como un panel roto, no como un permiso.

## El guardián

Novena regla en `scripts/invariantes.mjs`. **Tumba el build** si:

1. el layout del panel deja de consultar `rutaDeOperador()`,
2. el middleware deja de poner `x-ruta`,
3. alguien vuelve a meter un `upsert` a `admin_whitelist` en la aprobación de
   operadores.

## Cómo se probó

Dos sesiones vivas contra **el mismo build**, en el preview:

| | casa (`uno@`) | operador (`uno+kentro@`) |
|---|---|---|
| encabezado | «Modo admin» | «KÉNTRO» |
| Panorama | $651,650 · $384,000 · $126,500 | $0 |
| experiencias visibles | las 4 | ninguna (solo su borrador de prueba) |
| Reservas → pago manual | sí | escondido |
| recursos · solicitudes · payouts · facturación · cobro · operadores · /m | entra | rebota a `?aviso=solo_casa` |
| centinelas (hongos, Ensenada, volcanes, barranca, correos de clientes) | presentes | **cero en las 6 pantallas** |

El acceso de prueba se hizo con `generateLink({type:'magiclink'})` contra el
preview, que es como se prueba un login sin correo aquí.

## Encender y apagar

```sql
-- dar panel
update public.operators set panel_activo = true where slug = '<slug>';
-- quitarlo (sin borrar al operador ni su historial)
update public.operators set panel_activo = false where slug = '<slug>';
```

Hoy solo **Kéntro** lo tiene prendido. Su correo es `uno+kentro@numanhub.com`,
un alias de Luis: sirve para entrar y ver exactamente lo que ve un operador.

## Pendiente

- Podar el panel-app móvil (`/admin/m`) y abrirlo al operador.
- Una vista de dinero propia del operador (sus ventas y su comisión) que no sea
  la cascada de rentabilidad de la casa.
- El Kit le muestra la cuenta de Instagram conectada (la de Caminante). El handle
  es público y publicar sigue bloqueado, pero es una arista que sobra.
