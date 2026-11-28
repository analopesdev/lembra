package app

import (
	"context"
	"fmt"
	"time"

	"github.com/analopesdev/lembra/backend/internal/kernel"
	"github.com/analopesdev/lembra/backend/internal/modules/media/domain"
)

const URLTTL = 15 * time.Minute

type Objects interface {
	PresignPut(ctx context.Context, key, contentType string, ttl time.Duration) (string, error)
	PresignGet(ctx context.Context, key string, ttl time.Duration) (string, error)
	Exists(ctx context.Context, key string) (bool, error)
}

type Service struct {
	ids     kernel.IDGenerator
	clock   kernel.Clock
	objects Objects
}

func New(ids kernel.IDGenerator, clock kernel.Clock, objects Objects) *Service {
	return &Service{ids: ids, clock: clock, objects: objects}
}

type Upload struct {
	ID        kernel.ID
	Key       string
	URL       string
	ExpiresAt time.Time
}

type Download struct {
	ID        kernel.ID
	URL       string
	ExpiresAt time.Time
}

func (s *Service) CreateUpload(ctx context.Context, userID kernel.ID, clientID *kernel.ID, kind, contentType string, size int64) (Upload, error) {
	k, err := domain.ParseKind(kind)
	if err != nil {
		return Upload{}, err
	}
	ct, err := domain.ParseContentType(k, contentType)
	if err != nil {
		return Upload{}, err
	}
	if err := domain.ParseSize(size); err != nil {
		return Upload{}, err
	}
	id := s.ids.NewID()
	if clientID != nil && *clientID != (kernel.ID{}) {
		id = *clientID
	}
	key := domain.ObjectKey(userID, id)
	url, err := s.objects.PresignPut(ctx, key, ct, URLTTL)
	if err != nil {
		return Upload{}, fmt.Errorf("presign put: %w", err)
	}
	return Upload{ID: id, Key: key, URL: url, ExpiresAt: s.clock.Now().Add(URLTTL)}, nil
}

func (s *Service) Download(ctx context.Context, userID, mediaID kernel.ID) (Download, error) {
	key := domain.ObjectKey(userID, mediaID)
	ok, err := s.objects.Exists(ctx, key)
	if err != nil {
		return Download{}, fmt.Errorf("exists: %w", err)
	}
	if !ok {
		return Download{}, kernel.ErrNotFound
	}
	url, err := s.objects.PresignGet(ctx, key, URLTTL)
	if err != nil {
		return Download{}, fmt.Errorf("presign get: %w", err)
	}
	return Download{ID: mediaID, URL: url, ExpiresAt: s.clock.Now().Add(URLTTL)}, nil
}
