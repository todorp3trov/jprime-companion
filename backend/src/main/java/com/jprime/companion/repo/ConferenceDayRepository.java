package com.jprime.companion.repo;

import com.jprime.companion.domain.ConferenceDay;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConferenceDayRepository extends JpaRepository<ConferenceDay, Short> {
    List<ConferenceDay> findAllByOrderByIdAsc();
}
