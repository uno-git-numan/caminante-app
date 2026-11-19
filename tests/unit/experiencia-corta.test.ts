import { describe, expect, it } from "vitest";
import { CORTA_VACIA, datosOfertaDe, etiquetaDeSalida, experienciaDesdeCorta, faltantesDeCorta, renglonesDeOferta, RENGLON_SEGURO, type ExperienciaCorta } from "@/lib/experiences/corta";
import { encuestaLista, deslindeListo, listaParaPublicar } from "@/lib/experiences/flujo-venta";
import { clausulasEstandar } from "@/lib/legal/clausulas-estandar";

// El alta rápida: pocos datos de entrada, una experiencia completa de salida.

const completa: ExperienciaCorta = {
  titulo: "Amanecer en el Nevado",
  lugar: "Nevado de Toluca, Zinacantepec",
  estado: "Estado de México",
  actividad: "senderismo",
  descripcion: "Subimos de madrugada al cráter para ver salir el sol sobre las lagunas.\nBajamos por la vereda del bosque y desayunamos en el refugio.",
  portada: "https://ejemplo.test/portada.jpg",
  fotos: ["https://ejemplo.test/1.jpg", "https://ejemplo.test/2.jpg", "https://ejemplo.test/3.jpg"],
  incluye: ["Guía certificado", "Desayuno", ""],
  noIncluye: ["Transporte desde tu ciudad"],
  horaInicio: "05:00",
  horaTermino: "13:00",
  exigencia: "media",
  edadMinima: "12",
  precio: "1,850",
  cupo: "12",
  politica: "estandar",
};

describe("qué le falta al alta rápida", () => {
  it("vacía, lo dice todo junto y en el orden de la pantalla", () => {
    const f = faltantesDeCorta(CORTA_VACIA).map((x) => x.campo);
    expect(f).toEqual(["titulo", "lugar", "estado", "actividad", "descripcion", "portada", "incluye", "horaInicio", "horaTermino", "exigencia", "edadMinima", "precio"]);
  });

  it("completa, no le falta nada", () => {
    expect(faltantesDeCorta(completa)).toEqual([]);
  });

  it("el cupo es opcional; la edad mínima acepta cero", () => {
    expect(faltantesDeCorta({ ...completa, cupo: "", edadMinima: "0" })).toEqual([]);
    expect(faltantesDeCorta({ ...completa, cupo: "doce" }).map((x) => x.campo)).toEqual(["cupo"]);
  });

  it("no acepta una hora mal escrita, un precio de cero ni una política desconocida", () => {
    expect(faltantesDeCorta({ ...completa, horaInicio: "5 am", precio: "0", politica: "otra" }).map((x) => x.campo)).toEqual(["horaInicio", "precio", "politica"]);
  });
});

