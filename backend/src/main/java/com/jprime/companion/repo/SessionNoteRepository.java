package com.jprime.companion.repo;

import com.jprime.companion.domain.SessionNote;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionNoteRepository extends JpaRepository<SessionNote, Long> {
    Optional<SessionNote> findByDeviceIdAndSessionId(String deviceId, String sessionId);
}
