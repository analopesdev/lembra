package httpx

import (
	"log/slog"
	"net/http"

	"github.com/anamorais/lembra/backend/internal/kernel"
	"github.com/anamorais/lembra/backend/internal/platform/apigen"
)

// NewHandler monta o roteador com os middlewares padrão.
func NewHandler(logger *slog.Logger, clock kernel.Clock, ids kernel.IDGenerator) http.Handler {
	mux := http.NewServeMux()
	apigen.HandlerFromMux(Server{}, mux)
	return Chain(mux, RequestID(ids, logger), Recover, AccessLog(clock))
}
