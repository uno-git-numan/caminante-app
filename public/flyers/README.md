# Flyers (headers de imagen para templates de WhatsApp)

Los headers de imagen de los templates de WhatsApp Cloud API necesitan una **URL pública**
(no un archivo local). Cualquier archivo aquí se sirve en la raíz del sitio:

    public/flyers/ensenada.jpg  →  https://caminante.numanhub.com/flyers/ensenada.jpg

Pasos para una difusión:
1. Sube el flyer **vertical** aquí (JPG/PNG; WhatsApp recomienda ≤5 MB, formato 9:16 se ve bien).
2. Deploya (push a `deploy/caminante-site` → promover en Vercel) para que la URL exista.
3. Pásale esa URL a `scripts/broadcast-whatsapp.mjs` con `--flyer-url`.

Ver `scripts/README-broadcast.md` para el flujo completo.
