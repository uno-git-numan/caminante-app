"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getOrigin() {
  // Prefer the real request host so auth works on ANY domain
  // (caminante.numanhub.com, the vercel.app URL, localhost, future subdomains)
  // without depending on a build-time env var.
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (host) {
    const isLocal = host.includes("localhost") || host.startsWith("127.");
    const protocol = headerStore.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
    return `${protocol}://${host}`;
  }

  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  return "http://localhost:3000";
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

  const rawNext = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/caminante";
  // Solo rutas internas (el confirm valida origen de todos modos)
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/caminante";
  const origin = await getOrigin();
  const supabase = await createSupabaseServerClient();

  // emailRedirectTo lleva el DESTINO FINAL (no la URL del confirm): el template
  // del correo arma el link del confirm con {{ .TokenHash }} + {{ .SiteURL }} y
  // pasa esto como ?next=. Así el link nunca depende del matching de la allowlist.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}${next}`,
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
