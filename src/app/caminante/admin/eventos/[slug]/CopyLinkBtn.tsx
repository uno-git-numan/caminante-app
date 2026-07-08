"use client";

// Botón "Copiar link" de una salida PRIVADA (link cerrado de grupo).
import { useState } from "react";

export default function CopyLinkBtn({ link }: { link: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-glass btn-sm"
      title={link}
      onClick={async () => {
        await navigator.clipboard.writeText(link);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
    >
      {ok ? "✓ Copiado" : "Copiar link"}
    </button>
  );
}
