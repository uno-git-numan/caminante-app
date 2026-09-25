// Generado por scripts/extraer-css-dc.mjs desde design/equipo/dc/Equipo.html: el bloque <style> «lo único nuevo»
// (sólo las reglas .eq*; las de .ahead/.nav/.page ya viven en admin-css) + los tres controles del sistema de
// diseño que la lámina usa (Switch, Checkbox, Input: su CSS viaja dentro del bundle, no en un <style>) y los
// tokens de :root que esos controles piden, declarados en la raíz de cada control porque el extractor tira
// :root a propósito y `.adm .page` ya existe en admin-css (lo daría por vestido).
// ⚠️ NO editar a mano: si el diseño cambia se re-entrega y se re-extrae.
// Sólo va el delta del entregable, con TODOS los selectores bajo `.adm`.

export const EQUIPO_CSS = String.raw`
.adm .eqgrid{display:grid;gap:14px;grid-template-columns:1fr;align-items:start;margin-top:14px}
@media(min-width:900px){.adm .eqgrid{grid-template-columns:1fr 1fr}}
.adm .eqp .ph{align-items:center}
.adm .eqmail{font-family:var(--mono);font-size:11.5px;color:var(--ink-soft);overflow-wrap:anywhere}
.adm .eqchips{display:flex;gap:6px;flex-wrap:wrap}
.adm .eqfac{display:grid;gap:12px 16px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));padding:14px 16px;border-bottom:1px solid var(--line)}
.adm .eqf{display:flex;flex-direction:column;gap:6px;min-width:0}
.adm .eqf small{font-size:11.5px;line-height:1.5;color:var(--ink-soft);padding-left:56px}
.adm .eqf.off small{color:var(--sand)}
.adm .eqf .cmn-switch__label{font-size:13.5px;font-weight:500}
.adm .eqin{margin:12px 16px 0}
.adm .eqp .verdict.eqin{margin-bottom:0}
.adm .eqfoot{margin:14px 16px 0;padding:12px 0 14px}
.adm .eqp>.eqin+.eqfoot{border-top:0}
.adm .eqp>.eqin:last-child{margin-bottom:14px}
.adm .eqbaja{border-color:rgba(32,33,28,.3)}
.adm .eqcol{flex-direction:column;align-items:stretch;margin-top:0}
.adm .eqcol .g{flex:0 0 auto}
.adm .eqcol .ac{flex-wrap:wrap}
.adm .eqlist{display:flex;flex-direction:column;gap:8px;max-height:240px;overflow:auto;padding:4px 2px}
.adm .eqalta{margin-bottom:14px;border-color:var(--olive)}
.adm .eqalta .ph .fr{font-size:12px}
.adm .eqbody{padding:14px 16px 16px}
.adm .eqsix{cursor:pointer;font:inherit;font-size:12.5px;padding:6px 13px}
.adm .eqerr{font-size:12px;color:#c23c1c;margin-top:7px}
.adm .eqback{display:flex;gap:9px;font-size:13px;margin:0 0 6px;color:var(--sand)}
.adm .eqbajas{margin-top:22px}
.adm .eqbajas>summary{cursor:pointer;font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--sand);padding:6px 0 10px;list-style-position:inside}
.adm .eqbajas .pf{background:var(--panel)}
.adm .eqbajas .pfr .k,.adm .eqbajas .pfr .v{color:var(--ink-soft)}
.adm .eqn{display:inline-flex;flex-direction:column;align-items:flex-end;line-height:1.1;min-width:64px}
.adm .eqn b{font-family:var(--mono);font-size:14px;font-weight:400;color:var(--charcoal)}
.adm .eqn small{font-size:10px;color:var(--ink-soft);margin-top:3px;white-space:nowrap}
.adm .actv.nod .eqn b{color:var(--ink-soft)}
.adm .eqrk{font-family:var(--mono);font-size:12px;color:var(--sand);margin-right:10px;font-weight:400}
.adm .eqmx{font-family:var(--mono);font-size:12.5px;color:var(--charcoal);white-space:nowrap}
.adm .eqmx.neg{color:#c23c1c}
.adm .eqtot{background:var(--panel)}
.adm .eqtot .k{font-weight:600;color:var(--charcoal)}
.adm .opseg.eqhat{margin-top:0;padding:3px;border-radius:999px;gap:2px;flex-wrap:nowrap}
.adm .opseg.eqhat button{padding:5px 12px;border-radius:999px;font-size:12px;white-space:nowrap}
.adm .opseg.eqhat.dark{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18)}
.adm .opseg.eqhat.dark button{color:rgba(255,255,255,.75)}
.adm .opseg.eqhat.dark button.on{background:#fff;color:var(--charcoal)}
.adm .eqdemo{display:flex;gap:8px;flex-wrap:wrap}
.adm .eqp .ph{flex-direction:column;align-items:flex-start;gap:5px}
.adm .eqtog{width:100%;border:0;border-bottom:1px solid var(--line);font:inherit;text-align:left;cursor:pointer;flex-direction:row!important;align-items:center!important;justify-content:space-between;gap:12px!important}
.adm .eqtog{flex-wrap:nowrap!important}
.adm .eqtogg{display:flex;flex-direction:column;align-items:flex-start;gap:5px;flex:1 1 auto;min-width:0}
.adm .eqdesde{font-size:11.5px;color:var(--ink-soft)}
.adm .eqsum>span:last-child{flex:1 1 100%}
.adm .eqpleg:not(.open) .eqtog{border-bottom:0;background:#fff}
.adm .eqtog:hover{background:var(--panel)}
.adm .eqtog .chev2{flex:0 0 auto;color:var(--ink-soft);transition:transform .25s ease}
.adm .eqpleg.open .eqtog .chev2{transform:rotate(180deg)}
.adm .eqsum{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:12px;color:var(--ink-soft);margin-top:3px}
.adm .eqp .ph .fr{margin-left:0}
.adm .eqmail{overflow-wrap:break-word}
@media(max-width:640px){.adm .eqdemo .opseg.eqhat{flex-wrap:wrap}.adm .eqf small{padding-left:0}.adm .actv>.ah{grid-template-columns:1fr}.adm .actv>.ah .rt{justify-content:flex-start}.adm .eqn{align-items:flex-start}}
.adm .cmn-switch,.adm .cmn-check,.adm .cmn-field{--border-default:#d4cec6;--border-width:1px;--border-width-strong:2px;--control-md:44px;--danger-500:#c43d2a;--duration-base:200ms;--duration-fast:120ms;--ease-out:cubic-bezier(0.16, 1, 0.3, 1);--ease-standard:cubic-bezier(0.2, 0.8, 0.2, 1);--font-sans:"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;--green-500:#637154;--orange-500:#ff5d36;--radius-full:50%;--radius-md:12px;--radius-pill:999px;--radius-xs:4px;--shadow-focus:0 0 0 3px rgba(98, 114, 85, 0.30);--shadow-sm:0 1px 3px rgba(31, 29, 26, 0.08), 0 1px 2px rgba(31, 29, 26, 0.05);--space-2:0.5rem;--space-3:0.75rem;--space-4:1rem;--surface-card:#ffffff;--taupe-400:#c5beb6;--taupe-50:#faf9f7;--taupe-500:#b6ada5;--text-body:1rem;--text-body-sm:0.875rem;--text-caption:0.8125rem;--text-muted:#776f67;--text-primary:#20211c;--text-secondary:#534e48;--text-subtle:#988f86;--weight-medium:500;--white:#ffffff;}
.adm .cmn-switch{display: inline-flex; align-items: center; gap: var(--space-3); cursor: pointer; font-family: var(--font-sans); user-select: none;}
.adm .cmn-switch input{position: absolute; opacity: 0; width: 0; height: 0;}
.adm .cmn-switch__track{position: relative; width: 44px; height: 26px; flex: none;
  background: var(--taupe-400); border-radius: var(--radius-pill);
  transition: background var(--duration-base) var(--ease-standard);}
.adm .cmn-switch__thumb{position: absolute; top: 3px; left: 3px; width: 20px; height: 20px;
  background: var(--white); border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-base) var(--ease-out);}
.adm .cmn-switch input:checked + .cmn-switch__track{background: var(--green-500);}
.adm .cmn-switch input:checked + .cmn-switch__track .cmn-switch__thumb{transform: translateX(18px);}
.adm .cmn-switch input:focus-visible + .cmn-switch__track{box-shadow: var(--shadow-focus);}
.adm .cmn-switch input:disabled + .cmn-switch__track{opacity: .5;}
.adm .cmn-switch--disabled{cursor: not-allowed;}
.adm .cmn-switch__label{font-size: var(--text-body); color: var(--text-primary);}
.adm .cmn-check{display: inline-flex; align-items: flex-start; gap: var(--space-3); cursor: pointer; font-family: var(--font-sans); user-select: none;}
.adm .cmn-check input{position: absolute; opacity: 0; width: 0; height: 0;}
.adm .cmn-check__box{width: 20px; height: 20px; flex: none; margin-top: 1px;
  border: var(--border-width-strong) solid var(--border-default);
  border-radius: var(--radius-xs);
  background: var(--surface-card);
  display: inline-flex; align-items: center; justify-content: center;
  transition: background var(--duration-fast) var(--ease-standard),
              border-color var(--duration-fast) var(--ease-standard);}
.adm .cmn-check__box svg{width: 13px; height: 13px; opacity: 0; transform: scale(.6);
  transition: opacity var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out);}
.adm .cmn-check:hover .cmn-check__box{border-color: var(--green-500);}
.adm .cmn-check input:checked + .cmn-check__box{background: var(--green-500); border-color: var(--green-500);}
.adm .cmn-check input:checked + .cmn-check__box svg{opacity: 1; transform: scale(1);}
.adm .cmn-check input:focus-visible + .cmn-check__box{box-shadow: var(--shadow-focus);}
.adm .cmn-check input:disabled + .cmn-check__box{opacity: .5;}
.adm .cmn-check--disabled{cursor: not-allowed;}
.adm .cmn-check__text{font-size: var(--text-body); color: var(--text-primary); line-height: 1.4;}
.adm .cmn-check__text small{display: block; font-size: var(--text-caption); color: var(--text-muted); margin-top: 2px;}
.adm .cmn-field{display: flex; flex-direction: column; gap: var(--space-2); font-family: var(--font-sans);}
.adm .cmn-field__label{font-size: var(--text-body-sm); font-weight: var(--weight-medium); color: var(--text-secondary);}
.adm .cmn-field__req{color: var(--orange-500); margin-left: 2px;}
.adm .cmn-input-wrap{position: relative; display: flex; align-items: center;}
.adm .cmn-input{width: 100%; height: var(--control-md); box-sizing: border-box;
  font-family: var(--font-sans); font-size: var(--text-body); color: var(--text-primary);
  background: var(--surface-card);
  border: var(--border-width) solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 0 var(--space-4);
  transition: border-color var(--duration-fast) var(--ease-standard),
              box-shadow var(--duration-fast) var(--ease-standard);
  outline: none;}
.adm textarea.cmn-input{height: auto; padding: var(--space-3) var(--space-4); resize: vertical; line-height: 1.5; min-height: 88px;}
.adm .cmn-input::placeholder{color: var(--text-subtle);}
.adm .cmn-input:hover{border-color: var(--taupe-500);}
.adm .cmn-input:focus{border-color: var(--green-500); box-shadow: var(--shadow-focus);}
.adm .cmn-input[disabled]{background: var(--taupe-50); color: var(--text-subtle); cursor: not-allowed;}
.adm .cmn-input--icon{padding-left: 42px;}
.adm .cmn-input__icon{position: absolute; left: var(--space-3); display: inline-flex; color: var(--text-subtle);
  pointer-events: none;}
.adm .cmn-field--error .cmn-input{border-color: var(--danger-500);}
.adm .cmn-field--error .cmn-input:focus{box-shadow: 0 0 0 3px rgba(196,61,42,.22);}
.adm .cmn-field__help{font-size: var(--text-caption); color: var(--text-muted);}
.adm .cmn-field--error .cmn-field__help{color: var(--danger-500);}
`;
