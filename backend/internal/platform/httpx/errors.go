// Package httpx contém roteador, middlewares e tradução de erros HTTP.
package httpx

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/analopesdev/lembra/backend/internal/kernel"
)

// WriteError traduz um erro para problem+json (RFC 9457). É o único lugar que faz isso.
func WriteError(w http.ResponseWriter, r *http.Request, err error) {
	status, title := http.StatusInternalServerError, "Erro interno"
	detail := ""
	switch {
	case errors.Is(err, kernel.ErrNotFound):
		status, title = http.StatusNotFound, "Não encontrado"
	case errors.Is(err, kernel.ErrInvalidInput):
		status, title, detail = http.StatusBadRequest, "Requisição inválida", err.Error()
	case errors.Is(err, kernel.ErrUnauthorized):
		status, title = http.StatusUnauthorized, "Não autenticado"
	case errors.Is(err, kernel.ErrForbidden):
		status, title = http.StatusForbidden, "Acesso negado"
	case errors.Is(err, kernel.ErrConflict):
		status, title = http.StatusConflict, "Conflito"
	}
	body := map[string]any{"type": "about:blank", "title": title, "status": status, "instance": r.URL.Path}
	if detail != "" {
		body["detail"] = detail
	}
	w.Header().Set("Content-Type", "application/problem+json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
