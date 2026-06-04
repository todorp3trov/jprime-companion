package com.jprime.companion.service;

import com.jprime.companion.config.ClockConfig;
import com.jprime.companion.domain.ConferenceDay;
import com.jprime.companion.domain.Session;
import com.jprime.companion.domain.Speaker;
import com.jprime.companion.repo.ConferenceDayRepository;
import com.jprime.companion.repo.MapSpotRepository;
import com.jprime.companion.repo.NotificationRepository;
import com.jprime.companion.repo.RatingCriterionRepository;
import com.jprime.companion.repo.SavedSessionRepository;
import com.jprime.companion.repo.SessionRepository;
import com.jprime.companion.repo.SpeakerRepository;
import com.jprime.companion.web.dto.DayDto;
import com.jprime.companion.web.dto.MapSpotDto;
import com.jprime.companion.web.dto.NotificationDto;
import com.jprime.companion.web.dto.RatingCriterionDto;
import com.jprime.companion.web.dto.SessionDto;
import com.jprime.companion.web.dto.SpeakerDto;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ConferenceService {

    private final ConferenceDayRepository days;
    private final SessionRepository sessions;
    private final SpeakerRepository speakers;
    private final NotificationRepository notifications;
    private final MapSpotRepository mapSpots;
    private final RatingCriterionRepository criteria;
    private final SavedSessionRepository saved;
    private final Clock clock;

    public ConferenceService(ConferenceDayRepository days, SessionRepository sessions, SpeakerRepository speakers,
                             NotificationRepository notifications, MapSpotRepository mapSpots,
                             RatingCriterionRepository criteria, SavedSessionRepository saved, Clock clock) {
        this.days = days;
        this.sessions = sessions;
        this.speakers = speakers;
        this.notifications = notifications;
        this.mapSpots = mapSpots;
        this.criteria = criteria;
        this.saved = saved;
        this.clock = clock;
    }

    public List<DayDto> days() {
        return days.findAllByOrderByIdAsc().stream().map(DtoMapper::day).toList();
    }

    public List<SessionDto> sessions(Integer day, String deviceId) {
        List<Session> list = (day == null)
            ? sessions.findAllByOrderByDayIdAscSortOrderAsc()
            : sessions.findByDayIdOrderBySortOrderAsc(day.shortValue());
        Set<String> savedIds = savedIds(deviceId);
        Map<Short, LocalDate> dayDates = dayDates();
        return list.stream()
            .map(s -> DtoMapper.session(s, savedIds.contains(s.getId()), status(s, dayDates)))
            .toList();
    }

    public Optional<SessionDto> session(String id, String deviceId) {
        Set<String> savedIds = savedIds(deviceId);
        Map<Short, LocalDate> dayDates = dayDates();
        return sessions.findById(id)
            .map(s -> DtoMapper.session(s, savedIds.contains(s.getId()), status(s, dayDates)));
    }

    public List<SpeakerDto> speakers() {
        return speakers.findAllByOrderByNameAsc().stream().map(DtoMapper::speaker).toList();
    }

    public Optional<SpeakerDto> speaker(Integer id) {
        return speakers.findById(id).map(DtoMapper::speaker);
    }

    public List<NotificationDto> notifications() {
        return notifications.findAllByOrderBySortOrderAsc().stream().map(DtoMapper::notification).toList();
    }

    public List<MapSpotDto> mapSpots() {
        return mapSpots.findAllByOrderBySortOrderAsc().stream().map(DtoMapper::mapSpot).toList();
    }

    public List<RatingCriterionDto> ratingCriteria() {
        return criteria.findAllByOrderBySortOrderAsc().stream().map(DtoMapper::criterion).toList();
    }

    public List<String> tracks() {
        return sessions.findDistinctTracks();
    }

    private Set<String> savedIds(String deviceId) {
        if (deviceId == null || deviceId.isBlank()) {
            return Set.of();
        }
        return Set.copyOf(saved.findSessionIdsByDeviceId(deviceId));
    }

    private Map<Short, LocalDate> dayDates() {
        return days.findAllByOrderByIdAsc().stream()
            .collect(Collectors.toMap(ConferenceDay::getId, ConferenceDay::getCalendarDate));
    }

    private String status(Session session, Map<Short, LocalDate> dayDates) {
        LocalDate date = dayDates.get(session.getDayId());
        if (date == null) {
            return session.getStatus();
        }

        ZonedDateTime now = ZonedDateTime.now(clock).withZoneSameInstant(ClockConfig.CONFERENCE_ZONE);
        ZonedDateTime start = ZonedDateTime.of(date, session.getStartTime(), ClockConfig.CONFERENCE_ZONE);
        ZonedDateTime end = ZonedDateTime.of(date, session.getEndTime(), ClockConfig.CONFERENCE_ZONE);

        if (now.isBefore(start)) {
            return "upcoming";
        }
        if (now.isBefore(end)) {
            return "live";
        }
        return "done";
    }
}
