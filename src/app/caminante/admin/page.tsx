import Link from "next/link";

const adminLinks = [
  "/caminante/admin/providers",
  "/caminante/admin/listings",
  "/caminante/admin/bookings/requests",
  "/caminante/admin/payouts",
  "/caminante/admin/support",
];

export default function AdminHomePage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Admin dashboard</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {adminLinks.map((href) => (
          <Link key={href} href={href} className="rounded-xl border border-stone-200 bg-white p-4 hover:border-emerald-700">
            {href}
          </Link>
        ))}
      </div>
    </section>
  );
}
