-- 0042 · EL INTERRUPTOR DEL PANEL DEL OPERADOR
--
-- Contexto: hasta hoy, aprobar a un operador externo lo daba de alta en
-- `admin_whitelist`, que es una lista PLANA — quien está ahí es la casa. O sea
-- que el socio que sube a un cerro con 11 personas quedaba con acceso al ledger
-- completo, al CRM, a los payouts de los demás operadores y a la columna
-- «Alergias / condiciones / dieta» de todos los caminantes de todas las salidas.
--
-- Ahora existe un tercer rol («operador») que entra al mismo panel podado a sus
-- experiencias. Falta decir QUIÉN lo tiene, y no puede derivarse de existir en
-- `operators`: los EMBAJADORES también viven en esa tabla —`approveEmbajador`
-- les crea su fila para atribuirles ventas— y un embajador vende, no opera. Sin
-- una columna propia, aprobar a un embajador le abriría un panel que nadie
-- quiso darle.
--
-- Por eso una columna explícita. `default false` a propósito: la migración no
-- cambia nada para nadie hasta que alguien prenda el interruptor a mano.
--
-- Aditiva. No borra, no renombra, no toca datos existentes salvo el UPDATE
-- final, que es una sola fila y está nombrada.

alter table public.operators
  add column if not exists panel_activo boolean not null default false;

comment on column public.operators.panel_activo is
  'Si es true, quien inicie sesión con operators.email entra al panel PODADO a sus experiencias (rol operador). No es admin: admin es admin_whitelist. Apagarlo revoca el acceso sin borrar al operador.';

-- Índice: `alcanceActual()` resuelve el rol en CADA request del panel buscando
-- por correo. Sin índice eso es un seq scan por pantalla.
create index if not exists operators_email_panel_idx
  on public.operators (email)
  where panel_activo;

-- Kéntro es el operador piloto y su correo es un alias de Luis
-- (uno+kentro@numanhub.com), así que prenderlo sirve para DOS cosas: dejarlo
-- listo para su onboarding y que Luis pueda entrar con ese alias a ver
-- exactamente lo que ve un operador, sin inventar una cuenta de prueba.
update public.operators
   set panel_activo = true
 where slug = 'kentro';
