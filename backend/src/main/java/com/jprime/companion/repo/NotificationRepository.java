package com.jprime.companion.repo;

import com.jprime.companion.domain.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findAllByOrderBySortOrderAsc();
}
