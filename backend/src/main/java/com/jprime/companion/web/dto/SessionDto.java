package com.jprime.companion.web.dto;

import java.util.List;

public record SessionDto(
    String id,
    int day,
    String time,
    String end,
    String title,
    List<String> speakers,
    String room,
    String track,
    String level,
    String kind,
    boolean plenary,
    String description,
    List<String> materials,
    boolean saved,
    String status
) {}
