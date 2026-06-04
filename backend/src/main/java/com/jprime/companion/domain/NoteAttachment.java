package com.jprime.companion.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "note_attachment")
public class NoteAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id")
    private SessionNote note;

    private String kind;
    private String label;

    @Column(name = "content_type")
    private String contentType;

    private byte[] data;

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    protected NoteAttachment() {}

    public NoteAttachment(SessionNote note, String kind, String label, String contentType, byte[] data) {
        this.note = note;
        this.kind = kind;
        this.label = label;
        this.contentType = contentType;
        this.data = data;
    }

    public Long getId() { return id; }
    public SessionNote getNote() { return note; }
    public String getKind() { return kind; }
    public String getLabel() { return label; }
    public String getContentType() { return contentType; }
    public byte[] getData() { return data; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
