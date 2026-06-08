import { getCurrentUser } from "@/lib/auth/session";
import SiteChrome from "./SiteChrome";

export default async function CaminanteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return <SiteChrome user={Boolean(user)}>{children}</SiteChrome>;
}
