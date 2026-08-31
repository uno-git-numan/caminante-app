"""Transcriptor de CSS del entregable de la plataforma a admin-css.ts.

Diferencia con el de Comunidad: aquel decidía qué era nuevo con una lista de
PREFIJOS escrita a mano (`.cm`, `.gn`…). Eso obliga a adivinar las familias
antes de leer el archivo, y adivinar es exactamente lo que se rompió la primera
vez. Aquí no se adivina: cada regla se compara contra lo que YA existe en
admin-css.ts. Si el selector ya está, se salta; si no, se transcribe.

Igual que el otro, camina el CSS contando llaves —nada de regex sobre el archivo
entero, que se detiene en la primera at-rule inesperada y pierde en silencio todo
lo que venía después— y falla ruidosamente si pierde una sola regla.

Correr:  python3 design/plataforma/transcribir-css.py
Escribe el bloque nuevo en design/plataforma/css-nuevo.txt para pegarlo.
"""
import re, sys, pathlib

SRC = sys.argv[1] if len(sys.argv) > 1 else "design/plataforma/dc/plataforma.dc.html"
DEST = "src/app/caminante/admin/ui/admin-css.ts"
SALIDA = "design/plataforma/css-nuevo.txt"

css = re.search(r"<style[^>]*>(.*?)</style>", pathlib.Path(SRC).read_text(), re.S).group(1)
ya_ts = pathlib.Path(DEST).read_text()


def normalizar(sel: str) -> str:
    """Colapsa espacios para que el selector se compare igual escrito de dos formas."""
    return " ".join(sel.split())


def prefijar(sel: str) -> str:
    """`.foo, .bar` → `.adm .foo,.adm .bar`. Cada rama lleva su prefijo: sin eso,
    una lista de selectores se cuela a medias y la mitad aplica fuera del panel."""
    return ",".join(".adm " + normalizar(s) for s in sel.split(",") if s.strip())


def ya_existe(sel_prefijado: str) -> bool:
    """¿Alguna rama de este selector ya vive en admin-css.ts?"""
    plano = ya_ts.replace("\n  ", "\n")
    return all(rama + "{" in plano for rama in sel_prefijado.split(","))


def recorrer(txt: str):
    """(cabecera, cuerpo_completo) por cada regla, contando llaves."""
    i, n = 0, len(txt)
    while i < n:
        if txt.startswith("/*", i):
            fin = txt.find("*/", i + 2)
            if fin == -1:
                return
            i = fin + 2
            continue
        if txt[i].isspace():
            i += 1
            continue
        llave = txt.find("{", i)
        if llave == -1:
            return
        cab = txt[i:llave].strip()
        j, prof = llave, 0
        while j < n:
            if txt[j] == "{":
                prof += 1
            elif txt[j] == "}":
                prof -= 1
                if prof == 0:
                    break
            j += 1
        if j >= n:
            sys.exit(f"ABORTADO: llave sin cerrar en «{cab[:60]}»")
        yield cab, txt[llave + 1 : j].strip()
        i = j + 1


piezas, nuevos, saltados, at_rules = [], [], 0, 0
for cab, cuerpo in recorrer(css):
    if cab.startswith("@"):
        # Las at-rules (@media, @keyframes, @font-face) llevan reglas adentro:
        # se prefijan una por una, no la cabecera.
        if cab.startswith(("@font-face", "@keyframes")):
            at_rules += 1
            continue  # las fuentes y animaciones base ya viven en el panel
        dentro = [
            f"{prefijar(c2)}{{{b2}}}"
            for c2, b2 in recorrer(cuerpo)
            if not ya_existe(prefijar(c2))
        ]
        if dentro:
            piezas.append(f"{cab}{{" + "".join(dentro) + "}")
            nuevos.extend(dentro)
        continue
    if cab.startswith(":root") or cab in ("*", "html", "body", "button"):
        saltados += 1  # variables y reset: ya están, y pisarlas sería otro bug
        continue
    pref = prefijar(cab)
    if ya_existe(pref):
        saltados += 1
        continue
    regla = f"{pref}{{{cuerpo}}}"
    piezas.append(regla)
    nuevos.append(regla)

salida = "\n".join(piezas)

# ── La guarda ────────────────────────────────────────────────────────────────
# Cada regla que dijimos transcribir tiene que estar en la salida. Sin esto el
# script puede perder una y nadie se entera hasta que la pantalla se ve "casi
# bien" — que es peor que verse rota, porque nadie la reporta.
perdidas = [r for r in nuevos if r not in salida]
if perdidas:
    sys.exit(f"ABORTADO: {len(perdidas)} reglas se perdieron al ensamblar:\n" + "\n".join(perdidas[:5]))

# Invariante 15: un backtick dentro del template literal de admin-css.ts cierra
# la cadena a media hoja y el build truena en un punto que no dice nada.
if "`" in salida:
    sys.exit("ABORTADO: el CSS trae un backtick. Quítalo antes de pegar (invariante 16).")

pathlib.Path(SALIDA).write_text(salida + "\n")
print(f"  reglas nuevas transcritas : {len(nuevos)}")
print(f"  ya existían en el panel   : {saltados}")
print(f"  @font-face/@keyframes base: {at_rules} (omitidas a propósito)")
print(f"  escrito en                : {SALIDA} ({len(salida):,} chars)")
