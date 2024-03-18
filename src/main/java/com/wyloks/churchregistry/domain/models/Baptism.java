package com.wyloks.churchregistry.domain.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(schema = "PUBLIC", name = "BAPTISM_REGISTRY")
@Builder
public class Baptism extends Auditable {

    @Id
    @SequenceGenerator(name = "BAPTISM_SEQUENCE", sequenceName = "BAPTISM_SEQUENCE", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "BAPTISM_SEQUENCE")
    private Long id;
    private String baptismalName;
    private String surname;
    private ZonedDateTime dateOfBirth;
    private String fatherFullName;
    private String motherFullName;
    private String fatherFullAddress;
    private String motherFullAddress;
    private String sponsor1FullName;
    private String sponsor2FullName;
    private String church;
    private String officiatingPriest;

    @OneToOne(mappedBy = "baptism", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Confirmation confirmation;

    @OneToOne(mappedBy = "baptism", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Marriage marriage;
}
