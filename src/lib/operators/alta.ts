"use server";

// Alta de un operador en la tabla `operators` — el paso que convierte a alguien
// en operador DE VERDAD.
//
// ⚠️ El hueco que esto cierra (encontrado el 11 ago, preparando el primer
// onboarding real): había DOS puertas de entrada y solo una daba de alta.
//
//   · Embajador (`/caminante/embajadores` → aprobar): SÍ creaba la fila.
//   · Operador (`/caminante/signup?tipo=operador` → aprobar): solo ponía
//     `admin_whitelist.is_active = true`. La persona entraba al panel… y no
//     existía como operador. Sin fila en `operators` no se le puede asignar una
//     experiencia, sus ventas no se atribuyen (`reservations.operator_id`), no
//     aparece en el payout y no tiene perfil público. O sea: acceso sin alta.
//
// Ahora las dos puertas pasan por aquí.
//
// Es IDEMPOTENTE por correo: reintentar una aprobación, o aprobar a alguien que
// ya se dio de alta a mano, no duplica. Y nunca pisa los datos de una fila que
// ya existe — un alta no debe borrar lo que alguien ya configuró.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugLibre } from "@/lib/operators/slug";

export type AltaOperadorResult =
  | { ok: true; operatorId: string; creado: boolean }
  | { ok: false; error: string };

export async function ensureOperador(input: {
  name: string;
  email: string;
  /** Queda en `notes`: de dónde salió el alta y con qué trato. */
  notes?: string;
}): Promise<AltaOperadorResult> {
  const email = (input.email || "").trim().toLowerCase();
  const name = (input.name || "").trim();
  if (!email.includes("@")) return { ok: false, error: "Correo inválido." };
  if (!name) return { ok: false, error: "Falta el nombre del operador." };

  const sb = createSupabaseAdminClient();

  const { data: existente } = await sb
    .from("operators")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existente) return { ok: true, operatorId: (existente as { id: string }).id, creado: false };

  // La dirección de su perfil público, calculada del nombre. Nace con ella: sin
  // slug el operador no tiene página, no sale en el chip «Operada por» y
  // «Publicar» lo mandaría a una URL inexistente (ver lib/operators/slug.ts).
  const slug = await slugLibre(sb, name);

  const { data: nuevo, error } = await sb
    .from("operators")
    .insert({
      name,
      email,
      slug,
      // ⚠️ NULL a propósito, no 0. Esta columna es el % que RETIENE la
      // plataforma por venta, y se pacta en el convenio, uno por uno. En 0
      // significaría «no cobramos comisión», que es una afirmación distinta a
      // «todavía no se acuerda». El panel muestra «por definir» y se niega a
      // calcular un neto mientras siga así.
      commission_pct: null,
      notes: input.notes || `Alta ${new Date().toISOString().slice(0, 10)}`,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, operatorId: (nuevo as { id: string }).id, creado: true };
}
