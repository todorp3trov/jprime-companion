package com.jprime.companion.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "notification")
public class Notification {

    @Id
    private String id;

    private String kind;
    private String title;

    @Column(columnDefinition = "text")
    private String body;

    @Column(name = "time_label")
    private String timeLabel;

    private boolean unread;

    @Column(name = "sort_order")
    private Short sortOrder;

    protected Notification() {}

    public String getId() { return id; }
    public String getKind() { return kind; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public String getTimeLabel() { return timeLabel; }
    public boolean isUnread() { return unread; }
    public Short getSortOrder() { return sortOrder; }
}
