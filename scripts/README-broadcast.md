# Difusión por WhatsApp (Cloud API)

Manda un template aprobado (p.ej. el flyer) a la lista de clientes. Infraestructura
reutilizable: el bot de WhatsApp a futuro usa el mismo `lib/phone.mjs` y el mismo patrón.

## Archivos
- `lib/phone.mjs` — normaliza teléfonos del CRM a E.164 (maneja +52/52/10-dígitos/+1 y basura Unicode).
- `broadcast-whatsapp.mjs` — runner. **Dry-run por defecto** (no manda nada).
- `recipients.json` — semilla exportada de Notion (All Clients). **PII, gitignored.**

## Requisitos (una sola vez)
1. **Creds en `.env.local`** (de Meta Business → WhatsApp → API Setup):
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_ACCESS_TOKEN` (token permanente)
2. **Template aprobado** en Meta:
   - Nombre: `caminante_flyer_v1` · Categoría: Marketing · Idioma: `es_MX`
   - Header: **Imagen** (el flyer)
   - Body: `Hola {{1}} 🌊 Abrimos una nueva expedición Caminante. Te comparto los detalles aquí — cupo limitado. Si te late, respóndeme por aquí y te aparto tu lugar.`
   - (Opcional) Botón quick-reply "Quiero info" → abre la ventana de 24h para responder libre.
3. **Flyer hospedado** en `public/flyers/…` y deployado → URL pública (ver `public/flyers/README.md`).

## Correr
```bash
export PATH="/Users/luisdelarosa/Desktop/acting/caminante/.tools/fnm-data/node-versions/v22.22.0/installation/bin:$PATH"

# 1) Dry-run (siempre primero): valida lista, normaliza, deduplica, previsualiza
node scripts/broadcast-whatsapp.mjs

# 2) Prueba real a TU número antes del envío masivo
node scripts/broadcast-whatsapp.mjs --send --limit 1 \
  --template caminante_flyer_v1 --lang es_MX \
  --flyer-url https://caminante.numanhub.com/flyers/ensenada.jpg
# (pon tu número de prueba primero en recipients.json, o usa --limit con cuidado)

# 3) Envío a toda la lista
node scripts/broadcast-whatsapp.mjs --send \
  --template caminante_flyer_v1 --lang es_MX \
  --flyer-url https://caminante.numanhub.com/flyers/ensenada.jpg
```

## Fuente de destinatarios
- Default: `recipients.json` (semilla actual = 64 clientes válidos, deduplicados).
- Repetible a futuro: exporta All Clients de Notion a CSV y usa `--csv ruta.csv`
  (busca columnas Name/Phone). Así no hay que transcribir a mano.

## Notas
- WhatsApp exige **template** para escribir a alguien fuera de la ventana de 24h (lista fría).
- El runner espacia ~4 msg/seg y guarda un log `broadcast-results-<fecha>.json` (gitignored).
- Costo aprox: marketing ≈ $0.03 USD/mensaje × 64 ≈ $2 USD.
- Tras el envío, conviene marcar "Last Contact" en el Trip Pipeline / All Clients (manual o futuro sync).
