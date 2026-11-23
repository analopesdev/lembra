// Package domain do módulo review: estado FSRS derivado do histórico (RN-12, ADR-0007).
// Funções puras: sem relógio, I/O nem aleatoriedade. Fuzz fica sempre desligado.
package domain

import (
	"fmt"
	"math"
	"slices"
	"strconv"
	"strings"
	"time"

	fsrs "github.com/open-spaced-repetition/go-fsrs/v4"
)

// Rating é a nota FSRS final de uma revisão.
type Rating int

// Notas FSRS.
const (
	Again Rating = 1
	Hard  Rating = 2
	Good  Rating = 3
	Easy  Rating = 4
)

// State é o estado do card no FSRS.
type State int

// Estados FSRS.
const (
	New        State = 0
	Learning   State = 1
	Review     State = 2
	Relearning State = 3
)

// Params são os parâmetros FSRS (sincronizados do servidor para o app, RF-32).
type Params struct {
	RequestRetention float64
	MaximumInterval  float64
	Weights          [21]float64
	EnableShortTerm  bool
}

// DefaultParams devolve os parâmetros padrão (retenção 90%, FSRS-6, sem aprendizado em passos: ADR-0031).
func DefaultParams() Params {
	p := fsrs.DefaultParam()
	return Params{RequestRetention: p.RequestRetention, MaximumInterval: p.MaximumInterval, Weights: p.W, EnableShortTerm: false}
}

// ReviewEvent é um evento do histórico append-only. Retention, quando > 0, é a retenção alvo
// vigente no momento da revisão (RN-05); 0 usa Params.RequestRetention.
type ReviewEvent struct {
	ID        string
	At        time.Time
	Rating    Rating
	Retention float64
}

// CardState é o estado derivado (cache) do card.
type CardState struct {
	Due           time.Time
	LastReview    time.Time
	Stability     float64
	Difficulty    float64
	State         State
	Reps          int
	Lapses        int
	ScheduledDays int
}

// DeriveState calcula o estado a partir do histórico, que deve vir ordenado por (At, ID).
// Histórico vazio devolve o card novo com vencimento em `start`.
func DeriveState(history []ReviewEvent, p Params, start time.Time) (CardState, error) {
	card := fsrs.NewCard(start)
	for i, ev := range history {
		fp := fsrs.DefaultParam()
		fp.RequestRetention = p.RequestRetention
		if ev.Retention > 0 {
			fp.RequestRetention = ev.Retention
		}
		fp.MaximumInterval = p.MaximumInterval
		fp.W = p.Weights
		fp.EnableShortTerm = p.EnableShortTerm
		fp.EnableFuzz = false
		// NewFSRS troca parâmetros inválidos pelos padrão em silêncio: validamos antes (RN-12 exige falha explícita).
		if err := fp.Validate(); err != nil {
			return CardState{}, fmt.Errorf("parâmetros FSRS inválidos: %w", err)
		}
		if ev.Rating < Again || ev.Rating > Easy {
			return CardState{}, fmt.Errorf("revisão %d: nota inválida %d", i, ev.Rating)
		}
		info, err := fsrs.NewFSRS(fp).Next(card, ev.At, fsrs.Rating(int8(ev.Rating)))
		if err != nil {
			return CardState{}, fmt.Errorf("revisão %d: %w", i, err)
		}
		card = info.Card
		// O ts-fsrs guarda estabilidade e dificuldade arredondadas a 8 casas a cada passo (toFixed(8)).
		// Replicamos para que o mesmo histórico gere o mesmo estado nos dois lados (RN-12).
		card.Stability = round8(card.Stability)
		card.Difficulty = round8(card.Difficulty)
		// O ts-fsrs limita scheduled_days ao intervalo máximo; o go-fsrs só limita o vencimento.
		if m := uint64(p.MaximumInterval); card.State == fsrs.Review && card.ScheduledDays > m {
			card.ScheduledDays = m
		}
	}
	return CardState{
		Due: card.Due, LastReview: card.LastReview, Stability: card.Stability, Difficulty: card.Difficulty,
		State: State(card.State), Reps: toInt(card.Reps), Lapses: toInt(card.Lapses), ScheduledDays: toInt(card.ScheduledDays),
	}, nil
}

// round8 arredonda a 8 casas decimais com a mesma semântica de Number(x.toFixed(8)) do JavaScript.
func round8(x float64) float64 {
	r, err := strconv.ParseFloat(strconv.FormatFloat(x, 'f', 8, 64), 64)
	if err != nil {
		return x
	}
	return r
}

// toInt converte contadores do go-fsrs, saturando em math.MaxInt32 (valores reais são minúsculos).
func toInt(u uint64) int {
	if u > math.MaxInt32 {
		return math.MaxInt32
	}
	return int(u)
}

// SortHistory devolve o histórico na ordem canônica: por instante e, em empate, por ID (ordem estável, RN-12).
func SortHistory(history []ReviewEvent) []ReviewEvent {
	out := slices.Clone(history)
	slices.SortStableFunc(out, func(a, b ReviewEvent) int {
		if c := a.At.Compare(b.At); c != 0 {
			return c
		}
		return strings.Compare(a.ID, b.ID)
	})
	return out
}
