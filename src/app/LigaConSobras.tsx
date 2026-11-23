"use client";

// LA LIGA QUE LLEGÓ CON UN PUNTO PEGADO (23 nov 2026).
//
// Una liga copiada de un mensaje suele traer la puntuación de la frase: «entra
// a caminante.numanhub.com/caminante/operadores/aplicar.» — y con ese punto la
// página no existe. Le pasó a Luis haciendo el alta de una operadora, con una
// liga que le mandé yo. La persona no tiene por qué saber qué sobra.
//
// Esto vive en la página de «no encontrada»: si la dirección termina en un
// signo que ninguna de nuestras rutas usa, se quita y se vuelve a intentar UNA
// vez. Si aun limpia no existe, se queda el aviso de siempre.

import { useEffect } from "react";

const SOBRAS = /[.,;:!?)\]»”"']+$/;

export default function LigaConSobras() {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    const limpia = pathname.replace(SOBRAS, "");
    if (limpia && limpia !== pathname) window.location.replace(limpia + search + hash);
  }, []);
  return null;
}
