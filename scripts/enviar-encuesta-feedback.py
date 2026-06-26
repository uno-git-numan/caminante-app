#!/usr/bin/env python3
"""
Envía la encuesta de satisfacción de Caminante por correo (vía Resend).

Cada estrella del correo es un link que abre la encuesta con esa nota ya puesta
(?s=N). El botón principal abre la encuesta sin pre-selección.

Lee llaves de ~/dev/caminante-app/.env.local (RESEND_API_KEY, SUPABASE_URL/KEY).
NUNCA imprime la key.

Modos:
  --test correo@x.com        Manda UN correo de prueba (usa el token de prueba).
  --send                     Manda a TODOS los invited del experience (status=invited).
  (sin flag)                 Dry-run: lista a quién enviaría, sin mandar nada.

Opciones:
  --base URL                 Base del sitio (default https://caminante.numanhub.com)
  --exp UUID                 experience_id (default Ensenada)
  --token UUID               token a usar en --test (default token de prueba)
"""
import os, sys, json, time, argparse, urllib.request, urllib.error, re

ENV = os.path.expanduser("~/dev/caminante-app/.env.local")
PROD = "https://caminante.numanhub.com"
EXP_ENSENADA = "4791b13b-8a36-480b-a30d-784d3db8876d"
TEST_TOKEN = "26820ca9-3627-4abe-9f1f-16ffa795cac6"
FROM = "Caminante <caminante@numanhub.com>"
REPLY_TO = "uno@numanhub.com"
SUBJECT = "¿Cómo te fuiste de Ensenada de Muertos? 🌊"

# Marca
CREMA="#f5f0e8"; LAGOON="#1e3147"; DUNA="#d18730"; ARENA="#d4c5b0"; OLIVO="#5f5f40"


def load_env():
    env = {}
    with open(ENV) as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k] = v
    return env


def first_name(full):
    if not full:
        return "caminante"
    n = full.strip().split()[0]
    return n[:1].upper() + n[1:].lower()


def email_html(name, token, base):
    link = f"{base}/caminante/feedback/{token}"
    # 5 estrellas clicables (glifo ★ — robusto en todos los clientes)
    stars = ""
    for n in range(1, 6):
        stars += (
            f'<a href="{link}?s={n}" target="_blank" '
            f'style="text-decoration:none;color:{DUNA};font-size:40px;'
            f'line-height:1;padding:0 4px;" aria-label="{n} estrellas">★</a>'
        )
    return f"""\
<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:{CREMA};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{CREMA};">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="max-width:540px;background:#ffffff;border:1px solid {ARENA};border-radius:18px;overflow:hidden;">
    <tr><td style="padding:32px 36px 8px 36px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <div style="font-size:12px;letter-spacing:3px;color:{OLIVO};text-transform:uppercase;">
        Caminante &middot; Naturaleza en movimiento
      </div>
    </td></tr>
    <tr><td style="padding:16px 36px 0 36px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <h1 style="margin:0 0 14px 0;font-size:26px;line-height:1.25;color:{LAGOON};font-weight:600;">
        Hola, {name}.
      </h1>
      <p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:{LAGOON};">
        El mar de Ensenada de Muertos ya quedó atrás, pero algo de él se queda
        contigo. Antes de que la marea lo borre, cuéntanos cómo te fuiste: lo que
        viste, lo que sentiste, lo que afinaríamos.
      </p>
      <p style="margin:0 0 4px 0;font-size:16px;line-height:1.6;color:{LAGOON};">
        Son <strong>dos minutos</strong>. Empieza con un toque:
      </p>
    </td></tr>
    <tr><td align="center" style="padding:18px 36px 6px 36px;">
      {stars}
    </td></tr>
    <tr><td align="center" style="padding:0 36px 8px 36px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <div style="font-size:13px;color:{OLIVO};">Toca las estrellas — tu encuesta abre con esa nota ya puesta.</div>
    </td></tr>
    <tr><td align="center" style="padding:18px 36px 30px 36px;">
      <a href="{link}" target="_blank"
        style="display:inline-block;background:{LAGOON};color:#ffffff;text-decoration:none;
        font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;
        font-weight:600;padding:14px 32px;border-radius:999px;">
        Abrir mi encuesta
      </a>
    </td></tr>
    <tr><td style="padding:0 36px 30px 36px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <div style="border-top:1px solid {ARENA};padding-top:18px;font-size:13px;line-height:1.6;color:{OLIVO};">
        Si dejas unas palabras, quizá las compartamos —siempre solo con tus
        iniciales, nunca tu nombre completo. ¿Dudas? Responde este correo y te leemos.
      </div>
    </td></tr>
  </table>
  <div style="max-width:540px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
    font-size:11px;color:{OLIVO};padding:18px 8px;">
    Caminante by NUMAN &middot; uno@numanhub.com
  </div>
</td></tr></table>
</body></html>"""


def resend_send(api_key, to, name, token, base):
    body = {
        "from": FROM, "to": [to], "reply_to": REPLY_TO,
        "subject": SUBJECT, "html": email_html(name, token, base),
    }
    r = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read().decode()).get("id", "")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]


def sb_get(env, path):
    url = env["NEXT_PUBLIC_SUPABASE_URL"]; key = env["SUPABASE_SERVICE_ROLE_KEY"]
    r = urllib.request.Request(url + path, headers={"apikey": key, "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read().decode())


def recipients(env, exp):
    rows = sb_get(env,
        f"/rest/v1/experience_feedback?select=token,status,contact_id,contacts(full_name,email)"
        f"&experience_id=eq.{exp}&status=eq.invited")
    out = []
    for r in rows:
        c = r.get("contacts") or {}
        if c.get("email"):
            out.append((c["full_name"], c["email"], r["token"]))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--test")
    ap.add_argument("--send", action="store_true")
    ap.add_argument("--base", default=PROD)
    ap.add_argument("--exp", default=EXP_ENSENADA)
    ap.add_argument("--token", default=TEST_TOKEN)
    a = ap.parse_args()
    env = load_env()
    api_key = env.get("RESEND_API_KEY")
    if not api_key:
        sys.exit("Falta RESEND_API_KEY en .env.local")

    if a.test:
        sc, info = resend_send(api_key, a.test, "Luis", a.token, a.base)
        print(f"TEST → {a.test} | base={a.base} | HTTP {sc} | {info}")
        return

    recs = recipients(env, a.exp)
    print(f"Invitados pendientes (status=invited): {len(recs)}  | base={a.base}")
    if not a.send:
        for full, email, tok in recs:
            print(f"  (dry) {first_name(full):12s} {email:34s} {tok[:8]}")
        print("\nDry-run. Para enviar de verdad: --send")
        return

    ok = 0
    for full, email, tok in recs:
        sc, info = resend_send(api_key, email, first_name(full), tok, a.base)
        flag = "OK" if sc in (200, 201) else f"ERR {sc}"
        print(f"  [{flag}] {email:34s} {info}")
        if sc in (200, 201):
            ok += 1
        time.sleep(0.6)
    print(f"\nEnviados: {ok}/{len(recs)}")


if __name__ == "__main__":
    main()
