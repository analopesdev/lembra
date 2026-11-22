package httpx

import (
	"log/slog"
	"net/http"

	"github.com/anamorais/lembra/backend/internal/kernel"
	"github.com/anamorais/lembra/backend/internal/platform/observ"
)

// RequestIDHeader é o cabeçalho usado para correlacionar requisições.
const RequestIDHeader = "X-Request-ID"

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (s *statusWriter) WriteHeader(code int) {
	s.status = code
	s.ResponseWriter.WriteHeader(code)
}

// Chain aplica middlewares de fora para dentro (o primeiro é o mais externo).
func Chain(h http.Handler, mws ...func(http.Handler) http.Handler) http.Handler {
	for i := len(mws) - 1; i >= 0; i-- {
		h = mws[i](h)
	}
	return h
}

// RequestID garante um request_id, devolve no cabeçalho e coloca um logger com ele no contexto.
func RequestID(ids kernel.IDGenerator, base *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			rid := r.Header.Get(RequestIDHeader)
			if rid == "" {
				rid = ids.NewID().String()
			}
			w.Header().Set(RequestIDHeader, rid)
			ctx := observ.WithLogger(r.Context(), base.With("request_id", rid))
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// Recover transforma panics em 500 problem+json.
func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				observ.FromContext(r.Context()).Error("panic", "panic", rec)
				WriteError(w, r, nil)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// AccessLog registra método, caminho, status e duração (sem corpo nem dados pessoais).
func AccessLog(clock kernel.Clock) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := clock.Now()
			sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(sw, r)
			observ.FromContext(r.Context()).Info("http",
				"method", r.Method, "path", r.URL.Path, "status", sw.status,
				"duration_ms", clock.Now().Sub(start).Milliseconds())
		})
	}
}
