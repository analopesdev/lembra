#!/usr/bin/env bash
# Prova que o ESLint barra violações de arquitetura: cria arquivos ruins, espera falha, limpa.
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p src/features/aaa src/features/bbb src/domain/scheduling src/data/db
# Alvos reais: o plugin só classifica imports que resolvem para arquivos existentes.
printf 'export const x = 1;\n' > src/domain/scheduling/zz_target.ts
printf 'export const x = 1;\n' > src/data/db/zz_target.ts
printf 'export const x = 1;\n' > src/features/aaa/index.ts
printf 'export const x = 1;\n' > src/features/bbb/zz_inner.ts
printf 'export const x = 1;\n' > src/features/bbb/index.ts
cleanup() {
  rm -f app/zz_bad.tsx src/features/aaa/zz_bad.ts src/features/aaa/index.ts src/features/bbb/zz_inner.ts src/features/bbb/index.ts src/domain/scheduling/zz_target.ts src/data/db/zz_target.ts src/features/bbb/zz_ok.ts \
    src/domain/scheduling/zz_bad.ts src/data/db/zz_bad.ts src/shared/ui/zz_bad.ts src/shared/ui/zz_platform_ok.ts src/features/aaa/zz_platform_bad.ts
  rmdir src/features/aaa src/features/bbb src/domain/scheduling src/data/db 2>/dev/null; true
}
trap cleanup EXIT

fail=0
expect_violation() { # nome arquivo conteúdo
  mkdir -p "$(dirname "$2")"; printf '%s\n' "$3" > "$2"
  if pnpm exec eslint "$2" >/dev/null 2>&1; then echo "FALHOU: '$1' não foi barrado"; fail=1; else echo "ok: $1 barrado"; fi
  rm -f "$2"
}
expect_ok() {
  mkdir -p "$(dirname "$2")"; printf '%s\n' "$3" > "$2"
  if pnpm exec eslint "$2" >/dev/null 2>&1; then echo "ok: $1 permitido"; else echo "FALHOU: '$1' foi barrado"; fail=1; fi
  rm -f "$2"
}

expect_violation "route importa data"            app/zz_bad.tsx "import '@/data/api/schema.gen';
export default function X() { return null; }"
expect_violation "route importa domain"          app/zz_bad.tsx "import '@/domain/scheduling/zz_target';
export default function X() { return null; }"
expect_violation "domain importa data"           src/domain/scheduling/zz_bad.ts "import '@/data/db/zz_target'; export {};"
expect_violation "domain importa shared"         src/domain/scheduling/zz_bad.ts "import '@/shared/ui'; export {};"
expect_violation "domain importa react"          src/domain/scheduling/zz_bad.ts "import 'react'; export {};"
expect_violation "domain usa new Date()"         src/domain/scheduling/zz_bad.ts "export const a = new Date();"
expect_violation "domain usa Date.now()"         src/domain/scheduling/zz_bad.ts "export const a = Date.now();"
expect_violation "domain usa Math.random()"      src/domain/scheduling/zz_bad.ts "export const a = Math.random();"
expect_violation "data importa feature"          src/data/db/zz_bad.ts "import '@/features/aaa'; export {};"
expect_violation "shared importa domain"         src/shared/ui/zz_bad.ts "import '@/domain/scheduling/zz_target'; export {};"
expect_violation "any explícito"                 src/shared/ui/zz_bad.ts "export const a: any = 1;"
expect_violation "Platform.OS fora do adaptador" src/features/aaa/zz_platform_bad.ts "import { Platform } from 'react-native';
export const a = Platform.OS;"
expect_ok "Platform.OS em shared/ui"             src/shared/ui/zz_platform_ok.ts "import { Platform } from 'react-native';
export const a = Platform.OS;"
expect_violation "feature importa interno de outra feature" src/features/aaa/zz_bad.ts "import '@/features/bbb/zz_inner'; export {};"
expect_violation "route importa interno de feature" app/zz_bad.tsx "import '@/features/bbb/zz_inner';
export default function X() { return null; }"
expect_ok "feature importa index de outra feature" src/features/aaa/zz_bad.ts "import '@/features/bbb'; export {};"
expect_ok "feature importa a si mesma por arquivo interno" src/features/bbb/zz_ok.ts "import './zz_inner'; export {};"
expect_ok "feature importa domain e data" src/features/aaa/zz_bad.ts "import '@/domain/scheduling/zz_target'; import '@/data/db/zz_target'; export {};"
expect_ok "feature importa domain e shared"      src/features/aaa/zz_bad.ts "import '@/shared/i18n'; export {};"
exit $fail
