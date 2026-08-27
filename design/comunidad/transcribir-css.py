"""Transcriptor de CSS de un entregable de Claude Design a admin-css.ts.

Camina el CSS contando llaves — nada de regex sobre el archivo entero, que fue
lo que se rompió: un @keyframes o cualquier at-rule inesperada detenía el bucle
y TODO lo que venía después se perdía en silencio.

Falla ruidosamente si pierde una sola regla. Correr y pegar la salida.
"""
import re, sys, pathlib

SRC = sys.argv[1] if len(sys.argv) > 1 else "design/comunidad/dc/comunidad.dc.html"
css = re.search(r"<style>(.*?)</style>", pathlib.Path(SRC).read_text(), re.S).group(1)

# Familias que YA viven en admin-css.ts (Dashboard, Salidas, Experiencias).
YA = re.compile(r"^\.(ahead|nav|btn|page|sec|card|glass|pad|xhead|xbody|xpad|chev2|xh4|prog|progrow|"
                r"pchips?|pchip|wlist|wl|kpis?|kpi|spark|dots?|dot-l|stars-lg|tbl-wrap|chip|c-|badge|tick|cross|"
                r"filters|detail|dl|mini-form|act-row|barrow|bar|testi|tcard|empty|grid2|subtitle|roster-head|"
                r"mono|mut|eyebrow|display|vtag|vsep|docnote|salper|salfoot|sallk|salsay)\b")
NUEVA = re.compile(r"^\.(cm|gn|lam|hole|varset|varitem)")

def es_nueva(sel):
    s = " ".join(sel.split())
    return bool(NUEVA.match(s)) and not YA.match(s)

def prefijar(sel):
    return ",".join(".adm " + " ".join(s.split()) for s in sel.split(",") if s.strip())

def bloque(txt):
    """Devuelve (piezas, selectores_vistos) recorriendo txt con conteo de llaves."""
    piezas, vistos, i, n = [], [], 0, len(txt)
    while i < n:
        if txt.startswith("/*", i):
            fin = txt.find("*/", i + 2)
            if fin == -1: break
            piezas.append(txt[i:fin + 2]); i = fin + 2; continue
        if txt[i].isspace(): i += 1; continue
        llave = txt.find("{", i)
        if llave == -1: break
        cab = txt[i:llave].strip()
        j, depth = llave, 0
        while j < n:
            if txt[j] == "{": depth += 1
            elif txt[j] == "}":
                depth -= 1
                if depth == 0: break
            j += 1
        cuerpo = txt[llave + 1:j]
        if cab.startswith("@"):
            if cab.startswith(("@media", "@supports")):
                sub, sv = bloque(cuerpo)
                vistos += sv
                if sub: piezas.append(cab + "{\n" + "\n".join("  " + s for s in sub) + "\n}")
            # @keyframes, @font-face y demás: no se tocan, ya viven en el panel.
        else:
            vistos.append(cab)
            if any(es_nueva(s) for s in cab.split(",")):
                piezas.append(f"{prefijar(cab)}{{{' '.join(cuerpo.split())}}}")
        i = j + 1
    return piezas, vistos

piezas, vistos = bloque(css)
txt = "\n".join(piezas)

assert "`" not in txt, "backtick: rompería el template literal de admin-css.ts"
# ⚠️ Se compara el selector COMPLETO ya prefijado, no sólo el primero: una regla
# con varios selectores («a,b») termina en «.adm a,.adm b» y buscar «.adm a{»
# daba un falso positivo en 25 reglas que sí estaban.
plano = txt.replace("\n  ", "\n")
faltan = [s for s in vistos
          if any(es_nueva(x) for x in s.split(","))
          and prefijar(s) + "{" not in plano]
assert not faltan, f"PERDIDAS {len(faltan)}: {faltan[:12]}"

nuevas = sum(1 for s in vistos if any(es_nueva(x) for x in s.split(",")))
print(f"// selectores vistos: {len(vistos)} · nuevos transcritos: {nuevas}", file=sys.stderr)
print(txt)
