package httpx

import (
	"encoding/json"
	"net/http"

	"github.com/analopesdev/lembra/backend/internal/platform/apigen"
)

// Server implementa apigen.ServerInterface.
type Server struct{}

// GetHealth responde ao health check (GET /v1/health).
func (Server) GetHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(apigen.Health{Status: apigen.Ok})
}
