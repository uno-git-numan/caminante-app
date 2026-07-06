"use client";

// Admin · Crear / editar experiencia — autoría del DISEÑO v2 (el bespoke de
// ensenada/hongos, data-driven). El form edita un V2Draft de "secciones fijas
// opcionales" (portada, experiencia, bloque destacado, guías-repetidor,
// itinerario, inversión, incluye, faq, mochila, fechas, cierre) que al guardar
// se convierte en `page.blocks` (buildBlocks) + design:"v2". Las secciones de
// operación (precio, fechas/cupo, registro, encuesta) siguen sobre Experience.
// Wiring: saveExperience (guarda jsonb) + saveExperienceSlots (experience_slots).
// Fotos: subida con compresión en el navegador, multi-selección soportada.

import { useMemo, useState } from "react";
import { emptyExperience, slugify } from "@/lib/experiences/empty";
import PrellenarIA from "./PrellenarIA";
import { aplicarPrellenadoV2, slotsDesdeIA } from "@/lib/ai/aplicar-prellenado";
import type { SlotIA } from "@/lib/ai/prellenar";
import { saveExperience } from "@/lib/experiences/actions";
import { ESTADOS } from "@/lib/experiences/estados";
import { saveExperienceSlots } from "@/lib/experiences/slots-admin";
import type { Experience, V2Image } from "@/lib/experiences/types";
import {
  emptyV2Draft,
  emptyGuide,
  buildBlocks,
  draftFromBlocks,
  type V2Draft,
  type V2GuideDraft,
} from "@/lib/experiences/page-v2";

type SlotRow = { id?: string; label: string; start: string; end: string; cupo: string };
type InitialSlot = { id: string; label: string; startsAt: string; endsAt: string | null; capacity: number | null };

const G1 =
  '<g class="g1"><path d="M14.64,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64S0,96.44,0,104.52s6.56,14.64,14.64,14.64"/><path d="M102.08,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M91.72,114.57L4.29,27.44C-1.43,21.73-1.43,12.46,4.29,6.74c5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const G2 =
  '<g class="g2"><path d="M218.65,2.3c-8.09,0-14.64,6.56-14.64,14.64s6.56,14.64,14.64,14.64,14.64-6.56,14.64-14.64-6.56-14.64-14.64-14.64"/><path d="M276.91,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/><path d="M189.47,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/></g>';
const G3 =
  '<g class="g3"><path d="M335.23,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M422.67,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M412.31,114.57l-87.43-87.13c-5.72-5.72-5.72-14.99,0-20.71,5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const MARK = `<svg viewBox="0 0 437.31 121.74" role="img" aria-label="Caminante">${G1}${G2}${G3}</svg>`;

