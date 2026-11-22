// Command worker rodará a fila River (ADR-0015). Por ora só valida a configuração.
package main

import (
	"log/slog"
	"os"

	"github.com/anamorais/lembra/backend/internal/platform/config"
	"github.com/anamorais/lembra/backend/internal/platform/observ"
)

func main() {
	cfg, err := config.FromEnv()
	if err != nil {
		slog.Error("config inválida", "err", err)
		os.Exit(1)
	}
	observ.NewLogger(os.Stdout, cfg.LogLevel).Info("worker ainda sem jobs (Etapa 5)")
}
