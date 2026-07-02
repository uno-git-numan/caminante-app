"use client";

// Implementación React del diseño "Registro y deslinde" (Numan Caminante Design
// System / Claude Design, jun 2026) — re-skin del rebrand: nav+formhero+fsec cards,
// eyebrows " // ", secnum Geist Mono, paper bg. La lógica real está intacta: slots
// de la BD, prellenado con sesión, consentimientos LFPDPPP y firma vía
// submitRegistration. Los selects de sangre/sexo/nivel se quedan como texto libre
// para no perder datos prellenados del expediente.

import { useMemo, useState } from "react";
import { submitRegistration } from "@/lib/registration/actions";
import type {
  DependentOption,
  MedicalProfileData,
  MinorEntry,
  RegistrationPrefill,
  SlotOption,
} from "@/lib/registration/types";

// Fila del formulario de participantes (strings controlados; se mapea a
// ParticipantInput al enviar). Espeja los campos de un dependiente guardado.
type ParticipantRow = {
  dependentId?: string;
  fullName: string;
  birthDate: string;
  relationship: string;
  bloodType: string;
  fitnessNotes: string;
  conditions: string;
  allergies: string;
  dietaryRestrictions: string;
  emergencyName: string;
  emergencyPhone: string;
};

const emptyParticipant: ParticipantRow = {
  fullName: "",
  birthDate: "",
  relationship: "",
  bloodType: "",
  fitnessNotes: "",
  conditions: "",
  allergies: "",
  dietaryRestrictions: "",
  emergencyName: "",
  emergencyPhone: "",
};

function participantFromDependent(d: DependentOption): ParticipantRow {
  return {
    dependentId: d.id,
    fullName: d.fullName,
    birthDate: d.birthDate,
    relationship: d.relationship,
    bloodType: d.bloodType,
    fitnessNotes: d.fitnessNotes,
    conditions: d.conditions,
    allergies: d.allergies,
    dietaryRestrictions: d.dietaryRestrictions,
    emergencyName: d.emergencyName,
    emergencyPhone: d.emergencyPhone,
  };
}

// ── Marca: isotipo + wordmark (mismo SVG del landing/destinos) ──────────
const G1 =
  '<g class="g1"><path d="M14.64,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64S0,96.44,0,104.52s6.56,14.64,14.64,14.64"/><path d="M102.08,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M91.72,114.57L4.29,27.44C-1.43,21.73-1.43,12.46,4.29,6.74c5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const G2 =
  '<g class="g2"><path d="M218.65,2.3c-8.09,0-14.64,6.56-14.64,14.64s6.56,14.64,14.64,14.64,14.64-6.56,14.64-14.64-6.56-14.64-14.64-14.64"/><path d="M276.91,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/><path d="M189.47,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/></g>';
const G3 =
  '<g class="g3"><path d="M335.23,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M422.67,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M412.31,114.57l-87.43-87.13c-5.72-5.72-5.72-14.99,0-20.71,5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const GW =
  '<g class="gw"><path d="M532.87,98.77c-4.27,4.6-9.41,6.89-15.42,6.89-5.69,0-10.45-1.75-14.27-5.25-3.83-3.5-6.73-8.56-8.7-15.18-1.97-6.62-2.95-14.68-2.95-24.2s.98-17.77,2.95-24.45c1.97-6.67,4.87-11.76,8.7-15.26,3.83-3.5,8.58-5.25,14.27-5.25s10.42,2.11,14.52,6.32c4.1,4.21,6.97,10.36,8.61,18.46l18.05-.98c-2.3-12.58-7.08-22.37-14.36-29.37-7.27-7-16.22-10.5-26.82-10.5-9.41,0-17.37,2.49-23.87,7.47-6.51,4.98-11.46,12-14.85,21.08-3.39,9.08-5.08,19.91-5.08,32.49s1.69,23.24,5.08,32.32c3.39,9.08,8.34,16.08,14.85,21,6.51,4.92,14.46,7.38,23.87,7.38,11.26,0,20.56-3.72,27.89-11.16,7.33-7.44,11.98-17.83,13.95-31.17l-17.88-.82c-1.42,8.86-4.27,15.59-8.53,20.18"/><path d="M636.87,72.84l14.54-52.34,14.54,52.34h-29.09ZM640.25,2.62l-34.13,116.49h17.88l8.43-30.35h37.93l8.43,30.35h17.88L662.57,2.62h-22.31Z"/><polygon points="784.88 77.66 766.51 2.62 743.54 2.62 743.54 119.11 760.11 119.11 760.11 29.17 778.32 105 791.45 105 809.66 29.17 809.66 119.11 826.23 119.11 826.23 2.62 803.26 2.62 784.88 77.66"/><polygon points="873.07 18.87 900.97 18.87 900.97 102.87 873.07 102.87 873.07 119.11 945.92 119.11 945.92 102.87 918.03 102.87 918.03 18.87 945.92 18.87 945.92 2.62 873.07 2.62 873.07 18.87"/><polygon points="1051.99 94.46 1013.77 2.62 992.77 2.62 992.77 119.11 1009.67 119.11 1009.67 27.28 1047.89 119.11 1068.89 119.11 1068.89 2.62 1051.99 2.62 1051.99 94.46"/><path d="M1146.48,72.84l14.54-52.34,14.54,52.34h-29.09ZM1149.87,2.62l-34.13,116.49h17.88l8.43-30.35h37.93l8.43,30.35h17.88l-34.13-116.49h-22.31Z"/><polygon points="1312.38 94.46 1274.15 2.62 1253.15 2.62 1253.15 119.11 1270.05 119.11 1270.05 27.28 1308.28 119.11 1329.28 119.11 1329.28 2.62 1312.38 2.62 1312.38 94.46"/><polygon points="1376.12 18.87 1410.25 18.87 1410.25 119.11 1427.31 119.11 1427.31 18.87 1461.44 18.87 1461.44 2.62 1376.12 2.62 1376.12 18.87"/><polygon points="1508.28 2.62 1508.28 119.11 1581.13 119.11 1581.13 102.87 1525.51 102.87 1525.51 68.58 1577.85 68.58 1577.85 52.83 1525.51 52.83 1525.51 18.87 1579.81 18.87 1579.81 2.62 1508.28 2.62"/></g>';
