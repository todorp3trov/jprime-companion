package com.jprime.companion.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "speaker")
public class Speaker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
    private String role;
    private String org;
    private String location;
    private String pronoun;

    @Column(columnDefinition = "text")
    private String bio;

    private String handle;

    @Column(name = "source_id")
    private Integer sourceId;

    @Column(name = "image_url")
    private String imageUrl;

    @ElementCollection
    @CollectionTable(name = "speaker_tag", joinColumns = @JoinColumn(name = "speaker_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    protected Speaker() {}

    public Integer getId() { return id; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public String getOrg() { return org; }
    public String getLocation() { return location; }
    public String getPronoun() { return pronoun; }
    public String getBio() { return bio; }
    public String getHandle() { return handle; }
    public Integer getSourceId() { return sourceId; }
    public String getImageUrl() { return imageUrl; }
    public List<String> getTags() { return tags; }
}
