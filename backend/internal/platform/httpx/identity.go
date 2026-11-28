package httpx

import (
	"context"
	"net/http"

	"github.com/analopesdev/lembra/backend/internal/kernel"
)

type ctxKey struct{}

func WithUserID(ctx context.Context, id kernel.ID) context.Context {
	return context.WithValue(ctx, ctxKey{}, id)
}

func UserIDFrom(ctx context.Context) (kernel.ID, bool) {
	id, ok := ctx.Value(ctxKey{}).(kernel.ID)
	return id, ok
}

func LocalUser(env, localUserID string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if env != "local" || localUserID == "" {
				next.ServeHTTP(w, r)
				return
			}
			id, err := kernel.ParseID(localUserID)
			if err != nil {
				WriteError(w, r, kernel.ErrInvalidInput)
				return
			}
			next.ServeHTTP(w, r.WithContext(WithUserID(r.Context(), id)))
		})
	}
}

func RequireUser(w http.ResponseWriter, r *http.Request) (kernel.ID, bool) {
	id, ok := UserIDFrom(r.Context())
	if !ok {
		WriteError(w, r, kernel.ErrUnauthorized)
		return kernel.ID{}, false
	}
	return id, true
}
