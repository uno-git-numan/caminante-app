"use client";

// Helpers de navegador para el Meta Pixel (fbq). El código base del pixel
// (init + PageView) vive en layout.tsx; aquí solo DISPARAMOS eventos de embudo
// (ViewContent, InitiateCheckout, Lead, CompleteRegistration) desde componentes
// cliente. Purchase NO va aquí — es server-side vía CAPI (lib/meta/capi.ts).
//
// Todo con guarda: si fbq no cargó (bloqueador, aún sin hidratar) es no-op.

import { useEffect, useRef } from "react";

type FbqParams = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// Dispara un evento estándar del pixel. Best-effort: si fbq no existe, no hace nada.
export function trackPixel(event: string, params?: FbqParams): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.fbq === "function") {
      window.fbq("track", event, params ?? {});
    }
  } catch {
    // nunca romper la UI por un evento de analítica
  }
}

// Componente para inyectar un evento en páginas server-rendered (p.ej. ViewContent
// en ExperienceTemplateV2): se monta como hijo cliente y dispara UNA vez.
export function PixelEvent({ event, params }: { event: string; params?: FbqParams }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackPixel(event, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
