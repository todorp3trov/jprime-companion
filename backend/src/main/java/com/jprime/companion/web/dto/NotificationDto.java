package com.jprime.companion.web.dto;

public record NotificationDto(
    String id,
    String kind,
    String title,
    String body,
    String time,
    boolean unread
) {}
