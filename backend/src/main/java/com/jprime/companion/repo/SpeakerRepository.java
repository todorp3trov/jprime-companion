package com.jprime.companion.repo;

import com.jprime.companion.domain.Speaker;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpeakerRepository extends JpaRepository<Speaker, Integer> {
    List<Speaker> findAllByOrderByNameAsc();
    Optional<Speaker> findByName(String name);
}
