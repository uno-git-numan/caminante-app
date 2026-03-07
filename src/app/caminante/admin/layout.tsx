import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/caminante/login?next=/caminante/admin");
  }

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/caminante?error=not_admin");
  }

  return <>{children}</>;
}