describe("la experiencia que sale", () => {
  const clausulas = ["Participo de forma libre y voluntaria."];
  const exp = experienciaDesdeCorta(completa, { clausulas });

  it("nace en borrador, con su dirección, su actividad y su política", () => {
    expect(exp).toMatchObject({ slug: "amanecer-en-el-nevado", status: "draft", actividad: "senderismo", estado: "Estado de México", politicaCancelacion: "estandar", capacity: 12, design: "v2" });
  });

  it("el precio que se cobra y el que se muestra son el mismo", () => {
    expect(exp.price?.amount).toBe("1850");
    const tarifa = exp.page?.blocks.find((b) => b.type === "tariff") as { price: string } | undefined;
    expect(tarifa?.price).toBe("$1,850");
  });

  it("la página trae portada, lo que vas a vivir, tarifa, qué incluye, fechas y cierre, y nada vacío", () => {
    expect(exp.page?.blocks.map((b) => b.type)).toEqual(["hero", "split", "tariff", "checklist", "dates", "closing"]);
  });

  const incluyeDe = (e: ReturnType<typeof experienciaDesdeCorta>) => (e.page?.blocks.find((b) => b.type === "checklist") as { yesItems: string[]; noItems: string[] });

  it("sin póliza confirmada NO promete seguro: la lista queda como se escribió", () => {
    expect(incluyeDe(exp).yesItems).toEqual(["Guía certificado", "Desayuno"]);
    expect(incluyeDe(exp).noItems).toEqual(["Transporte desde tu ciudad"]);
  });

  it("con seguro (operadora con convenio) agrega el renglón, una sola vez", () => {
    expect(incluyeDe(experienciaDesdeCorta(completa, { clausulas, conSeguro: true })).yesItems).toEqual(["Guía certificado", "Desayuno", RENGLON_SEGURO]);
    const yaLoDice = experienciaDesdeCorta({ ...completa, incluye: ["Seguro de gastos médicos"] }, { clausulas, conSeguro: true });
    expect(incluyeDe(yaLoDice).yesItems).toEqual(["Seguro de gastos médicos"]);
  });

  it("con el deslinde estándar de legal para su actividad pasa el candado de publicar", () => {
    const estandar = clausulasEstandar({ actividad: completa.actividad, edadMinima: 12, conSeguro: false })!;
    const conEstandar = experienciaDesdeCorta(completa, { clausulas: estandar });
    expect(conEstandar.registration?.active).toBe(true);
    expect(listaParaPublicar(conEstandar).ok).toBe(true);
  });

  it("con tres fotos arma el mosaico; con dos, la sección va sin fotos", () => {
    const con = exp.page?.blocks.find((b) => b.type === "split") as { media: { images: unknown[] } };
    expect(con.media.images).toHaveLength(3);
    const sin = experienciaDesdeCorta({ ...completa, fotos: completa.fotos.slice(0, 2) }, { clausulas }).page?.blocks.find((b) => b.type === "split") as { media: { images: unknown[] } };
    expect(sin.media.images).toHaveLength(0);
  });

  it("el contacto es el de quien la crea", () => {
    const suya = experienciaDesdeCorta(completa, { clausulas, dueno: { email: "hola@operadora.test", whatsapp: "+52 55 0000 0000", instagram: "@operadora" } });
    expect(suya).toMatchObject({ email: "hola@operadora.test", whatsapp: "525500000000", instagram: "operadora" });
  });

  it("sale con la encuesta estándar prendida y el deslinde con las cláusulas que se le pasaron: pasa el candado de publicar", () => {
    expect(encuestaLista(exp).ok).toBe(true);
    expect(deslindeListo(exp).ok).toBe(true);
    expect(listaParaPublicar(exp).ok).toBe(true);
  });

  it("sin cláusulas el deslinde nace apagado: no se inventa una para pasar el candado", () => {
    const sin = experienciaDesdeCorta(completa);
    expect(sin.registration?.active).toBe(false);
    expect(listaParaPublicar(sin).ok).toBe(false);
  });
});

describe("los datos de la oferta en la ficha", () => {
  it("se leen en un renglón corto", () => {
    expect(renglonesDeOferta(datosOfertaDe(experienciaDesdeCorta(completa)))).toEqual(["De 5:00 a 13:00 h", "Exigencia media", "Desde 12 años"]);
    expect(renglonesDeOferta({ horaInicio: "07:30", horaTermino: "18:00", exigencia: "muy-alta", edadMinima: 0 })).toEqual(["De 7:30 a 18:00 h", "Exigencia muy alta", "Sin edad mínima"]);
  });

  it("una experiencia de antes, sin esos datos, no enseña nada", () => {
    expect(datosOfertaDe({})).toBeNull();
    expect(renglonesDeOferta(null)).toEqual([]);
  });
});

describe("la etiqueta de la primera fecha", () => {
  it("un día, varios días del mismo mes, y a caballo entre dos meses", () => {
    expect(etiquetaDeSalida("2026-12-12", "")).toBe("Dic 12");
    expect(etiquetaDeSalida("2026-12-12", "2026-12-12")).toBe("Dic 12");
    expect(etiquetaDeSalida("2026-12-12", "2026-12-13")).toBe("Dic 12-13");
    expect(etiquetaDeSalida("2026-11-30", "2026-12-02")).toBe("Nov 30 - Dic 2");
  });
});
