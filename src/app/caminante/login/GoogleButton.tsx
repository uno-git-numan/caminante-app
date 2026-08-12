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
import { signInWithGoogle } from "@/lib/auth/actions";

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
