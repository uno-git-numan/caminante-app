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

import { readFileSync, existsSync, readdirSync } from "node:fs";
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
  {
    nombre: "La vista previa del registro dice lo que el formulario pide",
    comprueba() {
      const est = leer("src/lib/registration/estructura.ts");
      const form = leer("src/app/caminante/registro/[slug]/RegistrationForm.tsx");
      if (!est) return "Falta src/lib/registration/estructura.ts: es la única definición del formulario de registro, y de ahí se dibuja la vista previa del panel.";
      if (!form) return "No encuentro RegistrationForm.tsx para comparar contra la estructura del registro.";

      // Los campos declarados (menos los que no son <input> con label propio).
      const declarados = new Set();
      for (const m of est.matchAll(/\{\s*id:\s*"([^"]+)"\s*,\s*label:\s*"[^"]*"\s*(,\s*sinInput:\s*true\s*)?\}/g)) {
        if (!m[2]) declarados.add(m[1]);
      }
      // Los que el formulario REALMENTE pide.
      const reales = new Set([...form.matchAll(/htmlFor="([^"]+)"/g)].map((m) => m[1]));

      const faltanEnEstructura = [...reales].filter((id) => !declarados.has(id));
      if (faltanEnEstructura.length)
        return `El formulario de registro pide campos que la estructura no declara: ${faltanEnEstructura.join(", ")}. La vista previa del panel se dibuja de la estructura, así que ese campo existiría en vivo sin aparecer en la revisión — que es exactamente cómo se anunció un bloque «Para tu seguro» que no existía. Agrégalos en src/lib/registration/estructura.ts.`;

      const faltanEnForm = [...declarados].filter((id) => !reales.has(id));
      if (faltanEnForm.length)
        return `La estructura del registro declara campos que el formulario ya no pide: ${faltanEnForm.join(", ")}. La vista previa los estaría prometiendo al viajero. Quítalos de src/lib/registration/estructura.ts o vuelve a ponerlos en el formulario.`;

      // Y que nadie vuelva a escribir los números a mano.
      if (/<SecHead num="\d/.test(form))
        return "RegistrationForm.tsx volvió a numerar una sección a mano. Con el bloque de seguro prendido o apagado la numeración cambia, y tres superficies dependen de ella: usa seccion(conSeguro, id) de lib/registration/estructura.ts.";
      return null;
    },
  },
  {
    nombre: "Ningún componente cliente alcanza el servidor",
    comprueba() {
      // Se sigue la cadena de imports @/… desde cada archivo con "use client".
      // Si alguno llega a next/headers, el build de Next falla con un mensaje
      // que NO nombra al componente culpable, solo al módulo del fondo.
      const src = join(raiz, "src");
      if (!existsSync(src)) return null;

      const archivos = [];
      (function barrer(d) {
        for (const e of readdirSync(d, { withFileTypes: true })) {
          const f = join(d, e.name);
          if (e.isDirectory()) barrer(f);
          else if (/\.(ts|tsx)$/.test(e.name)) archivos.push(f);
        }
      })(src);

      const rel = (f) => f.slice(raiz.length + 1);
      const resolver = (espec) => {
        const base = join(src, espec.slice(2));
        for (const cand of [base + ".ts", base + ".tsx", join(base, "index.ts")])
          if (existsSync(cand)) return cand;
        return null;
      };

      // `import type {…}` se borra al compilar: no arrastra nada.
      const importsDe = (txt) =>
        [...txt.matchAll(/^\s*import\s+(?!type\s)(?:[^"';]*?\sfrom\s+)?["'](@\/[^"']+)["']/gm)].map((m) => m[1]);

      const cache = new Map();
      const alcanza = (f, visto) => {
        if (cache.has(f)) return cache.get(f);
        if (visto.has(f)) return null;
        visto.add(f);
        const txt = readFileSync(f, "utf8");
        // Un módulo "use server" es una FRONTERA legítima: el cliente importa
        // la referencia a la acción, no su cuerpo, y nada de lo que hay dentro
        // llega al bundle. Cruzarla es correcto y no se marca.
        if (/^\s*["']use server["']/m.test(txt)) return null;
        // Dos barreras, el mismo síntoma: el build revienta nombrando el
        // módulo del fondo y nunca al componente que lo arrastró.
        if (/from\s+["']next\/headers["']/.test(txt)) return [rel(f) + " (next/headers)"];
        if (/^\s*import\s+["']server-only["']/m.test(txt)) return [rel(f) + " (server-only)"];
        for (const espec of importsDe(txt)) {
          const destino = resolver(espec);
          if (!destino) continue;
          const cadena = alcanza(destino, visto);
          if (cadena) { const r = [rel(f), ...cadena]; cache.set(f, r); return r; }
        }
        cache.set(f, null);
        return null;
      };

      for (const f of archivos) {
        const txt = readFileSync(f, "utf8");
        if (!/^\s*["']use client["']/m.test(txt)) continue;
        for (const espec of importsDe(txt)) {
          const destino = resolver(espec);
          if (!destino) continue;
          const cadena = alcanza(destino, new Set([f]));
          if (cadena)
            return [
              `${rel(f)} es un componente CLIENTE y llega al servidor: ${[rel(f), ...cadena].join(" → ")}.`,
              "Next tumba el build con «You're importing a component that needs …»,",
              "y el mensaje nombra solo el módulo del fondo, nunca al componente culpable.",
              "",
              "Pasó dos veces con lo mismo: una función pura —formatMXN, iniciales— viviendo",
              "en lib/admin/queries.ts, que llega hasta next/headers por la cadena del alcance.",
              "La salida NO es copiar la función al componente: es moverla a un módulo sin",
              "servidor, como lib/admin/formato.ts. Un `import type` sí viaja gratis.",
              "",
              "Tercera vez, ahora con server-only: volver cliente el Pipeline para que sus",
              "tarjetas abrieran el cajón arrastró lib/plataforma/operadoras.ts, que abre",
              "Supabase con la llave de servicio. Las etapas —constantes puras— se fueron a",
              "lib/plataforma/etapas.ts y operadoras.ts las reexporta.",
              "",
              "⚠️ tsc --noEmit pasa limpio en este caso. No ve la frontera servidor/cliente.",
            ].join("\n");
        }
      }
      return null;
    },
  },
  {
    nombre: "Ninguna pantalla del panel lleva el chrome del sitio público",
    comprueba() {
      const chrome = leer("src/app/caminante/SiteChrome.tsx");
      if (!chrome) return null;
      // La regla tiene que ser UNA, sobre el prefijo entero del panel. Si vuelve
      // a haber rutas de admin listadas una por una, la lista se va a quedar
      // corta otra vez.
      const generica = /pathname\.startsWith\(\s*["']\/caminante\/admin["']\s*\)/.test(chrome);
      const sueltas = [...chrome.matchAll(/pathname\.startsWith\(\s*["']\/caminante\/admin\/[^"']+["']\s*\)/g)]
        .map((m) => m[0]);
      if (!generica) {
        return [
          "SiteChrome ya no manda a inmersivo a todo /caminante/admin.",
          "Sin esa regla, las pantallas del panel salen con el encabezado del",
          "sitio público montado encima de su propio shell: dos navegaciones,",
          "dos logos, el usuario sin saber en cuál está.",
          "",
          "Pasó con una LISTA BLANCA ruta por ruta: nombraba 14 de 27 pantallas",
          "y las otras 13 se habían olvidado. Comunidad y Solicitudes salieron",
          "así a producción. La regla va sobre el prefijo, no por pantalla.",
        ].join("\n");
      }
      if (sueltas.length) {
        return [
          `SiteChrome volvió a listar rutas de admin una por una: ${sueltas.length}.`,
          "Sobran: /caminante/admin ya está cubierto por la regla general, y una",
          "lista paralela invita a que la siguiente pantalla se quede fuera.",
        ].join("\n");
      }
      return null;
    },
  },
  {
    nombre: "Ningún backtick dentro del CSS del panel",
    comprueba() {
      const css = leer("src/app/caminante/admin/ui/admin-css.ts");
      if (!css) return null;
      const abre = css.indexOf("= `");
      const cierra = css.lastIndexOf("`;");
      if (abre === -1 || cierra <= abre) return null;
      const cuerpo = css.slice(abre + 3, cierra);
      const n = (cuerpo.match(/`/g) || []).length;
      if (!n) return null;
      const linea = css.slice(0, abre + 3 + cuerpo.indexOf("`")).split("\n").length;
      return [
        `admin-css.ts tiene ${n} backtick(s) dentro del template literal (cerca de la línea ${linea}).`,
        "Cierran la cadena a media hoja y el build truena con «',' expected» en un",
        "punto que no dice nada del error real.",
        "",
        "Ya pasó TRES veces, siempre en un comentario que citaba una clase o una",
        "propiedad. En prosa no hacen falta: escribe .cmboard sin adornos.",
      ].join("\n");
    },
  },
  {
    nombre: "Esperar a Supabase nunca puede tumbar el sitio",
    comprueba() {
      const src = leer("src/lib/supabase/middleware.ts");
      if (!src) return null;
      // `getUser()` es la única espera del middleware, y el middleware corre en
      // CADA request. Si no está acotada, la latencia de un tercero se convierte
      // en 504 para todo el mundo.
      const acotada = /conLimite\s*\(\s*supabase\.auth\.getUser\(\)/.test(src);
      const suelta = /await\s+supabase\.auth\.getUser\(\)/.test(src);
      if (acotada && !suelta) return null;
      return [
        "El middleware espera a `supabase.auth.getUser()` sin límite de tiempo.",
        "",
        "Refrescar la cookie es una MEJORA, no un requisito: si no se logra, la",
        "página se sirve igual y la siguiente request lo reintenta. Pero como esto",
        "corre en cada request, una espera sin reloj convierte la lentitud de",
        "Supabase en un 504 MIDDLEWARE_INVOCATION_TIMEOUT del sitio ENTERO.",
        "",
        "Pasó el 28 de agosto de 2026: Supabase declaró «API Gateway: degraded",
        "performance» y todo el que tenía sesión —incluida la home pública— vio",
        "504 durante el incidente. Un visitante anónimo entraba perfecto y Luis no",
        "podía abrir su propio panel. La caída era de ellos; que se llevara el",
        "sitio puesto era nuestro.",
        "",
        "Envuélvelo en `conLimite(...)`. Y si se acaba el tiempo NO borres las",
        "cookies: lento no es lo mismo que muerto.",
      ].join("\n");
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
