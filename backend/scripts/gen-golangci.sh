#!/usr/bin/env bash
# Gera .golangci.yml a partir de scripts/modules.txt.
# Novo módulo: adicione o nome em modules.txt e rode `make lint-config`.
set -euo pipefail
cd "$(dirname "$0")/.."
MOD=github.com/anamorais/lembra/backend
mapfile -t MODULES < scripts/modules.txt

{
cat <<YAML
# GERADO por scripts/gen-golangci.sh. Não edite à mão.
version: "2"
run:
  build-tags: [integration]
linters:
  default: none
  enable: [depguard, forbidigo, errcheck, gosec, govet, staticcheck, unused, ineffassign]
  settings:
    forbidigo:
      forbid:
        - pattern: '^time\.Now\$'
          msg: "Use kernel.Clock; time.Now só em kernel/platform/cmd."
        - pattern: '^time\.Sleep\$'
          msg: "Sem sleep: use FakeClock."
    depguard:
      rules:
YAML
for m in "${MODULES[@]}"; do
cat <<YAML
        ${m}-domain:
          list-mode: strict
          files: ["**/internal/modules/${m}/domain/**", "!\$test"]
          allow: [\$gostd, ${MOD}/internal/kernel]
YAML
cat <<YAML
        ${m}-domain-io:
          files: ["**/internal/modules/${m}/domain/**", "!\$test"]
          deny:
            - {pkg: net, desc: "sem I/O no domain"}
            - {pkg: os, desc: "sem I/O no domain"}
            - {pkg: io/ioutil, desc: "sem I/O no domain"}
            - {pkg: database/sql, desc: "sem SQL no domain"}
            - {pkg: log, desc: "sem logging no domain"}
            - {pkg: log/slog, desc: "sem logging no domain"}
            - {pkg: math/rand, desc: "aleatoriedade deve ser injetada"}
            - {pkg: crypto/rand, desc: "aleatoriedade deve ser injetada"}
YAML
deny_others() { # $1 = kinds to deny for other modules
  for o in "${MODULES[@]}"; do
    [ "$o" = "$m" ] && continue
    for k in $1; do
      echo "            - pkg: ${MOD}/internal/modules/${o}/${k}"
      echo "              desc: módulos só se falam pelo app.Service público"
    done
  done
}
cat <<YAML
        ${m}-app:
          files: ["**/internal/modules/${m}/app/**"]
          deny:
            - pkg: ${MOD}/internal/modules/${m}/adapters
              desc: app não importa adapters (adapters → app → domain)
            - pkg: net/http
              desc: sem HTTP em app
            - pkg: database/sql
              desc: sem SQL em app
            - pkg: github.com/jackc/pgx
              desc: sem SQL em app
YAML
deny_others "domain adapters"
cat <<YAML
        ${m}-adapters:
          files: ["**/internal/modules/${m}/adapters/**"]
          deny:
YAML
deny_others "domain adapters"
done
cat <<YAML
  exclusions:
    rules:
      - path: '(^|/)(cmd|internal/kernel|internal/platform)/'
        linters: [forbidigo]
      - path: '_test\.go\$'
        linters: [forbidigo, gosec]
      - path: 'internal/platform/apigen/'
        linters: [govet, staticcheck, unused, errcheck, gosec]
YAML
} > .golangci.yml
