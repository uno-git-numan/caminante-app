-- 0024 · Cupo honesto (P7 automática)
--
-- El cron `/caminante/api/cron/cupo-honesto` detecta salidas PÚBLICAS y ABIERTAS
-- de experiencias PUBLICADAS cuyo cupo restante cae a ≤5 y avisa a Luis/Roberta
-- para que publiquen la story P7 «Quedan N lugares». Estas dos columnas evitan
-- el aviso repetido: se guarda el último "quedan N" avisado por salida.
--
--   cupo_alert_available  = último cupo restante avisado (N). NULL = nunca avisado / re-armado.
--   cupo_alert_at         = cuándo se avisó por última vez.
--
-- Regla de reenvío (en el cron): avisar cuando available ∈ (0, umbral] Y
-- (cupo_alert_available IS NULL  OR  available < cupo_alert_available)
--   → así solo se reavisa cuando BAJA (5 → 3 → 1), nunca el mismo número dos veces.
-- Si el cupo vuelve a subir por encima del umbral (se reabren lugares / sube el tope),
-- el cron RE-ARMA poniendo cupo_alert_available = NULL para que un futuro descenso avise de nuevo.

alter table experience_slots
  add column if not exists cupo_alert_available int,
  add column if not exists cupo_alert_at timestamptz;
