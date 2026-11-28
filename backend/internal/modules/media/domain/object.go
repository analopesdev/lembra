package domain

import (
	"fmt"
	"strings"

	"github.com/analopesdev/lembra/backend/internal/kernel"
)

const (
	KindImage = "image"
	KindAudio = "audio"
	KindVideo = "video"
)

const MaxBytes int64 = 20 << 20

func ObjectKey(userID, mediaID kernel.ID) string {
	return fmt.Sprintf("users/%s/media/%s", userID.String(), mediaID.String())
}

func ParseKind(s string) (string, error) {
	switch s {
	case KindImage, KindAudio, KindVideo:
		return s, nil
	default:
		return "", fmt.Errorf("%w: tipo de mídia inválido", kernel.ErrInvalidInput)
	}
}

func ParseContentType(kind, contentType string) (string, error) {
	ct := strings.ToLower(strings.TrimSpace(contentType))
	ok := false
	switch kind {
	case KindImage:
		ok = ct == "image/jpeg" || ct == "image/png" || ct == "image/webp"
	case KindAudio:
		ok = ct == "audio/mpeg" || ct == "audio/mp4" || ct == "audio/webm" || ct == "audio/wav"
	case KindVideo:
		ok = ct == "video/mp4" || ct == "video/webm"
	}
	if !ok {
		return "", fmt.Errorf("%w: content-type não permitido", kernel.ErrInvalidInput)
	}
	return ct, nil
}

func ParseSize(n int64) error {
	if n <= 0 || n > MaxBytes {
		return fmt.Errorf("%w: tamanho inválido", kernel.ErrInvalidInput)
	}
	return nil
}
