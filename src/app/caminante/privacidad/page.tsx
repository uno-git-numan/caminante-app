// Aviso de Privacidad de Caminante — página pública requerida por LFPDPPP y por
// las plataformas (Meta App publish, Stripe, ads). URL estable:
// https://caminante.numanhub.com/caminante/privacidad
//
// Noviembre 2026: adiciones de la sesión legal (design/legal/
// AVISO-PRIVACIDAD-ADICIONES-2026-11.md; D4, D16, D17), transcritas tal cual.
// ⚠️ La frase en negritas sobre Stripe la exige Stripe palabra por palabra, y la
// cláusula «aceptas esa transferencia… si no la aceptas…» la pide la LFPDPPP 2025
// art. 35. No se parafrasean.

export const metadata = {
  title: "Aviso de Privacidad · Caminante",
  description:
    "Cómo Caminante recaba, usa y protege tus datos personales (LFPDPPP).",
};

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-3xl font-light text-lagoon">
        Aviso de <span className="font-semibold text-dune">Privacidad</span>
      </h1>
      <p className="mt-2 text-sm text-olive">Última actualización: noviembre 2026</p>

      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-lagoon">
        <section>
          <h2 className="mb-1 font-semibold">Responsable</h2>
          <p>
            Caminante (marca operada por Numan Hub), con contacto en{" "}
            <a className="text-dune underline" href="mailto:caminante@numanhub.com">
              caminante@numanhub.com
            </a>
            , es responsable del tratamiento de tus datos personales conforme a la
            Ley Federal de Protección de Datos Personales en Posesión de los
            Particulares (LFPDPPP).
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Datos que recabamos</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Identificación y contacto:</strong> nombre, correo, teléfono /
              WhatsApp, ciudad y fecha de nacimiento.
            </li>
            <li>
              <strong>Datos de salud y seguridad</strong> (sensibles): condiciones
              médicas, alergias, restricciones alimentarias, contacto de emergencia y,
              en su caso, datos para pólizas de accidentes (CURP, beneficiario). Se
              recaban solo al registrarte a una experiencia y con tu consentimiento
              expreso.
            </li>
            <li>
              <strong>Mensajes:</strong> si nos escribes por WhatsApp, conservamos la
              conversación para darte seguimiento.
            </li>
            <li>
              <strong>Pagos:</strong> los procesa Stripe, nuestro procesador de pagos. Nunca
              vemos ni almacenamos tu tarjeta completa.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Para qué los usamos</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Gestionar tu reserva, registro, pago y logística de la experiencia.</li>
            <li>Tu seguridad en campo: los datos médicos solo los ve el equipo de guías.</li>
            <li>Contactarte por WhatsApp o correo sobre tu reserva.</li>
            <li>
              Con tu consentimiento adicional: enviarte novedades de próximas
              experiencias (puedes darte de baja en cualquier momento y la baja es
              definitiva salvo que tú vuelvas a suscribirte).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Con quién se comparten</h2>
          <p>
            No vendemos tus datos. Usamos proveedores que procesan datos por cuenta
            nuestra y bajo nuestras instrucciones (encargados): Supabase (base de datos),
            Vercel (hosting), Meta/WhatsApp (mensajería), Resend (correo) y Anthropic
            (lectura automatizada de documentos de operadoras, nunca de datos de salud).
            Stripe procesa los pagos y, en el caso de las operadoras, recibe sus datos
            como responsable propio (ver «Operadoras y cuenta de cobro»). Con fines de medición y
            publicidad de nuestras propias experiencias, compartimos con Meta
            identificadores <strong>cifrados (hash)</strong> —nunca datos en claro— como
            se explica en «Cookies y medición». Los datos médicos nunca salen de nuestra
            plataforma operativa ni se comparten con fines publicitarios.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Operadoras y cuenta de cobro</h2>
          <p>
            Si operas experiencias en Caminante, tratamos además los datos de tu
            expediente (Registro Nacional de Turismo, identificación oficial, Constancia
            de Situación Fiscal, pólizas) y tus datos fiscales: RFC, régimen, domicilio
            fiscal, CURP y la CLABE donde recibes tus ventas. Los conservamos mientras dure
            tu convenio y los plazos legales posteriores, y los usamos para verificar tu
            identidad y tu situación fiscal, facturarte nuestra comisión, retener y
            enterar los impuestos que la ley nos obliga a retenerte y presentar al SAT la
            información mensual de operadoras que exige la Ley del Impuesto al Valor
            Agregado (artículo 18-J, fracción III: nombre, RFC, CURP, domicilio fiscal,
            banco y CLABE, y monto de operaciones). Tu Constancia de Situación Fiscal se
            valida contra el servicio público del SAT; de ella tomamos tu CURP y tu
            domicilio fiscal. La CLABE la capturas una sola vez; el banco se deduce de
            ella. Esos datos fiscales se guardan en un registro de acceso restringido que
            sólo nuestro sistema lee, y la CLABE se muestra siempre enmascarada en
            pantalla.
          </p>
          <p className="mt-3">
            Para abrir tu cuenta de cobro, los datos que el procesador exige (nombre,
            fecha de nacimiento, domicilio, teléfono, RFC, identificación oficial y CLABE,
            y los de tu representante y dueños si eres persona moral) viajan cifrados de
            tu navegador a Stripe; Caminante no los recibe por esa vía.{" "}
            <strong>
              Cuando proporcionas datos personales en relación con Caminante, Stripe
              recibe esos datos personales y los procesa de acuerdo con la Política de
              privacidad de Stripe
            </strong>{" "}
            (
            <a className="text-dune underline" href="https://stripe.com/privacy" target="_blank" rel="noreferrer">
              https://stripe.com/privacy
            </a>
            ). Esa comunicación es una transferencia de datos a un tercero, incluidos
            datos financieros y patrimoniales, con la finalidad de verificar tu
            identidad, prevenir fraudes y depositarte tus ventas. Al firmar tu convenio
            de operación aceptas de manera expresa esa transferencia; si no la aceptas,
            no es posible abrirte una cuenta de cobro.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Cookies y medición (Meta Pixel / Conversions API)</h2>
          <p>
            Nuestro sitio usa el <strong>Meta Pixel</strong> y la{" "}
            <strong>Conversions API</strong> de Meta para medir el tráfico y la
            efectividad de nuestra publicidad (por ejemplo, cuántas personas ven una
            experiencia o completan una reserva) y para mostrar anuncios de Caminante a
            audiencias relevantes. Para ello Meta puede colocar cookies (como{" "}
            <code>_fbp</code> y <code>_fbc</code>) en tu navegador, y nosotros enviamos a
            Meta ciertos eventos (visita, inicio de reserva, compra) junto con
            identificadores <strong>cifrados</strong> (correo o teléfono convertidos en
            hash irreversible). No enviamos datos de salud. Puedes limitar este rastreo
            con la configuración de anuncios de tu cuenta de Meta, con las preferencias
            de cookies de tu navegador o con extensiones de bloqueo.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Transferencias de datos</h2>
          <p>
            Sólo transferimos datos personales a terceros cuando tú lo aceptas o cuando
            la ley lo permite sin tu consentimiento: a las operadoras que prestan la
            experiencia que reservaste (datos de contacto y, con tu consentimiento
            expreso, los de salud necesarios para tu seguridad, que ellas tratan como
            encargadas y deben suprimir al terminar la salida); al procesador de pagos,
            en el caso de las operadoras (sección anterior); a las aseguradoras cuando
            contratamos una póliza a tu nombre; y a las autoridades cuando una ley o un
            requerimiento lo exige (por ejemplo, la información mensual de operadoras al
            SAT). Al usar la plataforma y, en su caso, al firmar tu convenio, aceptas
            estas transferencias. Puedes oponerte escribiendo a{" "}
            <a className="text-dune underline" href="mailto:caminante@numanhub.com">
              caminante@numanhub.com
            </a>
            ; en los casos en que la transferencia es necesaria para prestarte el
            servicio o para cumplir la ley, no podremos continuar con el servicio
            afectado.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Tus derechos (ARCO)</h2>
          <p>
            Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus
            datos, así como revocar tu consentimiento y solicitar la eliminación de tu
            información, escribiendo a{" "}
            <a className="text-dune underline" href="mailto:caminante@numanhub.com">
              caminante@numanhub.com
            </a>
            . Respondemos en un máximo de 20 días hábiles. Para revocar tu
            consentimiento escribe al mismo correo indicando qué tratamiento revocas; la
            revocación no tiene efectos retroactivos.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Cambios a este aviso</h2>
          <p>
            Cualquier cambio se publicará en esta página. El uso continuado de
            nuestros servicios tras un cambio implica tu conformidad con el aviso
            vigente.
          </p>
        </section>
      </div>
    </main>
  );
}