const CSS = `
.adminexp{--dune:#c9b79c;--cream:#fbfbf7;--sand:#b6ada5;--salvia:#d6d8c7;--olive:#637154;--olive-d:#4f5d44;--forest:#20392b;--charcoal:#20211c;--orange:#ff5d36;--panel:#f1eee7;--bg:#eceae3;--ink-soft:rgba(32,33,28,.6);--line:rgba(32,33,28,.14);--r:14px;--eb:.2em;
  font-family:"Geist",system-ui,sans-serif;color:var(--charcoal);background:var(--bg);min-height:100vh;}
.adminexp *{box-sizing:border-box;}
.adminexp .eyebrow{font-size:11px;font-weight:600;letter-spacing:var(--eb);text-transform:uppercase;display:inline-flex;align-items:center;gap:.5em;line-height:1;color:var(--olive);}
.adminexp .eyebrow .sl{color:var(--orange);font-weight:700;}
.adminexp .ahead{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 24px;background:rgba(251,251,247,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);}
.adminexp .ahead .brand{display:flex;align-items:center;gap:14px;}
.adminexp .ahead .logo{height:26px;}.adminexp .ahead .logo svg{height:100%;width:auto;display:block;}
.adminexp .ahead .logo .g1{fill:var(--olive);}.adminexp .ahead .logo .g2{fill:var(--sand);}.adminexp .ahead .logo .g3{fill:var(--orange);}
.adminexp .ahead .ctx{font-size:13px;color:var(--ink-soft);font-weight:500;border-left:1px solid var(--line);padding-left:14px;}
.adminexp .ahead .ctx b{color:var(--charcoal);font-weight:600;}
.adminexp .ahead .head-actions{display:flex;gap:10px;align-items:center;}
.adminexp .savechip{font-family:"Geist Mono",monospace;font-size:12px;color:var(--ink-soft);margin-right:6px;}
.adminexp .btn{display:inline-flex;align-items:center;justify-content:center;gap:.5em;min-height:44px;padding:0 20px;border-radius:999px;font-size:14px;font-weight:500;cursor:pointer;border:1px solid transparent;transition:background .18s,transform .1s;white-space:nowrap;font-family:inherit;}
.adminexp .btn:active{transform:translateY(1px);}
.adminexp .btn:disabled{opacity:.6;cursor:not-allowed;}
.adminexp .btn-orange{background:var(--orange);color:#fff;}.adminexp .btn-orange:hover{background:#e8431f;}
.adminexp .btn-ghost{background:transparent;color:var(--olive);border-color:var(--line);}.adminexp .btn-ghost:hover{border-color:var(--olive);}
.adminexp .btn-sm{min-height:38px;padding:0 16px;font-size:13px;}
.adminexp .wrap{max-width:1160px;margin:0 auto;padding:28px 24px 130px;display:grid;gap:28px;grid-template-columns:1fr;}
@media(min-width:960px){.adminexp .wrap{grid-template-columns:230px 1fr;align-items:start;gap:40px;}}
.adminexp .index{position:sticky;top:74px;z-index:10;background:var(--bg);}
.adminexp .ix-title{font-size:11px;letter-spacing:var(--eb);text-transform:uppercase;color:var(--ink-soft);font-weight:600;margin-bottom:10px;display:none;}
.adminexp .ix-group{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--sand);font-weight:700;margin:14px 0 4px;padding-left:10px;display:none;}
.adminexp .ix-list{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;}
.adminexp .ix-list a{flex:0 0 auto;font-size:13px;color:var(--ink-soft);padding:8px 13px;border-radius:999px;border:1px solid var(--line);background:#fff;font-weight:500;white-space:nowrap;}
.adminexp .ix-list a:hover{color:var(--charcoal);border-color:var(--olive);}
.adminexp .ix-list a .n{font-family:"Geist Mono",monospace;color:var(--orange);margin-right:.5em;font-size:11px;}
@media(min-width:960px){.adminexp .ix-title,.adminexp .ix-group{display:block;}.adminexp .ix-list{flex-direction:column;gap:2px;overflow:visible;max-height:calc(100vh - 120px);overflow-y:auto;}.adminexp .ix-list a{border:0;background:transparent;padding:7px 10px;border-radius:8px;border-left:2px solid transparent;}.adminexp .ix-list a:hover{background:var(--panel);border-left-color:var(--olive);}}
.adminexp .main{display:flex;flex-direction:column;gap:22px;min-width:0;}
.adminexp .card{background:var(--cream);border:1px solid var(--line);border-radius:var(--r);padding:26px 24px;scroll-margin-top:84px;}
.adminexp .sec-head{margin-bottom:18px;}
.adminexp .sec-head h2{font-size:23px;font-weight:300;letter-spacing:-.01em;margin-top:8px;}
.adminexp .sec-head .desc{font-size:13.5px;color:var(--ink-soft);margin-top:7px;line-height:1.55;}
.adminexp .subhead{font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--olive);margin:24px 0 12px;padding-top:18px;border-top:1px dashed var(--line);}
.adminexp .optflag{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-soft);background:rgba(32,33,28,.06);border-radius:999px;padding:2px 8px;margin-left:8px;}
.adminexp .field{margin-bottom:16px;}
.adminexp .field > label{display:block;font-size:12.5px;font-weight:600;margin-bottom:7px;color:var(--charcoal);}
.adminexp .field .hint{font-weight:400;color:var(--ink-soft);}
.adminexp input[type=text],.adminexp input[type=url],.adminexp input[type=number],.adminexp input[type=date],.adminexp textarea,.adminexp select{width:100%;font-family:inherit;font-size:15px;color:var(--charcoal);background:#fff;border:1px solid var(--line);border-radius:10px;padding:11px 13px;transition:border-color .18s,box-shadow .18s;}
.adminexp textarea{min-height:74px;line-height:1.5;resize:vertical;}
.adminexp input:focus,.adminexp textarea:focus,.adminexp select:focus{outline:none;border-color:var(--olive);box-shadow:0 0 0 3px rgba(99,113,84,.16);}
.adminexp input::placeholder,.adminexp textarea::placeholder{color:rgba(32,33,28,.36);}
.adminexp .row{display:grid;gap:16px;grid-template-columns:1fr;}
@media(min-width:560px){.adminexp .row.c2{grid-template-columns:1fr 1fr;}.adminexp .row.c3{grid-template-columns:1fr 1fr 1fr;}}
.adminexp .with-btn{display:flex;gap:10px;align-items:center;}.adminexp .with-btn input{flex:1;}
.adminexp .slugbox{font-family:"Geist Mono",monospace;}
.adminexp .uploader{display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
.adminexp .uploader input[type=url],.adminexp .uploader input[type=text]{flex:1;min-width:200px;}
.adminexp .filebtn{display:inline-flex;align-items:center;gap:.5em;border:1px dashed var(--sand);color:var(--olive);border-radius:10px;padding:11px 16px;font-size:13px;font-weight:500;cursor:pointer;background:#fff;}
.adminexp .filebtn:hover{border-color:var(--olive);}.adminexp .filebtn input{display:none;}
.adminexp .thumb{height:46px;width:64px;border-radius:8px;border:1px solid var(--line);object-fit:cover;}
.adminexp .segmented{display:inline-flex;background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:3px;gap:2px;}
.adminexp .segmented label{cursor:pointer;position:relative;}.adminexp .segmented input{position:absolute;opacity:0;}
.adminexp .segmented span{display:block;padding:8px 18px;font-size:13.5px;font-weight:500;border-radius:999px;color:var(--ink-soft);}
.adminexp .segmented input:checked + span{background:var(--olive);color:#fff;}
.adminexp .segmented.sm span{padding:6px 12px;font-size:12.5px;}
.adminexp .toggle{display:inline-flex;align-items:center;gap:11px;cursor:pointer;}
.adminexp .toggle input{position:absolute;opacity:0;}
.adminexp .toggle .tk{display:inline-block;width:46px;height:26px;border-radius:999px;background:var(--sand);position:relative;transition:background .2s;flex:0 0 auto;}
.adminexp .toggle .tk::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:999px;background:#fff;transition:transform .2s;}
.adminexp .toggle input:checked + .tk{background:var(--olive);}
.adminexp .toggle input:checked + .tk::after{transform:translateX(20px);}
.adminexp .toggle .tlabel{font-size:14px;font-weight:500;}
.adminexp .rep-items{display:flex;flex-direction:column;gap:12px;}
.adminexp .rep-row{display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;}.adminexp .rep-row > *{margin-bottom:0;}.adminexp .rep-row .grow{flex:1;min-width:160px;}
.adminexp .rep-card{border:1px solid var(--line);border-radius:12px;padding:46px 16px 18px;background:#fff;position:relative;}
.adminexp .rm{flex:0 0 auto;background:transparent;border:1px solid var(--line);color:var(--ink-soft);border-radius:9px;padding:10px 12px;font-size:13px;cursor:pointer;line-height:1;font-family:inherit;}
.adminexp .rm:hover{border-color:var(--orange);color:var(--orange);}
.adminexp .rep-card .rm{position:absolute;top:14px;right:14px;}
.adminexp .add{margin-top:12px;background:transparent;border:1px solid var(--olive);color:var(--olive);border-radius:999px;padding:9px 18px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;}
.adminexp .add:hover{background:var(--olive);color:#fff;}
.adminexp .nested{margin-top:14px;padding-top:14px;border-top:1px dashed var(--line);}
.adminexp .nested .nlabel{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);font-weight:600;margin-bottom:10px;}
.adminexp .inline-check{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--charcoal);cursor:pointer;white-space:nowrap;padding-top:10px;}
.adminexp .inline-check input{width:17px;height:17px;accent-color:var(--olive);}
.adminexp .chip-auto{display:inline-flex;align-items:center;font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--olive);background:rgba(99,113,84,.12);border:1px solid rgba(99,113,84,.32);border-radius:999px;padding:2px 7px;margin-left:7px;vertical-align:middle;}
.adminexp .field.auto input,.adminexp .field.auto select,.adminexp .field.auto textarea{background:rgba(99,113,84,.055);border-color:rgba(99,113,84,.3);}
.adminexp .brandbanner{background:rgba(99,113,84,.07);border:1px solid rgba(99,113,84,.28);border-radius:var(--r);overflow:hidden;}
.adminexp .brandbanner summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;}
.adminexp .brandbanner summary::-webkit-details-marker{display:none;}
.adminexp .brandbanner .bb-l{display:flex;align-items:center;gap:12px;}
.adminexp .brandbanner .bb-l .t{font-size:15px;font-weight:600;}.adminexp .brandbanner .bb-l .d{font-size:12.5px;color:var(--ink-soft);}
.adminexp .brandbanner .chev{color:var(--olive);font-size:13px;}.adminexp .brandbanner[open] .chev{transform:rotate(180deg);}
.adminexp .inherited{padding:4px 22px 22px;border-top:1px dashed rgba(99,113,84,.3);}
.adminexp .inherited-grid{display:grid;gap:16px 28px;grid-template-columns:1fr;margin-top:16px;}
@media(min-width:620px){.adminexp .inherited-grid{grid-template-columns:1fr 1fr;}}
.adminexp .inh .k{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);font-weight:600;display:block;margin-bottom:3px;}
.adminexp .inh .v{font-size:14.5px;font-weight:500;}
.adminexp .form-intro{font-size:13.5px;line-height:1.6;color:var(--ink-soft);background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:16px 20px;}
.adminexp .form-intro .sl{color:var(--orange);font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:11px;display:block;margin-bottom:7px;}
.adminexp .gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;}
.adminexp .gal-slot{aspect-ratio:1;border:1px dashed var(--sand);border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center;color:var(--olive);font-size:12px;font-weight:500;cursor:pointer;text-align:center;padding:8px;position:relative;overflow:hidden;}
.adminexp .gal-slot:hover{border-color:var(--olive);}.adminexp .gal-slot input{display:none;}
.adminexp .gal-slot img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.adminexp .gal-slot .rm{position:absolute;top:6px;right:6px;padding:5px 7px;font-size:11px;z-index:2;background:#fff;}
.adminexp .preview{margin-top:20px;background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden;}
.adminexp .preview summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;}
.adminexp .preview summary::-webkit-details-marker{display:none;}
.adminexp .preview summary .pv-l{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--olive);}
.adminexp .preview .pv-tag{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);background:rgba(32,33,28,.07);border-radius:999px;padding:3px 9px;}
.adminexp .preview .chev{color:var(--olive);font-size:12px;}.adminexp .preview[open] .chev{transform:rotate(180deg);}
.adminexp .pv-body{padding:8px 20px 22px;border-top:1px dashed var(--line);background:#fff;}
.adminexp .pv-ro{font-size:11px;color:var(--ink-soft);font-style:italic;margin:12px 0 4px;}
.adminexp .cv-block{margin-top:18px;}
.adminexp .cv-block > .cvh{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--olive);margin-bottom:10px;}
.adminexp .cv-grid{display:grid;gap:11px;grid-template-columns:1fr 1fr;}
@media(max-width:540px){.adminexp .cv-grid{grid-template-columns:1fr;}}
.adminexp .cv-field .l{display:block;font-size:12px;color:var(--charcoal);font-weight:500;margin-bottom:5px;}
.adminexp .cv-input{height:32px;border:1px dashed var(--line);border-radius:7px;background:var(--cream);}.adminexp .cv-input.area{height:54px;}
.adminexp .cv-q{font-size:13.5px;font-weight:600;color:var(--charcoal);margin:16px 0 7px;}
.adminexp .cv-stars{color:var(--sand);font-size:17px;letter-spacing:3px;line-height:1;}
.adminexp .cv-nps{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;}
.adminexp .cv-nps span{width:24px;height:24px;border:1px solid var(--line);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--ink-soft);font-family:"Geist Mono",monospace;}
.adminexp .cv-note{font-size:12px;color:var(--ink-soft);font-style:italic;margin-top:7px;}
.adminexp .cv-check{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--charcoal);margin-top:9px;line-height:1.4;}
.adminexp .cv-check .bx{width:15px;height:15px;border:1.5px solid var(--sand);border-radius:4px;flex:0 0 auto;margin-top:1px;}
.adminexp .cv-list{margin-top:8px;display:flex;flex-direction:column;gap:7px;}
.adminexp .cv-list .ci{font-size:13px;color:#3a3c33;line-height:1.45;padding-left:16px;position:relative;}
.adminexp .cv-list .ci::before{content:"";position:absolute;left:0;top:7px;width:6px;height:6px;border-radius:999px;background:var(--orange);}
.adminexp .cv-cat{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid var(--line);}
.adminexp .cv-cat:first-child{border-top:0;}.adminexp .cv-cat .cn{font-size:13.5px;font-weight:500;}
.adminexp .cv-empty{font-size:12.5px;color:var(--ink-soft);font-style:italic;}
.adminexp .actionbar{position:fixed;bottom:0;left:0;right:0;z-index:40;background:rgba(251,251,247,.94);backdrop-filter:blur(12px);border-top:1px solid var(--line);}
.adminexp .actionbar .inner{max-width:1160px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:14px;}
.adminexp .actionbar .status{font-size:13px;color:var(--ink-soft);font-family:"Geist Mono",monospace;}
.adminexp .actionbar .status.ok{color:var(--olive);}
.adminexp .err{color:#c43d2a;font-size:13px;margin-top:8px;}
`;

