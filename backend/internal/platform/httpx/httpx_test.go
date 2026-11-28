package httpx_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/getkin/kin-openapi/openapi3filter"
	"github.com/getkin/kin-openapi/routers/gorillamux"

	"github.com/analopesdev/lembra/backend/internal/kernel"
	mediaapp "github.com/analopesdev/lembra/backend/internal/modules/media/app"
	"github.com/analopesdev/lembra/backend/internal/platform/apigen"
	"github.com/analopesdev/lembra/backend/internal/platform/httpx"
	"github.com/analopesdev/lembra/backend/internal/platform/observ"
)

type seqIDs struct{ n int }

func (s *seqIDs) NewID() kernel.ID {
	s.n++
	return kernel.ID{15: byte(s.n)}
}

func newHandler(buf *bytes.Buffer) http.Handler {
	clock := kernel.NewFakeClock(time.Date(2026, 11, 22, 12, 0, 0, 0, time.UTC))
	return httpx.NewHandler(observ.NewLogger(buf, -4), clock, &seqIDs{}, nil, "local", "01900000-0000-7000-8000-000000000001")
}

// Contrato HTTP: a resposta precisa obedecer ao contracts/openapi.yaml.
func TestHealthRespectsOpenAPIContract(t *testing.T) {
	spec, err := apigen.GetSpec()
	if err != nil {
		t.Fatal(err)
	}
	spec.Servers = nil
	router, err := gorillamux.NewRouter(spec)
	if err != nil {
		t.Fatal(err)
	}

	req := httptest.NewRequest(http.MethodGet, "/v1/health", nil)
	rec := httptest.NewRecorder()
	newHandler(&bytes.Buffer{}).ServeHTTP(rec, req)

	route, params, err := router.FindRoute(req)
	if err != nil {
		t.Fatal(err)
	}
	in := &openapi3filter.ResponseValidationInput{
		RequestValidationInput: &openapi3filter.RequestValidationInput{Request: req, PathParams: params, Route: route},
		Status:                 rec.Code,
		Header:                 rec.Header(),
	}
	in.SetBodyBytes(rec.Body.Bytes())
	if err := openapi3filter.ValidateResponse(context.Background(), in); err != nil {
		t.Fatalf("resposta fora do contrato: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
}

func TestRequestIDHeaderAndLog(t *testing.T) {
	var buf bytes.Buffer
	rec := httptest.NewRecorder()
	newHandler(&buf).ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/v1/health", nil))

	rid := rec.Header().Get(httpx.RequestIDHeader)
	if rid == "" {
		t.Fatal("sem X-Request-ID")
	}
	var line map[string]any
	if err := json.Unmarshal(buf.Bytes(), &line); err != nil {
		t.Fatalf("log não é JSON: %v (%s)", err, buf.String())
	}
	if line["request_id"] != rid || line["status"] != float64(200) {
		t.Fatalf("log inesperado: %v", line)
	}
}

func TestRequestIDIsPropagated(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/v1/health", nil)
	req.Header.Set(httpx.RequestIDHeader, "abc")
	rec := httptest.NewRecorder()
	newHandler(&bytes.Buffer{}).ServeHTTP(rec, req)
	if got := rec.Header().Get(httpx.RequestIDHeader); got != "abc" {
		t.Fatalf("request id = %q", got)
	}
}

func TestWriteErrorMapping(t *testing.T) {
	tests := []struct {
		err    error
		status int
	}{
		{kernel.ErrNotFound, 404},
		{fmt.Errorf("x: %w", kernel.ErrInvalidInput), 400},
		{kernel.ErrUnauthorized, 401},
		{kernel.ErrForbidden, 403},
		{kernel.ErrConflict, 409},
		{errors.New("boom"), 500},
	}
	for _, tt := range tests {
		t.Run(http.StatusText(tt.status), func(t *testing.T) {
			rec := httptest.NewRecorder()
			httpx.WriteError(rec, httptest.NewRequest(http.MethodGet, "/x", nil), tt.err)
			if rec.Code != tt.status {
				t.Fatalf("status = %d, quer %d", rec.Code, tt.status)
			}
			if ct := rec.Header().Get("Content-Type"); ct != "application/problem+json" {
				t.Fatalf("content-type = %q", ct)
			}
			var p apigen.Problem
			if err := json.Unmarshal(rec.Body.Bytes(), &p); err != nil || p.Status != tt.status {
				t.Fatalf("corpo inválido: %v %+v", err, p)
			}
		})
	}
}

func TestRecoverTurnsPanicInto500(t *testing.T) {
	h := httpx.Chain(http.HandlerFunc(func(http.ResponseWriter, *http.Request) { panic("x") }), httpx.Recover)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))
	if rec.Code != 500 {
		t.Fatalf("status = %d", rec.Code)
	}
}

type fakeObjects struct {
	puts []string
	keys map[string]bool
}

func (f *fakeObjects) PresignPut(_ context.Context, key, _ string, _ time.Duration) (string, error) {
	f.puts = append(f.puts, key)
	return "https://minio.local/put/" + key, nil
}
func (f *fakeObjects) PresignGet(_ context.Context, key string, _ time.Duration) (string, error) {
	return "https://minio.local/get/" + key, nil
}
func (f *fakeObjects) Exists(_ context.Context, key string) (bool, error) { return f.keys[key], nil }

func TestCreateMediaUpload(t *testing.T) {
	clock := kernel.NewFakeClock(time.Date(2026, 11, 24, 12, 0, 0, 0, time.UTC))
	ids := &seqIDs{}
	media := mediaapp.New(ids, clock, &fakeObjects{keys: map[string]bool{}})
	h := httpx.NewHandler(observ.NewLogger(&bytes.Buffer{}, -4), clock, ids, media, "local", "01900000-0000-7000-8000-000000000001")
	body, _ := json.Marshal(map[string]any{"kind": "image", "contentType": "image/webp", "byteSize": 80})
	req := httptest.NewRequest(http.MethodPost, "/v1/media", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	var out apigen.MediaUpload
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	if out.Key == "" || out.UploadUrl == "" {
		t.Fatalf("%+v", out)
	}
}

func TestUnknownRouteIsProblemJSON(t *testing.T) {
	rec := httptest.NewRecorder()
	newHandler(&bytes.Buffer{}).ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/nada", nil))
	if rec.Code != 404 || rec.Header().Get("Content-Type") != "application/problem+json" {
		t.Fatalf("status=%d content-type=%q", rec.Code, rec.Header().Get("Content-Type"))
	}
}
