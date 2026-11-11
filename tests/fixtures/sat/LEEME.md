# Esquemas del SAT (copias locales)

Descargados de sat.gob.mx el 12 nov 2026 para validar el complemento
«Servicios Plataformas Tecnológicas» 1.0 sin red:

- `ServiciosPlataformasTecnologicas10.xsd` — http://www.sat.gob.mx/esquemas/retencionpago/1/PlataformasTecnologicas10/ServiciosPlataformasTecnologicas10.xsd
  (único cambio: los `schemaLocation` de sus imports apuntan a estas copias)
- `catPT.xsd` — .../PlataformasTecnologicas10/catalogos/CatPlataformasTecnologicas.xsd
- `catRet.xsd` — http://www.sat.gob.mx/esquemas/retencionpago/1/catalogos/catRetenciones.xsd
- `tdCFDI.xsd` — http://www.sat.gob.mx/sitio_internet/cfd/tipoDatos/tdCFDI/tdCFDI.xsd

Si el SAT publica una revisión nueva, se vuelven a bajar y la prueba
`tests/unit/cfdi-retenciones.test.ts` dice si el XML sigue siendo válido.
