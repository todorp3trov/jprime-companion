package com.jprime.companion.repo;

import com.jprime.companion.domain.Session;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SessionRepository extends JpaRepository<Session, String> {

    List<Session> findAllByOrderByDayIdAscSortOrderAsc();

    List<Session> findByDayIdOrderBySortOrderAsc(Short dayId);

    @Query("select distinct s.track from Session s where s.track <> 'Plenary' order by s.track")
    List<String> findDistinctTracks();
}