const MARK = `<svg viewBox="0 0 437.31 121.74" role="img" aria-label="Caminante">${G1}${G2}${G3}</svg>`;
const WORD = `<svg viewBox="0 0 1581.13 121.74" role="img" aria-label="Caminante">${G1}${G2}${G3}${GW}</svg>`;

const CSS = `
@font-face{font-family:"Geist Mono";src:url("/landing/assets/fonts/GeistMono-VariableFont_wght.ttf") format("truetype-variations");font-weight:100 900;font-style:normal;font-display:swap;}
.reg-page{--lagoon:#1c6f6a;--dune:#c9b79c;--cream:#fbfbf7;--sand:#b6ada5;--salvia:#d6d8c7;--olive:#637154;--olive-d:#4f5d44;--forest:#20392b;--charcoal:#20211c;--orange:#ff5d36;--ink-soft:rgba(32,33,28,.62);--line:rgba(32,33,28,.12);--line-w:rgba(255,255,255,.22);--maxw:1240px;--eb:.24em;--r:18px;
  font-family:"Geist",system-ui,sans-serif;color:var(--charcoal);background:var(--cream);-webkit-font-smoothing:antialiased;min-height:100svh;}
.reg-page *{box-sizing:border-box;margin:0;padding:0;}
.reg-page a{color:inherit;text-decoration:none;}
.reg-page .eyebrow{font-size:12px;font-weight:600;letter-spacing:var(--eb);text-transform:uppercase;display:inline-flex;align-items:center;gap:.6em;line-height:1;}
.reg-page .eyebrow .sl{color:var(--orange);font-weight:700;}
.reg-page .display{font-weight:200;letter-spacing:-.02em;line-height:1.04;}
.reg-page em.ac{font-style:italic;color:var(--orange);font-weight:300;}
.reg-page .btn{display:inline-flex;align-items:center;justify-content:center;gap:.6em;min-height:50px;padding:0 26px;border-radius:999px;font-size:15px;font-weight:500;letter-spacing:.01em;cursor:pointer;border:1px solid transparent;transition:transform .18s ease,background .2s ease,border-color .2s ease,color .2s ease;white-space:nowrap;font-family:inherit;}
.reg-page .btn:active{transform:translateY(1px);}
.reg-page .btn-orange{background:var(--orange);color:#fff;}
.reg-page .btn-orange:hover{background:#e8431f;}
.reg-page .btn-orange:disabled{opacity:.6;cursor:not-allowed;}
.reg-page .btn-glass{background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.42);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);}
.reg-page .btn-glass:hover{background:rgba(255,255,255,.22);}
.reg-page .btn-arrow::after{content:"→";font-size:1.05em;}
.reg-page .nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:16px 22px;background:rgba(251,251,247,.9);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 1px 0 var(--line);}
.reg-page .nav .brand{display:flex;align-items:center;}
.reg-page .nav .logo-word{display:none;height:26px;}
.reg-page .nav .logo-mark{display:block;height:34px;}
.reg-page .nav .logo-word svg,.reg-page .nav .logo-mark svg{height:100%;width:auto;display:block;}
.reg-page .nav .brand .g1{fill:var(--olive);}
.reg-page .nav .brand .g2{fill:var(--sand);}
.reg-page .nav .brand .g3{fill:var(--orange);}
.reg-page .nav .brand .gw{fill:var(--charcoal);}
@media(min-width:620px){.reg-page .nav .logo-word{display:block;}.reg-page .nav .logo-mark{display:none;}}
.reg-page .nav-links{display:none;align-items:center;gap:34px;}
.reg-page .nav-links a{font-size:15px;font-weight:500;color:var(--charcoal);opacity:.92;}
.reg-page .nav-links a:hover{opacity:1;}
.reg-page .nav-cta{display:flex;align-items:center;gap:14px;}
.reg-page .nav-cta .btn{min-height:42px;padding:0 20px;font-size:14px;}
.reg-page .burger{display:flex;flex-direction:column;gap:5px;background:none;border:0;cursor:pointer;padding:8px;width:44px;height:44px;align-items:center;justify-content:center;}
.reg-page .burger span{display:block;width:24px;height:2px;background:var(--charcoal);transition:transform .3s,opacity .3s;}
.reg-page .drawer{position:fixed;inset:0;z-index:99;background:var(--forest);display:flex;flex-direction:column;justify-content:center;gap:6px;padding:32px;transform:translateY(-100%);transition:transform .4s cubic-bezier(.4,0,.2,1);}
.reg-page .drawer.open{transform:translateY(0);}
.reg-page .drawer a{color:#fff;font-size:30px;font-weight:200;letter-spacing:-.01em;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.12);}
.reg-page .drawer a .sl{color:var(--orange);margin-right:.4em;font-size:.6em;vertical-align:middle;}
.reg-page .drawer .btn{margin-top:24px;align-self:flex-start;}
@media(min-width:920px){.reg-page .nav-links{display:flex;}.reg-page .burger{display:none;}.reg-page .nav{padding:20px 40px;}}
.reg-page .formhero{padding:148px 0 8px;background:var(--cream);}
.reg-page .fwrap{max-width:680px;margin:0 auto;padding:0 22px;width:100%;}
.reg-page .formhero h1{font-size:clamp(30px,5.4vw,52px);margin:16px 0 16px;}
.reg-page .formhero .sub{font-size:17px;color:var(--ink-soft);line-height:1.55;max-width:52ch;}
.reg-page .formbody{background:var(--cream);padding:34px 0 100px;}
.reg-page .fsec{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:30px 26px;margin-bottom:22px;box-shadow:0 10px 30px -26px rgba(32,33,28,.4);}
.reg-page .fsec-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:8px;}
.reg-page .fsec-head h2{font-size:23px;font-weight:400;margin-top:10px;letter-spacing:-.01em;}
.reg-page .secnum{font-family:"Geist Mono",ui-monospace,monospace;font-weight:500;font-size:13px;letter-spacing:.14em;line-height:1;flex:0 0 auto;align-self:flex-start;white-space:nowrap;color:var(--olive);}
.reg-page .fnote{font-size:14.5px;line-height:1.55;color:var(--ink-soft);margin:14px 0 20px;}
.reg-page .field{margin-bottom:18px;}
.reg-page .field:last-child{margin-bottom:0;}
.reg-page .field label{display:block;font-size:13px;font-weight:600;letter-spacing:.03em;color:var(--charcoal);margin-bottom:7px;}
.reg-page .field input,.reg-page .field textarea,.reg-page .field select{width:100%;font-family:inherit;font-size:16px;color:var(--charcoal);background:var(--cream);border:1px solid var(--line);border-radius:12px;padding:13px 15px;transition:border-color .2s ease,box-shadow .2s ease;}
.reg-page .field input::placeholder,.reg-page .field textarea::placeholder{color:rgba(32,33,28,.38);}
.reg-page .field input:focus,.reg-page .field textarea:focus,.reg-page .field select:focus{outline:none;border-color:var(--olive);box-shadow:0 0 0 3px rgba(99,113,84,.18);}
.reg-page .field textarea{min-height:82px;resize:vertical;line-height:1.5;}
.reg-page .frow{display:grid;gap:18px;margin-bottom:18px;}
.reg-page .frow:last-child{margin-bottom:0;}
.reg-page .frow .field{margin-bottom:0;}
@media(min-width:520px){.reg-page .frow.two{grid-template-columns:1fr 1fr;}.reg-page .frow.three{grid-template-columns:1fr 1fr 1fr;}}
.reg-page .subhead{font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--olive);margin:24px 0 14px;}
.reg-page .optgrid{display:grid;gap:12px;}
.reg-page .optcard{display:flex;align-items:flex-start;gap:13px;border:1px solid var(--line);border-radius:14px;padding:16px;cursor:pointer;transition:border-color .2s ease,background .2s ease;}
.reg-page .optcard:hover{border-color:var(--olive);}
.reg-page .optcard input{margin-top:2px;accent-color:var(--olive);width:18px;height:18px;flex:0 0 auto;}
.reg-page .optcard .t{font-weight:600;font-size:15.5px;display:block;}
.reg-page .optcard .d{font-size:13.5px;color:var(--ink-soft);margin-top:3px;display:block;}
.reg-page .optcard:has(input:checked){border-color:var(--olive);background:rgba(99,113,84,.07);}
.reg-page .optcard input:disabled{opacity:.4;}
.reg-page .menor{border:1px dashed var(--sand);border-radius:14px;padding:18px 16px 8px;margin-bottom:14px;position:relative;background:var(--cream);}
.reg-page .menor .rm{position:absolute;top:12px;right:14px;background:none;border:0;color:var(--ink-soft);font-size:13px;cursor:pointer;}
.reg-page .menor .rm:hover{color:var(--orange);}
.reg-page .addbtn{display:inline-flex;align-items:center;gap:.5em;background:transparent;border:1px solid var(--olive);color:var(--olive);border-radius:999px;padding:11px 20px;font-family:inherit;font-size:14px;font-weight:500;cursor:pointer;transition:background .2s ease,color .2s ease;}
.reg-page .addbtn:hover{background:var(--olive);color:#fff;}
.reg-page .lockedslot{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--line);border-radius:14px;padding:16px;background:rgba(99,113,84,.06);}
.reg-page .lockedslot-label{font-weight:600;font-size:15.5px;color:var(--charcoal);}
.reg-page .lockedslot-note{font-size:12.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--olive);white-space:nowrap;}
.reg-page .depchips{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:16px;}
.reg-page .depchips-label{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);margin-right:2px;}
.reg-page .depchip{background:rgba(99,113,84,.08);border:1px solid var(--line);color:var(--olive-d);border-radius:999px;padding:8px 14px;font-family:inherit;font-size:13.5px;font-weight:500;cursor:pointer;transition:background .2s ease,border-color .2s ease,opacity .2s ease;}
.reg-page .depchip:hover{background:rgba(99,113,84,.16);border-color:var(--olive);}
.reg-page .depchip:disabled{opacity:.42;cursor:not-allowed;}
.reg-page .depmore{margin-top:6px;}
.reg-page .depmore summary{cursor:pointer;font-size:13.5px;font-weight:600;color:var(--olive);list-style:none;padding:6px 0;user-select:none;}
.reg-page .depmore summary::-webkit-details-marker{display:none;}
.reg-page .depmore summary::before{content:"+ ";font-weight:700;}
.reg-page .depmore[open] summary::before{content:"− ";}
.reg-page .depmore[open] summary{margin-bottom:8px;}
.reg-page .legal{background:var(--cream);border:1px solid var(--line);border-radius:12px;padding:20px;max-height:248px;overflow:auto;font-size:14px;line-height:1.6;color:#3a3c33;}
.reg-page .legal li{margin-bottom:10px;list-style:none;display:flex;gap:10px;}
.reg-page .legal li::before{content:"";margin-top:9px;width:6px;height:6px;flex:0 0 auto;border-radius:999px;background:var(--dune);}
.reg-page .legal .ver{font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);margin-top:12px;}
.reg-page .doclink{display:inline-flex;align-items:center;gap:.4em;margin-top:14px;font-size:14px;font-weight:600;color:var(--olive);}
.reg-page .doclink:hover{text-decoration:underline;}
.reg-page .check{display:flex;gap:11px;align-items:flex-start;margin-top:16px;font-size:15px;line-height:1.45;color:var(--charcoal);cursor:pointer;}
.reg-page .check input{margin-top:2px;width:18px;height:18px;accent-color:var(--olive);flex:0 0 auto;}
.reg-page .check .opt{display:block;font-size:12.5px;color:var(--ink-soft);margin-top:2px;}
.reg-page .sign input{font-size:21px;font-weight:300;font-style:italic;padding:16px 18px;}
.reg-page .signdate{font-size:13px;color:var(--ink-soft);margin-top:10px;}
.reg-page .btn-full{width:100%;min-height:58px;font-size:16px;margin-top:8px;}
.reg-page .endnote{font-size:13.5px;color:var(--ink-soft);line-height:1.5;margin-top:14px;text-align:center;}
.reg-page .errbox{display:flex;gap:11px;align-items:flex-start;background:rgba(255,93,54,.07);border:1px solid rgba(255,93,54,.3);border-radius:14px;padding:16px;margin-bottom:22px;color:var(--charcoal);font-size:14.5px;}
.reg-page .greet{display:flex;align-items:center;gap:13px;background:rgba(99,113,84,.07);border:1px solid rgba(99,113,84,.2);border-radius:14px;padding:16px;margin-bottom:22px;font-size:14.5px;color:var(--ink-soft);}
.reg-page .greet .ava{width:38px;height:38px;flex:0 0 auto;border-radius:999px;background:var(--forest);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;}
.reg-page .greet b{color:var(--olive);font-weight:600;}
.reg-page .footer{background:var(--charcoal);color:#fff;padding:64px 0 40px;}
.reg-page .footer .container{max-width:var(--maxw);margin:0 auto;padding:0 22px;width:100%;}
.reg-page .footer .word{height:30px;margin-bottom:28px;}
.reg-page .footer .word svg{height:100%;width:auto;}
.reg-page .footer .word .g1,.reg-page .footer .word .g2,.reg-page .footer .word .gw{fill:#fff;}
.reg-page .footer .word .g3{fill:var(--orange);}
.reg-page .footer .tagline{font-size:20px;font-weight:300;margin-bottom:8px;}
.reg-page .footer .sub{font-size:14px;color:rgba(255,255,255,.6);letter-spacing:.04em;text-transform:uppercase;margin-bottom:24px;}
.reg-page .footer .desc{font-size:15px;line-height:1.6;color:rgba(255,255,255,.7);max-width:64ch;}
.reg-page .footer .fbottom{margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,.12);font-size:13px;color:rgba(255,255,255,.5);display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;}
.reg-page .success{min-height:100svh;display:flex;align-items:center;justify-content:center;padding:120px 22px 70px;background:var(--forest);color:#fff;text-align:center;}
.reg-page .success .card{max-width:560px;}
.reg-page .success .ok{width:66px;height:66px;border-radius:999px;border:1.5px solid rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;margin:0 auto 26px;font-size:30px;color:var(--orange);}
.reg-page .success h2{font-size:clamp(30px,5vw,46px);font-weight:200;margin-bottom:16px;letter-spacing:-.02em;}
.reg-page .success .meta{font-family:"Geist Mono",ui-monospace,monospace;font-size:13px;letter-spacing:.06em;color:var(--dune);margin-bottom:22px;}
.reg-page .success p{font-size:17px;line-height:1.6;color:rgba(255,255,255,.85);max-width:44ch;margin:0 auto 30px;}
.reg-page .success .actions{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;}
`;

