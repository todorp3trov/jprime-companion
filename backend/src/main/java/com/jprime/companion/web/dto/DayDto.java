package com.jprime.companion.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DayDto(
    Short id,
    String weekday,
    String wdShort,
    String date,
    @JsonProperty("short") String shortLabel
) {}