/* ---------- helpers ---------- */
function Field({ label, hint, auto, children }: { label: React.ReactNode; hint?: string; auto?: boolean; children: React.ReactNode }) {
  return (
    <div className={`field${auto ? " auto" : ""}`}>
      <label>{label}{hint ? <span className="hint"> — {hint}</span> : null}{auto ? <span className="chip-auto">auto</span> : null}</label>
      {children}
    </div>
  );
}
// ── Subida de imágenes con compresión en el navegador ──────────────────────
// Vercel corta cualquier body >~4.5 MB ANTES de llegar a /api/admin/upload,
// así que las fotos de cámara (4–12 MB) morían en silencio. Aquí se
// redimensionan a máx 2560px (sobra para web) y se recomprimen a JPEG antes
// de subir: una foto de 10 MB queda en ~1 MB. Además el sitio carga más rápido.
async function comprimirImagen(file: File, maxLado = 2560, calidad = 0.82): Promise<Blob | null> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const esc = Math.min(1, maxLado / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * esc));
    const h = Math.max(1, Math.round(bmp.height * esc));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    return await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", calidad));
  } catch {
    return null; // formato no decodificable (p.ej. HEIC en Chrome)
  }
}

async function subirImagen(file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  let cuerpo: Blob = file;
  let nombre = file.name;
  // Comprimir todo lo que pese >1.2 MB (o no sea jpeg/png/webp ya ligero).
  if (file.size > 1_200_000) {
    const comp = await comprimirImagen(file);
    if (comp && comp.size < file.size) {
      cuerpo = comp;
      nombre = nombre.replace(/\.[^.]+$/, "") + ".jpg";
    }
  }
  if (cuerpo.size > 4_000_000) {
    return {
      ok: false,
      error:
        cuerpo === file
          ? "No pude comprimir este formato (¿HEIC?). Conviértela a JPG o PNG e inténtalo de nuevo."
          : "La imagen pesa demasiado incluso comprimida. Prueba con una versión más chica.",
    };
  }
  try {
    const fd = new FormData();
    fd.append("file", cuerpo, nombre);
    const res = await fetch("/caminante/api/admin/upload", { method: "POST", body: fd });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.url) {
      return { ok: false, error: j?.error || `La subida falló (HTTP ${res.status}). Intenta de nuevo.` };
    }
    return { ok: true, url: j.url as string };
  } catch {
    return { ok: false, error: "Se cortó la conexión al subir. Intenta de nuevo." };
  }
}

