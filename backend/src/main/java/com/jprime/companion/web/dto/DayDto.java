package com.jprime.companion.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

public record DayDto(
    Short id,
    String weekday,
    String wdShort,
    String date,
    @JsonProperty("short") String shortLabel,
    LocalDate calendarDate
) {}
