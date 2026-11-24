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

  // TODA FOTO SUBIDA SE DIBUJA (23 nov 2026). Antes sólo se usaban si eran 3 o
  // 4: Luis subió portada y UNA foto más, y en su página salió una sola.
  it("ninguna foto se pierde: una va sola, dos lado a lado, tres y cuatro en mosaico, la quinta al cierre", () => {
    type Split = { media: { kind: string; images: { url: string; big?: boolean }[]; rows?: string } };
    const de = (n: number) => {
      const fotos = ["a", "b", "c", "d", "e"].slice(0, n).map((x) => `https://fotos.test/${x}.jpg`);
      const bloques = experienciaDesdeCorta({ ...completa, fotos }, { clausulas }).page?.blocks ?? [];
      return {
        split: bloques.find((b) => b.type === "split") as unknown as Split,
        cierre: bloques.find((b) => b.type === "closing") as unknown as { bg: { url: string } },
      };
    };
    expect(de(0).split.media.images).toHaveLength(0);

    const una = de(1).split.media;
    expect(una.kind).toBe("photo");
    expect(una.images.map((i) => i.url)).toEqual(["https://fotos.test/a.jpg"]);

    const dos = de(2).split.media;
    expect(dos.kind).toBe("mosaic");
    expect(dos.images).toHaveLength(2);
    expect(dos.rows).toBe("420px"); // una sola fila: sin media rejilla vacía

    const tres = de(3).split.media;
    expect(tres.images).toHaveLength(3);
    expect(tres.images[0].big).toBe(true);

    expect(de(4).split.media.images).toHaveLength(4);
    // Sin quinta foto, el cierre va sobre la portada: nunca en gris.
    expect(de(4).cierre.bg.url).toBe(completa.portada);
    expect(de(0).cierre.bg.url).toBe(completa.portada);

    const cinco = de(5);
    expect(cinco.split.media.images).toHaveLength(4);
    expect(cinco.cierre.bg.url).toBe("https://fotos.test/e.jpg");
  });

  // Lo que se vio en la página de la operadora de prueba el 23 nov 2026.
  it("el cupo se dice una vez en la tarifa, y el renglón de las fechas lleva el precio delante", () => {
    const tarifa = exp.page?.blocks.find((b) => b.type === "tariff") as unknown as { availK?: string; availV?: string };
    expect(tarifa.availK ?? "").toBe(""); // la plantilla lo deriva de `capacity`: aquí lo duplicaba
    expect(exp.capacity).toBeGreaterThan(0);
    const fechas = exp.page?.blocks.find((b) => b.type === "dates") as unknown as { priceLine?: string };
    expect(fechas.priceLine).toMatch(/^\$[\d,]+ MXN por persona$/);
  });

  it("una operadora sin Instagram NO invita a seguir el de la casa: sólo sale el contacto que ella tiene", () => {
    const sinIg = experienciaDesdeCorta(completa, { clausulas, dueno: { email: "hola@operadora.test", whatsapp: "+52 55 0000 0000" } });
    const cierre = sinIg.page?.blocks.find((b) => b.type === "closing") as unknown as { contacts: { lbl: string; val: string }[] };
    expect(cierre.contacts.map((c) => c.lbl)).toEqual(["WhatsApp", "Email"]);
    expect(JSON.stringify(cierre.contacts)).not.toContain("somos.caminante");
    expect(sinIg.instagram).toBe("");
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
