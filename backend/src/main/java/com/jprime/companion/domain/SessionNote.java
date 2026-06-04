package com.jprime.companion.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "session_note")
public class SessionNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "session_id")
    private String sessionId;

    @Column(columnDefinition = "text")
    private String body = "";

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @OneToMany(mappedBy = "note", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt asc, id asc")
    private List<NoteAttachment> attachments = new ArrayList<>();

    protected SessionNote() {}

    public SessionNote(String deviceId, String sessionId) {
        this.deviceId = deviceId;
        this.sessionId = sessionId;
    }

    public Long getId() { return id; }
    public String getDeviceId() { return deviceId; }
    public String getSessionId() { return sessionId; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<NoteAttachment> getAttachments() { return attachments; }
}
