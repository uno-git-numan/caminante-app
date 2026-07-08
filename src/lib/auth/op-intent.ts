// Nombre de la cookie de "intención de operador" (se pone en el alta, se lee en
// /bienvenida). En archivo aparte porque un módulo "use server" (actions.ts)
// solo puede exportar funciones async, no constantes.
export const OP_INTENT_COOKIE = "cam_op_intent";
