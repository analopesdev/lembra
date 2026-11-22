GOBIN ?= $(shell go env GOPATH)/bin
export PATH := $(PATH):$(GOBIN)

# Só pacotes com testes: -cover em pacote sem teste quebra quando o toolchain é trocado automaticamente.
TEST_PKGS := $(shell go list -f '{{if or .TestGoFiles .XTestGoFiles}}{{.ImportPath}}{{end}}' ./...)

.PHONY: dev gen gen-check test test-int lint lint-arch-test migrate-up build lint-config

dev:
	go run ./cmd/api

gen:
	oapi-codegen -config oapi-codegen.yaml ../contracts/openapi.yaml

gen-check: gen
	git diff --exit-code -- internal/platform/apigen

test:
	go test -race -cover $(TEST_PKGS)

test-int:
	go test -tags=integration ./...

lint-config:
	./scripts/gen-golangci.sh

lint:
	golangci-lint run ./...

lint-arch-test:
	./scripts/lint-arch-test.sh

migrate-up:
	@echo "sem migrações ainda (Etapa 3)"

build:
	go build -o bin/ ./cmd/...
