package com.jprime.companion.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;

@Entity
@Table(name = "saved_session")
@IdClass(SavedSession.Key.class)
public class SavedSession {

    @Id
    @Column(name = "device_id")
    private String deviceId;

    @Id
    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected SavedSession() {}

    public SavedSession(String deviceId, String sessionId) {
        this.deviceId = deviceId;
        this.sessionId = sessionId;
    }

    public String getDeviceId() { return deviceId; }
    public String getSessionId() { return sessionId; }
    public OffsetDateTime getCreatedAt() { return createdAt; }

    public static class Key implements Serializable {
        private String deviceId;
        private String sessionId;

        public Key() {}

        public Key(String deviceId, String sessionId) {
            this.deviceId = deviceId;
            this.sessionId = sessionId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key key)) return false;
            return Objects.equals(deviceId, key.deviceId) && Objects.equals(sessionId, key.sessionId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(deviceId, sessionId);
        }
    }
}
