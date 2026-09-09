"use client";

// La liga, copiable. Vive aparte porque es lo único de esta pantalla que toca
// el portapapeles, y así el resto puede renderizarse sin JavaScript del cliente.

import { useState } from "react";

export default function Copiar({ url }: { url: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="sallk">
      <span>{url.replace(/^https?:\/\//, "")}</span>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => {
          void navigator.clipboard.writeText(url);
          setOk(true);
        }}
      >
        {ok ? "Copiada" : "Copiar"}
      </button>
    </div>
  );
}
