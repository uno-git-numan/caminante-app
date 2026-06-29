import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import CobroForm from "./CobroForm";

export const metadata = { title: "Cobrar por WhatsApp · Admin" };

export default async function CobroPage() {
  if (!(await isCurrentUserAdmin())) {
    redirect("/caminante/login?next=/caminante/admin/cobro");
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-3xl font-light text-lagoon">
        Cobrar <span className="font-semibold text-dune">por WhatsApp</span>
      </h1>
      <p className="mt-2 text-sm text-olive">
        Genera un link de pago por persona (precio × personas) atado a la reserva del
        cliente. Cópialo y pégalo en WhatsApp. Cuando paguen, el pago se registra solo
        y la reserva avanza a <em>Paid</em> en el pipeline.
      </p>
      <div className="mt-8">
        <CobroForm />
      </div>
    </div>
  );
}
