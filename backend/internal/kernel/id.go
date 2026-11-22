// Package kernel reúne os tipos compartilhados mínimos: IDs, relógio e erros base.
package kernel

import "github.com/google/uuid"

// ID é um UUIDv7 (ADR-0009). Normalmente gerado no cliente.
type ID = uuid.UUID

// IDGenerator gera IDs novos; é injetado para tornar o código determinístico em testes.
type IDGenerator interface {
	NewID() ID
}

// UUIDv7Generator gera UUIDv7 reais.
type UUIDv7Generator struct{}

// NewID devolve um UUIDv7 novo.
func (UUIDv7Generator) NewID() ID {
	id, err := uuid.NewV7()
	if err != nil {
		// uuid.NewV7 só falha se a fonte de aleatoriedade do SO falhar.
		panic("kernel: uuid v7: " + err.Error())
	}
	return id
}

// ParseID converte texto em ID.
func ParseID(s string) (ID, error) { return uuid.Parse(s) }
