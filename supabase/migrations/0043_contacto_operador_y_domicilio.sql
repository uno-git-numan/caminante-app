-- 0043 · El contacto del OPERADOR, y el domicilio del participante para el seguro.
--
-- Dos columnas, las dos aditivas y las dos nacidas del mismo día en producción.
--
-- 1 · operators.whatsapp
--     El bloque de contacto del cierre de cada página de experiencia se sembraba
--     con los datos de Caminante, fijos en el código. Mientras todas las
--     experiencias fueron nuestras eso era un default correcto. Con operadores
--     externos pasó a ser un dato falso: la página de Nomádika salió invitando a
--     escribir a uno@numanhub.com y a seguir a @somos.caminante. `operators` ya
--     tenía `email` (0016) e `instagram` (0020); faltaba el WhatsApp, que es
--     justo por donde escribe la gente.
--
-- 2 · medical_profiles.address
--     El bloque «Para tu seguro» del registro pide sexo, CURP, identificación,
--     ocupación y beneficiario. La aseguradora también pide DOMICILIO, y sin él
--     el expediente no se puede armar. Es opcional como todo el bloque: no hay
--     póliza todavía y nadie queda bloqueado por no llenarlo.
--
-- ⚠️ Dato personal. `medical_profiles` no tiene políticas de RLS y solo se lee
--    con el cliente de servicio; esta columna hereda ese trato y NO sale a
--    ninguna herramienta externa.

alter table public.operators
  add column if not exists whatsapp text;

comment on column public.operators.whatsapp is
  'WhatsApp de contacto del operador (E.164 o dígitos). Siembra el bloque de contacto de sus experiencias; sin él la página caería en el de Caminante.';

alter table public.medical_profiles
  add column if not exists address text;

comment on column public.medical_profiles.address is
  'Domicilio del participante para el expediente de la aseguradora. Opcional, como todo el bloque de seguro. Dato personal: solo cliente de servicio.';

-- 3 · operators.documentos
--     Los documentos que el operador YA tiene y trae consigo: su carta de
--     deslinde y su encuesta de satisfacción. Se capturan una vez en el
--     onboarding y sirven para TODAS sus experiencias: al dar de alta una, la
--     fusión (lib/ai/fusionar-deslinde.ts) parte de su carta en vez de pedirle
--     que la vuelva a subir.
--
--     Se guarda el documento, no solo el resultado de la fusión: sin el original
--     no se puede auditar de dónde salió cada cláusula ni rehacerla si la regla
--     cambia.
--
--     Forma: { "deslindeUrl": text, "deslindeNombre": text,
--              "encuestaUrl": text, "encuestaNombre": text }

alter table public.operators
  add column if not exists documentos jsonb;

comment on column public.operators.documentos is
  'Documentos propios del operador (su carta de deslinde, su encuesta). Alimentan la fusión con los nuestros al crear cada experiencia.';
