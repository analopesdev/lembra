package httpx

import (
	"context"
	"encoding/json"
	"net/http"

	openapi_types "github.com/oapi-codegen/runtime/types"

	"github.com/analopesdev/lembra/backend/internal/kernel"
	"github.com/analopesdev/lembra/backend/internal/platform/apigen"
	"github.com/analopesdev/lembra/backend/internal/platform/storage"
)

func (s Server) CreateMediaUpload(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	if s.Media == nil {
		WriteError(w, r, kernel.ErrNotFound)
		return
	}
	var body apigen.CreateMediaRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		WriteError(w, r, kernel.ErrInvalidInput)
		return
	}
	out, err := s.Media.CreateUpload(s.mediaContext(r), user, clientMediaID(body.Id), string(body.Kind), body.ContentType, body.ByteSize)
	if err != nil {
		WriteError(w, r, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(apigen.MediaUpload{
		Id:        openapi_types.UUID(out.ID),
		Key:       out.Key,
		UploadUrl: out.URL,
		ExpiresAt: out.ExpiresAt,
	})
}

func (s Server) GetMedia(w http.ResponseWriter, r *http.Request, id openapi_types.UUID) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	if s.Media == nil {
		WriteError(w, r, kernel.ErrNotFound)
		return
	}
	out, err := s.Media.Download(s.mediaContext(r), user, kernel.ID(id))
	if err != nil {
		WriteError(w, r, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(apigen.MediaDownload{
		Id:        openapi_types.UUID(out.ID),
		Url:       out.URL,
		ExpiresAt: out.ExpiresAt,
	})
}

func (s Server) mediaContext(r *http.Request) context.Context {
	if !s.LocalDev {
		return r.Context()
	}
	return storage.WithPublicHost(r.Context(), r.Host)
}

func clientMediaID(id *openapi_types.UUID) *kernel.ID {
	if id == nil {
		return nil
	}
	v := kernel.ID(*id)
	return &v
}
