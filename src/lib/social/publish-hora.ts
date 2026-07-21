// Hora REAL a la que el robot publica, para MOSTRAR (no para programar).
//
// El cron de publicación corre 1×/día a las 19:00 UTC = 13:00 CDMX. Las piezas
// programadas guardan `scheduled_at` normalizado a 08:00 UTC (≈02:00 CDMX) SOLO
// para marcar el DÍA que les toca (ver `atPublishHour` en campana.ts) — esa hora
// NO es cuándo se publican. Mostrar la hora guardada engaña: Luis vio "2:00 a.m."
// en la cola y dudó de si algo había fallado, cuando el post salió ~1:00 p.m.
// como siempre. Por eso al desplegar una PROGRAMADA usamos esta hora del cron,
// no la normalizada. (En Hobby el cron es diario → la hora es aproximada; si
// alguna vez se quiere hora exacta por pieza, es otra conversación de
// granularidad.) Las PUBLICADAS sí llevan `published_at` real → esas no usan esto.
export const HORA_PUBLICACION = "~1:00 p.m.";
export const HORA_PUBLICACION_CORTA = "~1pm"; // para el chip angosto del calendario
