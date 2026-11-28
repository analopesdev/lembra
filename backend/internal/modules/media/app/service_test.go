package app_test

import (
	"context"
	"testing"
	"time"

	"github.com/analopesdev/lembra/backend/internal/kernel"
	"github.com/analopesdev/lembra/backend/internal/modules/media/app"
	"github.com/analopesdev/lembra/backend/internal/modules/media/domain"
)

type seqIDs struct{ n byte }

func (s *seqIDs) NewID() kernel.ID {
	s.n++
	return kernel.ID{15: s.n}
}

type fakeObjects struct {
	puts, gets []string
	keys       map[string]bool
}

func (f *fakeObjects) PresignPut(_ context.Context, key, _ string, _ time.Duration) (string, error) {
	f.puts = append(f.puts, key)
	return "https://minio/put/" + key, nil
}
func (f *fakeObjects) PresignGet(_ context.Context, key string, _ time.Duration) (string, error) {
	f.gets = append(f.gets, key)
	return "https://minio/get/" + key, nil
}
func (f *fakeObjects) Exists(_ context.Context, key string) (bool, error) { return f.keys[key], nil }

func TestCreateUpload(t *testing.T) {
	clock := kernel.NewFakeClock(time.Date(2026, 11, 24, 12, 0, 0, 0, time.UTC))
	obj := &fakeObjects{keys: map[string]bool{}}
	svc := app.New(&seqIDs{}, clock, obj)
	user := kernel.ID{15: 9}
	got, err := svc.CreateUpload(context.Background(), user, nil, "image", "image/webp", 1200)
	if err != nil {
		t.Fatal(err)
	}
	wantKey := domain.ObjectKey(user, kernel.ID{15: 1})
	if got.Key != wantKey || got.URL != "https://minio/put/"+wantKey {
		t.Fatalf("%+v", got)
	}
	if got.ExpiresAt != clock.Now().Add(app.URLTTL) {
		t.Fatalf("expires %v", got.ExpiresAt)
	}
}

func TestCreateUploadKeepsClientID(t *testing.T) {
	svc := app.New(&seqIDs{}, kernel.NewFakeClock(time.Now().UTC()), &fakeObjects{})
	user := kernel.ID{15: 9}
	mine := kernel.ID{15: 42}
	got, err := svc.CreateUpload(context.Background(), user, &mine, "image", "image/webp", 1200)
	if err != nil {
		t.Fatal(err)
	}
	if got.ID != mine || got.Key != domain.ObjectKey(user, mine) {
		t.Fatalf("%+v", got)
	}
}

func TestCreateUploadRejectsBadInput(t *testing.T) {
	svc := app.New(&seqIDs{}, kernel.NewFakeClock(time.Now().UTC()), &fakeObjects{})
	if _, err := svc.CreateUpload(context.Background(), kernel.ID{}, nil, "image", "text/plain", 10); err == nil {
		t.Fatal("esperava erro")
	}
}

func TestDownload(t *testing.T) {
	clock := kernel.NewFakeClock(time.Date(2026, 11, 24, 12, 0, 0, 0, time.UTC))
	user := kernel.ID{15: 9}
	media := kernel.ID{15: 3}
	key := domain.ObjectKey(user, media)
	obj := &fakeObjects{keys: map[string]bool{key: true}}
	svc := app.New(&seqIDs{}, clock, obj)
	got, err := svc.Download(context.Background(), user, media)
	if err != nil {
		t.Fatal(err)
	}
	if got.URL != "https://minio/get/"+key {
		t.Fatalf("%+v", got)
	}
}

func TestDownloadMissing(t *testing.T) {
	svc := app.New(&seqIDs{}, kernel.NewFakeClock(time.Now().UTC()), &fakeObjects{keys: map[string]bool{}})
	_, err := svc.Download(context.Background(), kernel.ID{15: 1}, kernel.ID{15: 2})
	if err != kernel.ErrNotFound {
		t.Fatalf("err = %v", err)
	}
}
