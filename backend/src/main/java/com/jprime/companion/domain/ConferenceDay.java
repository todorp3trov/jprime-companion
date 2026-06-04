package com.jprime.companion.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "conference_day")
public class ConferenceDay {

    @Id
    private Short id;

    private String weekday;

    @Column(name = "wd_short")
    private String wdShort;

    @Column(name = "date_label")
    private String dateLabel;

    @Column(name = "short_label")
    private String shortLabel;

    @Column(name = "calendar_date")
    private LocalDate calendarDate;

    protected ConferenceDay() {}

    public Short getId() { return id; }
    public String getWeekday() { return weekday; }
    public String getWdShort() { return wdShort; }
    public String getDateLabel() { return dateLabel; }
    public String getShortLabel() { return shortLabel; }
    public LocalDate getCalendarDate() { return calendarDate; }
}
