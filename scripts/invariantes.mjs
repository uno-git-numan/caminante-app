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
    nombre: "Los candados de venta viven en una sola puerta",
    comprueba() {
      // Publicar desde el formulario, publicar desde el tablero y cobrar son
      // TRES puertas hacia lo mismo. Cada una preguntaba por su cuenta qué
      // candados aplicaban, y así se separaron sin que nadie lo decidiera:
      // el candado por actividad estaba en las dos de publicar y NO en la
      // caja, y `operadorListo` prometía en su encabezado estar en las tres y
      // no estaba en ninguna. `correr-entre-volcanes` vendió con el expediente
      // de senderismo incompleto porque nadie preguntó al cobrar (22 sep 2026,
      // design/mvp/MVP.md §5.2).
      //
      // Desde entonces las cuatro puertas (las dos de publicar, la caja, y la
      // página de reservar que avisa antes del submit) llaman SOLO a
      // `candadosDe` (lib/experiences/candados-venta.ts). Esta regla vigila que
      // ninguna vuelva a importar un candado suelto y que ninguna deje de
      // llamar a la puerta única.
      const puertas = [
        "src/lib/payments/checkout.ts",
        "src/app/caminante/reservar/[slug]/page.tsx",
        "src/lib/experiences/actions.ts",
        "src/lib/admin/eventos-actions.ts",
      ];
      const sueltos = ["deslindeListo", "listaParaPublicar", "actividadListaParaPublicar", "operadorListo"];
      if (!hay("src/lib/experiences/candados-venta.ts")) {
        return "Falta lib/experiences/candados-venta.ts, la puerta única de los candados de venta.";
      }
      for (const rel of puertas) {
        const src = leer(rel);
        if (!src) return `Falta ${rel}: es una de las puertas de venta y esta regla la vigila.`;
        if (!/\bcandadosDe\(/.test(src)) {
          return [
            `${rel} ya no llama a candadosDe().`,
            "Es una de las puertas de venta. Sin la puerta única, esa puerta",
            "vuelve a preguntar por su cuenta —o a no preguntar— y los tres",
            "candados se separan otra vez sin que nadie lo decida.",
          ].join("\n    ");
        }
        // Sólo se miran los IMPORTS: un comentario que mencione `deslindeListo`
        // no es una llamada, y una llamada sin import no compila.
        const imports = src.match(/^import[^;]*;/gm) ?? [];
        for (const imp of imports) {
          const suelto = sueltos.find((n) => new RegExp(`\\b${n}\\b`).test(imp));
          if (suelto) {
            return [
              `${rel} importa \`${suelto}\` directo.`,
              "Los candados de venta se preguntan por candadosDe() y por nada más:",
              "importar uno suelto es el primer paso para olvidar los otros dos.",
            ].join("\n    ");
          }
        }
      }
      return null;
    },
  },
  {
    nombre: "El cupo no se escribe dos veces",
    comprueba() {
      // El cupo vive en `data.capacity` y TODO lo que lo enseña lo deriva
      // (lib/experiences/cupo.ts). Esta regla vigila que el formulario y la
      // plantilla no vuelvan a ofrecer escribirlo a mano.
      //
      // Nació de esto: el 13 sep 2026, publicada y en producción, «El fondo de
      // la barranca» anunciaba «11 personas» en la tarifa y «cupo 12 personas»
      // cuatro secciones más abajo. Ninguna de las dos era la que el sistema
      // usaba para vender —`data.capacity` estaba VACÍA— así que el sitio
      // prometía un número que nadie hacía cumplir. No revienta: miente.
      const lector = "src/lib/experiences/cupo.ts";
      if (!hay(lector)) {
        return `Falta ${lector}, que es el lector único del cupo. Sin él cada pantalla vuelve a inventarse el suyo.`;
      }
      const plantilla = leer("src/app/caminante/experiencias/[slug]/ExperienceTemplateV2.tsx");
      if (plantilla && !/cupoDe\(/.test(plantilla)) {
        return [
          "La plantilla pública ya no deriva el cupo de `data.capacity`.",
          "Si el número vuelve a salir de un texto libre, la página puede prometer",
          "un cupo distinto del que el sistema deja vender — y ya pasó.",
        ].join("\n    ");
      }
      const form = leer("src/app/caminante/admin/experiencias/ExperienceForm.tsx");
      if (form && !/exp\.capacity/.test(form)) {
        return [
          "El formulario dejó de capturar `capacity`.",
          "Sin ese campo el cupo no tiene dónde vivir y vuelve al texto libre,",
          "que es exactamente de donde lo sacamos.",
        ].join("\n    ");
      }
      return null;
    },
  },
  {
    nombre: "Cuántos van se cuenta, no se lleva en un contador",
    comprueba() {
      // `experience_slots.seats_taken` era un contador que sólo movía el
      // registro —la venta self-serve nunca lo tocó— así que llevaba meses
      // desfasado: medido el 23 sep 2026, **6 de 14 salidas** con el número
      // equivocado. «Domingo 26 jul» decía 0 con 18 personas dentro. Y
      // `seats_available`, generada restándolo, heredaba la mentira.
      //
      // No revienta: MIENTE. Y no se arregla poniéndolo al día — un segundo
      // lugar donde vive el mismo hecho se desincroniza el primer día que
      // alguien escribe en uno solo. La 0065 borró las dos columnas; esta regla
      // impide que vuelvan por la puerta de atrás.
      const src = join(raiz, "src");
      if (!existsSync(src)) return null;
      const malos = [];
      (function barrer(d) {
        for (const e of readdirSync(d, { withFileTypes: true })) {
          const f = join(d, e.name);
          if (e.isDirectory()) barrer(f);
          else if (/\.(ts|tsx)$/.test(e.name)) {
            // ⚠️ SE MIRA EL CÓDIGO, NO LOS COMENTARIOS. Media docena de
            // archivos explican en prosa por qué estas columnas ya no están, y
            // esa memoria es justo lo que queremos que sobreviva: una regla que
            // la castigara empujaría a borrar la explicación.
            const codigo = readFileSync(f, "utf8")
              .replace(/\/\*[\s\S]*?\*\//g, "")
              .replace(/^\s*\/\/.*$/gm, "");
            if (/seats_(taken|available)/.test(codigo)) {
              malos.push(f.slice(raiz.length + 1));
            }
          }
        }
      })(src);
      if (malos.length) {
        return [
          `Volvió el contador de lugares en: ${malos.join(", ")}`,
          "Cuántos van se cuenta desde `reservations` (fetchSlotAvailability),",
          "que es lo que ve el viajero. Un contador aparte se desfasa el primer",
          "día que un camino escribe y el otro no — y ya pasó, en 6 de 14 salidas.",
        ].join("\n    ");
      }
      return null;
    },
  },
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
  {
    nombre: "Ninguna comisión pasa del 20%",
    comprueba() {
      const src = leer("src/lib/operadores/comision.ts");
      if (!src) return "Falta src/lib/operadores/comision.ts — es el ÚNICO lugar donde vive una tasa de comisión.";

      // Cada tramo se escribe `[8_000, 0.18]` o `[Infinity, 0.14]`.
      const tramos = [...src.matchAll(/\[\s*(?:Infinity|[\d_]+)\s*,\s*(0?\.\d+)\s*\]/g)].map((m) =>
        Number(m[1]),
      );
      if (!tramos.length) return "No se encontró ni un tramo en comision.ts: o cambió el formato de la tabla o la tabla desapareció. Revísalo a mano.";

      const TOPE = 0.2;
      const pasados = tramos.filter((t) => t > TOPE + 1e-9);
      if (pasados.length) {
        return [
          `Hay ${pasados.length} tasa(s) por encima del 20%: ${pasados.map((t) => (t * 100).toFixed(0) + "%").join(", ")}.`,
          "",
          "El tope de 20% es una decisión de Luis, no una preferencia.",
          "",
          "Ya estuvo roto entre el 18 ago y el 3 sep de 2026 sin que nadie lo viera:",
          "la tabla nació del research de mercado con 25% y 22% arriba, y cuando se",
          "fijó el tope nadie la corrigió. No se notaba porque el porcentaje siempre",
          "se miraba contra el ticket completo —una travesía de $32,197 sale en",
          "19.71% y parece que respeta el tope— y solo salió al tarifar POR OBJETO:",
          "un complemento de $6,778 caía en los dos primeros tramos y pagaba 23.33%.",
          "",
          "Si de verdad hay que subir el tope, cámbialo AQUÍ y en comision.ts a la vez.",
        ].join("\n");
      }

      // Las tasas de cada escala tienen que ir de mayor a menor. Si una subiera,
      // la tasa efectiva dejaría de bajar con el precio y «entre más cara, más
      // baja» se volvería mentira — el discurso que se le vende al operador.
      for (const nombre of ["VENTA", "PLATAFORMA"]) {
        // Del `const NOMBRE` hasta su PRIMER `];`. Sin ese corte, el bloque de
        // VENTA se tragaba el de PLATAFORMA y la comprobación de monotonía leía
        // el salto entre las dos escalas como si fuera un tramo que sube.
        const desde = src.indexOf(`const ${nombre}`);
        if (desde < 0) continue;
        const hasta = src.indexOf("];", desde);
        const bloque = src.slice(desde, hasta < 0 ? undefined : hasta);
        const tasas = [...bloque.matchAll(/,\s*(0?\.\d+)\s*\]/g)].map((m) => Number(m[1]));
        for (let i = 1; i < tasas.length; i++) {
          if (tasas[i] > tasas[i - 1]) {
            return `En la escala ${nombre} la tasa SUBE del tramo ${i} al ${i + 1} (${tasas[i - 1]} → ${tasas[i]}). Con tramos marginales eso rompe «entre más cara la venta, más baja la tasa», que es justo lo que se le promete al operador.`;
          }
        }
      }
      return null;
    },
  },
  {
    nombre: "La escala de plataforma nunca cobra más que la de venta",
    comprueba() {
      const src = leer("src/lib/operadores/comision.ts");
      if (!src) return null; // ya lo reporta la regla del tope

      // Cada escala, de su `const NOMBRE` hasta su PRIMER `];`. Mismo corte que
      // usa la regla del tope, y por la misma razón: sin él, VENTA se traga el
      // bloque de PLATAFORMA.
      const escala = (nombre) => {
        const desde = src.indexOf(`const ${nombre}`);
        if (desde < 0) return null;
        const hasta = src.indexOf("];", desde);
        const bloque = src.slice(desde, hasta < 0 ? undefined : hasta);
        return [...bloque.matchAll(/\[\s*(Infinity|[\d_]+)\s*,\s*(0?\.\d+)\s*\]/g)].map((m) => ({
          tope: m[1] === "Infinity" ? Infinity : Number(m[1].replace(/_/g, "")),
          tasa: Number(m[2]),
        }));
      };

      const venta = escala("VENTA");
      const plataforma = escala("PLATAFORMA");
      if (!venta?.length || !plataforma?.length) {
        return "No se pudieron leer las dos escalas de comision.ts. O cambió el formato de las tablas o una desapareció; revísalo a mano antes de deployar.";
      }

      // Los cortes tienen que ser los MISMOS en las dos escalas. Si no, comparar
      // renglón contra renglón no significa nada — y el convenio, que las
      // presenta como una sola tabla de dos columnas, estaría mintiendo.
      if (venta.length !== plataforma.length) {
        return `VENTA tiene ${venta.length} tramos y PLATAFORMA ${plataforma.length}. Las dos escalas tienen que compartir cortes: el convenio las publica como UNA tabla de dos columnas, y con cortes distintos ese renglón no existe.`;
      }
      for (let i = 0; i < venta.length; i++) {
        if (venta[i].tope !== plataforma[i].tope) {
          const f = (n) => (Number.isFinite(n) ? "$" + n.toLocaleString("es-MX") : "infinito");
          return `El corte ${i + 1} no coincide: VENTA hasta ${f(venta[i].tope)} y PLATAFORMA hasta ${f(plataforma[i].tope)}. Las dos escalas comparten cortes a propósito.`;
        }
      }

      // Y la de plataforma nunca puede cobrar más que la de venta.
      for (let i = 0; i < venta.length; i++) {
        if (plataforma[i].tasa > venta[i].tasa + 1e-9) {
          return [
            `En el tramo ${i + 1} PLATAFORMA cobra ${(plataforma[i].tasa * 100).toFixed(0)}% y VENTA ${(venta[i].tasa * 100).toFixed(0)}%.`,
            "",
            "Eso está al revés y le quita el sentido a tener dos escalas. VENTA se",
            "cobra cuando Caminante ENTREGA el cliente —su audiencia, su contenido,",
            "su canal— y PLATAFORMA cuando el operador trae al suyo y solo usa los",
            "rieles. Si la segunda cobra igual o más, traer clientes propios deja de",
            "premiarse y el operador no tiene por qué hacerlo.",
            "",
            "Ya pasó, y en silencio: hasta el 8 sep 2026 las dos escalas arrancaban",
            "en 20% y solo se separaban 1.2 puntos en el ticket promedio. Nadie lo",
            "vio porque cada tabla se revisaba sola; el problema solo aparece al",
            "ponerlas una junto a la otra. Por eso este guardián las compara.",
          ].join("\n");
        }
      }
      return null;
    },
  },

  // ── 22 · Firmar no es mirar ────────────────────────────────────────────────
  {
    nombre: "Un acto nunca se decide con el sombrero",
    comprueba() {
      // El panel de la casa tiene una pastilla de sombreros: mirándolo por
      // Caminante se ve Caminante, por Kéntro se ve Kéntro. Eso lo resuelve
      // `operadoraQueMiro()`, que sabe de la cookie.
      //
      // `operadorDelAlcance()` contesta otra pregunta —QUIÉN SOY— y por eso no
      // sabe de la cookie. Los actos se resuelven con ésa: firmar un convenio y
      // ser dueño de una experiencia nueva.
      //
      // ⚠️ ESTO ESTUVO A UN PASO DE PASAR. Al construir el sombrero (24 sep
      // 2026) el primer plan era que `operadorDelAlcance` devolviera el
      // sombrero y ya: catorce llamadas arregladas de un golpe. Dos de esas
      // catorce eran `firmarConvenioAction` —que habría dejado a la casa
      // firmando el convenio de otra empresa con sólo traer un sombrero
      // puesto— y el dueño de una experiencia nueva, que es atribución, que es
      // dinero, y que se congela al vender. Ninguna de las dos habría fallado:
      // habrían funcionado, en silencio, a nombre de quien no era.
      const actos = [
        ["src/lib/operadores/convenio-actions.ts", "firmar el convenio"],
        ["src/app/caminante/admin/experiencias/nueva/page.tsx", "el dueño de una experiencia nueva"],
      ];
      for (const [rel, que] of actos) {
        const f = join(raiz, rel);
        if (!existsSync(f)) {
          return `No encontré ${rel}. Si se movió, este guardián tiene que apuntar a su nueva casa.`;
        }
        if (readFileSync(f, "utf8").includes("operadoraQueMiro")) {
          return [
            `${rel} usa \`operadoraQueMiro()\`, y ahí se decide ${que}.`,
            "",
            "`operadoraQueMiro()` contesta QUÉ ESTOY MIRANDO y depende de una",
            "cookie de vista. `operadorDelAlcance()` contesta QUIÉN SOY. Un acto",
            "—una firma, una atribución— se resuelve con la segunda, siempre.",
            "",
            "Con la primera, la casa con el sombrero de Caminante puesto firmaría",
            "el convenio de Caminante, o crearía experiencias a su nombre, sin que",
            "nada falle y sin que nadie lo decida. La atribución además se congela",
            "al vender y no se rellena hacia atrás (0016).",
          ].join("\n");
        }
      }
      return null;
    },
  },

  // ── 23 · Cambiar de sombrero es una navegación de verdad ───────────────────
  {
    nombre: "La pastilla de sombreros no usa <Link>",
    comprueba() {
      // Del otro lado de esos chips hay un ROUTE HANDLER, no una página: pone
      // la cookie del sombrero y redirige. `<Link>` hace navegación de cliente
      // —pide el payload RSC— y además PRECARGA al pasar el mouse.
      //
      // ⚠️ YA PASÓ EN PRODUCCIÓN, el 24 sep 2026, el mismo día que salió. El
      // clic no hacía nada visible (el router pedía RSC, recibía un redirect a
      // la ruta en la que ya estaba y se callaba) pero la PRECARGA sí ejecutaba
      // el handler. Resultado: la cookie en Kéntro y la pantalla diciendo
      // Caminante. El sombrero puesto y el sombrero escrito, distintos — que es
      // lo único que este diseño no se podía permitir, porque su única defensa
      // contra «leí un número creyendo que era de la otra» es que la etiqueta
      // diga la verdad.
      //
      // Con `<a>` pelado es navegación del navegador: la cookie se escribe, el
      // redirect aterriza y todo el servidor se vuelve a dibujar, que es lo que
      // cambiar de sombrero significa.
      const rel = "src/app/caminante/admin/ui/AdminShell.tsx";
      const f = join(raiz, rel);
      if (!existsSync(f)) {
        return `No encontré ${rel}. Si la cabecera del panel se movió, este guardián tiene que apuntar a su nueva casa.`;
      }
      const txt = readFileSync(f, "utf8");
      const AGUJA = "/caminante/admin/sombrero/";
      let i = txt.indexOf(AGUJA);
      if (i === -1) {
        return [
          `${rel} ya no enlaza a ${AGUJA}.`,
          "",
          "Si la pastilla de sombreros se quitó o se movió, este guardián sobra y",
          "se borra a mano. Si sigue ahí con otra forma, hay que reapuntarlo: la",
          "regla de fondo es que un efecto de escritura no puede colgar de un",
          "`<Link>`, porque `<Link>` precarga.",
        ].join("\n");
      }
      while (i !== -1) {
        // Hacia atrás hasta la etiqueta que abre: la primera `<` con nombre.
        const antes = txt.slice(Math.max(0, i - 400), i);
        const m = [...antes.matchAll(/<([A-Za-z][A-Za-z0-9]*)/g)].pop();
        const etiqueta = m ? m[1] : "(ninguna)";
        if (etiqueta !== "a") {
          return [
            `En ${rel} el enlace a ${AGUJA} va dentro de <${etiqueta}>, no de <a>.`,
            "",
            "Del otro lado hay un route handler que ESCRIBE una cookie. `<Link>`",
            "hace navegación de cliente y precarga al pasar el mouse: el clic no",
            "hace nada visible y la precarga sí cambia el sombrero. Eso deja la",
            "cookie en una operadora y la etiqueta de la pantalla en otra.",
            "",
            "Pasó el 24 sep 2026, el día que salió. Tiene que ser `<a>` pelado.",
          ].join("\n");
        }
        i = txt.indexOf(AGUJA, i + 1);
      }
      return null;
    },
  },

  // ── 24 · El alta cierra secciones en sus DOS puertas ───────────────────────
  {
    nombre: "El candado del alta está en el layout y en la cabecera",
    comprueba() {
      // Mientras la operadora no termina su alta, las seis secciones rebotan a
      // Mi alta (lámina v5, 24 sep 2026). Next NO vuelve a correr el layout al
      // navegar con clics entre páginas del panel: con el candado sólo en el
      // layout, escribir la URL rebotaba pero un clic entraba. Con él sólo en
      // la cabecera, las pantallas que no la dibujan quedaban abiertas.
      //
      // Por eso son dos puertas con UNA función (`rebotaDelAlta`). Si una la
      // pierde, el candado sigue pareciendo puesto y ya no lo está.
      const puertas = [
        "src/app/caminante/admin/layout.tsx",
        "src/app/caminante/admin/ui/AdminShell.tsx",
      ];
      for (const rel of puertas) {
        const f = join(raiz, rel);
        if (!existsSync(f)) return `No encontré ${rel}. Si se movió, este guardián tiene que apuntar a su nueva casa.`;
        const txt = readFileSync(f, "utf8").replace(/\/\/.*$/gm, "");
        if (!/await\s+rebotaDelAlta\(/.test(txt)) {
          return [
            `${rel} ya no llama a \`rebotaDelAlta\`.`,
            "",
            "El candado del alta necesita las dos puertas: el layout cubre la URL",
            "escrita a mano y la cabecera cubre la navegación con clics, que el",
            "layout no ve. Con una sola, la operadora entra a una sección que en",
            "el nav se ve punteada.",
          ].join("\n");
        }
      }
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
