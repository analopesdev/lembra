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
	S3Endpoint  string
	S3Region    string
	S3Bucket    string
	S3AccessKey string
	S3SecretKey string
	S3PathStyle bool
	LocalUserID string
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
	s3 := func(key, localDef string) string {
		if cfg.Env == "local" {
			return get(key, localDef)
		}
		return get(key, "")
	}
	cfg.S3Endpoint = s3("LEMBRA_S3_ENDPOINT", "http://127.0.0.1:9000")
	cfg.S3Region = s3("LEMBRA_S3_REGION", "us-east-1")
	cfg.S3Bucket = s3("LEMBRA_S3_BUCKET", "lembra")
	cfg.S3AccessKey = s3("LEMBRA_S3_ACCESS_KEY", "lembra")
	cfg.S3SecretKey = s3("LEMBRA_S3_SECRET_KEY", "lembra-secret")
	cfg.S3PathStyle = s3("LEMBRA_S3_PATH_STYLE", "true") != "false"
	cfg.LocalUserID = s3("LEMBRA_LOCAL_USER_ID", "01900000-0000-7000-8000-000000000001")
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
