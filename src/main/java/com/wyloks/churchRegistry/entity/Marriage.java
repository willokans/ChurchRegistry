package com.wyloks.churchRegistry.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "marriage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Marriage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baptism_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_marriage_baptism_id"))
    private Baptism baptism;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "communion_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_marriage_communion_id"))
    private FirstHolyCommunion firstHolyCommunion;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "confirmation_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_marriage_confirmation_id"))
    private Confirmation confirmation;

    @Column(name = "partners_name", nullable = false, length = 255)
    private String partnersName;

    @Column(name = "marriage_date", nullable = false)
    private LocalDate marriageDate;

    @Column(name = "marriage_time")
    private LocalTime marriageTime;

    @Column(name = "church_name", length = 255)
    private String churchName;

    @Column(name = "marriage_register", length = 255)
    private String marriageRegister;

    @Column(name = "diocese", length = 255)
    private String diocese;

    @Column(name = "civil_registry_number", length = 255)
    private String civilRegistryNumber;

    @Column(name = "dispensation_granted")
    private Boolean dispensationGranted;

    @Column(name = "canonical_notes")
    private String canonicalNotes;

    @Column(name = "note")
    private String note;

    @Column(name = "officiating_priest", nullable = false, length = 255)
    private String officiatingPriest;

    @Column(name = "parish", nullable = false, length = 255)
    private String parish;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
