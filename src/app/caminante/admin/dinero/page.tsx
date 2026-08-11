import { redirect } from "next/navigation";

// «Dinero» y «Rentabilidad» se fundieron en «Recursos» (Luis, 11 ago): dos
// páginas que hablan del mismo dinero se leen como redundancia y obligan a
// saltar entre ellas para cerrar una cuenta.
//
// La ruta se queda como redirección, no se borra: está enlazada desde correos,
// notas y la memoria del equipo. Regla de sistema limpio — lo obsoleto se
// elimina, pero migrando antes a quien ya lo usaba.
export default function DineroPage() {
  redirect("/caminante/admin/recursos");
}
