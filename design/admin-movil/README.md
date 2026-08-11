# Entregable de Claude Design — App de admin (móvil)

**Fuente de verdad del diseño. No se edita.** Si el diseño cambia, se re-entrega
completo y se vuelve a extraer de aquí; jamás se parchea a mano.

- `Caminante Admin App.html` — el shell del prototipo (React UMD + Babel en el navegador).
- `adm-app.css` — el CSS. Se extrae **byte-idéntico** a `src/lib/admin/movil-css.ts`.
  Única desviación permitida: las rutas de `@font-face` apuntan a
  `/landing/assets/fonts/…`, que es donde vive Geist en este repo.
- `adm-core.jsx` — helpers presentacionales + `INIT` (datos de ejemplo, se tiran)
  + `TabIcon`.
- `adm-screens-{a,b,c}.jsx`, `adm-dinero.jsx`, `adm-pago.jsx` — las pantallas.

Los `assets/fonts` del zip se omitieron: Geist ya vive en `public/landing/assets/fonts/`.
