// Command api sobe o servidor HTTP do Lembra (composition root).
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/analopesdev/lembra/backend/internal/kernel"
	"github.com/analopesdev/lembra/backend/internal/platform/config"
	"github.com/analopesdev/lembra/backend/internal/platform/httpx"
	"github.com/analopesdev/lembra/backend/internal/platform/observ"
)

func main() {
	if err := run(); err != nil {
		slog.Error("falha fatal", "err", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.FromEnv()
	if err != nil {
		return err
	}
	logger := observ.NewLogger(os.Stdout, cfg.LogLevel)
	slog.SetDefault(logger)

	srv := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           httpx.NewHandler(logger, kernel.SystemClock{}, kernel.UUIDv7Generator{}),
		ReadHeaderTimeout: 5 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	errCh := make(chan error, 1)
	go func() {
		logger.Info("api iniciada", "addr", cfg.HTTPAddr, "env", cfg.Env)
		errCh <- srv.ListenAndServe()
	}()

	select {
	case err := <-errCh:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return srv.Shutdown(shutdownCtx)
	}
	return nil
}
