#!/usr/bin/env python3
"""Deriva CONVENIO-v3-FIRMABLE.md de CONVENIO-v3.md.

El documento de trabajo lleva notas para el abogado (🔸), comentarios (>) y la
tabla de cambios. Lo que se firma es SOLO lo que está entre <!-- FIRMABLE --> y
<!-- /FIRMABLE -->, sin esas líneas. La pantalla de firma pinta únicamente
títulos (#) y negritas (**); el script avisa si queda algo que no pinta.

    python3 design/operadores/derivar-firmable.py
"""
import re, sys, pathlib

base = pathlib.Path(__file__).resolve().parent
src = (base / "CONVENIO-v3.md").read_text(encoding="utf-8")
dst = base / "CONVENIO-v3-FIRMABLE.md"

m = re.search(r"<!-- FIRMABLE -->\n(.*?)<!-- /FIRMABLE -->", src, re.S)
if not m:
    sys.exit("no encontré los marcadores <!-- FIRMABLE --> … <!-- /FIRMABLE -->")

out = []
for linea in m.group(1).split("\n"):
    l = linea.strip()
    if l.startswith("🔸") or l.startswith(">") or l.startswith("<!--") or l == "---":
        continue
    out.append(linea.rstrip())

texto = re.sub(r"\n{3,}", "\n\n", "\n".join(out)).strip() + "\n"

# Las mismas guardas que scripts/publicar-convenio.mjs, más las del renderizador.
problemas = []
if re.search(r"REVISI[ÓO]N LEGAL", texto, re.I): problemas.append("dice «revisión legal»")
if "🔸" in texto: problemas.append("quedó un 🔸")
if re.search(r"no ser un documento firmable|ning[úu]n abogado", texto, re.I): problemas.append("dice que no es firmable")
if not texto.startswith("# "): problemas.append("la primera línea no es el título «# »")
for n, l in enumerate(texto.split("\n"), 1):
    if "|" in l: problemas.append(f"línea {n}: tabla o barra, la pantalla no la pinta")
    if re.search(r"(?<!\*)\*(?!\*)[^*]+\*(?!\*)", l): problemas.append(f"línea {n}: cursiva, la pantalla no la pinta")
    if re.search(r"\[[^\]]+\]\(", l): problemas.append(f"línea {n}: enlace markdown, la pantalla no lo pinta")
    if re.search(r"\[___\]|\[[A-ZÁÉÍÓÚ ]{4,}\]", l): problemas.append(f"línea {n}: campo sin llenar")
if problemas:
    print("NO SE ESCRIBE. Problemas:", *("  · " + p for p in problemas), sep="\n")
    sys.exit(1)

dst.write_text(texto, encoding="utf-8")
print(f"ok · {dst.name} · {len(texto.splitlines())} líneas")
