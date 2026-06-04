package com.jprime.companion.repo;

import com.jprime.companion.domain.MapSpot;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MapSpotRepository extends JpaRepository<MapSpot, Integer> {
    List<MapSpot> findAllByOrderBySortOrderAsc();
}
