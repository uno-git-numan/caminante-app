"use client";

// "Continuar con Google".
//
// ⚠️ Por qué es un componente de cliente y no un `<form action={serverAction}>`:
// la acción arranca el OAuth en el servidor (para que el code_verifier PKCE
// quede en una cookie que el callback sí ve) pero **la navegación a Google la
// hace el navegador**. Cuando la acción terminaba en `redirect(urlDeGoogle)`,
// Next le pasaba ese redirect al router del cliente, que no puede seguir una URL
// de otro origen: el POST respondía 303, el navegador lo abortaba y la página se
// quedaba idéntica. Reportado desde un iPhone el 11 ago: «le pico al botón, algo
// carga, y ahí queda» — nunca llegaba a Google. `location.assign` sí es una
// navegación dura del documento, que es lo que un OAuth necesita.

import { useState } from "react";
import { signInWithApple, signInWithGoogle } from "@/lib/auth/actions";

export default function GoogleButton({ next = "/caminante" }: { next?: string }) {
  const [yendo, setYendo] = useState(false);
  const [error, setError] = useState("");

  async function ir() {
    setYendo(true);
    setError("");
    const fd = new FormData();
    fd.set("next", next);
    try {
      const r = await signInWithGoogle(fd);
      if ("url" in r) {
        window.location.assign(r.url);
        return; // nos vamos del sitio: el botón se queda en «Abriendo Google…»
      }
      setError(r.error);
    } catch {
      setError("No se pudo abrir Google. Intenta con tu correo.");
    }
    setYendo(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={ir}
        disabled={yendo}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-sand bg-white px-4 py-3 text-sm font-semibold text-lagoon transition hover:border-dune disabled:opacity-70"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
          />
        </svg>
        {yendo ? "Abriendo Google…" : "Continuar con Google"}
      </button>
      {error ? (
        <p className="mt-2 text-center text-xs text-orange" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * «Continuar con Apple» — mismo mecanismo. Sólo se dibuja cuando
 * `NEXT_PUBLIC_AUTH_APPLE=1`: el proveedor hay que darlo de alta en Supabase con
 * la cuenta de Apple Developer de Luis (Services ID, Team ID, Key ID y la llave
 * .p8). Un botón sin proveedor detrás es un control muerto.
 */
export function AppleButton({ next = "/caminante" }: { next?: string }) {
  const [yendo, setYendo] = useState(false);
  const [error, setError] = useState("");

  async function ir() {
    setYendo(true);
    setError("");
    const fd = new FormData();
    fd.set("next", next);
    try {
      const r = await signInWithApple(fd);
      if ("url" in r) {
        window.location.assign(r.url);
        return;
      }
      setError(r.error);
    } catch {
      setError("No se pudo abrir Apple. Intenta con tu correo.");
    }
    setYendo(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={ir}
        disabled={yendo}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-lagoon px-4 py-3 text-sm font-semibold text-cream transition hover:bg-dune disabled:opacity-70"
      >
        <svg width="16" height="18" viewBox="0 0 16 19" aria-hidden="true" fill="currentColor">
          <path d="M13.3 10.1c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.5-.2-2.8.8-3.6.8-.7 0-1.9-.8-3.1-.8C3.6 4.7 2 5.6 1.1 7.1c-1.8 3.2-.5 7.9 1.3 10.5.9 1.3 1.9 2.7 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.3-1.3 3.1-2.6 1-1.5 1.4-2.9 1.4-3-.1 0-2.4-1-2.4-3.5zM11 3.1c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" />
        </svg>
        {yendo ? "Abriendo Apple…" : "Continuar con Apple"}
      </button>
      {error ? (
        <p className="mt-2 text-center text-xs text-orange" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
