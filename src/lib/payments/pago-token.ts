// EL TOKEN DE LA PÁGINA DE PAGO — `reservations.pago_token` (0074).
//
// Un link de pago (el especial con descuento, el cobro por WhatsApp) ya no
// manda a Stripe a secas: manda a /caminante/pago/<token>, una página de
// Caminante que explica qué se paga y, al tocar «Pagar», crea la Checkout
// Session y lleva a Stripe. Al volver, la pantalla de éxito de siempre con
// «Firmar mi deslinde». Luis, 3 nov 2026: «hoy sólo es Stripe, y el usuario se
// pierde, no sabe cómo regresar a firmar».
//
// Sin "server-only" a propósito: lo importan actions y loaders; el token es un
// string opaco y la URL pública no es secreto.

import { randomBytes } from "node:crypto";

export const SITE = "https://caminante.numanhub.com";

export const nuevoPagoToken = (): string => randomBytes(16).toString("base64url");

export const urlDePago = (token: string): string => `${SITE}/caminante/pago/${token}`;

/** Lo que viene en la URL: base64url de 16 bytes (22 chars). Nada más pasa. */
export const cleanPagoToken = (raw: unknown): string | null => {
  const t = typeof raw === "string" ? raw.trim() : "";
  return /^[A-Za-z0-9_-]{16,40}$/.test(t) ? t : null;
};
