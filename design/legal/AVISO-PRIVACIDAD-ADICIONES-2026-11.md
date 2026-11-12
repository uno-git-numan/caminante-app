# Aviso de privacidad de Caminante — adiciones del 11 nov 2026

**Para la sesión de producto.** Página: `src/app/caminante/privacidad/page.tsx`
(https://caminante.numanhub.com/caminante/privacidad). Se **agregan** las
secciones de abajo y se **cambian** tres frases; todo lo demás se queda. Cambiar
«Última actualización: julio 2026» por «noviembre 2026». Fundamento y decisión:
`DECISIONES-LEGAL-FISCAL-2026-11-11.md` D4, D16 y D17.

## Cambios a frases existentes

1. En «Datos que recabamos», el punto **Pagos** queda así:
   > **Pagos:** los procesa Stripe, nuestro procesador de pagos. Nunca vemos ni
   > almacenamos tu tarjeta completa.
2. En «Con quién se comparten», la frase «Usamos proveedores que procesan datos
   por cuenta nuestra: Stripe (pagos), Supabase (base de datos), Vercel
   (hosting), Meta/WhatsApp (mensajería) y Resend (correo).» queda así:
   > Usamos proveedores que procesan datos por cuenta nuestra y bajo nuestras
   > instrucciones (encargados): Supabase (base de datos), Vercel (hosting),
   > Meta/WhatsApp (mensajería), Resend (correo) y Anthropic (lectura
   > automatizada de documentos de operadoras, nunca de datos de salud). Stripe
   > procesa los pagos y, en el caso de las operadoras, recibe sus datos como
   > responsable propio (ver «Operadoras y cuenta de cobro»).
3. En «Tus derechos (ARCO)», después de «Respondemos en un máximo de 20 días
   hábiles.» agregar:
   > Para revocar tu consentimiento escribe al mismo correo indicando qué
   > tratamiento revocas; la revocación no tiene efectos retroactivos.

## Sección nueva: «Operadoras y cuenta de cobro» (después de «Con quién se comparten»)

> **Operadoras y cuenta de cobro.** Si operas experiencias en Caminante,
> tratamos además los datos de tu expediente (Registro Nacional de Turismo,
> identificación oficial, Constancia de Situación Fiscal, pólizas) y tus datos
> fiscales: RFC, régimen, domicilio fiscal, CURP y la CLABE donde recibes tus
> ventas. Los conservamos mientras dure tu convenio y los plazos legales
> posteriores, y los usamos para verificar tu identidad y tu situación fiscal,
> facturarte nuestra comisión, retener y enterar los impuestos que la ley nos
> obliga a retenerte y presentar al SAT la información mensual de operadoras
> que exige la Ley del Impuesto al Valor Agregado (artículo 18-J, fracción III:
> nombre, RFC, CURP, domicilio fiscal, banco y CLABE, y monto de operaciones).
> Tu Constancia de Situación Fiscal se valida contra el servicio público del
> SAT; de ella tomamos tu CURP y tu domicilio fiscal. La CLABE la capturas una
> sola vez; el banco se deduce de ella. Esos datos fiscales se guardan en un
> registro de acceso restringido que sólo nuestro sistema lee, y la CLABE se
> muestra siempre enmascarada en pantalla.
>
> Para abrir tu cuenta de cobro, los datos que el procesador exige (nombre,
> fecha de nacimiento, domicilio, teléfono, RFC, identificación oficial y
> CLABE, y los de tu representante y dueños si eres persona moral) viajan
> cifrados de tu navegador a Stripe; Caminante no los recibe por esa vía.
> **Cuando proporcionas datos personales en relación con Caminante, Stripe
> recibe esos datos personales y los procesa de acuerdo con la Política de
> privacidad de Stripe** (https://stripe.com/privacy). Esa comunicación es una
> transferencia de datos a un tercero, incluidos datos financieros y
> patrimoniales, con la finalidad de verificar tu identidad, prevenir fraudes y
> depositarte tus ventas. Al firmar tu convenio de operación aceptas de manera
> expresa esa transferencia; si no la aceptas, no es posible abrirte una cuenta
> de cobro.
>
> **Facturación desde el portal (añadido el 12 nov 2026, D20).** Si activas la
> facturación desde tu panel, Caminante emite por tu cuenta, con tu Certificado
> de Sello Digital, las facturas de tus ventas en la plataforma, sus notas de
> crédito y tu factura global. Tu certificado, su clave y su contraseña los
> cargas tú y los custodia el proveedor autorizado de certificación que usamos
> (Facturapi), que los trata por nuestra cuenta sólo para ese fin; Caminante no
> los guarda en sus sistemas ni recibe tu e.firma. Al desactivar la facturación
> o terminar tu convenio, damos de baja tu certificado en el proveedor.

## Sección nueva: «Transferencias de datos» (antes de «Tus derechos (ARCO)»)

> **Transferencias de datos.** Sólo transferimos datos personales a terceros
> cuando tú lo aceptas o cuando la ley lo permite sin tu consentimiento: a las
> operadoras que prestan la experiencia que reservaste (datos de contacto y, con
> tu consentimiento expreso, los de salud necesarios para tu seguridad, que
> ellas tratan como encargadas y deben suprimir al terminar la salida); al
> procesador de pagos, en el caso de las operadoras (sección anterior); a las
> aseguradoras cuando contratamos una póliza a tu nombre; y a las autoridades
> cuando una ley o un requerimiento lo exige (por ejemplo, la información
> mensual de operadoras al SAT). Al usar la plataforma y, en su caso, al firmar
> tu convenio, aceptas estas transferencias. Puedes oponerte escribiendo a
> caminante@numanhub.com; en los casos en que la transferencia es necesaria para
> prestarte el servicio o para cumplir la ley, no podremos continuar con el
> servicio afectado.

## Por qué cada pieza

- La frase en negritas sobre Stripe es la que Stripe exige, palabra por palabra,
  a toda plataforma que enlaza su propio aviso de privacidad
  (docs.stripe.com/connect/updating-service-agreements, «Divulgación sobre cómo
  Stripe procesa los datos de las cuentas conectadas»).
- La cláusula «aceptas esta transferencia… si no la aceptas…» es la que pide la
  LFPDPPP 2025 art. 35 (el aviso «contendrá una cláusula en la que se indique si
  la persona titular acepta o no la transferencia»).
- La mención de Anthropic como encargado y de la CLABE/CURP conservadas sale de
  las decisiones D17 y D4; el registro restringido, la CLABE enmascarada y el
  origen en la Constancia son lo que construyó producto (commit 347a640,
  migración 0081).
- El mecanismo de revocación lo exige el art. 7, último párrafo.
