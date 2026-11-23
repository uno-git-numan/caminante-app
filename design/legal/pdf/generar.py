#!/usr/bin/env python3
"""Genera el PDF del documento de decisiones para Marisol.

Vivía en una carpeta temporal y una limpieza se lo llevó (23 nov 2026); por eso
está aquí. Uso, desde la raíz del repositorio:

    python3 design/legal/pdf/generar.py

Escribe el PDF en Descargas con el nombre de siempre. Necesita el paquete
`markdown` y Google Chrome.
"""
import pathlib, subprocess, sys, tempfile

try:
    import markdown
except ImportError:
    sys.exit("falta el paquete markdown (pip install --user markdown)")

aqui = pathlib.Path(__file__).resolve().parent
fuente = aqui.parent / "DECISIONES-LEGAL-FISCAL-2026-11-11.md"
destino = pathlib.Path.home() / "Downloads" / "Caminante - Decisiones legales y fiscales (11 nov 2026).pdf"
chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

cabeza = (aqui / "cabeza.html").read_text(encoding="utf-8")
cuerpo = markdown.markdown(fuente.read_text(encoding="utf-8"), extensions=["tables", "sane_lists", "smarty"])
with tempfile.TemporaryDirectory() as tmp:
    html = pathlib.Path(tmp) / "decisiones.html"
    html.write_text(cabeza + cuerpo + "\n</body></html>", encoding="utf-8")
    subprocess.run([chrome, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={destino}", f"file://{html}"], check=True, capture_output=True)
print(destino, destino.stat().st_size, "bytes")
