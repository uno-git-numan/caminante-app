import re, sys, pathlib

def strip_comments(t):
    return re.sub(r"/\*.*?\*/", "", t, flags=re.S)

def rules(css, ctx=""):
    """Devuelve [(contexto, selector, declaraciones)] aplanando @media."""
    out = []
    i = 0
    css = strip_comments(css)
    while i < len(css):
        at = css.find("@", i)
        brace = css.find("{", i)
        if brace == -1: break
        if at != -1 and at < brace:
            # at-rule con bloque
            pre = css[at:brace].strip()
            depth, j = 0, brace
            while j < len(css):
                if css[j] == "{": depth += 1
                elif css[j] == "}":
                    depth -= 1
                    if depth == 0: break
                j += 1
            if pre.startswith("@media") or pre.startswith("@supports"):
                out += rules(css[brace+1:j], (ctx + " " + pre).strip())
            i = j + 1
            continue
        sel = css[:brace][i:].strip() if False else css[i:brace].strip()
        end = css.find("}", brace)
        decl = css[brace+1:end].strip()
        for s in sel.split(","):
            s = " ".join(s.split())
            if s: out.append((ctx, s, decl))
        i = end + 1
    return out

def norm_decl(d):
    parts = [" ".join(p.split()) for p in d.split(";")]
    return ";".join(sorted(p for p in parts if p))

def norm_media(m):
    return " ".join(m.replace(" ", "").split())

dc = pathlib.Path(sys.argv[1]).read_text()
style = re.search(r"<style>(.*?)</style>", dc, re.S).group(1)
want = rules(style)

adm = pathlib.Path("src/app/caminante/admin/ui/admin-css.ts").read_text()
have = rules(adm)

# índice de lo que tenemos: quitamos el prefijo .adm para comparar
idx = {}
for ctx, sel, decl in have:
    s = re.sub(r"^\.adm\s+", "", sel)
    s = re.sub(r"^\.adm$", "BODY", s)
    idx.setdefault((norm_media(ctx), s), []).append(decl)

only = sys.argv[2] if len(sys.argv) > 2 else ""
faltan, difieren = [], []
for ctx, sel, decl in want:
    if only and only not in sel: continue
    key = (norm_media(ctx), sel)
    if key not in idx:
        faltan.append((ctx, sel, decl))
    elif not any(norm_decl(d) == norm_decl(decl) for d in idx[key]):
        difieren.append((ctx, sel, decl, idx[key]))

print(f"=== FALTAN por completo: {len(faltan)} ===")
for ctx, sel, decl in faltan:
    print(f"  [{ctx or 'base'}] {sel} {{{decl[:110]}}}")
print(f"\n=== DIFIEREN: {len(difieren)} ===")
for ctx, sel, decl, mine in difieren:
    print(f"  [{ctx or 'base'}] {sel}")
    print(f"      dc : {decl[:150]}")
    print(f"      mío: {mine[0][:150]}")
