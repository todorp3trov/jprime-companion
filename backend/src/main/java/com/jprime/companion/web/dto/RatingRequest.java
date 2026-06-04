package com.jprime.companion.web.dto;

import java.util.Map;

public record RatingRequest(String feedback, Map<Integer, Integer> scores) {}
