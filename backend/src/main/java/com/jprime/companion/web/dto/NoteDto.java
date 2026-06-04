package com.jprime.companion.web.dto;

import java.util.List;

public record NoteDto(
    String sessionId,
    String body,
    List<AttachmentDto> attachments
) {}
