package com.jprime.companion.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "rating_criterion")
public class RatingCriterion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;

    @Column(name = "sort_order")
    private Short sortOrder;

    protected RatingCriterion() {}

    public Integer getId() { return id; }
    public String getName() { return name; }
    public Short getSortOrder() { return sortOrder; }
}
