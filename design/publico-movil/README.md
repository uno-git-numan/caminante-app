# Entregable de Claude Design — Sitio público (móvil)

**Fuente de verdad del diseño. No se edita.** Si cambia, se re-entrega completo y se
vuelve a extraer de aquí; jamás se parchea a mano.

- `Caminante Sitio Publico App.html` — el shell (React UMD + Babel), 25 pantallas.
- `pub-app.css` — el CSS (32 KB). Se extrae **byte-idéntico** a
  `src/lib/publico/movil-css.ts`. Única desviación permitida: las rutas de
  `@font-face` a `/landing/assets/fonts/`, que es donde vive Geist en este repo.
- `pub-core.jsx` — helpers presentacionales + datos de ejemplo (se tiran).
- `pub-a.jsx` · `pub-b.jsx` · `pub-c.jsx` · `pub-aprende.jsx` — las pantallas.

⚠️ En el mismo zip venía `Caminante Sitio Publico - Movil.html` (34 KB): es el
artefacto VIEJO de 4 pantallas (Inicio, Experiencia, Reservar, Mi espacio), de
antes de las adendas. **No se usa.**
