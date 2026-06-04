package com.jprime.companion.web.dto;

import java.util.Map;

public record RatingDto(
    String sessionId,
    boolean submitted,
    String feedback,
    Map<Integer, Integer> scores
) {}
