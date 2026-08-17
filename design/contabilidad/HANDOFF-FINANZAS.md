# HANDOFF — Contabilidad y facturación de Caminante

Para el chat del sistema de finanzas de Caminante. Escrito el 13 ago 2026 tras la
junta con los asesores (Jorge Zubarán, legal · Eduardo, fiscal-contable) del 22 jul
y su lista de seguimiento del 29 jul.

> ⚠️ **Quién es quién, para no confundirse.** En la minuta, las observaciones
> fiscales las hace **Eduardo** y las legales **Jorge** — por eso este documento
> cita a Eduardo al atribuir cada hallazgo. **Pero las dos preguntas que bloquean
> el carril B (tipo de cargo y retenciones) se las mandó Luis a JORGE** el 13 ago.
> **Es la respuesta de Jorge la que desbloquea.** Si alguien duda, se le pregunta
> a Luis; no se asume.

---

## 1 · El estado real, sin adornos

**Solo se operan experiencias PROPIAS.** No hay operación de terceros todavía: el
trato con Kéntro nunca se aterrizó, y las experiencias que estuvieron atribuidas a
ellos se regresaron a Numan. Por lo tanto **no hay ingreso de terceros mal
reconocido** — los $103,500 de «Hacienda y hongos» son ingreso propio y están bien
donde están.

**No existe Stripe Connect.** Verificado en el código: no hay `transfer_data`, ni
`application_fee`, ni cuentas conectadas. El 100% del cobro cae a la cuenta de
NUMAN HUB y al operador se le transferiría a mano.

⚠️ En la junta se describió Connect **en presente** («el dinero cae directamente al
operador menos la comisión»). Es un plan, no un hecho. Hay que corregirlo con
Eduardo antes de que diseñe la estructura encima.

⚠️ También se dijo **~500 facturas/día**. La realidad histórica son **41 ventas
totales**. No cambia la arquitectura pero sí la urgencia y su cotización.

---

## 2 · Decisiones que Luis ya tomó (13 ago)

| Tema | Decisión |
|---|---|
| **Connect vs facturación** | **Las dos en paralelo.** Se le advirtió que toca el camino crítico del cobro, que hoy corre en LIVE; lo reafirmó. Mitigación obligatoria: Connect se construye **detrás de un gate**, sin tocar `createCheckout` ni el webhook, hasta que exista un operador con convenio. |
| **Kéntro** | Todo es Numan. Sin deal aterrizado. No hay nada que reclasificar. |
| **Autofactura** | **Se enciende.** Luis consigue cuenta de Facturapi y el CSD esta semana. |
| **Contratos** | **Claude redacta el borrador**, los asesores lo vuelven exigible. |

---

## 3 · Lo que ya está construido y sin encender

`src/lib/facturacion/` — `facturapi.ts`, `actions.ts`, `admin-actions.ts`,
`catalogos.ts`, `token.ts` · UI en `/caminante/facturacion` · panel admin.
Migración **`0019_facturacion_cfdi.sql` escrita y SIN aplicar** (guarda `rfc`,
`regimen_fiscal`, `uso_cfdi` del cliente).

**Para encenderlo hace falta, en este orden:**
1. Luis crea cuenta en Facturapi y sube su CSD (`.cer`, `.key`, contraseña). **Los
   teclea él; Claude no toca secretos.**
2. Luis aplica `0019` a mano en el SQL Editor.
3. Quitar el gate, un timbrado real de prueba, verificar el XML y el PDF.

Los cobros reales que ya ocurrieron están marcados `status_cfdi = por-emitir`. Hay
que decidir con Eduardo si se timbran retroactivamente.

---

## 4 · Lo que hay que construir

### Facturación (propias) — desbloqueado esta semana
- Encender el motor con los 3 pasos de arriba.
- **Impuesto sobre plataformas tecnológicas**: ya aplica según Eduardo, y hoy no se
  calcula. La tasa depende del tipo de servicio (aventura ≠ hospedaje) — es pregunta
  para él, **no se estima**.

### Stripe Connect — PRIORIDAD (13 ago)

⚠️ **Corrección de criterio.** Se había recomendado esperar «a que exista un
operador con convenio». Es un razonamiento circular: **no hay operadores dados de
alta porque los rieles no existen**, no al revés. Luis ya tiene operadores que
quieren usar la plataforma. Connect es camino crítico.

