-- 0004 · VACÍA A PROPÓSITO (corregida el 23 sep 2026)
--
-- Esta migración prendía RLS y escribía policies para `trip_items`,
-- `participants` y la `payments` vieja: las tres del marketplace que la 0001
-- describía y que producción nunca tuvo. Sobre una base limpia reventaba, y
-- sobre producción nunca corrió.
--
-- El modelo de acceso que sí rige hoy es el contrario y vive en la 0007 en
-- adelante: RLS prendida SIN policies, todo por service-role desde server
-- actions. Ver `.claude/rules/migraciones.md`.
--
-- Se conserva el archivo con su número para no mover la numeración de las
-- cincuenta y siete que vienen después.

select 1;
