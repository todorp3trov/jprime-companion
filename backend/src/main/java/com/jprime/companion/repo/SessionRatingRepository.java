package com.jprime.companion.repo;

import com.jprime.companion.domain.SessionRating;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionRatingRepository extends JpaRepository<SessionRating, Long> {
    Optional<SessionRating> findByDeviceIdAndSessionId(String deviceId, String sessionId);
}
