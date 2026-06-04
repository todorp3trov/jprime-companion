package com.jprime.companion.repo;

import com.jprime.companion.domain.SavedSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SavedSessionRepository extends JpaRepository<SavedSession, SavedSession.Key> {

    boolean existsByDeviceIdAndSessionId(String deviceId, String sessionId);

    void deleteByDeviceIdAndSessionId(String deviceId, String sessionId);

    @Query("select s.sessionId from SavedSession s where s.deviceId = :deviceId")
    List<String> findSessionIdsByDeviceId(String deviceId);
}
