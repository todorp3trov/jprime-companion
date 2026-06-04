package com.jprime.companion.web;

import com.jprime.companion.service.ConferenceService;
import com.jprime.companion.service.UserDataService;
import com.jprime.companion.web.dto.AttachmentDto;
import com.jprime.companion.web.dto.NoteDto;
import com.jprime.companion.web.dto.NoteRequest;
import com.jprime.companion.web.dto.RatingDto;
import com.jprime.companion.web.dto.RatingRequest;
import com.jprime.companion.web.dto.SavedStateDto;
import com.jprime.companion.web.dto.SessionDto;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class SessionController {

    private final ConferenceService conference;
    private final UserDataService userData;

    public SessionController(ConferenceService conference, UserDataService userData) {
        this.conference = conference;
        this.userData = userData;
    }

    @GetMapping("/sessions")
    public List<SessionDto> sessions(@RequestParam(required = false) Integer day,
                                     @RequestHeader(value = "X-Device-Id", required = false) String deviceId) {
        return conference.sessions(day, deviceId);
    }

    @GetMapping("/sessions/{id}")
    public SessionDto session(@PathVariable String id,
                              @RequestHeader(value = "X-Device-Id", required = false) String deviceId) {
        return conference.session(id, deviceId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown session: " + id));
    }

    // ── Saved sessions ──────────────────────────────────────────────

    @GetMapping("/me/saved")
    public List<String> savedSessions(@DeviceId String deviceId) {
        return userData.savedSessionIds(deviceId);
    }

    @PutMapping("/sessions/{id}/saved")
    public SavedStateDto save(@PathVariable String id, @DeviceId String deviceId) {
        return new SavedStateDto(id, userData.setSaved(deviceId, id, true));
    }

    @DeleteMapping("/sessions/{id}/saved")
    public SavedStateDto unsave(@PathVariable String id, @DeviceId String deviceId) {
        return new SavedStateDto(id, userData.setSaved(deviceId, id, false));
    }

    // ── Notes & attachments ─────────────────────────────────────────

    @GetMapping("/sessions/{id}/note")
    public NoteDto note(@PathVariable String id, @DeviceId String deviceId) {
        return userData.getNote(deviceId, id);
    }

    @PutMapping("/sessions/{id}/note")
    public NoteDto putNote(@PathVariable String id, @RequestBody NoteRequest request, @DeviceId String deviceId) {
        return userData.putNote(deviceId, id, request.body());
    }

    @GetMapping("/sessions/{id}/note/attachments")
    public List<AttachmentDto> attachments(@PathVariable String id, @DeviceId String deviceId) {
        return userData.getNote(deviceId, id).attachments();
    }

    @PostMapping("/sessions/{id}/note/attachments")
    public AttachmentDto addAttachment(@PathVariable String id,
                                       @RequestParam("file") MultipartFile file,
                                       @RequestParam(required = false) String kind,
                                       @RequestParam(required = false) String label,
                                       @DeviceId String deviceId) {
        try {
            return userData.addAttachment(deviceId, id, kind, label, file.getContentType(), file.getBytes());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read uploaded file", e);
        }
    }

    // ── Ratings ─────────────────────────────────────────────────────

    @GetMapping("/sessions/{id}/rating")
    public RatingDto rating(@PathVariable String id, @DeviceId String deviceId) {
        return userData.getRating(deviceId, id);
    }

    @PutMapping("/sessions/{id}/rating")
    public RatingDto putRating(@PathVariable String id, @RequestBody RatingRequest request, @DeviceId String deviceId) {
        return userData.putRating(deviceId, id, request.feedback(), request.scores());
    }
}
