package com.jprime.companion.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.BatchSize;

@Entity
@Table(name = "session")
public class Session {

    @Id
    private String id;

    @Column(name = "day_id")
    private Short dayId;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    private String title;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_id")
    private Room room;

    private String track;
    private String level;
    private String kind;
    private boolean plenary;

    @Column(columnDefinition = "text")
    private String description;

    private String status;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "session_speaker",
        joinColumns = @JoinColumn(name = "session_id"),
        inverseJoinColumns = @JoinColumn(name = "speaker_id"))
    @OrderColumn(name = "sort_order")
    @BatchSize(size = 100)
    private List<Speaker> speakers = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "session_material", joinColumns = @JoinColumn(name = "session_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "material")
    @BatchSize(size = 100)
    private List<String> materials = new ArrayList<>();

    protected Session() {}

    public String getId() { return id; }
    public Short getDayId() { return dayId; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }
    public String getTitle() { return title; }
    public Room getRoom() { return room; }
    public String getTrack() { return track; }
    public String getLevel() { return level; }
    public String getKind() { return kind; }
    public boolean isPlenary() { return plenary; }
    public String getDescription() { return description; }
    public String getStatus() { return status; }
    public Integer getSortOrder() { return sortOrder; }
    public List<Speaker> getSpeakers() { return speakers; }
    public List<String> getMaterials() { return materials; }
}
