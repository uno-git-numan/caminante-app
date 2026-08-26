#!/usr/bin/env node
// GUARDIÁN DE INVARIANTES — corre en cada build (`prebuild`) y TUMBA el deploy
// si alguno se rompe.
//
// Por qué existe: la noche del 11 de agosto de 2026 el sitio quedó inservible
// para un usuario con la sesión caducada —la home mostraba «Application error» y
// el login contestaba «No pudimos completar el inicio de sesión» aunque el
// enlace fuera nuevo— y tardamos horas en encontrarlo porque el error solo
// aparecía con una cookie podrida, imposible de reproducir desde una sesión
// sana. La causa de fondo llevaba meses ahí: `middleware.ts` estaba en la RAÍZ
// del repo con el código en `src/`, y Next lo ignora **sin un solo warning**.
//
// Cada regla de abajo es una cicatriz. Si una falla, el mensaje dice qué se
// rompió, por qué importa y qué pasó la última vez.
//
// Correr a mano:  node scripts/invariantes.mjs
// Autoprueba:     node scripts/invariantes.mjs --autoprueba

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const leer = (rel) => (existsSync(join(raiz, rel)) ? readFileSync(join(raiz, rel), "utf8") : null);
const hay = (rel) => existsSync(join(raiz, rel));

/** @type {{nombre:string, comprueba:() => string|null}[]} */
const REGLAS = [
  {
    nombre: "El middleware vive donde Next lo lee",
    comprueba() {
      const enSrc = hay("src/middleware.ts");
      const enRaiz = hay("middleware.ts");
      const usaSrc = hay("src/app");
      if (!usaSrc) return null; // proyecto sin src/: la raíz es correcta
      if (enRaiz && !enSrc) {
        return [
          "middleware.ts está en la RAÍZ pero el código vive en src/.",
          "Next lo IGNORA sin warning: nunca corre.",
          "Consecuencia real (11 ago 2026): nadie refrescaba la cookie de sesión de",
          "Supabase, el refresh token caducó sin reemplazo y el sitio empezó a lanzar",
          "«Invalid Refresh Token» en cada página. Muévelo a src/middleware.ts.",
        ].join("\n    ");
      }
      if (enRaiz && enSrc) {
        return "Hay DOS middleware.ts (raíz y src/). Next solo lee el de src/; borra el de la raíz para que nadie edite el muerto.";
      }
      if (!enSrc) return "Falta src/middleware.ts — sin él la sesión de Supabase no se refresca nunca.";
      return null;
    },
  },
  {
    nombre: "El middleware refresca la sesión",
    comprueba() {
      const s = leer("src/middleware.ts");
      if (!s) return null; // ya lo reporta la regla anterior
      return /updateSession\s*\(/.test(s)
        ? null
        : "src/middleware.ts ya no llama a updateSession(): esa llamada es LO ÚNICO que mantiene viva la cookie de sesión en cada request.";
    },
  },
  {
    nombre: "Leer la sesión nunca puede tumbar una página",
    comprueba() {
      const faltan = ["src/lib/auth/authorization.ts", "src/lib/auth/session.ts"].filter((f) => {
        const s = leer(f);
        return !s || !s.includes("esSesionMuerta");
      });
      return faltan.length
        ? [
            `Estos archivos leen la sesión sin protegerse: ${faltan.join(", ")}.`,
            "`supabase.auth.getUser()` LANZA (no solo devuelve {error}) cuando el refresh",
            "token ya no existe. Sin atraparlo, una cookie caduca tumba TODA página que",
            "lea la sesión — que es toda /caminante, porque el layout la lee.",
            "Usa esSesionMuerta() de src/lib/auth/sesion-rota.ts y devuelve null.",
          ].join("\n    ")
        : null;
    },
  },
  {
    nombre: "Las rutas de auth ignoran la sesión que llega",
    comprueba() {
      const malos = [
        "src/app/caminante/auth/callback/route.ts",
        "src/app/caminante/auth/confirm/route.ts",
      ].filter((f) => {
        const s = leer(f);
        return !s || !s.includes("createSupabaseAuthClient") || s.includes("limpiarSesion(");
      });
      return malos.length
        ? [
            `Estas rutas no usan createSupabaseAuthClient (o volvieron a borrar cookies): ${malos.join(", ")}.`,
            "Deben IGNORAR la sesión entrante, no borrarla. Si el cliente lee una cookie con",
            "refresh token muerto, intenta refrescarla y verifyOtp/exchangeCodeForSession",
            "LANZAN: el usuario queda encerrado, ni con liga nueva entra (12 ago 2026).",
            "Borrarla no sirve: cookies().delete() afecta la respuesta, no lo que getAll() ve.",
          ].join("\n    ")
        : null;
    },
  },
  {
    nombre: "El middleware no se mete con las rutas de auth",
    comprueba() {
      const s = leer("src/middleware.ts");
      if (!s) return null;
      return /\/caminante\/auth\//.test(s)
        ? null
        : [
            "src/middleware.ts ya no excluye /caminante/auth/.",
            "Ahí no hay sesión que refrescar (esas rutas la CREAN), y al intentarlo",
            "sobre una cookie muerta el cliente limpia su almacenamiento y se lleva el",
            "code-verifier de PKCE. Google deja de poder entrar.",
          ].join("\n    ");
    },
  },
  {
    nombre: "Limpiar la sesión nunca borra el verificador de PKCE",
    comprueba() {
      const s = leer("src/lib/auth/sesion-rota.ts");
      if (!s) return "Falta src/lib/auth/sesion-rota.ts.";
      return /code-verifier/.test(s)
        ? null
        : [
            "cookiesDeSesion() ya no excluye la cookie `-code-verifier`.",
            "Se llama `sb-<ref>-auth-token-code-verifier`, o sea que CAE en el filtro",
            "de las cookies de sesión — y es lo que exchangeCodeForSession necesita para",
            "canjear el código que Google acaba de devolver. Borrarla deja el login en",
            "«No pudimos completar el inicio de sesión» (pasó el 11 ago 2026).",
          ].join("\n    ");
    },
  },
  {
    nombre: "El panel móvil es alcanzable desde el teléfono",
    comprueba() {
      const chrome = leer("src/app/caminante/SiteChrome.tsx");
      const panel = leer("src/app/caminante/admin/page.tsx");
      const mas = leer("src/app/caminante/admin/m/ui/Mas.tsx");
      if (!chrome || !panel || !mas) return null;
      const problemas = [];
      // El botón del nav debe pasar por /caminante/entrar, que es lo ÚNICO que
      // sabe decidir por rol y por dispositivo.
      if (!/href="\/caminante\/entrar"/.test(chrome)) {
        problemas.push('SiteChrome ya no manda a "/caminante/entrar": si atajas al panel, el admin en teléfono cae en la tabla de escritorio.');
      }
      // El índice del panel redirige al panel-app en teléfono.
      if (!/esTelefono/.test(panel) || !/\/caminante\/admin\/m/.test(panel)) {
        problemas.push("admin/page.tsx ya no redirige al panel-app en teléfono: el panel móvil vuelve a ser inalcanzable.");
      }
      // …y el panel-app conserva la puerta de vuelta, o el teléfono queda encerrado.
      if (!/escritorio=1/.test(mas)) {
        problemas.push("El panel-app perdió su enlace «Panel de escritorio» (?escritorio=1): desde el teléfono ya no habría forma de llegar a las secciones que solo existen en escritorio.");
      }
      return problemas.length
        ? [
            ...problemas,
            "Contexto (12 ago 2026): el panel móvil se construyó el 11 ago y NADIE lo enlazaba.",
            "Abrir el panel desde el celular daba la tabla de escritorio; Luis lo reportó dos veces.",
          ].join("\n    ")
        : null;
    },
  },
  {
    nombre: "El cliente de servidor tolera cookies de solo-lectura",
    comprueba() {
      const s = leer("src/lib/supabase/server.ts");
      if (!s) return "Falta src/lib/supabase/server.ts.";
      // El setAll debe ir envuelto: en un Server Component las cookies son
      // de solo lectura y sin el try/catch cada usuario logueado veía un 500.
      return /setAll\s*\([\s\S]{0,400}?try\s*\{/.test(s)
        ? null
        : "El setAll de createSupabaseServerClient perdió su try/catch. En un Server Component las cookies son de solo lectura: sin él, TODO usuario con sesión recibe 500 (pasó el 8 jun 2026).";
    },
  },
  {
    nombre: "El panel del operador no se cae abierto",
    comprueba() {
      const layout = leer("src/app/caminante/admin/layout.tsx");
      const lista = leer("src/lib/auth/panel-operador.ts");
      const mw = leer("src/middleware.ts");
      const aprobar = leer("src/lib/admin/operadores-app-actions.ts");

      if (!lista) return "Falta src/lib/auth/panel-operador.ts: es la lista blanca de las pantallas que ve un operador externo. Sin ella no hay quien niegue por omisión.";
      if (!layout || !/rutaDeOperador/.test(layout))
        return "El layout de /caminante/admin dejó de consultar rutaDeOperador(). Sin esa comprobación, un operador externo entra a TODAS las pantallas del panel: el ledger, el CRM y la columna «Alergias / condiciones / dieta» de todos los caminantes.";
      if (!mw || !/x-ruta/.test(mw))
        return "El middleware dejó de poner la cabecera `x-ruta`. Los layouts no reciben el pathname, así que sin ella la lista blanca del panel no puede evaluarse y toda pantalla nueva nacería abierta al operador.";
      if (aprobar && /admin_whitelist/.test(aprobar.replace(/\/\/[^\n]*/g, "")))
        return "aprobarOperadorApp volvió a tocar `admin_whitelist`. Esa tabla no tiene niveles: quien está ahí es LA CASA. Ese upsert era exactamente el agujero que abría las 31 pantallas a un operador externo (24 ago 2026).";
      return null;
    },
  },
  {
    nombre: "El destino por rol vive en un solo lugar",
    comprueba() {
      if (!hay("src/lib/auth/destino.ts"))
        return "Falta src/lib/auth/destino.ts: es el único lugar donde se decide a dónde va cada rol después de autenticarse.";
      // El patrón que causó el incidente: ramificar el destino a mano, con solo
      // dos roles en mente. Se busca en las cinco puertas que lo tenían copiado.
      const puertas = [
        "src/app/caminante/entrar/route.ts",
        "src/app/caminante/login/page.tsx",
        "src/app/caminante/auth/callback/route.ts",
        "src/app/caminante/auth/confirm/route.ts",
        "src/lib/auth/actions.ts",
      ];
      for (const f of puertas) {
        const s = leer(f);
        if (!s) continue;
        if (/role\s*===\s*"admin"\s*\?/.test(s) || /rol\s*===\s*"admin"\s*\?/.test(s))
          return `${f} volvió a decidir el destino a mano con un ternario de dos roles. Eso dejó a una operadora real dando vueltas entre Google y la pantalla de login el 25 ago 2026: no entraba en ningún caso y caía al login, una y otra vez, sin un solo error. Usa destinoPorRol() de lib/auth/destino.ts.`;
        if (!/destinoPorRol/.test(s))
          return `${f} decide a dónde mandar a alguien recién autenticado y ya no llama a destinoPorRol(). Si esa puerta se olvida de un rol, ese rol se queda fuera en silencio.`;
      }
      return null;
    },
  },
  {
    nombre: "Fusionar un deslinde nunca quita cobertura",
    comprueba() {
      const f = "src/lib/ai/fusionar-deslinde.ts";
      const s = leer(f);
      if (!s) return `Falta ${f}: es donde vive la regla de fusión del deslinde del operador.`;
      // La regla del negocio es que la fusión es una UNIÓN: el documento
      // resultante no puede cubrir menos que ninguno de los dos que entraron.
      // Un modelo que "consolida" viñetas para acortar la lista produce un
      // deslinde más corto —y más débil— sin que nadie lo note, porque el
      // resultado se ve perfectamente razonable. El candado numérico es la
      // única parte que no depende de que el modelo se porte bien.
      if (!/clausulas\.length\s*<\s*args\.clausulasActuales\.length/.test(s))
        return `${f} perdió el candado que rechaza una fusión con MENOS cláusulas de las que entraron. Sin él, un deslinde puede salir más débil que el que ya estaba y nadie se entera: la lista sigue leyéndose bien.`;
      // Y el lector único: si alguien vuelve a tratar las cláusulas como
      // cadenas sueltas, se pierde qué es obligatorio y de quién es cada una.
      if (!hay("src/lib/legal/clausulas.ts"))
        return "Falta src/lib/legal/clausulas.ts: es el único lector de las cláusulas (cadenas legadas y objetos). Con dos normalizadores las dos formas se separan.";
      return null;
    },
  },
];

// ── Autoprueba: comprobar que las reglas SÍ detectan lo que dicen detectar ────
// Sin esto un guardián puede quedarse callado para siempre y nadie se entera.
function autoprueba() {
  const casos = [
    {
      que: "middleware en la raíz con src/",
      regla: "El middleware vive donde Next lo lee",
      simula: { "src/app": true, "middleware.ts": true, "src/middleware.ts": false },
      debeFallar: true,
    },
    {
      que: "middleware correcto en src/",
      regla: "El middleware vive donde Next lo lee",
      simula: { "src/app": true, "middleware.ts": false, "src/middleware.ts": true },
      debeFallar: false,
    },
  ];

  // Se re-implementa la lógica de la regla contra el mapa simulado: probamos la
  // DECISIÓN, no el sistema de archivos.
  const decidir = (m) => {
    if (!m["src/app"]) return null;
    if (m["middleware.ts"] && !m["src/middleware.ts"]) return "raíz";
    if (m["middleware.ts"] && m["src/middleware.ts"]) return "duplicado";
    if (!m["src/middleware.ts"]) return "falta";
    return null;
  };

  let fallos = 0;
  for (const c of casos) {
    const fallo = decidir(c.simula) !== null;
    const ok = fallo === c.debeFallar;
    console.log(`  ${ok ? "ok" : "FALLA"}  ${c.que} → ${fallo ? "detecta" : "pasa"}`);
    if (!ok) fallos++;
  }
  return fallos;
}

// ── Correr ────────────────────────────────────────────────────────────────────
if (process.argv.includes("--autoprueba")) {
  console.log("Autoprueba de las reglas:");
  process.exit(autoprueba() === 0 ? 0 : 1);
}

let rotas = 0;
for (const r of REGLAS) {
  const problema = r.comprueba();
  if (problema) {
    rotas++;
    console.error(`\n  ✗ ${r.nombre}\n    ${problema}`);
  }
}

if (rotas) {
  console.error(
    `\n${rotas} invariante(s) roto(s). El build se detiene a propósito: cada una de estas` +
      `\nreglas existe porque su ausencia ya rompió el sitio en producción.\n`,
  );
  process.exit(1);
}
console.log(`Invariantes: ${REGLAS.length}/${REGLAS.length} en orden.`);
