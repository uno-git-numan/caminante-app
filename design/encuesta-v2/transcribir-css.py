import re, pathlib

SRC = "design/encuesta-v2/dc/experiencias.dc.html"
css = re.search(r"<style>(.*?)</style>", pathlib.Path(SRC).read_text(), re.S).group(1)
# solo la sección que Claude Design marcó como nueva para esta pantalla
nuevo = css.split("/* ══ NUEVO · solo para esta pantalla ══ */", 1)[1]

# Conflictan con el entregable del Dashboard, que viste las otras 12 pantallas
# del panel. Se dejan fuera a propósito y se le dice a Luis.
OMITIR = {"a", "a:hover", ".nav a", ".nav a.on"}

def prefijar(sel):
    partes = []
    for s in sel.split(","):
        s = " ".join(s.split())
        if not s: continue
        if s in OMITIR: return None
        partes.append(".adm " + s)
    return ",".join(partes)

salida, i, omitidas = [], 0, []
while i < len(nuevo):
    com = re.match(r"\s*/\*(.*?)\*/", nuevo[i:], re.S)
    if com:
        salida.append("/*" + com.group(1) + "*/")
        i += com.end()
        continue                      # ← el fallo era caerse aquí y comerse la regla
    m = re.match(r"\s*(@media[^{]*)\{", nuevo[i:])
    if m:
        j, depth = i + m.end() - 1, 0
        while j < len(nuevo):
            if nuevo[j] == "{": depth += 1
            elif nuevo[j] == "}":
                depth -= 1
                if depth == 0: break
            j += 1
        cuerpo = nuevo[i + m.end(): j]
        dentro = []
        for sel, decl in re.findall(r"([^{}]+)\{([^{}]*)\}", cuerpo):
            p = prefijar(sel)
            if p is None: omitidas.append(sel.strip()); continue
            dentro.append(f"  {p}{{{decl.strip()}}}")
        if dentro:
            salida.append(m.group(1).strip() + "{\n" + "\n".join(dentro) + "\n}")
        i = j + 1
        continue
    m = re.match(r"\s*([^{}@]+)\{([^{}]*)\}", nuevo[i:])
    if m:
        p = prefijar(m.group(1))
        if p is None: omitidas.append(m.group(1).strip())
        else: salida.append(f"{p}{{{m.group(2).strip()}}}")
        i += m.end()
        continue
    break

txt = "\n".join(salida)

# ── guardas: que no vuelva a pasar ──
assert "`" not in txt, "backtick dentro del template literal rompe el build"
esperadas = [s for s, _ in re.findall(r"([^{}@/][^{}@]*)\{([^{}]*)\}", re.sub(r"/\*.*?\*/", "", nuevo, flags=re.S))]
faltan = []
for sel in esperadas:
    prim = " ".join(sel.split(",")[0].split())
    if prim in OMITIR or prim.startswith("@"): continue
    if f".adm {prim}{{" not in txt.replace("\n  ", "\n"): faltan.append(prim)
assert not faltan, f"reglas perdidas en la transcripcion: {faltan}"
print(f"reglas transcritas: {txt.count('{')} · omitidas por conflicto: {sorted(set(omitidas))}")
print(txt)  # se pega en admin-css.ts; auditar-css.py comprueba que no falte nada
