package com.jprime.companion.service;

import com.jprime.companion.domain.ConferenceDay;
import com.jprime.companion.domain.MapSpot;
import com.jprime.companion.domain.Notification;
import com.jprime.companion.domain.RatingCriterion;
import com.jprime.companion.domain.Session;
import com.jprime.companion.domain.Speaker;
import com.jprime.companion.web.dto.DayDto;
import com.jprime.companion.web.dto.MapSpotDto;
import com.jprime.companion.web.dto.NotificationDto;
import com.jprime.companion.web.dto.RatingCriterionDto;
import com.jprime.companion.web.dto.SessionDto;
import com.jprime.companion.web.dto.SpeakerDto;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/** Pure mapping from JPA entities to the wire DTOs the frontend expects. */
public final class DtoMapper {

    private static final DateTimeFormatter HM = DateTimeFormatter.ofPattern("HH:mm");

    private DtoMapper() {}

    public static SessionDto session(Session s, boolean saved, String status) {
        List<String> speakers = s.getSpeakers().stream().map(Speaker::getName).toList();
        return new SessionDto(
            s.getId(),
            s.getDayId(),
            fmt(s.getStartTime()),
            fmt(s.getEndTime()),
            s.getTitle(),
            speakers,
            s.getRoom().getName(),
            s.getTrack(),
            s.getLevel(),
            s.getKind(),
            s.isPlenary(),
            s.getDescription(),
            List.copyOf(s.getMaterials()),
            saved,
            status);
    }

    public static DayDto day(ConferenceDay d) {
        return new DayDto(d.getId(), d.getWeekday(), d.getWdShort(), d.getDateLabel(), d.getShortLabel());
    }

    public static SpeakerDto speaker(Speaker s) {
        return new SpeakerDto(
            s.getId(), s.getName(), s.getRole(), s.getOrg(), s.getLocation(),
            s.getPronoun(), s.getBio(), List.copyOf(s.getTags()), s.getHandle(), s.getSourceId(), s.getImageUrl());
    }

    public static NotificationDto notification(Notification n) {
        return new NotificationDto(n.getId(), n.getKind(), n.getTitle(), n.getBody(), n.getTimeLabel(), n.isUnread());
    }

    public static MapSpotDto mapSpot(MapSpot m) {
        return new MapSpotDto(m.getName(), m.getPosX(), m.getPosY(), m.getKind());
    }

    public static RatingCriterionDto criterion(RatingCriterion c) {
        return new RatingCriterionDto(c.getId(), c.getName());
    }

    private static String fmt(LocalTime t) {
        return t.format(HM);
    }
}
