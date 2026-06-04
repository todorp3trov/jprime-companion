package com.jprime.companion.repo;

import com.jprime.companion.domain.RatingCriterion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RatingCriterionRepository extends JpaRepository<RatingCriterion, Integer> {
    List<RatingCriterion> findAllByOrderBySortOrderAsc();
}
