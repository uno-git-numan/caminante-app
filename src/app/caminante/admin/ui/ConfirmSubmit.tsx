"use client";

// Botón submit con confirmación del navegador antes de enviar el form. Para
// acciones que disparan efectos en lote (p. ej. mandar correos a N personas):
// si el usuario cancela, se detiene el submit y no corre la server action.
export default function ConfirmSubmit({
  message,
  className,
  title,
  children,
}: {
  message: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      title={title}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
