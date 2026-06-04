package com.jprime.companion.web.dto;

public record AttachmentDto(
    Long id,
    String kind,
    String label,
    String url
) {}
