package com.wyloks.churchregistry.domain.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.ZonedDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(schema = "CHURCH_REGISTRY", name = "MARRIAGE_REGISTRY")
@Builder
public class Marriage {

    @Id
    @SequenceGenerator(
            name = "MARRIAGE_SEQUENCE", sequenceName = "MARRIAGE_SEQUENCE", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "MARRIAGE_SEQUENCE")
    private Long id;

    @NotNull(message = "Married to cannot be null")
    @Column(name = "MARRIED_TO", nullable = false)
    private String marriedTo;

    @NotNull(message = "Church name cannot be null")
    @Column(name = "CHURCH_NAME", nullable = false)
    private String churchName;

    @NotNull(message = "Church address cannot be null")
    @Column(name = "CHURCH_ADDRESS", nullable = false)
    private String churchAddress;

    @NotNull(message = "Marriage date cannot be null")
    @Column(name = "MARRIAGE_DATE", nullable = false)
    private ZonedDateTime marriageDate;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baptism_id", referencedColumnName = "id", unique = true)
    private Baptism baptism;
}
