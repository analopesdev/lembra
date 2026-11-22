// Package observ configura logs estruturados (slog).
package observ

import (
	"context"
	"io"
	"log/slog"
)

type ctxKey struct{}

// NewLogger cria um logger JSON no nível pedido.
func NewLogger(w io.Writer, level slog.Level) *slog.Logger {
	return slog.New(slog.NewJSONHandler(w, &slog.HandlerOptions{Level: level}))
}

// WithLogger guarda o logger (já com request_id/user_id) no contexto.
func WithLogger(ctx context.Context, l *slog.Logger) context.Context {
	return context.WithValue(ctx, ctxKey{}, l)
}

// FromContext devolve o logger do contexto, ou o padrão.
func FromContext(ctx context.Context) *slog.Logger {
	if l, ok := ctx.Value(ctxKey{}).(*slog.Logger); ok {
		return l
	}
	return slog.Default()
}
