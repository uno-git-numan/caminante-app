import { getCurrentRole } from "@/lib/auth/authorization";
import SiteChrome from "./SiteChrome";

export default async function CaminanteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getCurrentRole();

  return <SiteChrome role={role}>{children}</SiteChrome>;
}
