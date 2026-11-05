#!/usr/bin/env bash
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
JAR=/tmp/ff-ai-test-cookies.txt
TICKET=cmvtlah4n000d9knwjee9u6uf
STORE=cmvtlah4g000b9knw0dos1zwv

# refresh login if needed
if [[ ! -f "$JAR" ]] || ! curl -sS -b "$JAR" -m 10 -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/app/dashboard | grep -q 200; then
  CSRF=$(curl -sS -c "$JAR" -b "$JAR" http://127.0.0.1:3000/api/auth/csrf | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).csrfToken||''))")
  curl -sS -c "$JAR" -b "$JAR" -X POST "http://127.0.0.1:3000/api/auth/callback/credentials" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "csrfToken=$CSRF" \
    --data-urlencode 'email=owner@demo.facilityflow.local' \
    --data-urlencode 'password=DemoOwner123!' \
    --data-urlencode 'callbackUrl=/app/dashboard' \
    --data-urlencode 'json=true' -o /tmp/ff-ai-login.json >/dev/null
fi

echo "== health =="
curl -sS -b "$JAR" -m 15 http://127.0.0.1:3000/api/ai/health
echo
echo "== unauth =="
curl -sS -m 10 -o /dev/null -w "unauth_health=%{http_code}\n" http://127.0.0.1:3000/api/ai/health
curl -sS -m 10 -X POST http://127.0.0.1:3000/api/ai/similar-tickets -H 'Content-Type: application/json' -d '{}' -o /dev/null -w "unauth_similar=%{http_code}\n"

run() {
  local name="$1" path="$2" body="$3"
  local out="/tmp/ff-ai-${name}.json"
  local code
  code=$(curl -sS -b "$JAR" -m 120 -X POST "http://127.0.0.1:3000${path}" \
    -H 'Content-Type: application/json' \
    -d "$body" -o "$out" -w "%{http_code}" || echo ERR)
  node -e '
const fs=require("fs");
const [name,code,out]=process.argv.slice(1);
let j={};
try { j=JSON.parse(fs.readFileSync(out,"utf8")); } catch(e) {
  console.log(name, "http="+code, "PARSE", e.message); process.exit(0);
}
const src=j.source||(j.suggestion&&j.suggestion.source)||"-";
console.log(name, "http="+code, "source="+src, "needsConfirm="+j.needsConfirm, "err="+(j.error||"-"));
' "$name" "$code" "$out"
}

echo "== matrix =="
run category /api/ai/suggest-category '{"description":"Frigo banco caldo corridoio 2 da ieri sera, prodotto a rischio"}'
run priority /api/ai/suggest-priority '{"description":"Frigo banco caldo urgente chiuso al pubblico","category":"frigo"}'
run vendor /api/ai/suggest-vendor "{\"storeId\":\"$STORE\",\"category\":\"frigo\"}"
run summarize /api/ai/summarize-ticket "{\"ticketId\":\"$TICKET\"}"
run draft /api/ai/draft-message "{\"ticketId\":\"$TICKET\",\"audience\":\"vendor\"}"
run similar /api/ai/similar-tickets "{\"ticketId\":\"$TICKET\"}"
run breach /api/ai/breach-brief "{\"ticketId\":\"$TICKET\"}"
run digest /api/ai/digest-narrative '{}'
run empty_similar /api/ai/similar-tickets '{}'

echo "== audit =="
node --import tsx -e '
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const invAfter = await p.aiInvocation.count();
const recent = await p.aiInvocation.findMany({
  orderBy: { createdAt: "desc" },
  take: 20,
  select: { feature: true, provider: true, ok: true, latencyMs: true, model: true },
});
const emb = await p.ticketEmbedding.count();
console.log(JSON.stringify({ invAfter, emb, recent }, null, 2));
await p.$disconnect();
'
