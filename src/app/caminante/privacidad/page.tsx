// Aviso de Privacidad de Caminante — página pública requerida por LFPDPPP y por
// las plataformas (Meta App publish, Stripe, ads). URL estable:
// https://caminante.numanhub.com/caminante/privacidad

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
      <p className="mt-2 text-sm text-olive">Última actualización: julio 2026</p>

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
              <strong>Pagos:</strong> los procesa Stripe; nunca vemos ni almacenamos tu
              tarjeta completa.
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
            No vendemos ni compartimos tus datos con terceros para fines de mercadeo.
            Usamos proveedores que procesan datos por cuenta nuestra: Stripe (pagos),
            Supabase (base de datos), Vercel (hosting), Meta/WhatsApp (mensajería) y
            Resend (correo). Los datos médicos nunca salen de nuestra plataforma
            operativa.
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
            . Respondemos en un máximo de 20 días hábiles.
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
