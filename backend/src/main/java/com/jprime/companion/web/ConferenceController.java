package com.jprime.companion.web;

import com.jprime.companion.service.ConferenceService;
import com.jprime.companion.web.dto.DayDto;
import com.jprime.companion.web.dto.MapSpotDto;
import com.jprime.companion.web.dto.NotificationDto;
import com.jprime.companion.web.dto.RatingCriterionDto;
import com.jprime.companion.web.dto.SpeakerDto;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class ConferenceController {

    private final ConferenceService conference;

    public ConferenceController(ConferenceService conference) {
        this.conference = conference;
    }

    @GetMapping("/days")
    public List<DayDto> days() {
        return conference.days();
    }

    @GetMapping("/speakers")
    public List<SpeakerDto> speakers() {
        return conference.speakers();
    }

    @GetMapping("/speakers/{id}")
    public SpeakerDto speaker(@PathVariable Integer id) {
        return conference.speaker(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown speaker: " + id));
    }

    @GetMapping("/notifications")
    public List<NotificationDto> notifications() {
        return conference.notifications();
    }

    @GetMapping("/map-spots")
    public List<MapSpotDto> mapSpots() {
        return conference.mapSpots();
    }

    @GetMapping("/rating-criteria")
    public List<RatingCriterionDto> ratingCriteria() {
        return conference.ratingCriteria();
    }

    @GetMapping("/tracks")
    public List<String> tracks() {
        return conference.tracks();
    }
}
