// PRUEBAS UNITARIAS — lo puro se prueba sin base, sin Stripe y sin sesión.
//
// Hasta el 22 sep 2026 el repo no tenía una sola prueba automatizada: el único
// guardián era `scripts/invariantes.mjs`, que vigila la FORMA del código (que
// un gate esté en sus tres puertas, que una constante no pase de 20%) pero no
// su ARITMÉTICA. La comisión de $301.72 sobre $1,750, el piso de $250, el cupo
// que se deriva de un solo campo — nada de eso tenía quien lo afirmara.
//
// Aquí van los módulos que no tocan el mundo: comisión, cupo, contrato de la
// copia, gate de Connect, marca, flujo de venta y las reglas del convenio. Los
// que abren Supabase se prueban con el cliente inyectado o simulado.
//
// `server-only` se resuelve a un módulo vacío: en Next es un centinela que
// revienta si un componente cliente importa un módulo de servidor. Aquí no hay
// cliente ni servidor, sólo funciones.
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": `${raiz}src`,
      "server-only": `${raiz}tests/unit/_shims/server-only.ts`,
    },
  },
  test: {
    // `tests/e2e/` entra en la misma corrida pero sus pruebas se saltan solas
    // si no está `PROBAR_CONNECT=1` con una llave de prueba: cobran de verdad
    // contra Stripe. Se prenden a mano, nunca en CI por accidente.
    include: ["tests/unit/**/*.test.ts", "tests/e2e/**/*.test.ts"],
    environment: "node",
    // Sin reloj real: las pruebas de vigencia pasan `hoy` explícito. Si alguna
    // dependiera de la fecha de la máquina, fallaría un día y nadie sabría por qué.
    clearMocks: true,
  },
});
