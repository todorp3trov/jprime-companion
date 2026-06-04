package com.jprime.companion.service;

import com.jprime.companion.domain.NoteAttachment;
import com.jprime.companion.domain.RatingScore;
import com.jprime.companion.domain.SavedSession;
import com.jprime.companion.domain.SessionNote;
import com.jprime.companion.domain.SessionRating;
import com.jprime.companion.repo.NoteAttachmentRepository;
import com.jprime.companion.repo.SavedSessionRepository;
import com.jprime.companion.repo.SessionNoteRepository;
import com.jprime.companion.repo.SessionRatingRepository;
import com.jprime.companion.repo.SessionRepository;
import com.jprime.companion.web.dto.AttachmentDto;
import com.jprime.companion.web.dto.NoteDto;
import com.jprime.companion.web.dto.RatingDto;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class UserDataService {

    private static final Set<String> ATTACHMENT_KINDS = Set.of("whiteboard", "slide", "badge");

    private final SessionRepository sessions;
    private final SavedSessionRepository saved;
    private final SessionNoteRepository notes;
    private final NoteAttachmentRepository attachments;
    private final SessionRatingRepository ratings;

    public UserDataService(SessionRepository sessions, SavedSessionRepository saved, SessionNoteRepository notes,
                           NoteAttachmentRepository attachments, SessionRatingRepository ratings) {
        this.sessions = sessions;
        this.saved = saved;
        this.notes = notes;
        this.attachments = attachments;
        this.ratings = ratings;
    }

    // ── Saved sessions ──────────────────────────────────────────────

    public boolean setSaved(String deviceId, String sessionId, boolean save) {
        requireSession(sessionId);
        boolean exists = saved.existsByDeviceIdAndSessionId(deviceId, sessionId);
        if (save && !exists) {
            saved.save(new SavedSession(deviceId, sessionId));
        } else if (!save && exists) {
            saved.deleteByDeviceIdAndSessionId(deviceId, sessionId);
        }
        return save;
    }

    @Transactional(readOnly = true)
    public List<String> savedSessionIds(String deviceId) {
        return saved.findSessionIdsByDeviceId(deviceId);
    }

    // ── Notes ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public NoteDto getNote(String deviceId, String sessionId) {
        requireSession(sessionId);
        return notes.findByDeviceIdAndSessionId(deviceId, sessionId)
            .map(this::toNoteDto)
            .orElseGet(() -> new NoteDto(sessionId, "", List.of()));
    }

    public NoteDto putNote(String deviceId, String sessionId, String body) {
        SessionNote note = note(deviceId, sessionId);
        note.setBody(body == null ? "" : body);
        note.setUpdatedAt(OffsetDateTime.now());
        return toNoteDto(notes.save(note));
    }

    public AttachmentDto addAttachment(String deviceId, String sessionId, String kind, String label,
                                       String contentType, byte[] data) {
        if (data == null || data.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empty attachment");
        }
        String resolvedKind = (kind != null && ATTACHMENT_KINDS.contains(kind)) ? kind : "slide";
        String resolvedLabel = (label == null || label.isBlank()) ? "Photo" : label;
        String resolvedType = (contentType == null || contentType.isBlank()) ? "application/octet-stream" : contentType;
        SessionNote note = note(deviceId, sessionId);
        notes.save(note);
        NoteAttachment attachment = new NoteAttachment(note, resolvedKind, resolvedLabel, resolvedType, data);
        note.getAttachments().add(attachment);
        return toAttachmentDto(attachments.save(attachment));
    }

    @Transactional(readOnly = true)
    public NoteAttachment getAttachment(String deviceId, Long attachmentId) {
        return attachments.findByIdAndNote_DeviceId(attachmentId, deviceId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));
    }

    public void deleteAttachment(String deviceId, Long attachmentId) {
        NoteAttachment attachment = attachments.findByIdAndNote_DeviceId(attachmentId, deviceId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));
        attachments.delete(attachment);
    }

    // ── Ratings ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RatingDto getRating(String deviceId, String sessionId) {
        requireSession(sessionId);
        return ratings.findByDeviceIdAndSessionId(deviceId, sessionId)
            .map(this::toRatingDto)
            .orElseGet(() -> new RatingDto(sessionId, false, "", Map.of()));
    }

    public RatingDto putRating(String deviceId, String sessionId, String feedback, Map<Integer, Integer> scores) {
        requireSession(sessionId);
        SessionRating rating = ratings.findByDeviceIdAndSessionId(deviceId, sessionId)
            .orElseGet(() -> new SessionRating(deviceId, sessionId));
        rating.setFeedback(feedback == null ? "" : feedback);
        rating.setUpdatedAt(OffsetDateTime.now());
        rating.getScores().clear();
        if (scores != null) {
            scores.forEach((criterionId, score) -> {
                if (criterionId != null && score != null) {
                    rating.getScores().add(new RatingScore(rating, criterionId, clamp(score)));
                }
            });
        }
        return toRatingDto(ratings.save(rating));
    }

    // ── Helpers ─────────────────────────────────────────────────────

    private SessionNote note(String deviceId, String sessionId) {
        requireSession(sessionId);
        return notes.findByDeviceIdAndSessionId(deviceId, sessionId)
            .orElseGet(() -> new SessionNote(deviceId, sessionId));
    }

    private void requireSession(String sessionId) {
        if (!sessions.existsById(sessionId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown session: " + sessionId);
        }
    }

    private NoteDto toNoteDto(SessionNote note) {
        List<AttachmentDto> dtos = note.getAttachments().stream().map(this::toAttachmentDto).toList();
        return new NoteDto(note.getSessionId(), note.getBody(), dtos);
    }

    private AttachmentDto toAttachmentDto(NoteAttachment a) {
        return new AttachmentDto(a.getId(), a.getKind(), a.getLabel(), "/api/attachments/" + a.getId());
    }

    private RatingDto toRatingDto(SessionRating rating) {
        Map<Integer, Integer> scores = new LinkedHashMap<>();
        rating.getScores().forEach(s -> scores.put(s.getCriterionId(), (int) s.getScore()));
        return new RatingDto(rating.getSessionId(), true, rating.getFeedback(), scores);
    }

    private static short clamp(int score) {
        return (short) Math.max(1, Math.min(5, score));
    }
}
