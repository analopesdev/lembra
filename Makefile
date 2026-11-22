.PHONY: dev gen test test-int lint lint-arch-test migrate-up deps-up deps-down

deps-up:
	docker compose up -d --wait

deps-down:
	docker compose down

dev: deps-up
	$(MAKE) -C backend dev

gen:
	$(MAKE) -C backend gen
	pnpm --filter mobile gen:api

test:
	$(MAKE) -C backend test
	pnpm --filter mobile test

test-int:
	$(MAKE) -C backend test-int

lint:
	$(MAKE) -C backend lint
	pnpm --filter mobile lint

lint-arch-test:
	$(MAKE) -C backend lint-arch-test
	pnpm --filter mobile lint-arch-test

migrate-up:
	$(MAKE) -C backend migrate-up
