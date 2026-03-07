import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function isCurrentUserAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return false;
  }

  const { data, error } = await supabase
    .from("admin_whitelist")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}
