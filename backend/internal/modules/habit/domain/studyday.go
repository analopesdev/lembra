package domain

import (
	"fmt"
	"time"
)

const (
	RolloverHour = 4
	dayLayout    = "2006-01-02"
)

func StudyDayOf(at time.Time, loc *time.Location) string {
	local := at.In(loc)
	y, m, d := local.Date()
	day := time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
	if local.Hour() < RolloverHour {
		day = day.AddDate(0, 0, -1)
	}
	return day.Format(dayLayout)
}

func parseDay(day string) (time.Time, error) {
	t, err := time.ParseInLocation(dayLayout, day, time.UTC)
	if err != nil {
		return time.Time{}, fmt.Errorf("dia de estudo inválido %q: %w", day, err)
	}
	return t, nil
}

func DiffDays(from, to string) (int, error) {
	a, err := parseDay(from)
	if err != nil {
		return 0, err
	}
	b, err := parseDay(to)
	if err != nil {
		return 0, err
	}
	return int(b.Sub(a).Hours() / 24), nil
}

func AddDays(day string, n int) (string, error) {
	t, err := parseDay(day)
	if err != nil {
		return "", err
	}
	return t.AddDate(0, 0, n).Format(dayLayout), nil
}

func ISOWeekday(day string) (int, error) {
	t, err := parseDay(day)
	if err != nil {
		return 0, err
	}
	if wd := int(t.Weekday()); wd != 0 {
		return wd, nil
	}
	return 7, nil
}
