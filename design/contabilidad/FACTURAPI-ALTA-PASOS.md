# Facturapi — pasos para Luis (alta de la cuenta y de las organizaciones)

**9 nov 2026.** Lo que Luis hace con sus manos; Claude nunca toca el CSD ni las
llaves Live. Fuente de precios: facturapi.io/pricing leído el 9 nov 2026.

## Qué se contrata (y qué no)

| Plan | Precio (IVA incl.) | ¿Lo contratamos? |
|---|---|---|
| **API de Facturación CFDI** | **$299 MXN/mes + $0.60 por timbre** · **multi-RFC** («puedes registrar y operar múltiples RFC emisores a través de la API sin costo adicional por cada uno») | **SÍ. Sólo éste.** |
| Facturación Web | $199/mes **por organización** | No |
| E-Receipts y Autofactura | $599/mes por organización | No (la autofactura ya está construida en el portal) |
| Facturapi para Stripe | $299/mes por organización | No (nuestro webhook ya decide qué se factura y con qué emisor) |
| Descarga Masiva de CFDI | $999/mes por organización | No por ahora (para «el pasado» basta la exportación del SAT) |

Con un solo plan API caben NUMAN HUB, DRUIDAS, Nomádika, Kéntro y las que
vengan: una **organización** por RFC emisor, cada una con su CSD.

## Pasos (en orden)

1. **Crear la cuenta** en facturapi.io con `uno@numanhub.com`. Guardar la
   contraseña en el gestor de contraseñas, no en el chat.
2. **Primera organización = NUMAN HUB.** Nombre «NUMAN HUB». En *Configuración ›
   Datos fiscales*: RFC `NHU250826CS8`, razón social **NUMAN HUB** (exacta, sin
   «S.A. de C.V.», como la CSF), régimen **601**, CP **11000**.
3. **Suscripción**: *Cuenta › Suscripción* → plan **API de Facturación CFDI**.
   Se cobra con la tarjeta empresarial de NUMAN (regla de Marisol: gastos de la
   empresa con la tarjeta de la empresa). Pedir el CFDI de Facturapi a NUMAN
   (entra a La Caja por `/facturas`).
4. **Subir el CSD** en *Configuración › Certificados*: archivo `.cer`, archivo
   `.key` y la contraseña de la llave privada. **Lo sube Luis.** ⚠️ Es el CSD
   (sello), no la e.firma. Sin CSD no se timbra en Live.
5. **Carta Manifiesto** (*Configuración › Firma de Carta Manifiesto*): se firma
   con la **e.firma** de NUMAN HUB. Es requisito del SAT para que el PAC timbre
   a nombre del RFC.
6. **Llaves**: en *Configuración › API Keys* sacar la **Test Secret Key** y la
   **Live Secret Key** de la organización NUMAN HUB.
   - La **Test key** se la pasa a la sesión de código (puede ir por chat: sólo
     timbra en sandbox) → `.env.local` → `FACTURAPI_SECRET_KEY` en local.
   - La **Live key** la pega Luis en **Vercel** (proyecto `caminante-app` →
     Settings → Environment Variables → `FACTURAPI_SECRET_KEY`, Production) y
     **rebuild** antes de promover (Vercel captura las env vars al construir).
     Nunca por chat.
7. **Probar en sandbox** (sesión de código): un CFDI de prueba de cada tipo (B1
   cliente, B2 comisión, egreso) con la Test key. Nada en Live hasta que
   Marisol conteste el memo (`MEMO-MARISOL-2026-11.md`) y el pasado esté
   cuadrado (tarea 3).
8. **Organización DRUIDAS** (cuando tenga RFC, e.firma y CSD): repetir 2, 4, 5 y
   6 dentro de la misma cuenta. El plan no cobra más por la organización. La
   sesión de código guarda su `facturapi_org_id` en `operators`.
9. **Operadoras externas** (Nomádika, Kéntro): su organización la crea el portal
   por API cuando suben su CSD en «Mi alta»; la contraseña del CSD la teclea la
   operadora y viaja directo a Facturapi, no se guarda (Fase 2 del MAPA).

## Qué verificar con el soporte de Facturapi antes del primer timbre real

- Que la **API de retenciones** (`/v1/retentions`, documentada) acepte el
  complemento **«Servicios Plataformas Tecnológicas»** (CveRetenc **26** según
  la matriz de errores del SAT) con un `TipoDeServ` por servicio. Si no lo
  soporta, el CFDI de retenciones mensual (R1) se emite con otra herramienta
  hasta que lo soporten.
- Que una organización pueda timbrar **CFDI global** (público en general) por
  API — sí, es un CFDI normal con RFC XAXX010101000.

## Costo esperado

Suscripción $299/mes + $0.60 por CFDI. Con ~80 ventas/año y una B2 por venta de
operadora, más egresos y retenciones: **menos de $400/mes** en total. Entra a
`COSTOS-PLATAFORMA.md` como costo fijo de la plataforma.
