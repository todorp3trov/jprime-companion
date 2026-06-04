package com.jprime.companion.web.dto;

import java.util.List;

public record SpeakerDto(
    Integer id,
    String name,
    String role,
    String org,
    String location,
    String pronoun,
    String bio,
    List<String> tags,
    String handle,
    Integer sourceId,
    String imageUrl
) {}