function Uploader({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr(null);
    const r = await subirImagen(f);
    if (r.ok) onChange(r.url);
    else setErr(r.error);
    setBusy(false);
    e.target.value = "";
  }
  return (
    <div className="uploader">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="thumb" />
      ) : null}
      <input type="url" value={value} placeholder="https://… o sube un archivo" onChange={(e) => onChange(e.target.value)} />
      <label className="filebtn">{busy ? "Subiendo…" : "Subir archivo"}<input type="file" accept="image/*" onChange={onFile} disabled={busy} /></label>
      {err ? <div style={{ color: "#b33517", fontSize: 12, marginTop: 4 }}>{err}</div> : null}
    </div>
  );
}
function StrList({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <>
      <div className="rep-items">
        {items.map((it, i) => (
          <div key={i} className="rep-row">
            <input type="text" className="grow" value={it} placeholder={placeholder} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
            <button type="button" className="rm" onClick={() => onChange(items.filter((_, j) => j !== i))}>Quitar</button>
          </div>
        ))}
      </div>
      <button type="button" className="add" onClick={() => onChange([...items, ""])}>+ Agregar</button>
    </>
  );
}
function PrevBlock({ t, fields }: { t: string; fields: string[] }) {
  return (
    <div className="cv-block">
      <div className="cvh">{t}</div>
      <div className="cv-grid">
        {fields.map((f) => <div key={f} className="cv-field"><span className="l">{f}</span><div className="cv-input"></div></div>)}
      </div>
    </div>
  );
}
// Casilla "+ Agregar fotos" con selección MÚLTIPLE: sube en serie (comprimiendo
// cada una) y va agregando conforme terminan; los errores se acumulan visibles.
function MultiAdd({ onAdd }: { onAdd: (url: string) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setErr(null);
    const errores: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setBusy(files.length > 1 ? `Subiendo ${i + 1}/${files.length}…` : "Subiendo…");
      const r = await subirImagen(files[i]);
      if (r.ok) onAdd(r.url);
      else errores.push(`${files[i].name}: ${r.error}`);
    }
    setBusy(null);
    if (errores.length) setErr(errores.join(" · "));
  }
  return (
    <label className="gal-slot" title={err ?? undefined} style={err ? { borderColor: "#b33517", color: "#b33517" } : undefined}>
      {busy ?? (err ? "Falló — reintentar" : "+ Agregar fotos")}
      <input type="file" accept="image/*" multiple onChange={onFiles} disabled={!!busy} />
    </label>
  );
}
// Lista de fotos (V2Image[]) con multi-subida y quitar.
function PhotoList({ images, onChange }: { images: V2Image[]; onChange: (v: V2Image[]) => void }) {
  const conUrl = images.filter((im) => im.url);
  return (
    <div className="gallery">
      {conUrl.map((im, i) => (
        <div key={i} className="gal-slot" style={{ borderStyle: "solid" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={im.url} alt={im.alt || ""} />
          <button type="button" className="rm" onClick={() => onChange(conUrl.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <MultiAdd onAdd={(url) => onChange([...conUrl, { url, alt: "" }])} />
    </div>
  );
}
function Seg<T extends string>({ name, value, options, onChange, sm }: { name: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; sm?: boolean }) {
  return (
    <div className={`segmented${sm ? " sm" : ""}`}>
      {options.map((o) => (
        <label key={o.v}><input type="radio" name={name} checked={value === o.v} onChange={() => onChange(o.v)} /><span>{o.l}</span></label>
      ))}
    </div>
  );
}
function SecToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="field"><label className="toggle"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span className="tk"></span><span className="tlabel">{checked ? "Sección visible en la página" : "Sección oculta"}</span></label></div>
  );
}

/* ---------- main ---------- */
export default function ExperienceForm({ initial, initialSlots }: { initial?: Experience; initialSlots?: InitialSlot[] }) {
  const [exp, setExp] = useState<Experience>(initial ?? emptyExperience());
  const [v2, setV2] = useState<V2Draft>(() =>
    initial ? draftFromBlocks(initial.page, initial) : emptyV2Draft(emptyExperience()),
  );
  const [slots, setSlots] = useState<SlotRow[]>(
    (initialSlots ?? []).map((s) => ({ id: s.id, label: s.label, start: (s.startsAt || "").slice(0, 10), end: (s.endsAt || "").slice(0, 10), cupo: s.capacity != null ? String(s.capacity) : "" })),
  );
  const [cupoEstandar, setCupoEstandar] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("Borrador sin guardar");
  const [statusOk, setStatusOk] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!initial);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  // Guarda anti-sobrescritura: cuando el slug ya existe, guardamos aquí la
  // experiencia lista y el status para reintentar con confirmación explícita.
  const [pendienteSobrescribir, setPendienteSobrescribir] = useState<{
    exp: Experience;
    st: Experience["status"];
  } | null>(null);

  function set<K extends keyof Experience>(k: K, v: Experience[K]) { setExp((p) => ({ ...p, [k]: v })); }
  // Parcha una sección del borrador v2 (portada, itinerario, …).
  function upd<K extends keyof V2Draft>(k: K, patch: Partial<V2Draft[K]>) {
    setV2((p) => ({ ...p, [k]: { ...(p[k] as object), ...patch } }) as V2Draft);
  }
  const setGuides = (v: V2GuideDraft[]) => setV2((p) => ({ ...p, guides: v }));
  const patchGuide = (i: number, patch: Partial<V2GuideDraft>) =>
    setGuides(v2.guides.map((g, j) => (j === i ? { ...g, ...patch } : g)));

  const reg = exp.registration ?? { active: false, waiverVersion: "v1", waiverDocUrl: "", waiverClauses: [] };
  const fb = exp.feedback ?? { active: false, version: "v1", locationLabel: "", npsEnabled: true, sections: [], testimonialPrompt: "" };
  const price = exp.price ?? { amount: "", currency: "MXN · por persona", desc: "" };
  const setReg = (patch: Partial<typeof reg>) => set("registration", { ...reg, ...patch });
  const setFb = (patch: Partial<typeof fb>) => set("feedback", { ...fb, ...patch });
  const setPrice = (patch: Partial<typeof price>) => set("price", { ...price, ...patch });
  const priceTiers = exp.priceTiers ?? [];
  const setTiers = (v: { label: string; amount: string }[]) => set("priceTiers", v);

  const gallery = exp.gallery ?? [];
  const clausulas = reg.waiverClauses ?? [];
  const cats = fb.sections ?? [];

  const heroCompleto = `${v2.hero.title} ${v2.hero.titleAccent}`.trim();
  const suggestedSlug = useMemo(() => slugify(heroCompleto), [heroCompleto]);
  const effectiveSlug = autoSlug ? suggestedSlug : (exp.slug ?? "");

  function onPrellenado(data: Record<string, unknown>, slotsIA: SlotIA[]) {
    const r = aplicarPrellenadoV2(exp, v2, data);
    setExp(r.exp);
    setV2(r.draft);
    setSlots((prev) => {
      const conContenido = prev.filter((s) => s.label.trim() || s.start);
      return [...conContenido, ...slotsDesdeIA(slotsIA, conContenido)];
    });
    setStatusOk(false);
    setStatus("Pre-llenado con IA — revisa antes de guardar");
  }

  // Guardado real (ya con la experiencia armada). allowOverwrite viene del
  // botón de confirmación cuando el slug ya existía.
  async function guardar(filled: Experience, st: Experience["status"], allowOverwrite: boolean) {
    setSaving(true);
    const res = await saveExperience(filled, {
      expectedSlug: initial?.slug ?? null,
      allowOverwrite,
    });
    const t = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    if (!res.ok) {
      setSaving(false);
      setStatusOk(false);
      if (res.code === "slug_exists") {
        // Pedir confirmación en vez de fallar: guardamos lo listo para reintentar.
        setPendienteSobrescribir({ exp: filled, st });
        setStatus(res.error);
      } else {
        setStatus(`Error: ${res.error}`);
      }
      return;
    }
    setPendienteSobrescribir(null);
    setExp(filled);
    setSavedSlug(res.slug);
    // Salidas → experience_slots (fuera del jsonb)
    const slotInputs = slots
      .filter((s) => s.label.trim() && s.start)
      .map((s) => ({
        ...(s.id ? { id: s.id } : {}),
        label: s.label.trim(),
        startsAt: `${s.start}T12:00:00Z`,
        endsAt: s.end ? `${s.end}T23:00:00Z` : null,
        capacity: s.cupo ? Number(s.cupo) : null,
      }));
    const slotRes = await saveExperienceSlots(res.slug, slotInputs);
    setSaving(false);
    setStatusOk(slotRes.ok);
    if (!slotRes.ok) { setStatus(`Guardada, pero las fechas fallaron: ${slotRes.error}`); return; }
    setStatus(st === "published" ? `✓ Experiencia publicada · ${t}` : `✓ Borrador guardado · ${t}`);
  }

  async function onSubmit(st: Experience["status"]) {
    const slug = (autoSlug ? suggestedSlug : (exp.slug ?? "")).trim();
    const heroTitle = v2.hero.title.trim();
    const nombre = exp.cardTitle?.trim() || heroCompleto;
    const filled: Experience = {
      ...exp, slug, status: st,
      // El título del hero también nombra la experiencia (tarjetas, admin, notifs).
      title: heroTitle || exp.title,
      titleAccent: v2.hero.titleAccent || exp.titleAccent,
      subtitle: v2.hero.sub || exp.subtitle,
      // La foto del hero alimenta las tarjetas del home y "Mi espacio".
      heroImageUrl: v2.hero.bg.url || exp.heroImageUrl,
      heroImageAlt: v2.hero.bg.alt || exp.heroImageAlt,
      docTitle: exp.docTitle || `${nombre} — Caminante`,
      edgeLabel: exp.edgeLabel || `Caminante · ${nombre}`,
      footerBrand: exp.footerBrand || `Caminante · ${nombre}`,
    };
    // Diseño v2: la portada es el mínimo. Sin portada NO se marca v2 (así una
    // experiencia legacy editada por accidente no se rompe en público).
    if (heroTitle || v2.hero.bg.url.trim()) {
      filled.design = "v2";
      filled.page = { docTitle: `${nombre} — Caminante`, blocks: buildBlocks(v2) };
    }
    await guardar(filled, st, false);
  }

  const itinDays = v2.itinerary.days;
  const setItinDays = (days: V2Draft["itinerary"]["days"]) => upd("itinerary", { days });

  return (
    <div className="adminexp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="ahead">
        <div className="brand">
          <span className="logo" aria-label="Caminante" dangerouslySetInnerHTML={{ __html: MARK }} />
          <span className="ctx">Admin · <b>{initial ? "Editar experiencia" : "Crear experiencia"}</b></span>
        </div>
        <div className="head-actions">
          <span className="savechip">{statusOk ? "Guardado" : "Sin guardar"}</span>
          {(() => {
            const slugPreview = savedSlug ?? initial?.slug ?? null;
            return slugPreview ? (
              <a className="btn btn-ghost btn-sm" href={`/caminante/admin/preview/${slugPreview}`} target="_blank" rel="noopener noreferrer">Vista previa</a>
            ) : (
              <button className="btn btn-ghost btn-sm" type="button" disabled title="Guarda el borrador primero para verlo" style={{ opacity: 0.5 }}>Vista previa</button>
            );
          })()}
          <button className="btn btn-ghost btn-sm" type="button" disabled={saving} onClick={() => onSubmit("draft")}>Guardar borrador</button>
          <button className="btn btn-orange btn-sm" type="button" disabled={saving} onClick={() => onSubmit("published")}>Publicar</button>
        </div>
      </header>

      {pendienteSobrescribir ? (
        <div
          style={{
            margin: "12px 20px 0", padding: "12px 16px", borderRadius: 12,
            border: "1px solid rgba(255,93,54,.4)", background: "rgba(255,93,54,.08)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 14, flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13.5, color: "#b33517" }}>⚠️ {status}</span>
          <span style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={saving}
              onClick={() => { setPendienteSobrescribir(null); setStatus("Sin guardar"); }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-orange btn-sm"
              disabled={saving}
              onClick={() =>
                guardar(pendienteSobrescribir.exp, pendienteSobrescribir.st, true)
              }
            >
              Sí, sobrescribir
            </button>
          </span>
        </div>
      ) : null}

      <div className="wrap">
        <nav className="index">
          <div className="ix-title">Secciones</div>
          <div className="ix-group">Lo básico</div>
          <div className="ix-list" style={{ marginBottom: 4 }}><a href="#s1"><span className="n">01</span>Lo básico</a></div>
          <div className="ix-group">Página (diseño v2)</div>
          <div className="ix-list" style={{ marginBottom: 4 }}>
            <a href="#s2"><span className="n">02</span>Portada</a>
            <a href="#s3"><span className="n">03</span>La experiencia</a>
            <a href="#s4"><span className="n">04</span>Bloque destacado</a>
            <a href="#s5"><span className="n">05</span>Guías y aliados</a>
            <a href="#s6"><span className="n">06</span>Itinerario</a>
            <a href="#s7"><span className="n">07</span>Inversión</a>
            <a href="#s8"><span className="n">08</span>Incluye / No</a>
            <a href="#s9"><span className="n">09</span>FAQ</a>
            <a href="#s10"><span className="n">10</span>Mochila</a>
            <a href="#s11"><span className="n">11</span>Fechas (texto)</a>
            <a href="#s12"><span className="n">12</span>Cierre</a>
          </div>
          <div className="ix-group">Operación</div>
          <div className="ix-list">
            <a href="#s13"><span className="n">13</span>Precio</a>
            <a href="#s14"><span className="n">14</span>Fechas &amp; cupo</a>
            <a href="#s15"><span className="n">15</span>Registro</a>
            <a href="#s16"><span className="n">16</span>Encuesta</a>
          </div>
        </nav>

        <div className="main">
          {!initial ? <PrellenarIA onResult={onPrellenado} /> : null}

          <details className="brandbanner">
            <summary>
              <span className="bb-l"><span className="chip-auto">auto</span><span><span className="t">Ajustes de marca</span><br /><span className="d">Heredado de tu perfil · contacto, moneda, deslinde, encuesta</span></span></span>
              <span className="chev">▾</span>
            </summary>
            <div className="inherited"><div className="inherited-grid">
              <div className="inh"><span className="k">WhatsApp</span><span className="v">{exp.whatsapp}</span></div>
              <div className="inh"><span className="k">Correo</span><span className="v">{exp.email}</span></div>
              <div className="inh"><span className="k">Instagram</span><span className="v">@{exp.instagram}</span></div>
              <div className="inh"><span className="k">Moneda</span><span className="v">{price.currency}</span></div>
              <div className="inh"><span className="k">URL del deslinde</span><span className="v">{reg.waiverDocUrl || "—"}</span></div>
              <div className="inh"><span className="k">Encuesta</span><span className="v">{fb.active ? "Activa" : "Inactiva"} · {fb.version}{fb.npsEnabled ? " · con NPS" : ""}</span></div>
            </div></div>
          </details>

          <p className="form-intro"><span className="sl">{"// Cómo funciona"}</span>Aquí armas la página de la experiencia en el diseño de la marca (el mismo de Ensenada y Hongos): portada, la experiencia en 3 puntos, guías, itinerario, inversión, mochila… Cada sección es opcional — si la dejas vacía, no aparece. Abajo está la operación: precio que se cobra, fechas y cupo, registro y encuesta. Guarda el borrador y usa &quot;Vista previa&quot; para verla tal cual la verá el viajero.</p>

          {/* 01 · LO BÁSICO */}
          <section className="card" id="s1">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> Lo básico</span><h2>Lo básico</h2><p className="desc">Cómo se presenta la experiencia en el inicio, el calendario y el panel. El título grande de la página se escribe en &quot;Portada&quot;.</p></div>
            <div className="row c2">
              <Field label="Título de tarjeta" hint="el nombre corto en el home y en el panel"><input type="text" value={exp.cardTitle ?? ""} placeholder="Recolección de Hongos" onChange={(e) => set("cardTitle", e.target.value)} /></Field>
              <Field label="Ubicación" hint="conecta con su página de destino">
                <select value={exp.estado ?? ""} onChange={(e) => set("estado", e.target.value)}>
                  <option value="" disabled>Selecciona un estado</option>
                  {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Hook" hint="frase para la tarjeta del home"><input type="text" value={exp.cardHook ?? ""} placeholder="Cuatro días en el Mar de Cortés." onChange={(e) => set("cardHook", e.target.value)} /></Field>
            <Field label={<>Galería de fotos <span className="optflag">opcional</span></>} hint="banco de fotos de la experiencia; puedes subir varias a la vez">
              <div className="gallery">
                {gallery.map((g, i) => (
                  <div key={i} className="gal-slot" style={{ borderStyle: "solid" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {g ? <img src={g} alt="" /> : <span style={{ fontSize: 11 }}>foto</span>}
                    <button type="button" className="rm" onClick={() => set("gallery", gallery.filter((_, j) => j !== i))}>✕</button>
                  </div>
                ))}
                <MultiAdd onAdd={(url) => setExp((p) => ({ ...p, gallery: [...(p.gallery ?? []), url] }))} />
              </div>
            </Field>
            <Field label="Slug" hint="se genera del título de la portada, editable">
              <div className="with-btn">
                <input type="text" className="slugbox" value={effectiveSlug} placeholder="recoleccion-de-hongos" onChange={(e) => { setAutoSlug(false); set("slug", e.target.value); }} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAutoSlug(true)}>Regenerar</button>
              </div>
            </Field>
            <Field label="Estado">
              <div className="segmented">
                <label><input type="radio" name="estado-pub" checked={exp.status !== "published"} onChange={() => set("status", "draft")} /><span>Borrador</span></label>
                <label><input type="radio" name="estado-pub" checked={exp.status === "published"} onChange={() => set("status", "published")} /><span>Publicada</span></label>
              </div>
            </Field>
          </section>

          {/* 02 · PORTADA */}
          <section className="card" id="s2">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> Portada</span><h2>Portada</h2><p className="desc">El hero de la página: foto a sangre, título grande con remate en itálica naranja y subtítulo. Es lo mínimo para que la página exista.</p></div>
            <div className="row c2">
              <Field label="Eyebrow" hint="tipo · lugar"><input type="text" value={v2.hero.eyebrow} placeholder="Recolección de hongos · Edo. de México" onChange={(e) => upd("hero", { eyebrow: e.target.value })} /></Field>
              <Field label="Referencia geográfica"><input type="text" value={v2.hero.metaEst} placeholder="Bosque de Xalatlaco" onChange={(e) => upd("hero", { metaEst: e.target.value })} /></Field>
            </div>
            <div className="row c2">
              <Field label="Título"><input type="text" value={v2.hero.title} placeholder="El bosque" onChange={(e) => upd("hero", { title: e.target.value })} /></Field>
              <Field label="Remate" hint="itálica naranja, con punto final"><input type="text" value={v2.hero.titleAccent} placeholder="de Xalatlaco." onChange={(e) => upd("hero", { titleAccent: e.target.value })} /></Field>
            </div>
            <Field label="Subtítulo"><textarea value={v2.hero.sub} placeholder="El bosque se asoma por partes. Hay que saber mirar…" onChange={(e) => upd("hero", { sub: e.target.value })} /></Field>
            <Field label="Foto de portada" hint="también es la foto de la tarjeta en el home"><Uploader value={v2.hero.bg.url} onChange={(url) => upd("hero", { bg: { ...v2.hero.bg, url } })} /></Field>
          </section>

          {/* 03 · LA EXPERIENCIA */}
          <section className="card" id="s3">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> La experiencia</span><h2>La experiencia</h2><p className="desc">El resumen en 3 puntos + el mosaico de fotos (3 fotos: la primera se hace grande; o 4 en cuadrícula).</p></div>
            <div className="row c2">
              <Field label="Título"><input type="text" value={v2.experiencia.title} placeholder="Un día" onChange={(e) => upd("experiencia", { title: e.target.value })} /></Field>
              <Field label="Remate"><input type="text" value={v2.experiencia.titleAccent} placeholder="en el bosque." onChange={(e) => upd("experiencia", { titleAccent: e.target.value })} /></Field>
            </div>
            <Field label="Puntos" hint="idealmente 3, una línea cada uno">
              <StrList items={v2.experiencia.points} onChange={(points) => upd("experiencia", { points })} placeholder="Una jornada de recolección en el bosque de montaña" />
            </Field>
            <Field label="Mosaico de fotos" hint="puedes subir varias a la vez">
              <PhotoList images={v2.experiencia.mosaic} onChange={(mosaic) => upd("experiencia", { mosaic })} />
            </Field>
          </section>

          {/* 04 · BLOQUE DESTACADO */}
          <section className="card" id="s4">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> Bloque destacado</span><h2>Bloque destacado <span className="optflag">opcional</span></h2><p className="desc">La declaración sobre foto oscura a sangre (el método Caminante, las meditaciones…). Frase grande + cita.</p></div>
            <SecToggle checked={v2.statement.on} onChange={(on) => upd("statement", { on })} />
            {v2.statement.on ? (
              <>
                <div className="row c2">
                  <Field label="Eyebrow — antes del //"><input type="text" value={v2.statement.eyebrowPre} placeholder="Naturaleza" onChange={(e) => upd("statement", { eyebrowPre: e.target.value })} /></Field>
                  <Field label="Eyebrow — después del //"><input type="text" value={v2.statement.eyebrow} placeholder="el método Caminante" onChange={(e) => upd("statement", { eyebrow: e.target.value })} /></Field>
                </div>
                <div className="row c2">
                  <Field label="Título"><input type="text" value={v2.statement.title} placeholder="Pon las manos" onChange={(e) => upd("statement", { title: e.target.value })} /></Field>
                  <Field label="Remate"><input type="text" value={v2.statement.titleAccent} placeholder="en la tierra." onChange={(e) => upd("statement", { titleAccent: e.target.value })} /></Field>
                </div>
                <Field label="Texto"><textarea value={v2.statement.body} placeholder="Recolectar es bajar el ritmo y afinar la mirada…" onChange={(e) => upd("statement", { body: e.target.value })} /></Field>
                <Field label="Cita" hint="opcional, va en naranja itálica"><input type="text" value={v2.statement.quote} placeholder="“Donde pones tu atención, ahí va tu energía”" onChange={(e) => upd("statement", { quote: e.target.value })} /></Field>
                <Field label="Foto de fondo"><Uploader value={v2.statement.bg.url} onChange={(url) => upd("statement", { bg: { ...v2.statement.bg, url } })} /></Field>
              </>
            ) : null}
          </section>

          {/* 05 · GUÍAS Y ALIADOS */}
          <section className="card" id="s5">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> Guías y aliados</span><h2>Guías y aliados <span className="optflag">opcional</span></h2><p className="desc">Una sección por guía, comunidad o grupo (ej. &quot;Quién te guía · Nanae&quot;, &quot;La comunidad&quot;, &quot;Qué vas a encontrar&quot;). Cada una puede ser un perfil con párrafos o una lista con puntos naranjas, con foto o mosaico.</p></div>
            <div className="rep-items">
              {v2.guides.map((g, i) => (
                <div key={i} className="rep-card">
                  <button type="button" className="rm" onClick={() => setGuides(v2.guides.filter((_, j) => j !== i))}>Quitar</button>
                  <div className="row c2">
                    <Field label="Eyebrow"><input type="text" value={g.eyebrow} placeholder="Quién te guía" onChange={(e) => patchGuide(i, { eyebrow: e.target.value })} /></Field>
                    <Field label="Sub-eyebrow naranja" hint="credencial, solo perfiles"><input type="text" value={g.subEyebrow} placeholder="Micóloga · autora de…" onChange={(e) => patchGuide(i, { subEyebrow: e.target.value })} /></Field>
                  </div>
                  <div className="row c2">
                    <Field label="Título"><input type="text" value={g.title} placeholder="Nanae" onChange={(e) => patchGuide(i, { title: e.target.value })} /></Field>
                    <Field label="Remate"><input type="text" value={g.titleAccent} placeholder="Watabe." onChange={(e) => patchGuide(i, { titleAccent: e.target.value })} /></Field>
                  </div>
                  <Field label="Contenido">
                    <Seg name={`gmode${i}`} sm value={g.mode} options={[{ v: "items", l: "Lista con puntos" }, { v: "paragraphs", l: "Párrafos (perfil)" }]} onChange={(mode) => patchGuide(i, { mode })} />
                  </Field>
                  {g.mode === "items" ? (
                    <div className="nested">
                      <div className="nlabel">Elementos de la lista</div>
                      <div className="rep-items">
                        {g.items.map((it, k) => (
                          <div key={k} className="rep-row">
                            <input type="text" placeholder="Nombre" style={{ maxWidth: 220 }} value={it.name} onChange={(e) => patchGuide(i, { items: g.items.map((y, l) => (l === k ? { ...y, name: e.target.value } : y)) })} />
                            <input type="text" className="grow" placeholder="Rol (opcional)" value={it.role} onChange={(e) => patchGuide(i, { items: g.items.map((y, l) => (l === k ? { ...y, role: e.target.value } : y)) })} />
                            <button type="button" className="rm" onClick={() => patchGuide(i, { items: g.items.filter((_, l) => l !== k) })}>Quitar</button>
                          </div>
                        ))}
                      </div>
                      <button type="button" className="add" onClick={() => patchGuide(i, { items: [...g.items, { name: "", role: "" }] })}>+ Agregar elemento</button>
                    </div>
                  ) : (
                    <Field label="Párrafos" hint="*cursiva* con asteriscos">
                      <StrList items={g.paragraphs} onChange={(paragraphs) => patchGuide(i, { paragraphs })} placeholder="De raíces japonesa y mexicana…" />
                    </Field>
                  )}
                  <Field label="Nota final" hint="opcional"><input type="text" value={g.lead} placeholder="Andrés es caballerango y conoce esta montaña como nadie…" onChange={(e) => patchGuide(i, { lead: e.target.value })} /></Field>
                  <div className="row c3">
                    <Field label="Media">
                      <Seg name={`gframe${i}`} sm value={g.frame} options={[{ v: "allies", l: "Una foto" }, { v: "xp", l: "Mosaico" }]} onChange={(frame) => patchGuide(i, { frame })} />
                    </Field>
                    <Field label="Lado de la foto">
                      <Seg name={`gside${i}`} sm value={g.side} options={[{ v: "left", l: "Izquierda" }, { v: "right", l: "Derecha" }]} onChange={(side) => patchGuide(i, { side })} />
                    </Field>
                    <Field label="Fondo">
                      <Seg name={`gbg${i}`} sm value={g.bg} options={[{ v: "panel", l: "Panel" }, { v: "cream", l: "Crema" }]} onChange={(bg) => patchGuide(i, { bg })} />
                    </Field>
                  </div>
                  <Field label={g.frame === "xp" ? "Fotos del mosaico (3 o 4)" : "Foto"}>
                    <PhotoList images={g.images} onChange={(images) => patchGuide(i, { images })} />
                  </Field>
                </div>
              ))}
            </div>
            <button type="button" className="add" onClick={() => setGuides([...v2.guides, emptyGuide()])}>+ Agregar sección de guía/aliados</button>
          </section>

          {/* 06 · ITINERARIO */}
          <section className="card" id="s6">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> Itinerario</span><h2>Itinerario <span className="optflag">opcional</span></h2><p className="desc">Tarjetas de vidrio sobre foto oscura. Viaje de varios días: número (01, 02…) + etiqueta (&quot;Jueves · Llegada&quot;). Experiencia de un día: sin número, etiqueta = momento (&quot;Amanecer&quot;) + título corto.</p></div>
            <div className="row c2">
              <Field label="Título"><input type="text" value={v2.itinerary.title} placeholder="Un domingo" onChange={(e) => upd("itinerary", { title: e.target.value })} /></Field>
              <Field label="Remate"><input type="text" value={v2.itinerary.titleAccent} placeholder="completo." onChange={(e) => upd("itinerary", { titleAccent: e.target.value })} /></Field>
            </div>
            <Field label="Foto de fondo"><Uploader value={v2.itinerary.bg.url} onChange={(url) => upd("itinerary", { bg: { ...v2.itinerary.bg, url } })} /></Field>
            <div className="rep-items">
              {itinDays.map((d, i) => (
                <div key={i} className="rep-card">
                  <button type="button" className="rm" onClick={() => setItinDays(itinDays.filter((_, j) => j !== i))}>Quitar</button>
                  <div className="row c3">
                    <Field label="Número" hint="'01'… o vacío"><input type="text" value={d.num} placeholder="01" onChange={(e) => setItinDays(itinDays.map((x, j) => (j === i ? { ...x, num: e.target.value } : x)))} /></Field>
                    <Field label="Etiqueta naranja"><input type="text" value={d.lab} placeholder="Jueves · Llegada / Amanecer" onChange={(e) => setItinDays(itinDays.map((x, j) => (j === i ? { ...x, lab: e.target.value } : x)))} /></Field>
                    <Field label="Título corto" hint="opcional"><input type="text" value={d.ttl} placeholder="Encuentro" onChange={(e) => setItinDays(itinDays.map((x, j) => (j === i ? { ...x, ttl: e.target.value } : x)))} /></Field>
                  </div>
                  <div className="nested">
                    <div className="nlabel">Momentos del día</div>
                    <div className="rep-items">
                      {d.items.map((b, k) => (
                        <div key={k} className="rep-row">
                          <input type="text" placeholder="6:30" style={{ maxWidth: 130 }} value={b.t} onChange={(e) => setItinDays(itinDays.map((x, j) => (j === i ? { ...x, items: x.items.map((y, l) => (l === k ? { ...y, t: e.target.value } : y)) } : x)))} />
                          <input type="text" className="grow" placeholder="Descripción del momento" value={b.d} onChange={(e) => setItinDays(itinDays.map((x, j) => (j === i ? { ...x, items: x.items.map((y, l) => (l === k ? { ...y, d: e.target.value } : y)) } : x)))} />
                          <button type="button" className="rm" onClick={() => setItinDays(itinDays.map((x, j) => (j === i ? { ...x, items: x.items.filter((_, l) => l !== k) } : x)))}>Quitar</button>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="add" onClick={() => setItinDays(itinDays.map((x, j) => (j === i ? { ...x, items: [...x.items, { t: "", d: "" }] } : x)))}>+ Agregar momento</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="add" onClick={() => setItinDays([...itinDays, { num: "", lab: "", ttl: "", items: [{ t: "", d: "" }] }])}>+ Agregar día / momento</button>
          </section>

          {/* 07 · INVERSIÓN */}
          <section className="card" id="s7">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> Inversión</span><h2>Inversión <span className="optflag">opcional</span></h2><p className="desc">La tarjeta verde de tarifa. Este es el precio que se MUESTRA; el que se cobra vive en &quot;Precio&quot; (operación), abajo.</p></div>
            <div className="row c2">
              <Field label="Título"><input type="text" value={v2.tariff.title} placeholder="Un día," onChange={(e) => upd("tariff", { title: e.target.value })} /></Field>
              <Field label="Remate"><input type="text" value={v2.tariff.titleAccent} placeholder="todo incluido." onChange={(e) => upd("tariff", { titleAccent: e.target.value })} /></Field>
            </div>
            <Field label="Texto"><textarea value={v2.tariff.lead} placeholder="Tu lugar se aparta con el pago por adelantado…" onChange={(e) => upd("tariff", { lead: e.target.value })} /></Field>
            <div className="row c2">
              <Field label="Plan / etiqueta"><input type="text" value={v2.tariff.tier} placeholder="Caminata de hongos + comida" onChange={(e) => upd("tariff", { tier: e.target.value })} /></Field>
              <Field label="Precio (como se muestra)"><input type="text" value={v2.tariff.price} placeholder="$2,550" onChange={(e) => upd("tariff", { price: e.target.value })} /></Field>
            </div>
            <div className="row c3">
              <Field label="Moneda / nota"><input type="text" value={v2.tariff.priceCur} placeholder="MXN · todo incluido" onChange={(e) => upd("tariff", { priceCur: e.target.value })} /></Field>
              <Field label="Dato — etiqueta"><input type="text" value={v2.tariff.availK} placeholder="Cupo" onChange={(e) => upd("tariff", { availK: e.target.value })} /></Field>
              <Field label="Dato — valor"><input type="text" value={v2.tariff.availV} placeholder="17 personas" onChange={(e) => upd("tariff", { availV: e.target.value })} /></Field>
            </div>

            <div className="subhead">Tipos de precio <span className="optflag">opcional</span></div>
            <p className="desc" style={{ marginTop: -4, marginBottom: 12 }}>
              Para experiencias con varios precios (ej. <b>Habitación compartida</b> / <b>Habitación individual</b>). Cada tipo se muestra en la tarjeta de la página (&quot;Desde $…&quot; + la lista) y el cliente elige y <b>paga</b> ese tipo en el checkout. Si agregas tipos, el precio de arriba se ignora en la página. Déjalo vacío si solo hay un precio.
            </p>
            {priceTiers.map((t, i) => (
              <div className="row c2" key={i} style={{ alignItems: "flex-end", marginBottom: 8 }}>
                <Field label="Tipo"><input type="text" value={t.label} placeholder="Habitación compartida" onChange={(e) => setTiers(priceTiers.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} /></Field>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <Field label="Monto por persona"><input type="number" value={t.amount} placeholder="11500" onChange={(e) => setTiers(priceTiers.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} /></Field>
                  <button type="button" className="rm" style={{ marginBottom: 16 }} onClick={() => setTiers(priceTiers.filter((_, j) => j !== i))}>Quitar</button>
                </div>
              </div>
            ))}
            <button type="button" className="add" onClick={() => setTiers([...priceTiers, { label: "", amount: "" }])}>+ Agregar tipo de precio</button>
          </section>

          {/* 08 · INCLUYE / NO */}
          <section className="card" id="s8">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> Qué incluye / qué no</span><h2>Incluye / No incluye <span className="optflag">opcional</span></h2><p className="desc">Dos columnas. La segunda puede ser &quot;No incluye&quot; (−) o &quot;Buenas prácticas&quot; (·).</p></div>
            <div className="subhead" style={{ borderTop: 0, paddingTop: 0 }}>Incluye</div>
            <StrList items={v2.checklist.yesItems} onChange={(yesItems) => upd("checklist", { yesItems })} placeholder="Ej. Transporte redondo" />
            <div className="subhead">Segunda columna</div>
            <div className="row c2">
              <Field label="Título"><input type="text" value={v2.checklist.noTitle} placeholder="No incluye / Buenas prácticas" onChange={(e) => upd("checklist", { noTitle: e.target.value })} /></Field>
              <Field label="Marcador">
                <Seg name="nomark" sm value={v2.checklist.noMark === "·" ? "·" : "−"} options={[{ v: "−", l: "− (no incluye)" }, { v: "·", l: "· (prácticas)" }]} onChange={(noMark) => upd("checklist", { noMark })} />
              </Field>
            </div>
            <StrList items={v2.checklist.noItems} onChange={(noItems) => upd("checklist", { noItems })} placeholder="Ej. Vuelos" />
          </section>

          {/* 09 · FAQ */}
          <section className="card" id="s9">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> Preguntas frecuentes</span><h2>Preguntas frecuentes <span className="optflag">opcional</span></h2><p className="desc">Tarjeta de vidrio sobre foto. Si no agregas preguntas, la sección no aparece.</p></div>
            <SecToggle checked={v2.faq.on} onChange={(on) => upd("faq", { on })} />
            {v2.faq.on ? (
              <>
                <Field label="Foto de fondo"><Uploader value={v2.faq.bg.url} onChange={(url) => upd("faq", { bg: { ...v2.faq.bg, url } })} /></Field>
                <div className="rep-items">
                  {v2.faq.qa.map((f, i) => (
                    <div key={i} className="rep-card">
                      <button type="button" className="rm" onClick={() => upd("faq", { qa: v2.faq.qa.filter((_, j) => j !== i) })}>Quitar</button>
                      <Field label="Pregunta"><input type="text" value={f.q} placeholder="¿…?" onChange={(e) => upd("faq", { qa: v2.faq.qa.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })} /></Field>
                      <Field label="Respuesta"><textarea value={f.a} placeholder="Respuesta" onChange={(e) => upd("faq", { qa: v2.faq.qa.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} /></Field>
                    </div>
                  ))}
                </div>
                <button type="button" className="add" onClick={() => upd("faq", { qa: [...v2.faq.qa, { q: "", a: "" }] })}>+ Agregar pregunta</button>
              </>
            ) : null}
          </section>

          {/* 10 · MOCHILA */}
          <section className="card" id="s10">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> La mochila</span><h2>Qué llevar <span className="optflag">opcional</span></h2><p className="desc">Checklist con casillas + una foto vertical.</p></div>
            <Field label="Bajada" hint="una línea"><input type="text" value={v2.packing.cap} placeholder="Lo esencial para un día de montaña, lluvia y lodo." onChange={(e) => upd("packing", { cap: e.target.value })} /></Field>
            <Field label="Items"><StrList items={v2.packing.items} onChange={(items) => upd("packing", { items })} placeholder="Botas de caminar o hike" /></Field>
            <Field label="Foto"><Uploader value={v2.packing.photo.url} onChange={(url) => upd("packing", { photo: { ...v2.packing.photo, url } })} /></Field>
          </section>

          {/* 11 · FECHAS (texto) */}
          <section className="card" id="s11">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> Próximas fechas</span><h2>Fechas — texto de la sección</h2><p className="desc">Solo el copy que rodea las tarjetas de fechas. Las tarjetas (fecha + &quot;Quedan N lugares&quot;) se llenan SOLAS desde las salidas de la sección &quot;Fechas &amp; cupo&quot;.</p></div>
            <div className="row c2">
              <Field label="Título"><input type="text" value={v2.dates.title} placeholder="Elige tu" onChange={(e) => upd("dates", { title: e.target.value })} /></Field>
              <Field label="Remate"><input type="text" value={v2.dates.titleAccent} placeholder="domingo." onChange={(e) => upd("dates", { titleAccent: e.target.value })} /></Field>
            </div>
            <Field label="Bajada"><input type="text" value={v2.dates.cap} placeholder="Mismo bosque, misma jornada — elige tu salida." onChange={(e) => upd("dates", { cap: e.target.value })} /></Field>
            <Field label="Línea de precio" hint="**negritas** con asteriscos"><input type="text" value={v2.dates.priceLine} placeholder="**$2,550 MXN** · todo incluido · cupo 17 personas" onChange={(e) => upd("dates", { priceLine: e.target.value })} /></Field>
          </section>

          {/* 12 · CIERRE */}
          <section className="card" id="s12">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> Cierre</span><h2>Cierre</h2><p className="desc">La tarjeta de vidrio final con el contacto y los botones de reserva.</p></div>
            <div className="row c2">
              <Field label="Título"><input type="text" value={v2.closing.title} placeholder="Nos vemos" onChange={(e) => upd("closing", { title: e.target.value })} /></Field>
              <Field label="Remate"><input type="text" value={v2.closing.titleAccent} placeholder="en el bosque." onChange={(e) => upd("closing", { titleAccent: e.target.value })} /></Field>
            </div>
            <Field label="Foto de fondo"><Uploader value={v2.closing.bg.url} onChange={(url) => upd("closing", { bg: { ...v2.closing.bg, url } })} /></Field>
            <div className="subhead" style={{ borderTop: 0, paddingTop: 0 }}>Contacto <span className="chip-auto">auto</span></div>
            <div className="rep-items">
              {v2.closing.contacts.map((c, i) => (
                <div key={i} className="rep-row">
                  <input type="text" placeholder="Etiqueta" style={{ maxWidth: 160 }} value={c.lbl} onChange={(e) => upd("closing", { contacts: v2.closing.contacts.map((x, j) => (j === i ? { ...x, lbl: e.target.value } : x)) })} />
                  <input type="text" className="grow" placeholder="Valor" value={c.val} onChange={(e) => upd("closing", { contacts: v2.closing.contacts.map((x, j) => (j === i ? { ...x, val: e.target.value } : x)) })} />
                  <button type="button" className="rm" onClick={() => upd("closing", { contacts: v2.closing.contacts.filter((_, j) => j !== i) })}>Quitar</button>
                </div>
              ))}
            </div>
            <button type="button" className="add" onClick={() => upd("closing", { contacts: [...v2.closing.contacts, { lbl: "", val: "" }] })}>+ Agregar contacto</button>
          </section>

          {/* 13 · PRECIO */}
          <section className="card" id="s13">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> Precio</span><h2>Precio base</h2><p className="desc">El precio por persona QUE SE COBRA en el checkout cuando hay un solo precio. Si tienes varios tipos (ej. habitación compartida / individual), agrégalos en la sección <b>Inversión</b> (arriba) — esos se muestran y se cobran; aquí queda el precio base/de respaldo.</p></div>
            <div className="row c3">
              <Field label={priceTiers.length ? "Monto base (respaldo)" : "Monto"}><input type="number" value={price.amount} placeholder="11500" onChange={(e) => setPrice({ amount: e.target.value })} /></Field>
              <Field label="Moneda" auto><input type="text" value={price.currency} onChange={(e) => setPrice({ currency: e.target.value })} /></Field>
              <Field label="Descripción"><input type="text" value={price.desc} placeholder="por persona" onChange={(e) => setPrice({ desc: e.target.value })} /></Field>
            </div>
          </section>

          {/* 14 · FECHAS & CUPO */}
          <section className="card" id="s14">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> Fechas &amp; cupo</span><h2>Fechas &amp; cupo</h2><p className="desc">Las fechas de salida y cuántos lugares hay en cada una. El sitio muestra &quot;Quedan N lugares&quot; y baja el número conforme la gente reserva; cuando se llena, aparece &quot;Agotado&quot;. Deja el cupo vacío para una salida sin tope.</p></div>
            <div style={{ maxWidth: 220 }}><Field label="Cupo estándar" hint="se usa al agregar salidas"><input type="number" value={cupoEstandar} placeholder="16" onChange={(e) => setCupoEstandar(e.target.value)} /></Field></div>
            <div className="subhead">Salidas</div>
            <div className="rep-items">
              {slots.map((s, i) => (
                <div key={i} className="rep-card">
                  <button type="button" className="rm" onClick={() => setSlots(slots.filter((_, j) => j !== i))}>Quitar</button>
                  <Field label="Etiqueta"><input type="text" value={s.label} placeholder="Jun 12-15" onChange={(e) => setSlots(slots.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} /></Field>
                  <div className="row c3">
                    <Field label="Inicio"><input type="date" value={s.start} onChange={(e) => setSlots(slots.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} /></Field>
                    <Field label="Fin"><input type="date" value={s.end} onChange={(e) => setSlots(slots.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} /></Field>
                    <Field label="Cupo"><input type="number" value={s.cupo} placeholder="sin tope" onChange={(e) => setSlots(slots.map((x, j) => (j === i ? { ...x, cupo: e.target.value } : x)))} /></Field>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="add" onClick={() => setSlots([...slots, { label: "", start: "", end: "", cupo: cupoEstandar }])}>+ Agregar salida</button>
          </section>

          {/* 15 · REGISTRO & DESLINDE */}
          <section className="card" id="s15">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> Registro &amp; deslinde</span><h2>Registro &amp; deslinde</h2><p className="desc">Es el formulario que cada viajero llena antes del viaje: sus datos, su contacto de emergencia, su información médica y la aceptación del deslinde (la carta de responsabilidad) con su firma. Aquí lo prendes para esta experiencia, subes el documento del deslinde y escribes un resumen de sus puntos. La &quot;versión&quot; déjala en v1; solo súbela si cambias el texto del deslinde.</p></div>
            <div className="field"><label className="toggle"><input type="checkbox" checked={reg.active} onChange={(e) => setReg({ active: e.target.checked })} /><span className="tk"></span><span className="tlabel">Registro activo</span></label></div>
            <div className="row c2">
              <Field label="Versión" auto><input type="text" value={reg.waiverVersion} placeholder="v1" onChange={(e) => setReg({ waiverVersion: e.target.value })} /></Field>
              <Field label="URL del documento" auto><input type="url" value={reg.waiverDocUrl} placeholder="https://…" onChange={(e) => setReg({ waiverDocUrl: e.target.value })} /></Field>
            </div>
            <div className="subhead">Cláusulas-resumen <span className="chip-auto">auto</span></div>
            <div className="rep-items">
              {clausulas.map((c, i) => (
                <div key={i} className="rep-row">
                  <textarea className="grow" placeholder="Resumen de la cláusula" value={c} onChange={(e) => setReg({ waiverClauses: clausulas.map((x, j) => (j === i ? e.target.value : x)) })} />
                  <button type="button" className="rm" onClick={() => setReg({ waiverClauses: clausulas.filter((_, j) => j !== i) })}>Quitar</button>
                </div>
              ))}
            </div>
            <button type="button" className="add" onClick={() => setReg({ waiverClauses: [...clausulas, ""] })}>+ Agregar cláusula</button>

            <details className="preview">
              <summary><span className="pv-l"><span className="pv-tag">Vista previa</span> Así lo verá el viajero</span><span className="chev">▾</span></summary>
              <div className="pv-body">
                <p className="pv-ro">Vista de solo lectura — el formulario que cada viajero llena antes del viaje.</p>
                <PrevBlock t="1 · Datos personales" fields={["Nombre completo", "Fecha de nacimiento", "Ciudad", "Correo", "WhatsApp", "Elegir fecha de salida"]} />
                <PrevBlock t="2 · Perfil médico" fields={["Tipo de sangre", "Nivel de nado / condición física", "Padecimientos actuales", "Medicamentos de uso periódico", "Alergias", "Restricciones alimentarias"]} />
                <PrevBlock t="3 · Contacto de emergencia" fields={["Nombre", "Parentesco", "Teléfono"]} />
                <PrevBlock t="4 · Acompañantes menores (opcional)" fields={["Nombre", "Edad", "Parentesco"]} />
                <PrevBlock t="5 · Para tu seguro" fields={["Sexo", "Nacionalidad", "CURP", "Pasaporte / INE", "Ocupación", "Beneficiario — Nombre", "Beneficiario — Parentesco", "Beneficiario — Teléfono"]} />
                <div className="cv-block">
                  <div className="cvh">6 · El deslinde</div>
                  <div className="cv-list">
                    {clausulas.filter((c) => c.trim()).length ? clausulas.filter((c) => c.trim()).map((c, i) => <div key={i} className="ci">{c}</div>) : <div className="cv-empty">Aún sin cláusulas — agrégalas arriba.</div>}
                  </div>
                  {["He leído y acepto el deslinde", "Acepto el aviso de privacidad", "Autorizo uso de imagen (opcional)", "Quiero recibir noticias (opcional)"].map((c) => <div key={c} className="cv-check"><span className="bx"></span>{c}</div>)}
                </div>
                <PrevBlock t="7 · Tu firma" fields={["Escribe tu nombre completo como firma"]} />
              </div>
            </details>
          </section>

          {/* 16 · ENCUESTA */}
          <section className="card" id="s16">
            <div className="sec-head"><span className="eyebrow"><span className="sl">{"//"}</span> Encuesta de satisfacción</span><h2>Encuesta de satisfacción</h2><p className="desc">La encuesta que se manda a los viajeros después del viaje, por correo y sola, más o menos un día después de que termina cada salida. Aquí solo eliges si se manda, qué partes del viaje quieres que califiquen, si incluyes la pregunta de &quot;¿qué tan probable es que nos recomiendes?&quot; y el texto que invita a dejar un testimonio.</p></div>
            <div className="field"><label className="toggle"><input type="checkbox" checked={fb.active} onChange={(e) => setFb({ active: e.target.checked })} /><span className="tk"></span><span className="tlabel">Encuesta activa</span></label></div>
            <div className="row c2">
              <Field label="Versión" auto><input type="text" value={fb.version} placeholder="v1" onChange={(e) => setFb({ version: e.target.value })} /></Field>
              <Field label="Etiqueta de locación"><input type="text" value={fb.locationLabel} placeholder="Ensenada de Muertos" onChange={(e) => setFb({ locationLabel: e.target.value })} /></Field>
            </div>
            <div className="field"><label className="toggle"><input type="checkbox" checked={fb.npsEnabled} onChange={(e) => setFb({ npsEnabled: e.target.checked })} /><span className="tk"></span><span className="tlabel">Incluir NPS (0–10)</span></label></div>
            <div className="subhead">Categorías a calificar <span className="chip-auto">auto</span></div>
            <div className="rep-items">
              {cats.map((c, i) => (
                <div key={i} className="rep-row">
                  <input type="text" placeholder="Ícono" style={{ maxWidth: 110 }} value={c.icon ?? ""} onChange={(e) => setFb({ sections: cats.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)) })} />
                  <input type="text" className="grow" placeholder="Etiqueta — ej. Guías y equipo" value={c.label} onChange={(e) => setFb({ sections: cats.map((x, j) => (j === i ? { ...x, label: e.target.value, key: x.key || slugify(e.target.value) } : x)) })} />
                  <button type="button" className="rm" onClick={() => setFb({ sections: cats.filter((_, j) => j !== i) })}>Quitar</button>
                </div>
              ))}
            </div>
            <button type="button" className="add" onClick={() => setFb({ sections: [...cats, { key: "", label: "", icon: "◆" }] })}>+ Agregar categoría</button>
            <div style={{ marginTop: 18 }}><Field label="Prompt del testimonio" auto><textarea value={fb.testimonialPrompt ?? ""} placeholder="¿Nos regalas unas palabras?" onChange={(e) => setFb({ testimonialPrompt: e.target.value })} /></Field></div>

            <details className="preview">
              <summary><span className="pv-l"><span className="pv-tag">Vista previa</span> Así la verá el viajero</span><span className="chev">▾</span></summary>
              <div className="pv-body">
                <p className="pv-ro">Vista de solo lectura — lo que se le manda al viajero después del viaje.</p>
                <div className="cv-block">
                  <div className="cvh">Paso 1</div>
                  <div className="cv-q">¿Cómo te fuiste?</div><div className="cv-stars">★ ★ ★ ★ ★</div>
                  {fb.npsEnabled ? <><div className="cv-q">¿Qué tan probable es que nos recomiendes a alguien que quieres?</div><div className="cv-nps">{Array.from({ length: 11 }, (_, i) => <span key={i}>{i}</span>)}</div></> : null}
                </div>
                <div className="cv-block">
                  <div className="cvh">Paso 2</div>
                  <div className="cv-q">{fb.testimonialPrompt || "¿Nos regalas unas palabras?"}</div><div className="cv-input area"></div>
                  <div className="cv-check"><span className="bx"></span>Permito compartir mi testimonio con mis iniciales</div>
                  <div className="cv-check"><span className="bx"></span>Permito compartir mis fotos</div>
                  <div className="cv-note">Si la calificación fue baja, en su lugar se pregunta: &quot;¿Qué nos faltó?&quot;</div>
                </div>
                <div className="cv-block">
                  <div className="cvh">Paso 3 · Califica cada parte</div>
                  {cats.filter((c) => c.label.trim()).length ? cats.filter((c) => c.label.trim()).map((c, i) => <div key={i} className="cv-cat"><span className="cn">{c.label}</span><span className="cv-stars">★ ★ ★ ★ ★</span></div>) : <div className="cv-empty">Aún sin partes a calificar.</div>}
                  <div className="cv-q">¿Qué fue lo que más te marcó?</div><div className="cv-input area"></div>
                  <div className="cv-q">¿Hubo algo que esperabas y no pasó?</div><div className="cv-input area"></div>
                  <div className="cv-check" style={{ marginTop: 14 }}><span className="bx"></span>¿Te avisamos de la próxima expedición?</div>
                </div>
              </div>
            </details>
          </section>
        </div>
      </div>

      <div className="actionbar"><div className="inner">
        <span className={`status${statusOk ? " ok" : ""}`}>
          {status}{savedSlug ? <> · <a href={`/caminante/admin/preview/${savedSlug}`} target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>vista previa</a></> : null}
        </span>
        <div className="grp">
          <button className="btn btn-ghost" type="button" disabled={saving} onClick={() => onSubmit("draft")}>{saving ? "Guardando…" : "Guardar borrador"}</button>
          <button className="btn btn-orange" type="button" disabled={saving} onClick={() => onSubmit("published")}>{saving ? "Publicando…" : "Publicar experiencia"}</button>
        </div>
      </div></div>
    </div>
  );
}
