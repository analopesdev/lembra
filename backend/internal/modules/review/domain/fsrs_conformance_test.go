package domain_test

import (
	"encoding/json"
	"math"
	"os"
	"testing"
	"time"

	"github.com/anamorais/lembra/backend/internal/modules/review/domain"
)

const vectorsPath = "../../../../../contracts/fsrs-vectors/vectors.v1.json"

type vectorFile struct {
	Version        int                     `json:"version"`
	Tolerance      struct{ Float float64 } `json:"tolerance"`
	DefaultWeights []float64               `json:"default_weights"`
	Params         map[string]struct {
		RequestRetention float64 `json:"request_retention"`
		MaximumInterval  float64 `json:"maximum_interval"`
		EnableShortTerm  bool    `json:"enable_short_term"`
	} `json:"params"`
	Cases []struct {
		Name    string    `json:"name"`
		Params  string    `json:"params"`
		Weights []float64 `json:"weights"`
		Reviews []struct {
			At        time.Time `json:"at"`
			Rating    int       `json:"rating"`
			Retention float64   `json:"retention"`
		} `json:"reviews"`
		Expected []struct {
			Due           time.Time `json:"due"`
			Stability     float64   `json:"stability"`
			Difficulty    float64   `json:"difficulty"`
			State         int       `json:"state"`
			Reps          int       `json:"reps"`
			Lapses        int       `json:"lapses"`
			ScheduledDays int       `json:"scheduled_days"`
			LastReview    time.Time `json:"last_review"`
		} `json:"expected"`
	} `json:"cases"`
}

func near(a, b, tol float64) bool { return math.Abs(a-b) <= tol*math.Max(1, math.Abs(b)) }

// Conformidade (ADR-0006): go-fsrs deve reproduzir, passo a passo, o estado gerado pelo ts-fsrs.
func TestFSRSConformance(t *testing.T) {
	raw, err := os.ReadFile(vectorsPath)
	if err != nil {
		t.Fatal(err)
	}
	var vf vectorFile
	if err := json.Unmarshal(raw, &vf); err != nil {
		t.Fatal(err)
	}
	if vf.Version != 1 || len(vf.Cases) == 0 {
		t.Fatalf("vetores inesperados: versão %d, %d casos", vf.Version, len(vf.Cases))
	}
	tol := vf.Tolerance.Float
	for _, c := range vf.Cases {
		if params := vf.Params[c.Params]; params.EnableShortTerm {
			t.Fatalf("%s: vetores devem ter enable_short_term=false (ADR-0031)", c.Name)
		}
		t.Run(c.Name, func(t *testing.T) {
			ps := vf.Params[c.Params]
			p := domain.Params{RequestRetention: ps.RequestRetention, MaximumInterval: ps.MaximumInterval, EnableShortTerm: ps.EnableShortTerm}
			w := vf.DefaultWeights
			if c.Weights != nil {
				w = c.Weights
			}
			copy(p.Weights[:], w)

			// Prefixos do histórico: o estado derivado de cada prefixo deve bater com o passo esperado (RN-12).
			history := make([]domain.ReviewEvent, 0, len(c.Reviews))
			for i, r := range c.Reviews {
				r := r
				history = append(history, domain.ReviewEvent{At: r.At, Rating: domain.Rating(r.Rating), Retention: r.Retention})
				got, err := domain.DeriveState(history, p, c.Reviews[0].At)
				if err != nil {
					t.Fatalf("passo %d: %v", i, err)
				}
				want := c.Expected[i]
				if !got.Due.Equal(want.Due) || !got.LastReview.Equal(want.LastReview) ||
					int(got.State) != want.State || got.Reps != want.Reps || got.Lapses != want.Lapses ||
					got.ScheduledDays != want.ScheduledDays ||
					!near(got.Stability, want.Stability, tol) || !near(got.Difficulty, want.Difficulty, tol) {
					t.Fatalf("passo %d diverge\n got: %+v\nwant: %+v", i, got, want)
				}
			}
		})
	}
}

func TestDeriveStateRejectsInvalidParams(t *testing.T) {
	p := domain.DefaultParams()
	p.RequestRetention = 2
	_, err := domain.DeriveState([]domain.ReviewEvent{{At: time.Unix(0, 0).UTC(), Rating: domain.Good}}, p, time.Unix(0, 0).UTC())
	if err == nil {
		t.Fatal("esperava erro para retenção inválida")
	}
}

func TestDeriveStateEmptyHistoryIsNewCard(t *testing.T) {
	start := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	got, err := domain.DeriveState(nil, domain.DefaultParams(), start)
	if err != nil || got.State != domain.New || !got.Due.Equal(start) || got.Reps != 0 {
		t.Fatalf("got %+v err %v", got, err)
	}
}

func TestDeriveStateRejectsInvalidRating(t *testing.T) {
	at := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	for _, r := range []domain.Rating{0, 5, -1} {
		if _, err := domain.DeriveState([]domain.ReviewEvent{{At: at, Rating: r}}, domain.DefaultParams(), at); err == nil {
			t.Fatalf("nota %d deveria falhar", r)
		}
	}
}