const emptyMedical: MedicalProfileData = {
  bloodType: "",
  conditions: "",
  medications: "",
  allergies: "",
  dietaryRestrictions: "",
  fitnessNotes: "",
  emergencyName: "",
  emergencyRelationship: "",
  emergencyPhone: "",
  gender: "",
  curp: "",
  nationality: "",
  governmentId: "",
  occupation: "",
  beneficiaryName: "",
  beneficiaryRelationship: "",
  beneficiaryPhone: "",
};

function Brand({ kind }: { kind: "word" | "mark" }) {
  return (
    <span
      className={kind === "word" ? "logo-word" : "logo-mark"}
      dangerouslySetInnerHTML={{ __html: kind === "word" ? WORD : MARK }}
    />
  );
}

function SecHead({ num, eyebrow, title, extra }: { num: string; eyebrow: string; title: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="fsec-head">
      <div>
        <span className="eyebrow"><span className="sl">//</span> {eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <span className="secnum">{num}</span>
      {extra}
    </div>
  );
}

export default function RegistrationForm({
  slug,
  title,
  datesBadge,
  slots,
  waiverClauses,
  waiverDocUrl,
  hasSession,
  sessionEmail,
  prefill,
  reservationId,
  lockedSlot,
}: {
  slug: string;
  title: string;
  datesBadge: string;
  slots: SlotOption[];
  waiverClauses: string[];
  waiverDocUrl: string;
  hasSession: boolean;
  sessionEmail: string;
  prefill: RegistrationPrefill | null;
  reservationId?: string;
  lockedSlot?: { slotId: string; slotLabel: string } | null;
}) {
  const [fullName, setFullName] = useState(prefill?.fullName || "");
  const [birthDate, setBirthDate] = useState(prefill?.birthDate || "");
  const [email, setEmail] = useState(prefill?.email || sessionEmail || "");
  const [phone, setPhone] = useState(prefill?.phone || "");
  const [city, setCity] = useState(prefill?.city || "");
  // Si la fecha ya se eligió al reservar, queda FIJA (no se vuelve a preguntar).
  const [slotId, setSlotId] = useState(lockedSlot?.slotId || "");
  const [m, setM] = useState<MedicalProfileData>(prefill?.medical || emptyMedical);
  const savedDependents = prefill?.dependents || [];
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [imageConsent, setImageConsent] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    waiverVersion: string;
    signedAt: string;
    slotLabel: string;
    stripeLink: string | null;
  } | null>(null);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }),
    [],
  );

  const setMed = (k: keyof MedicalProfileData) => (v: string) => setM({ ...m, [k]: v });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!lockedSlot && slots.length > 0 && !slotId) {
      setError("Elige tu salida para continuar.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    const selected = slots.find((s) => s.id === slotId);
    const cleanParticipants = participants.filter((p) => p.fullName.trim());
    // El titular firma por todo el grupo: los participantes quedan también en el
    // rastro legal `minors` (nombre/parentesco) además de guardarse como perfiles.
    const derivedMinors: MinorEntry[] = cleanParticipants.map((p) => ({
      name: p.fullName.trim(),
      age: "",
      relationship: p.relationship.trim(),
    }));
    const res = await submitRegistration({
      slug,
      fullName,
      birthDate,
      email,
      phone,
      city,
      slotId: slotId || null,
      slotLabel: lockedSlot?.slotLabel || selected?.label || datesBadge,
      medical: m,
      minors: derivedMinors,
      participants: cleanParticipants,
      reservationId,
      waiverAccepted,
      privacyConsent,
      imageConsent,
      newsletterOptIn,
      signatureName,
    });
    setSubmitting(false);
    if (res.ok) {
      setSuccess({
        waiverVersion: res.waiverVersion,
        signedAt: res.signedAt,
        slotLabel: res.slotLabel,
        stripeLink: res.stripeLink,
      });
      window.scrollTo({ top: 0 });
    } else {
      setError(res.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const Nav = (
    <>
      <nav className="nav">
        <a href="/caminante" className="brand" aria-label="Caminante — inicio">
          <Brand kind="word" />
          <Brand kind="mark" />
        </a>
        <div className="nav-links">
          <a href="/caminante">Inicio</a>
          <a href="/caminante#proximos">Calendario</a>
          <a href="/caminante#aprende">Aprende</a>
          <a href="/caminante#quees">Nosotros</a>
        </div>
        <div className="nav-cta">
          <a href="/caminante#proximos" className="btn btn-orange">Reservar</a>
          <button
            className="burger"
            aria-label="Abrir menú"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((o) => !o)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>
      <div className={`drawer${drawerOpen ? " open" : ""}`} onClick={() => setDrawerOpen(false)}>
        <a href="/caminante"><span className="sl">//</span>Inicio</a>
        <a href="/caminante#proximos"><span className="sl">//</span>Calendario</a>
        <a href="/caminante#aprende"><span className="sl">//</span>Aprende</a>
        <a href="/caminante#quees"><span className="sl">//</span>Nosotros</a>
        <a href="/caminante#proximos" className="btn btn-orange">Reservar</a>
      </div>
    </>
  );

  // ── PANTALLA DE ÉXITO ─────────────────────────────────────────────
  if (success) {
    const signedDate = new Date(success.signedAt).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return (
      <div className="reg-page solid-nav">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {Nav}
        <section className="success">
          <div className="card">
            <div className="ok">✓</div>
            <h2 className="display">Estás dentro, <em className="ac">caminante.</em></h2>
            <div className="meta">
              {title} · {success.slotLabel} · Deslinde {success.waiverVersion} firmado el {signedDate}
            </div>
            <p>
              Tu deslinde quedó firmado y tu expediente guardado. ¡Nos vemos en el camino!
            </p>
            <div className="actions">
              <a
                href={hasSession ? "/caminante/perfil" : "/caminante/login?next=%2Fcaminante%2Fbienvenida"}
                className="btn btn-glass"
              >
                {hasSession ? "Ver mi perfil" : "Crear mi cuenta"}
              </a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── FORMULARIO ────────────────────────────────────────────────────
  return (
    <div className="reg-page solid-nav">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {Nav}

      <header className="formhero">
        <div className="fwrap">
          <span className="eyebrow"><span className="sl">//</span> Registro y deslinde</span>
          <h1 className="display">
            Prellenamos tu expediente. <em className="ac">Confírmalo y firma.</em>
          </h1>
          <p className="sub">
            {title}
            {datesBadge ? ` · ${datesBadge}` : ""}. Revisa cada sección, corrige lo que haga falta
            y firma al final.
          </p>
        </div>
      </header>

      <main className="formbody">
        <form className="fwrap" noValidate onSubmit={onSubmit}>
          {error ? (
            <div className="errbox">
              <span aria-hidden="true">⚠</span>
              <div>
                <strong>Revisa tu registro.</strong> {error}
              </div>
            </div>
          ) : null}

          {hasSession && prefill ? (
            <div className="greet">
              <span className="ava">
                {(prefill.fullName || sessionEmail || "C").charAt(0).toUpperCase()}
              </span>
              <span>
                Hola <b>{prefill.fullName?.split(" ")[0] || "caminante"}</b> — prellenamos tu
                expediente. Confírmalo y firma.
              </span>
            </div>
          ) : null}

          {/* 1 · DATOS PERSONALES (+ salida) */}
          <section className="fsec">
            <SecHead num="01" eyebrow="Sección uno" title="Datos personales" />
            <div className="field">
              <label htmlFor="nombre">Nombre completo</label>
              <input id="nombre" type="text" placeholder="Como aparece en tu identificación" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="frow two">
              <div className="field">
                <label htmlFor="nacimiento">Fecha de nacimiento</label>
                <input id="nacimiento" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="ciudad">Ciudad</label>
                <input id="ciudad" type="text" placeholder="Ciudad de México" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
            <div className="frow two">
              <div className="field">
                <label htmlFor="correo">Correo</label>
                <input id="correo" type="email" placeholder="tu@correo.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="whatsapp">WhatsApp</label>
                <input id="whatsapp" type="tel" placeholder="+52 55 0000 0000" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            {lockedSlot ? (
              <div className="field">
                <label>Tu salida</label>
                <div className="lockedslot">
                  <span className="lockedslot-label">{lockedSlot.slotLabel}</span>
                  <span className="lockedslot-note">Elegida al reservar</span>
                </div>
              </div>
            ) : slots.length > 0 ? (
              <div className="field">
                <label>Elige tus fechas</label>
                <div className="optgrid">
                  {slots.map((s) => {
                    const unlimited = s.seatsAvailable === null;
                    const full = !unlimited && (s.seatsAvailable as number) <= 0;
                    const avail = unlimited
                      ? "Lugares disponibles"
                      : full
                        ? "Agotado"
                        : `${s.seatsAvailable} ${s.seatsAvailable === 1 ? "lugar disponible" : "lugares disponibles"}`;
                    return (
                      <label className="optcard" key={s.id}>
                        <input type="radio" name="salida" value={s.id} disabled={full} checked={slotId === s.id} onChange={() => setSlotId(s.id)} />
                        <span>
                          <span className="t">{s.label}</span>
                          <span className="d">{avail}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

          {/* 2 · PERFIL MÉDICO */}
          <section className="fsec">
            <SecHead num="02" eyebrow="Sección dos" title="Perfil médico" />
            <p className="fnote">Solo lo ve el equipo de guías para cuidarte en campo; nunca se comparte.</p>
            <div className="frow two">
              <div className="field">
                <label htmlFor="sangre">Tipo de sangre</label>
                <input id="sangre" type="text" placeholder="O+, A−, …" value={m.bloodType} onChange={(e) => setMed("bloodType")(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="condicion">Nivel de nado / condición física</label>
                <input id="condicion" type="text" placeholder="Nado intermedio, corro 5k…" value={m.fitnessNotes} onChange={(e) => setMed("fitnessNotes")(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="padecimientos">Padecimientos actuales</label>
              <textarea id="padecimientos" placeholder="Describe cualquier condición relevante. Si no aplica, escribe “Ninguno”." value={m.conditions} onChange={(e) => setMed("conditions")(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="medicamentos">Medicamentos de uso periódico</label>
              <textarea id="medicamentos" placeholder="Nombre y dosis. Si no aplica, escribe “Ninguno”." value={m.medications} onChange={(e) => setMed("medications")(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="alergias">Alergias</label>
              <textarea id="alergias" placeholder="Alimentos, medicamentos, picaduras… Si no aplica, escribe “Ninguna”." value={m.allergies} onChange={(e) => setMed("allergies")(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="dieta">Restricciones alimentarias</label>
              <textarea id="dieta" placeholder="Vegetariana, vegana, sin gluten… Si no aplica, escribe “Ninguna”." value={m.dietaryRestrictions} onChange={(e) => setMed("dietaryRestrictions")(e.target.value)} />
            </div>
          </section>

          {/* 3 · CONTACTO DE EMERGENCIA */}
          <section className="fsec">
            <SecHead num="03" eyebrow="Sección tres" title="Contacto de emergencia" />
            <div className="field">
              <label htmlFor="em-nombre">Nombre</label>
              <input id="em-nombre" type="text" placeholder="Nombre completo" value={m.emergencyName} onChange={(e) => setMed("emergencyName")(e.target.value)} />
            </div>
            <div className="frow two">
              <div className="field">
                <label htmlFor="em-parentesco">Parentesco</label>
                <input id="em-parentesco" type="text" placeholder="Madre, pareja…" value={m.emergencyRelationship} onChange={(e) => setMed("emergencyRelationship")(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="em-telefono">Teléfono</label>
                <input id="em-telefono" type="tel" placeholder="+52 55 0000 0000" value={m.emergencyPhone} onChange={(e) => setMed("emergencyPhone")(e.target.value)} />
              </div>
            </div>
          </section>

          {/* 4 · PARTICIPANTES (opcional) */}
          <section className="fsec">
            <SecHead num="04" eyebrow="Sección cuatro" title={<>Participantes <span style={{ color: "var(--ink-soft)", fontWeight: 300 }}>(opcional)</span></>} />
            <p className="fnote">
              ¿Reservaste para más personas (por ejemplo tus hijos)? Agrega su perfil aquí. Es
              opcional —puedes hacerlo ahora o después— y queda guardado para tus próximas
              reservas. Tú firmas el deslinde por todo el grupo.
            </p>

            {savedDependents.length > 0 ? (
              <div className="depchips">
                <span className="depchips-label">Guardados</span>
                {savedDependents.map((d) => {
                  const added = participants.some((p) => p.dependentId === d.id);
                  return (
                    <button
                      type="button"
                      key={d.id}
                      className="depchip"
                      disabled={added}
                      onClick={() => setParticipants([...participants, participantFromDependent(d)])}
                    >
                      + {d.fullName}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {participants.map((p, i) => {
              const setP = (key: keyof ParticipantRow) => (v: string) =>
                setParticipants(participants.map((x, j) => (j === i ? { ...x, [key]: v } : x)));
              return (
                <div className="menor" key={i}>
                  <button type="button" className="rm" aria-label="Quitar" onClick={() => setParticipants(participants.filter((_, j) => j !== i))}>Quitar</button>
                  <div className="field">
                    <label>Nombre</label>
                    <input type="text" placeholder="Nombre completo" value={p.fullName} onChange={(e) => setP("fullName")(e.target.value)} />
                  </div>
                  <div className="frow two">
                    <div className="field">
                      <label>Fecha de nacimiento</label>
                      <input type="date" value={p.birthDate} onChange={(e) => setP("birthDate")(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Parentesco</label>
                      <input type="text" placeholder="Hijo, hija, sobrina…" value={p.relationship} onChange={(e) => setP("relationship")(e.target.value)} />
                    </div>
                  </div>
                  <details className="depmore">
                    <summary>Datos de seguridad (opcional)</summary>
                    <div className="frow two">
                      <div className="field">
                        <label>Tipo de sangre</label>
                        <input type="text" placeholder="O+, A−…" value={p.bloodType} onChange={(e) => setP("bloodType")(e.target.value)} />
                      </div>
                      <div className="field">
                        <label>Nivel físico / nado</label>
                        <input type="text" placeholder="Nado intermedio…" value={p.fitnessNotes} onChange={(e) => setP("fitnessNotes")(e.target.value)} />
                      </div>
                    </div>
                    <div className="field">
                      <label>Padecimientos</label>
                      <textarea placeholder="Condiciones relevantes. Si no aplica, “Ninguno”." value={p.conditions} onChange={(e) => setP("conditions")(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Alergias</label>
                      <textarea placeholder="Alimentos, medicamentos… Si no aplica, “Ninguna”." value={p.allergies} onChange={(e) => setP("allergies")(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Restricciones alimentarias</label>
                      <textarea placeholder="Vegetariana, sin gluten… Si no aplica, “Ninguna”." value={p.dietaryRestrictions} onChange={(e) => setP("dietaryRestrictions")(e.target.value)} />
                    </div>
                    <div className="frow two">
                      <div className="field">
                        <label>Contacto de emergencia</label>
                        <input type="text" placeholder="Nombre" value={p.emergencyName} onChange={(e) => setP("emergencyName")(e.target.value)} />
                      </div>
                      <div className="field">
                        <label>Teléfono de emergencia</label>
                        <input type="tel" placeholder="+52 55 0000 0000" value={p.emergencyPhone} onChange={(e) => setP("emergencyPhone")(e.target.value)} />
                      </div>
                    </div>
                  </details>
                </div>
              );
            })}
            <button type="button" className="addbtn" onClick={() => setParticipants([...participants, { ...emptyParticipant }])}>
              + Agregar participante
            </button>
          </section>

          {/* 5 · EL DESLINDE + CONSENTIMIENTOS */}
          <section className="fsec">
            <SecHead num="05" eyebrow="Sección cinco" title="El deslinde" />
            <p className="fnote">La naturaleza es real y la expedición tiene riesgos reales. Lee con calma el resumen de cláusulas; esto es lo que aceptas al firmar.</p>
            <ul className="legal">
              {waiverClauses.map((clause, i) => (
                <li key={i}>{clause}</li>
              ))}
              <li className="ver" style={{ paddingLeft: 0 }}>Documento de deslinde — se completa por experiencia.</li>
            </ul>
            {waiverDocUrl ? (
              <a href={waiverDocUrl} target="_blank" rel="noopener noreferrer" className="doclink">
                Leer el documento completo →
              </a>
            ) : null}
            <label className="check">
              <input type="checkbox" checked={waiverAccepted} onChange={(e) => setWaiverAccepted(e.target.checked)} />
              <span>He leído y acepto íntegramente la Carta de Responsabilidad Compartida y Deslinde de Responsabilidad.</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={privacyConsent} onChange={(e) => setPrivacyConsent(e.target.checked)} />
              <span>
                He leído y acepto el Aviso de Privacidad. Declaro que la información médica y personal que proporcioné es verídica.
                <span className="opt">Obligatorio</span>
              </span>
            </label>
            <label className="check">
              <input type="checkbox" checked={imageConsent} onChange={(e) => setImageConsent(e.target.checked)} />
              <span>
                Autorizo el uso de mi imagen en redes y materiales de Caminante.
                <span className="opt">Opcional</span>
              </span>
            </label>
            <label className="check">
              <input type="checkbox" checked={newsletterOptIn} onChange={(e) => setNewsletterOptIn(e.target.checked)} />
              <span>
                Quiero recibir noticias y futuras experiencias.
                <span className="opt">Opcional</span>
              </span>
            </label>
          </section>

          {/* 6 · TU FIRMA */}
          <section className="fsec">
            <SecHead num="06" eyebrow="Sección seis" title="Tu firma" />
            <div className="field sign">
              <label htmlFor="firma">Escribe tu nombre completo como firma</label>
              <input id="firma" type="text" placeholder="Tu nombre completo" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} />
              <p className="signdate">Fecha: {today}. Tu nombre tecleado junto con la fecha constituye tu aceptación electrónica del documento.</p>
            </div>
            <button type="submit" className="btn btn-orange btn-full" disabled={submitting}>
              {submitting ? "Enviando…" : "Firmar y confirmar registro"}
            </button>
            <p className="endnote">
              Tus datos se tratan conforme al Aviso de Privacidad de Caminante. La información médica
              solo la ve el equipo de guías y nunca se comparte. Tu registro queda confirmado al
              completar el anticipo; te contactamos por WhatsApp.
            </p>
          </section>
        </form>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="word" dangerouslySetInnerHTML={{ __html: WORD }} />
          <div className="tagline">Caminante · Naturaleza en movimiento</div>
          <div className="sub">Una expansión de NUMAN al mundo natural</div>
          <p className="desc">
            Caminante lleva la educación encarnada de NUMAN a paisajes reales. Una parte de cada
            experiencia se destina a la conservación del lugar que la hace posible.
          </p>
          <div className="fbottom">
            <span>© 2026 Caminante</span>
            <span>uno@numanhub.com · @somos.caminante</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
