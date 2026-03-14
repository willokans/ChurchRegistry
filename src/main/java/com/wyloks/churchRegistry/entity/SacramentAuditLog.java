package com.wyloks.churchRegistry.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * Immutable audit log for sacramental data access and mutation events.
 * Append-only; updates and deletes are prevented by database trigger.
 */
@Entity
@Table(name = "sacrament_audit_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SacramentAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_type", nullable = false, length = 20)
    private String eventType;

    @Column(name = "sacrament_type", nullable = false, length = 40)
    private String sacramentType;

    @Column(name = "record_id")
    private Long recordId;

    @Column(name = "parish_id")
    private Long parishId;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actor_name", length = 255)
    private String actorName;

    @Column(name = "details", columnDefinition = "text")
    private String details;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    public enum EventType {
        READ,
        READ_LIST,
        CREATE,
        UPDATE,
        DELETE,
        CERTIFICATE_DOWNLOAD
    }

    public enum SacramentType {
        BAPTISM,
        COMMUNION,
        CONFIRMATION,
        MARRIAGE,
        HOLY_ORDER
    }
}
