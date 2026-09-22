"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";

function val(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

async function requireAdminOrRedirect() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/caminante?error=not_admin");
  }
}

export async function createProviderAction(formData: FormData) {
  await requireAdminOrRedirect();

  const legalName = val(formData, "legal_name");
  const displayName = val(formData, "display_name");
  const countryCode = val(formData, "country_code") || "MX";

  if (!legalName || !displayName) {
    redirect("/caminante/admin/providers?error=missing_fields");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("providers").insert({
    legal_name: legalName,
    display_name: displayName,
    country_code: countryCode,
    api_mode: "portal",
    approval_state: "approved",
  });

  if (error) {
    redirect(`/caminante/admin/providers?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/caminante/admin/providers?created=1");
}
