#!/usr/bin/env python3
"""Chequeo ESTRUCTURAL de archivos TS/TSX — el sustituto de `tsc` cuando no hay
node en la máquina (el verificador real es el build de Vercel, y esperar 3
minutos para descubrir un backtick suelto ya nos costó un build).

No pretende ser un compilador. Atrapa lo que de verdad se rompe al editar con
sed/python:
  · delimitadores desbalanceados ({ } ( ) [ ]) fuera de cadenas y comentarios
  · template literals / cadenas sin cerrar
  · imports que apuntan a archivos que no existen
  · identificadores importados que nadie usa (ESLint los marca y el build cae)

Uso:  python3 scripts/verificacion/estructura.py <archivo.tsx> [...]
"""
import os
import re
import sys

def escanear(src: str):
    """Recorre el archivo como un lexer chico. Devuelve (errores, pila_final)."""
    err, pila = [], []
    i, n, linea = 0, len(src), 1
    pares = {")": "(", "]": "[", "}": "{"}
    while i < n:
        c = src[i]
        if c == "\n":
            linea += 1; i += 1; continue
        # comentarios
        if c == "/" and i + 1 < n:
            if src[i+1] == "/":
                j = src.find("\n", i)
                i = n if j < 0 else j
                continue
            if src[i+1] == "*":
                j = src.find("*/", i + 2)
                if j < 0:
                    err.append(f"L{linea}: comentario /* sin cerrar"); break
                linea += src.count("\n", i, j); i = j + 2
                continue
        # cadenas
        if c in "\"'":
            j, ini = i + 1, linea
            while j < n:
                if src[j] == "\\": j += 2; continue
                if src[j] == "\n": break
                if src[j] == c: break
                j += 1
            if j >= n or src[j] != c:
                err.append(f"L{ini}: cadena {c} sin cerrar")
                i = j + 1; continue
            i = j + 1; continue
        # template literal (con ${ } anidado)
        if c == "`":
            j, ini, prof = i + 1, linea, 0
            cerrado = False
            while j < n:
                if src[j] == "\\": j += 2; continue
                if src[j] == "\n": linea += 1; j += 1; continue
                if src[j] == "$" and j + 1 < n and src[j+1] == "{": prof += 1; j += 2; continue
                if src[j] == "}" and prof > 0: prof -= 1; j += 1; continue
                if src[j] == "`" and prof == 0: cerrado = True; break
                j += 1
            if not cerrado:
                err.append(f"L{ini}: template literal ` sin cerrar"); break
            i = j + 1; continue
        if c in "([{":
            pila.append((c, linea)); i += 1; continue
        if c in ")]}":
            if not pila:
                err.append(f"L{linea}: '{c}' de más"); i += 1; continue
            ab, ab_l = pila.pop()
            if ab != pares[c]:
                err.append(f"L{linea}: '{c}' cierra un '{ab}' abierto en L{ab_l}")
            i += 1; continue
        i += 1
    return err, pila

def imports_de(src: str):
    for m in re.finditer(r'^\s*import\s+([^;]*?)\s+from\s+["\']([^"\']+)["\'];', src, re.M):
        yield m.group(1), m.group(2), src[:m.start()].count("\n") + 1

def main(archivos):
    raiz = os.getcwd()
    fallos = 0
    for f in archivos:
        src = open(f, encoding="utf-8").read()
        problemas = []
        err, pila = escanear(src)
        problemas += err
        problemas += [f"L{l}: '{c}' nunca se cierra" for c, l in pila]

        for clausula, mod, ln in imports_de(src):
            # resolución del import
            if mod.startswith("@/"):
                base = os.path.join(raiz, "src", mod[2:])
            elif mod.startswith("."):
                base = os.path.normpath(os.path.join(os.path.dirname(f), mod))
            else:
                base = None  # paquete de node_modules: fuera de alcance
            if base and not any(
                os.path.exists(base + ext)
                for ext in ("", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx")
            ):
                problemas.append(f"L{ln}: import inexistente → {mod}")
            # identificadores importados sin usar
            nombres = []
            c = clausula
            llaves = re.search(r"\{([^}]*)\}", c)
            if llaves:
                for parte in llaves.group(1).split(","):
                    parte = parte.strip()
                    if not parte or parte.startswith("type "):
                        parte = parte[5:].strip() if parte.startswith("type ") else parte
                    if not parte:
                        continue
                    nombres.append(parte.split(" as ")[-1].strip())
                c = c[: llaves.start()] + c[llaves.end() :]
            for parte in c.split(","):
                parte = parte.strip().rstrip(",")
                if parte and re.fullmatch(r"[A-Za-z_$][\w$]*", parte):
                    nombres.append(parte)
            cuerpo = src[: src.index("from", src.find(clausula))] + src[src.find(mod) + len(mod) :]
            for nom in nombres:
                usos = len(re.findall(r"\b" + re.escape(nom) + r"\b", src))
                if usos <= 1:
                    problemas.append(f"L{ln}: '{nom}' importado y nunca usado (ESLint tumba el build)")

        rel = os.path.relpath(f, raiz)
        if problemas:
            fallos += 1
            print(f"✗ {rel}")
            for p in problemas:
                print(f"    {p}")
        else:
            print(f"✓ {rel}")
    print()
    print("TODO BIEN" if not fallos else f"{fallos} archivo(s) con problemas")
    return 1 if fallos else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
