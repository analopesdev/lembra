package httpx

import (
	"log/slog"
	"net/http"

	"github.com/analopesdev/lembra/backend/internal/kernel"
	mediaapp "github.com/analopesdev/lembra/backend/internal/modules/media/app"
	"github.com/analopesdev/lembra/backend/internal/platform/apigen"
)

// NewHandler monta o roteador com os middlewares padrão.
func NewHandler(logger *slog.Logger, clock kernel.Clock, ids kernel.IDGenerator, media *mediaapp.Service, env, localUserID string) http.Handler {
	mux := http.NewServeMux()
	apigen.HandlerFromMux(Server{Media: media, LocalDev: env == "local"}, mux)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) { WriteError(w, r, kernel.ErrNotFound) })
	return Chain(mux, RequestID(ids, logger), Recover, AccessLog(clock), LocalUser(env, localUserID))
}
