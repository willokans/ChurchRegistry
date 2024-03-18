package com.wyloks.churchregistry.domain.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(schema = "PUBLIC", name = "CONFIRMATION_REGISTRY")
@Builder
public class Confirmation extends Auditable {

    @Id
    @SequenceGenerator(name = "CONFIRMATION_SEQUENCE", sequenceName = "CONFIRMATION_SEQUENCE", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "CONFIRMATION_SEQUENCE")
    private Long id;
    private String confirmationName;
    private String churchName;
    private String churchAddress;
    private ZonedDateTime dateOfConfirmation;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "baptism_id", referencedColumnName = "id", unique = true)
    private Baptism baptism;
}
