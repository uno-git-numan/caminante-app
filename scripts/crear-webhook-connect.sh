#!/usr/bin/env bash
# Crea el SEGUNDO endpoint de webhook de Stripe: el de CUENTAS CONECTADAS.
#
# ¿Por qué un segundo endpoint y no una casilla en el que ya existe? Porque en
# Stripe el alcance de un endpoint es O «tu cuenta» O «cuentas conectadas»
# (parámetro `connect`), nunca los dos — y solo se puede fijar AL CREARLO. Así que
# `account.updated` de los operadores necesita su propio endpoint, con su propia
# firma. La ruta del webhook ya prueba los dos secretos.
#
# ⚠️ NO TOCA el endpoint de cobros que ya existe. Su secreto no cambia.
#
# Cómo se usa:
#   1. Copia tu llave secreta LIVE de Stripe al portapapeles
#      (Stripe → Developers → API keys → Secret key, la que empieza con sk_live_).
#   2. Corre:  bash scripts/crear-webhook-connect.sh
#
# La llave se lee del portapapeles, se usa en memoria y NO se imprime, NO se
# guarda en ningún archivo y NO queda en el historial del shell. Lo único que el
# script imprime es el signing secret nuevo (whsec_…), que es justo lo que hay que
# pegar en Vercel como STRIPE_WEBHOOK_SECRET_CONNECT.

set -euo pipefail

URL="https://caminante.numanhub.com/caminante/api/payments/webhook"

K="$(pbpaste | tr -d '[:space:]')"

if [ -z "$K" ]; then
  echo "El portapapeles está vacío. Copia tu llave sk_live_… y vuelve a correr." >&2
  exit 1
fi
case "$K" in
  sk_live_*) : ;;
  sk_test_*)
    echo "Esa es la llave de PRUEBA (sk_test_). El endpoint hay que crearlo en LIVE." >&2
    exit 1 ;;
  rk_*)
    echo "Esa es una llave restringida (rk_). Para crear un webhook hace falta la secreta (sk_live_)." >&2
    exit 1 ;;
  *)
    echo "Lo que hay en el portapapeles no parece una llave de Stripe." >&2
    exit 1 ;;
esac

# Idempotencia: si ya existe un endpoint de cuentas conectadas apuntando a esta
# URL, no se crea otro. Dos endpoints iguales significarían eventos duplicados y
# dos secretos válidos, y nadie sabría cuál está en Vercel.
echo "Revisando si ya existe…"
YA="$(curl -s "https://api.stripe.com/v1/webhook_endpoints?limit=100" -u "$K:" \
  | URL="$URL" python3 -c "
import json,sys,os
d = json.load(sys.stdin)
if 'error' in d:
    print('ERROR:' + d['error'].get('message','')); raise SystemExit
url = os.environ['URL']
for e in d.get('data', []):
    if e.get('url') == url and e.get('connect') is True:
        print(e['id']); raise SystemExit
print('')
")"

case "$YA" in
  ERROR:*)
    echo "Stripe rechazó la llave: ${YA#ERROR:}" >&2
    exit 1 ;;
  we_*)
    cat >&2 <<EOF

Ya existe un endpoint de cuentas conectadas para esta URL: $YA

Stripe solo muestra el signing secret AL CREARLO, así que no se puede volver a
leer desde aquí. Dos opciones:
  · Si ya tienes ese secreto guardado, pégalo en Vercel y listo.
  · Si lo perdiste, borra ese endpoint en el dashboard y vuelve a correr esto.
EOF
    exit 1 ;;
esac

echo "Creando el endpoint…"
RES="$(curl -s https://api.stripe.com/v1/webhook_endpoints -u "$K:" \
  -d "url=$URL" \
  -d "connect=true" \
  -d "enabled_events[]=account.updated" \
  -d "description=Cuentas conectadas de operadores (Connect) — account.updated")"

echo "$RES" | python3 -c "
import json,sys
d = json.load(sys.stdin)
if 'error' in d:
    print('Stripe rechazó la creación:', d['error'].get('message',''), file=sys.stderr)
    raise SystemExit(1)
print()
print('Endpoint creado:', d['id'])
print('  url     :', d['url'])
print('  connect :', d.get('connect'))
print('  eventos :', ', '.join(d.get('enabled_events', [])))
print()
print('Pega ESTO en Vercel como STRIPE_WEBHOOK_SECRET_CONNECT (Production):')
print()
print('   ', d.get('secret',''))
print()
print('Stripe solo lo muestra ahora. Si lo pierdes, hay que borrar el endpoint y')
print('volver a crearlo.')
"
