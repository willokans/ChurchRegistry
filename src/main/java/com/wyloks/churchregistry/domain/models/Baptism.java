package com.wyloks.churchregistry.domain.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.ZonedDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Baptism extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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
