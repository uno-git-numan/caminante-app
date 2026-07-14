// Contenido editorial de una página de destino (por estado). TODO opcional
// salvo el hero: el template renderiza cada sección solo si su contenido existe,
// así un estado sin contenido (p. ej. Chihuahua recién dado de alta) cae en un
// fallback válido (hero + grilla de experiencias en vivo + cierre) sin romperse.

export type DestinoPill = { v: string; k: string };
export type DestinoCara = { label: string; title: string; text: string; imageUrl?: string };
export type DestinoSlide = { imageUrl: string; caption?: string };
export type DestinoDato = { k: string; v: string };

export type DestinoFeatured = {
  meta?: string;
  title: string;
  accent?: string;
  body: string;
  pills?: DestinoDato[];
  slug: string; // experiencia a la que enlaza
  imageUrl?: string;
} | null;

export type DestinoContact = {
  email?: string;
  whatsapp?: string; // visible, p. ej. "+52 55 1202 0565"
  whatsappUrl?: string; // wa.me/...
  instagram?: string;
};

export type DestinoContent = {
  // Hero (lo único indispensable; con fallback al nombre del estado)
  heroTitle?: string;
  heroAccent?: string;
  heroSub?: string;
  heroBgUrl?: string;
  heroMeta?: string; // p. ej. "23.6°N · Golfo de California"

  // 01 · El territorio + las 4 caras
  terrTitle?: string;
  terrAccent?: string;
  terrIntro?: string[]; // párrafos
  terrPills?: DestinoPill[];
  carasCap?: string;
  caras?: DestinoCara[];

  // 02 · Galería
  galleryTitle?: string;
  galleryAccent?: string;
  galleryCap?: string;
  gallery?: DestinoSlide[];

  // 03 · Experiencia destacada
  featured?: DestinoFeatured;

  // 04 · Próximas experiencias (encabezado; la grilla se llena sola por estado)
  expTitle?: string;
  expAccent?: string;
  expCap?: string;

  // Cierre / reserva
  closeEyebrow?: string;
  closeTitle?: string;
  closeAccent?: string;
  closeBgUrl?: string;
  contact?: DestinoContact;
};

export type Destino = {
  estado: string; // canónico, p. ej. "Baja California Sur"
  slug: string;
  isPublished: boolean;
  content: DestinoContent;
};

// Contacto por defecto (fallback y cierre cuando el destino no lo define).
export const CONTACTO_DEFAULT: Required<DestinoContact> = {
  email: "uno@numanhub.com",
  whatsapp: "+52 55 1202 0565",
  whatsappUrl: "https://wa.me/525512020565",
  instagram: "@somos.caminante",
};
