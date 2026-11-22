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
	// Rota desconhecida também responde em problem+json (ADR-0011).
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) { WriteError(w, r, kernel.ErrNotFound) })
	return Chain(mux, RequestID(ids, logger), Recover, AccessLog(clock))
}