**Dos decisiones que definen el código y las confirma EDUARDO, no nosotros:**

1. **Tipo de cargo.**
   - *Direct charges* — el cobro nace en la cuenta del operador; él es el
     comerciante de registro y Numan cobra `application_fee`. **Es el que embona
     con lo que pidió Eduardo** («Numan solo reconoce como ingreso la comisión»).
   - *Destination charges* — el cobro nace en la cuenta de Numan y se transfiere.
     Todo el monto toca a Numan, que es justo lo que hay que evitar.

   Recomendación: **direct charges**. Confirmar antes de escribir la plomería,
   porque cambiarlo después es rehacer el webhook y la conciliación.

2. **Retenciones de plataforma.** Si los operadores son **personas físicas**, la
   plataforma está obligada a retener ISR e IVA y enterarlos. Ahí es donde Numan es
   **corresponsable solidaria**. Es un subsistema completo (cálculo, constancias de
   retención, entero mensual) y hoy no existe ni en el modelo de datos.

   Pregunta para Eduardo: ¿qué tasas aplican, y cambia si el operador es persona
   moral?

**Alcance técnico:**
- Onboarding de Stripe por operador (KYC: RFC, CLABE, identificación). No es
  instantáneo — el operador tiene que completarlo con Stripe.
- `application_fee_amount` = la comisión, con `commission_pct` congelada por venta
  (la 0016 ya lo hace).
- Conciliación: los cobros ya no caen todos en la cuenta de Numan.

⚠️ **El motor de facturación tiene que volverse MULTI-EMISOR.** Hoy `0019` y
`lib/facturacion/` asumen un solo emisor (NUMAN). En el modelo de operadores, el
operador factura al cliente **con su propio CSD** y Numan le factura solo el fee.
Eso es una expansión real del módulo, no un ajuste — y es lo que Luis pidió cuando
dijo «que facture también a nombre de Numan».

### Contratos (Claude redacta, ellos revisan)
- **Términos y condiciones**, diferenciando experiencias propias vs. de terceros.
  El deslinde actual NO basta — Jorge fue explícito.
- **Contrato de onboarding de operador**: objeto, contraprestación, fee, quién
  responde de qué, cláusulas fiscales, confidencialidad, responsabilidad laboral,
  privacidad de datos.
- Materia prima disponible: el funnel de operadores
  (`design/operadores/FUNNEL.md`), las tres reglas duras del sistema, el expediente
  de documentos y el flujo de cobro real.

### Para los asesores (documentos que Claude puede escribir ya)
- **Punto 2** — Descripción del flujo de operaciones, propias y de terceros, con
  Connect marcado como PLAN.
- **Punto 3** — Lista de experiencias (5 en base, 4 publicadas, todas propias).
- **Punto 6** — Inventario de activos: plataforma, marcas, dominios, software.

---

## 5 · Lo que NO es de Claude

Objeto social · constancia de situación fiscal ante el SAT (Eduardo lo llamó
**omisión** con multas y recargos, porque ya se opera) · escritura constitutiva ·
contrato con Stripe · estados financieros a junio 2026 (Marisol) · PLD.

---

## 6 · Preguntas abiertas para Luis

1. ¿**Numan** y **Caminante** están registradas como marca? ¿Ante el IMPI?
2. ¿Tienes la escritura constitutiva a la mano, con sus actas de asamblea?
3. ¿Qué actividades trae hoy la constancia de situación fiscal?
4. ¿Marisol tiene balance a junio 2026, o hay que armarlo desde La Caja?
5. ¿Firmaste algo con Stripe además de aceptar sus términos estándar?

---

## 7 · Con qué se conecta

- **La Caja** (`~/Finanzas` + Drive/CONTABILIDAD) — ledger, facturas, conciliación.
  Skills `/facturas`, `/gasto`, `/ingreso`, `/cierre-mes`, `/pendientes`.
- **Hojas de costeo** — ver `ESTÁNDAR — Hojas de costeo de Caminante` en Drive.
- **Panel `/caminante/admin/recursos`** — ingresos, egresos, rentabilidad por salida.
- **Tasa real de Stripe**: 3.6% + $3 MXN + IVA = **4.23% all-in** (medida, no
  estimada). El IVA de la comisión es acreditable: costo fiscal 3.646%.
- Llave de solo lectura en `~/.config/finanzas/.env`. **Nunca se imprime.**
