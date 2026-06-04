package com.jprime.companion.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "rating_score")
@IdClass(RatingScore.Key.class)
public class RatingScore {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rating_id")
    private SessionRating rating;

    @Id
    @Column(name = "criterion_id")
    private Integer criterionId;

    private short score;

    protected RatingScore() {}

    public RatingScore(SessionRating rating, Integer criterionId, short score) {
        this.rating = rating;
        this.criterionId = criterionId;
        this.score = score;
    }

    public SessionRating getRating() { return rating; }
    public Integer getCriterionId() { return criterionId; }
    public short getScore() { return score; }
    public void setScore(short score) { this.score = score; }

    public static class Key implements Serializable {
        private Long rating;
        private Integer criterionId;

        public Key() {}

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key key)) return false;
            return Objects.equals(rating, key.rating) && Objects.equals(criterionId, key.criterionId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(rating, criterionId);
        }
    }
}
