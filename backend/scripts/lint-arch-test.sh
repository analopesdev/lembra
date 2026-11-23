#!/usr/bin/env bash
# Prova que o lint de arquitetura barra violações: cria arquivos ruins, espera falha, limpa.
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="$PATH:$(go env GOPATH)/bin"
MOD=github.com/analopesdev/lembra/backend
T=internal/modules
cleanup() { rm -rf "$T/cards/domain/zz_bad.go" "$T/cards/app/zz_bad.go" "$T/cards/adapters/zz_bad.go" \
  "$T/quiz/app/zz_bad.go"; rmdir "$T/cards/domain" "$T/cards/app" "$T/cards/adapters" "$T/cards" "$T/quiz/app" "$T/quiz" 2>/dev/null; true; }
trap cleanup EXIT
mkdir -p "$T"/cards/{domain,app,adapters} "$T"/quiz/app "$T"/review/domain

fail=0
expect_violation() { # nome arquivo conteúdo
  printf '%s\n' "$3" > "$2"
  if golangci-lint run ./... >/dev/null 2>&1; then echo "FALHOU: '$1' não foi barrado"; fail=1; else echo "ok: $1 barrado"; fi
  rm -f "$2"
}
expect_violation "domain importa net/http" "$T/cards/domain/zz_bad.go" "package domain
import _ \"net/http\""
expect_violation "domain usa time.Now" "$T/cards/domain/zz_bad.go" "package domain
import \"time\"
var _ = time.Now()"
expect_violation "app importa adapters" "$T/cards/app/zz_bad.go" "package app
import _ \"$MOD/internal/modules/cards/adapters\""
expect_violation "app usa time.Now" "$T/cards/app/zz_bad.go" "package app
import \"time\"
var _ = time.Now()"
expect_violation "módulo importa domain de outro módulo" "$T/quiz/app/zz_bad.go" "package app
import _ \"$MOD/internal/modules/review/domain\""
expect_violation "adapters importam adapters de outro módulo" "$T/cards/adapters/zz_bad.go" "package adapters
import _ \"$MOD/internal/modules/quiz/adapters\""
# Controle positivo: dependência permitida não deve ser barrada.
printf 'package app\nimport _ "%s/internal/kernel"\n' "$MOD" > "$T/cards/app/zz_bad.go"
if golangci-lint run ./... >/dev/null 2>&1; then echo "ok: app → kernel permitido"; else echo "FALHOU: app → kernel foi barrado"; fail=1; fi
exit $fail
