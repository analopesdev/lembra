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
	mediaapp "github.com/analopesdev/lembra/backend/internal/modules/media/app"
	"github.com/analopesdev/lembra/backend/internal/platform/config"
	"github.com/analopesdev/lembra/backend/internal/platform/httpx"
	"github.com/analopesdev/lembra/backend/internal/platform/observ"
	"github.com/analopesdev/lembra/backend/internal/platform/storage"
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

	clock := kernel.SystemClock{}
	ids := kernel.UUIDv7Generator{}
	objects := storage.New(storage.Config{
		Endpoint:     cfg.S3Endpoint,
		Region:       cfg.S3Region,
		Bucket:       cfg.S3Bucket,
		AccessKey:    cfg.S3AccessKey,
		SecretKey:    cfg.S3SecretKey,
		UsePathStyle: cfg.S3PathStyle,
	})
	media := mediaapp.New(ids, clock, objects)
	srv := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           httpx.NewHandler(logger, clock, ids, media, cfg.Env, cfg.LocalUserID),
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
