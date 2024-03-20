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
@Table(schema = "CHURCH_REGISTRY", name = "CONFIRMATION_REGISTRY")
@Builder
public class Confirmation extends Auditable {

    @Id
    @SequenceGenerator(name = "CONFIRMATION_SEQUENCE", sequenceName = "CONFIRMATION_SEQUENCE", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "CONFIRMATION_SEQUENCE")
    private Long id;

    @NotNull(message = "Confirmation name cannot be null")
    @Column(name = "CONFIRMATION_NAME", nullable = false)
    private String confirmationName;

    @NotNull(message = "Church name cannot be null")
    @Column(name = "CHURCH_NAME", nullable = false)
    private String churchName;

    @NotNull(message = "Church address cannot be null")
    @Column(name = "CHURCH_ADDRESS", nullable = false)
    private String churchAddress;

    @NotNull(message = "date of confirmation cannot be null")
    @Column(name = "DATE_OF_CONFIRMATION", nullable = false)
    private ZonedDateTime dateOfConfirmation;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "baptism_id", referencedColumnName = "id", unique = true)
    private Baptism baptism;
}
