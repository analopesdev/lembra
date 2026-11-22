package kernel

import (
	"sync"
	"time"
)

// Clock fornece "agora". Nunca chame time.Now() em domain ou app.
type Clock interface {
	Now() time.Time
}

// SystemClock usa o relógio real, sempre em UTC.
type SystemClock struct{}

// Now devolve o instante atual em UTC.
func (SystemClock) Now() time.Time { return time.Now().UTC() }

// FakeClock é um relógio controlável para testes.
type FakeClock struct {
	mu  sync.Mutex
	now time.Time
}

// NewFakeClock cria um relógio parado em t.
func NewFakeClock(t time.Time) *FakeClock { return &FakeClock{now: t.UTC()} }

// Now devolve o instante atual do relógio falso.
func (c *FakeClock) Now() time.Time {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.now
}

// Advance avança o relógio em d.
func (c *FakeClock) Advance(d time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.now = c.now.Add(d)
}
