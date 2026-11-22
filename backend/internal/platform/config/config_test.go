package config_test

import (
	"log/slog"
	"testing"

	"github.com/anamorais/lembra/backend/internal/platform/config"
)

func lookup(m map[string]string) func(string) (string, bool) {
	return func(k string) (string, bool) { v, ok := m[k]; return v, ok }
}

func TestLoad(t *testing.T) {
	tests := []struct {
		name    string
		env     map[string]string
		want    config.Config
		wantErr bool
	}{
		{"padrões", map[string]string{}, config.Config{Env: "local", HTTPAddr: ":8080", LogLevel: slog.LevelInfo}, false},
		{"valores", map[string]string{"LEMBRA_ENV": "prod", "LEMBRA_HTTP_ADDR": ":9", "LEMBRA_LOG_LEVEL": "DEBUG", "LEMBRA_DATABASE_URL": "x"},
			config.Config{Env: "prod", HTTPAddr: ":9", LogLevel: slog.LevelDebug, DatabaseURL: "x"}, false},
		{"nível inválido", map[string]string{"LEMBRA_LOG_LEVEL": "xx"}, config.Config{}, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := config.Load(lookup(tt.env))
			if (err != nil) != tt.wantErr {
				t.Fatalf("err = %v, wantErr %v", err, tt.wantErr)
			}
			if got != tt.want {
				t.Fatalf("got %+v, want %+v", got, tt.want)
			}
		})
	}
}
