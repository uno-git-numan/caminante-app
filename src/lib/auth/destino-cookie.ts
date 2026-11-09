// A dónde iba la persona cuando pidió su código o liga de acceso (9 nov 2026).
// La escribe `pedirCodigo` (lib/auth/actions.ts) y la lee `auth/confirm` cuando
// la liga del correo llega sin destino: Supabase sólo respeta `emailRedirectTo`
// si está en su lista de URLs permitidas, y una ruta como
// /caminante/g/<token>/entrar caía a la portada — la invitada perdía el grupo.
export const DESTINO_COOKIE = "cam_destino";
