package domain_test

import (
	"encoding/json"
	"os"
	"testing"
	"time"
	_ "time/tzdata"

	"github.com/analopesdev/lembra/backend/internal/modules/habit/domain"
)

const vectorsPath = "../../../../../contracts/study-day-vectors/vectors.v1.json"

type vectorFile struct {
	RolloverHour int `json:"rolloverHour"`
	StudyDays    []struct {
		At       time.Time `json:"at"`
		Zone     string    `json:"zone"`
		StudyDay string    `json:"studyDay"`
	} `json:"studyDays"`
	Calendar []struct {
		From        string `json:"from"`
		To          string `json:"to"`
		Diff        int    `json:"diff"`
		WeekdayFrom int    `json:"weekdayFrom"`
		WeekdayTo   int    `json:"weekdayTo"`
	} `json:"calendar"`
}

func load(t *testing.T) vectorFile {
	t.Helper()
	raw, err := os.ReadFile(vectorsPath)
	if err != nil {
		t.Fatal(err)
	}
	var vf vectorFile
	if err := json.Unmarshal(raw, &vf); err != nil {
		t.Fatal(err)
	}
	return vf
}

func TestStudyDayVectors(t *testing.T) {
	vf := load(t)
	if vf.RolloverHour != domain.RolloverHour || len(vf.StudyDays) < 3000 {
		t.Fatalf("vetores inesperados: virada %d, %d casos", vf.RolloverHour, len(vf.StudyDays))
	}
	locs := map[string]*time.Location{}
	wrong := 0
	for _, v := range vf.StudyDays {
		loc, ok := locs[v.Zone]
		if !ok {
			var err error
			if loc, err = time.LoadLocation(v.Zone); err != nil {
				t.Fatal(err)
			}
			locs[v.Zone] = loc
		}
		if got := domain.StudyDayOf(v.At, loc); got != v.StudyDay {
			wrong++
			if wrong <= 10 {
				t.Errorf("%s em %s: obteve %s, quer %s", v.At.Format(time.RFC3339), v.Zone, got, v.StudyDay)
			}
		}
	}
	if wrong > 0 {
		t.Fatalf("%d divergências de %d", wrong, len(vf.StudyDays))
	}
}

func TestCalendarVectors(t *testing.T) {
	for _, v := range load(t).Calendar {
		diff, err := domain.DiffDays(v.From, v.To)
		if err != nil || diff != v.Diff {
			t.Fatalf("DiffDays(%s, %s) = %d, %v; quer %d", v.From, v.To, diff, err, v.Diff)
		}
		added, err := domain.AddDays(v.From, v.Diff)
		if err != nil || added != v.To {
			t.Fatalf("AddDays(%s, %d) = %s, %v; quer %s", v.From, v.Diff, added, err, v.To)
		}
		wf, _ := domain.ISOWeekday(v.From)
		wt, _ := domain.ISOWeekday(v.To)
		if wf != v.WeekdayFrom || wt != v.WeekdayTo {
			t.Fatalf("ISOWeekday: %s=%d (quer %d), %s=%d (quer %d)", v.From, wf, v.WeekdayFrom, v.To, wt, v.WeekdayTo)
		}
	}
}

func TestInvalidDay(t *testing.T) {
	if _, err := domain.DiffDays("2026-13-40", "2026-01-01"); err == nil {
		t.Fatal("esperava erro")
	}
	if _, err := domain.AddDays("x", 1); err == nil {
		t.Fatal("esperava erro")
	}
	if _, err := domain.ISOWeekday(""); err == nil {
		t.Fatal("esperava erro")
	}
}
