---
paths:
  - "supabase/**"
  - "src/lib/supabase/**"
---

# Migraciones y base de datos

## Las tres reglas

**1 · Solo aditivas, y las aplica Luis a mano en el SQL Editor con su visto bueno.**
No hay CLI. Un `drop column` no es reversible y necesita autorización explícita,
aparte.

**2 · Los archivos de migración ≠ el estado real de la base.** Verifica siempre
contra la base antes de afirmar. Caso vivo: antes del `0007` la base solo tenía
**4 tablas**; todo el marketplace del `0001` (profiles, trips, bookings…) existe
solo en el código y **nunca se aplicó**. Y la `0035` llevaba días escrita sin
correr — el funnel de operadores estaba muerto y nadie lo sabía.

**3 · Antes de darle Run, compara el hash.** Lo que se pega en el editor se compara
por SHA-256 contra el archivo en disco. Si no empatan, no se corre.

```
shasum -a 256 supabase/migrations/00XX_nombre.sql
# en el editor:
# crypto.subtle.digest('SHA-256', new TextEncoder().encode(monaco.editor.getModels()[0].getValue()))
```

⚠️ **Esto ya cazó dos errores reales.** En la `0035` el pegado corrompió un carácter
(`timestamptf` en vez de `timestamptz`). En la `0038` faltaban 9 bytes porque se
colapsó la alineación de una línea. El typo ruidoso es el afortunado; el peligro es
el que **sí es SQL válido** — un `0.1` que llega como `0.01`, un `and` que llega
como `or`. Eso corre sin quejarse y queda mal en la base.

## Aplicarlas por el navegador

El **SQL Editor de Supabase no renderiza si la pestaña está en segundo plano**
(Monaco no hidrata). Truco: traer la pestaña al frente, luego inyectar con
`monaco.editor.getModels()[0].setValue(...)`. **Verificar SIEMPRE el resultado por
PostgREST**, no por lo que diga la pantalla.

Supabase pide su propia confirmación cuando detecta operaciones destructivas.

## Convenciones

- **RLS prendida SIN policies** en las tablas que solo toca el service-role. Nadie
  llega por PostgREST anónimo; la app entra por server action.
- **Si una condición sostiene el dinero, va en el `comment on column`**, no solo en
  el código. Quien consulta la tabla no abre el repo. Ejemplos vivos:
  `operator_payables.origen` y `operators.commission_pct`.
- **Lo obsoleto se elimina en el mismo ciclo, migrando antes sus datos.** No se
  quiere dos sistemas conviviendo.

## Trampas conocidas

- **`registrations` es APPEND-ONLY**: un trigger bloquea UPDATE/DELETE incluso al
  service-role. Corregir un dato = editar `medical_profiles` y, si importa
  legalmente, re-firmar con nueva `waiverVersion`. Borrar filas de prueba exige
  `disable trigger … enable` en transacción — **acción sensible que ejecuta Luis**.
- **`contacts.mailing_unsubscribed_at` es sagrada**: nada la reactiva salvo el
  propio usuario en su perfil. El módulo de boletín solo la LEE para excluir.
- **`experience_slots.capacity_total` NULL = salida SIN TOPE**, no cero.
- **`reservations.channel`** solo admite `web|whatsapp|email|admin` (check de la
  0007). La forma de pago vive en `payments.method`, que es su lugar.
- El worktree necesita el symlink del entorno o `createSupabaseAdminClient` truena
  con ZodError: `ln -sf ~/dev/caminante-m1/.env.local <worktree>/`.

## Hitos aplicados que conviene conocer

`0007` CRM/reservas · `0008` deslinde y perfil médico · `0016` operadores y
atribución congelada · `0017` participantes · `0018` salidas privadas ·
`0028` boletín · `0030` branding de operador · `0034` transferencias ·
`0035` aplicaciones de operador · `0036` Connect · `0037` borra la comisión
duplicada · `0038` un solo hogar fiscal + CSD de dos archivos.
