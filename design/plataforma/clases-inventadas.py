#!/usr/bin/env python3
"""¿Estoy usando una clase que el entregable nunca usó?

El chequeo viejo preguntaba «¿existe esta clase en el CSS?» y por eso dejó
pasar `.cmch`: existe —es un CONTENEDOR de botones— pero el entregable jamás
la puso como chip. La pregunta correcta es «¿el entregable usa esta clase?».

Una clase que está en el CSS y no en el markup es una de dos cosas: un selector
de contexto (`.cmc .cmtag`) o basura. Ninguna de las dos es algo que yo pueda
escribir a mano sin haber visto cómo se ve.
"""
import pathlib, re, sys

RAIZ = pathlib.Path(__file__).resolve().parents[2]
# TODOS los entregables: el panel se armó de varios y una clase legítima puede
# venir de cualquiera. Mirar sólo el último es lo que producía falsas alarmas.
DCS = sorted(RAIZ.glob("design/*/dc/*.html"))
CSS = RAIZ / "src/app/caminante/admin/ui/admin-css.ts"
MIOS = [
    "src/app/caminante/admin/plataforma",
    "src/app/caminante/admin/ui/Cajon.tsx",
]

# Clases nuestras, no del entregable: utilidades de Next/React o del panel viejo.
# .no-print no sale de ningún entregable: es la utilidad de impresión del panel.
PERDONADAS = {"adm", "fin", "no-print"}

# Por clase, CON QUÉ ETIQUETAS la usa el entregable. El nombre solo no basta:
# `cmch` existe —es un <div> contenedor de botones— y ponerla en un <span>
# como si fuera un chip compila, pasa cualquier chequeo de nombres y se ve
# como texto crudo. La etiqueta es lo que distingue las dos cosas.
enMarkup = {}
for dcf in DCS:
    for m in re.finditer(r"<([a-zA-Z][\w-]*)([^>]*)\bclass=\"([^\"]+)\"", dcf.read_text()):
        tag, clases = m.group(1).lower(), m.group(3).split()
        for c in clases:
            enMarkup.setdefault(c, set()).add(tag)

css = CSS.read_text()
enCss = set(re.findall(r"\.([a-zA-Z][\w-]*)", css))

usadas = {}
for ruta in MIOS:
    p = RAIZ / ruta
    archivos = sorted(p.rglob("*.tsx")) if p.is_dir() else [p]
    for f in archivos:
        src = f.read_text()
        for m in re.finditer(r'className=(?:"([^"]*)"|\{`([^`]*)`\})', src):
            crudo = m.group(1) or m.group(2) or ""
            # La etiqueta es el último `<algo` abierto antes de este className.
            antes = src[:m.start()]
            tags = re.findall(r"<([a-zA-Z][\w-]*)", antes)
            tag = tags[-1].lower() if tags else "?"
            # En `cmc${dormida ? " sleep" : ""}` la clase es "sleep"; `dormida`
            # es una VARIABLE. Contarla como clase era ruido que enterraba las
            # alarmas de verdad. Cuenta lo de fuera de ${...} y, dentro, sólo
            # lo que va entre comillas.
            literal = re.sub(r"\$\{[^{}]*\}", " ", crudo)
            for m2 in re.finditer(r"\$\{([^{}]*)\}", crudo):
                # Sólo lo que va DESPUÉS de ? o :, que es donde vive la clase.
                # En `done === "aprobada" ? "c-paid" : "c-canc"` la primera
                # cadena es una comparación, no algo que se pinte.
                literal += " " + " ".join(
                    re.findall(r"[?:]\s*[\"']([^\"']*)[\"']", m2.group(1))
                )
            for tok in literal.split():
                if re.fullmatch(r"[a-zA-Z][\w-]*", tok):
                    usadas.setdefault(tok, set()).add((f.relative_to(RAIZ), tag))

inventadas, solo_css, mal_tag = [], [], []
for c, donde in sorted(usadas.items()):
    if c in PERDONADAS:
        continue
    if c in enMarkup:
        # Componentes de React (<Cajon>, <Link>) no son etiquetas HTML: su
        # className viaja a otro lado y aquí no se puede saber a cuál.
        malos = {(f, tg) for f, tg in donde
                 if tg[0].islower() and tg not in enMarkup[c]}
        if malos:
            mal_tag.append((c, sorted(enMarkup[c]), malos))
        continue
    (solo_css if c in enCss else inventadas).append((c, donde))

fmt = lambda d: ", ".join("%s <%s>" % (f, tg) for f, tg in sorted(d))
for c, donde in inventadas:
    print("INVENTADA  .%-14s no existe ni en el markup ni en el CSS  %s"
          % (c, fmt(donde)))
for c, donde in solo_css:
    print("SOLO-CSS   .%-14s está en el CSS pero ningún entregable la usa  %s"
          % (c, fmt(donde)))
for c, ok, malos in mal_tag:
    print("OTRA-COSA  .%-14s el entregable sólo la usa en <%s>  %s"
          % (c, ">, <".join(ok), fmt(malos)))

total = len(inventadas) + len(solo_css) + len(mal_tag)
print("\n%d clases revisadas · %d sospechosas" % (len(usadas), total))
sys.exit(1 if total else 0)
