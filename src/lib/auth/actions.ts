"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getOrigin() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

function parseEmail(formData: FormData) {
  const raw = formData.get("email");
  if (typeof raw !== "string") {
    return null;
  }

  const email = raw.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return null;
  }

  return email;
}

export async function sendMagicLink(formData: FormData) {
  const email = parseEmail(formData);
  if (!email) {
    redirect("/caminante/login?error=invalid_email");
  }

  const next = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/caminante";
  const origin = await getOrigin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/caminante/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(`/caminante/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/caminante/login?sent=1&email=${encodeURIComponent(email)}`);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/caminante");
}

export async function signInWithGoogle(formData: FormData) {
  const next = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/caminante";
  const origin = await getOrigin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/caminante/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect(`/caminante/login?error=${encodeURIComponent(error?.message ?? "oauth_error")}`);
  }

  redirect(data.url);
}

export async function signInWithApple(formData: FormData) {
  const next = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/caminante";
  const origin = await getOrigin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo: `${origin}/caminante/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect(`/caminante/login?error=${encodeURIComponent(error?.message ?? "oauth_error")}`);
  }

  redirect(data.url);
}

export async function signInWithPasswordAction(formData: FormData) {
  const email = parseEmail(formData);
  if (!email) {
    redirect("/caminante/login?mode=password&error=Email+inválido");
  }

  const password = formData.get("password");
  if (typeof password !== "string" || password.length < 6) {
    redirect("/caminante/login?mode=password&error=Contraseña+inválida");
  }

  const next = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/caminante";
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/caminante/login?mode=password&error=${encodeURIComponent(error.message)}`);
  }

  redirect(next);
}

export async function signUpWithPasswordAction(formData: FormData) {
  const email = parseEmail(formData);
  if (!email) {
    redirect("/caminante/signup?mode=password&error=Email+inválido");
  }

  const password = formData.get("password");
  if (typeof password !== "string" || password.length < 6) {
    redirect("/caminante/signup?mode=password&error=La+contraseña+debe+tener+al+menos+6+caracteres");
  }

  const next = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/caminante";
  const origin = await getOrigin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/caminante/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(`/caminante/signup?mode=password&error=${encodeURIComponent(error.message)}`);
  }

  if (data.session) {
    redirect(next);
  }

  redirect(`/caminante/login?sent=1&email=${encodeURIComponent(email)}`);
}
