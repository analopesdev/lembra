// Package config lê a configuração do ambiente (12-factor).
package config

import (
	"fmt"
	"log/slog"
	"os"
	"strings"
)

// Config é a configuração do processo.
type Config struct {
	Env         string
	HTTPAddr    string
	LogLevel    slog.Level
	DatabaseURL string
}

// Load lê as variáveis LEMBRA_* usando lookup (os.LookupEnv em produção).
func Load(lookup func(string) (string, bool)) (Config, error) {
	get := func(key, def string) string {
		if v, ok := lookup(key); ok && v != "" {
			return v
		}
		return def
	}
	cfg := Config{
		Env:         get("LEMBRA_ENV", "local"),
		HTTPAddr:    get("LEMBRA_HTTP_ADDR", ":8080"),
		DatabaseURL: get("LEMBRA_DATABASE_URL", ""),
	}
	switch strings.ToLower(get("LEMBRA_LOG_LEVEL", "info")) {
	case "debug":
		cfg.LogLevel = slog.LevelDebug
	case "info":
		cfg.LogLevel = slog.LevelInfo
	case "warn":
		cfg.LogLevel = slog.LevelWarn
	case "error":
		cfg.LogLevel = slog.LevelError
	default:
		return Config{}, fmt.Errorf("config: LEMBRA_LOG_LEVEL inválido: %q", get("LEMBRA_LOG_LEVEL", ""))
	}
	return cfg, nil
}

// FromEnv carrega a configuração do ambiente do processo.
func FromEnv() (Config, error) { return Load(os.LookupEnv) }
