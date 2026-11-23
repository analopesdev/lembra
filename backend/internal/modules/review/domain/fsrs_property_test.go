package domain_test

import (
	"fmt"
	"testing"
	"time"

	"pgregory.net/rapid"

	"github.com/analopesdev/lembra/backend/internal/modules/review/domain"
)

var propStart = time.Date(2026, 1, 5, 7, 0, 0, 0, time.UTC)

func historyGen() *rapid.Generator[[]domain.ReviewEvent] {
	gaps := []time.Duration{0, time.Minute, 10 * time.Minute, 24 * time.Hour, 72 * time.Hour, 240 * time.Hour, 1440 * time.Hour}
	return rapid.Custom(func(t *rapid.T) []domain.ReviewEvent {
		n := rapid.IntRange(1, 40).Draw(t, "n")
		at := propStart
		out := make([]domain.ReviewEvent, n)
		for i := range out {
			at = at.Add(rapid.SampledFrom(gaps).Draw(t, "gap"))
			out[i] = domain.ReviewEvent{ID: fmt.Sprintf("ev-%04d", i), At: at, Rating: domain.Rating(rapid.IntRange(1, 4).Draw(t, "rating"))}
		}
		return out
	})
}

func noShortTerm() domain.Params {
	p := domain.DefaultParams()
	p.EnableShortTerm = false
	return p
}

func TestPropertyDerivationIsPure(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		h := historyGen().Draw(t, "h")
		a, err1 := domain.DeriveState(h, noShortTerm(), propStart)
		b, err2 := domain.DeriveState(h, noShortTerm(), propStart)
		if err1 != nil || err2 != nil || a != b {
			t.Fatalf("não é pura: %+v vs %+v (%v, %v)", a, b, err1, err2)
		}
	})
}

// O sync entrega revisões em qualquer ordem (união de conjuntos): reordenar por (At, ID) dá o mesmo estado.
func TestPropertyOrderOfArrivalDoesNotMatter(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		h := historyGen().Draw(t, "h")
		shuffled := rapid.Permutation(h).Draw(t, "perm")
		want, err := domain.DeriveState(domain.SortHistory(h), noShortTerm(), propStart)
		if err != nil {
			t.Fatal(err)
		}
		got, err := domain.DeriveState(domain.SortHistory(shuffled), noShortTerm(), propStart)
		if err != nil || got != want {
			t.Fatalf("ordem de chegada alterou o estado: %+v vs %+v (%v)", got, want, err)
		}
	})
}

func TestPropertyInvariants(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		h := historyGen().Draw(t, "h")
		s, err := domain.DeriveState(h, noShortTerm(), propStart)
		if err != nil {
			t.Fatal(err)
		}
		if s.Reps != len(h) || s.Lapses > s.Reps || s.Difficulty < 1 || s.Difficulty > 10 || s.Stability <= 0 || s.Due.Before(s.LastReview) {
			t.Fatalf("invariante violada: %+v (n=%d)", s, len(h))
		}
	})
}

func TestSortHistoryTieBreaksByID(t *testing.T) {
	a := domain.ReviewEvent{ID: "a", At: propStart, Rating: domain.Again}
	b := domain.ReviewEvent{ID: "b", At: propStart, Rating: domain.Easy}
	for _, in := range [][]domain.ReviewEvent{{a, b}, {b, a}} {
		got := domain.SortHistory(in)
		if got[0].ID != "a" || got[1].ID != "b" {
			t.Fatalf("ordem instável: %v", got)
		}
	}
}
