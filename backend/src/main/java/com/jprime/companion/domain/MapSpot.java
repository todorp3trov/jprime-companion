package com.jprime.companion.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "map_spot")
public class MapSpot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;

    @Column(name = "pos_x")
    private String posX;

    @Column(name = "pos_y")
    private String posY;

    private String kind;

    @Column(name = "sort_order")
    private Short sortOrder;

    protected MapSpot() {}

    public Integer getId() { return id; }
    public String getName() { return name; }
    public String getPosX() { return posX; }
    public String getPosY() { return posY; }
    public String getKind() { return kind; }
    public Short getSortOrder() { return sortOrder; }
}
