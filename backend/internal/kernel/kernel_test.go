package kernel_test

import (
	"testing"
	"time"

	"github.com/anamorais/lembra/backend/internal/kernel"
)

func TestUUIDv7Generator(t *testing.T) {
	g := kernel.UUIDv7Generator{}
	a, b := g.NewID(), g.NewID()
	if a == b {
		t.Fatal("ids devem ser únicos")
	}
	if a.Version() != 7 {
		t.Fatalf("versão = %d, quer 7", a.Version())
	}
}

func TestFakeClock(t *testing.T) {
	start := time.Date(2026, 11, 22, 4, 0, 0, 0, time.UTC)
	c := kernel.NewFakeClock(start)
	if !c.Now().Equal(start) {
		t.Fatal("now inicial errado")
	}
	c.Advance(90 * time.Minute)
	if want := start.Add(90 * time.Minute); !c.Now().Equal(want) {
		t.Fatalf("now = %v, quer %v", c.Now(), want)
	}
}

func TestSystemClockIsUTC(t *testing.T) {
	if kernel.SystemClock.Now(kernel.SystemClock{}).Location() != time.UTC {
		t.Fatal("SystemClock deve devolver UTC")
	}
}
