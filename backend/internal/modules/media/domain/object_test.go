package domain_test

import (
	"testing"

	"github.com/analopesdev/lembra/backend/internal/kernel"
	"github.com/analopesdev/lembra/backend/internal/modules/media/domain"
)

func TestObjectKey(t *testing.T) {
	user := mustID("01900000-0000-7000-8000-000000000001")
	media := mustID("01900000-0000-7000-8000-00000000000a")
	got := domain.ObjectKey(user, media)
	want := "users/01900000-0000-7000-8000-000000000001/media/01900000-0000-7000-8000-00000000000a"
	if got != want {
		t.Fatalf("got %q", got)
	}
}

func TestParseKind(t *testing.T) {
	if _, err := domain.ParseKind("image"); err != nil {
		t.Fatal(err)
	}
	if _, err := domain.ParseKind("pdf"); err == nil {
		t.Fatal("esperava erro")
	}
}

func TestParseContentType(t *testing.T) {
	if _, err := domain.ParseContentType("image", "image/webp"); err != nil {
		t.Fatal(err)
	}
	if _, err := domain.ParseContentType("image", "application/pdf"); err == nil {
		t.Fatal("esperava erro")
	}
}

func TestParseSize(t *testing.T) {
	if err := domain.ParseSize(1); err != nil {
		t.Fatal(err)
	}
	if err := domain.ParseSize(0); err == nil {
		t.Fatal("esperava erro")
	}
	if err := domain.ParseSize(domain.MaxBytes + 1); err == nil {
		t.Fatal("esperava erro")
	}
}

func mustID(s string) kernel.ID {
	id, err := kernel.ParseID(s)
	if err != nil {
		panic(err)
	}
	return id
}
