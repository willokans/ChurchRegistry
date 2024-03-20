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
@Table(schema = "CHURCH_REGISTRY",
        name = "BAPTISM_REGISTRY",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"baptismalName", "surname", "dateOfBirth"})} )
@Builder
public class Baptism extends Auditable {

    @Id
    @SequenceGenerator(name = "BAPTISM_SEQUENCE", sequenceName = "BAPTISM_SEQUENCE", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "BAPTISM_SEQUENCE")
    private Long id;

    @NotNull(message = "Baptismal name cannot be null")
    @Column(name = "BAPTISMAL_NAME", nullable = false)
    private String baptismalName;

    @NotNull(message = "Child's Surname name cannot be null")
    @Column(name = "SURNAME", nullable = false)
    private String surname;

    @NotNull(message = "Child's DOB cannot be null")
    @Column(name = "DATE_OF_BIRTH", nullable = false)
    private ZonedDateTime dateOfBirth;

    @NotNull(message = "Father's full name cannot be null")
    @Column(name = "FATHER_FULL_NAME", nullable = false)
    private String fatherFullName;

    @NotNull(message = "Mother's full name cannot be null")
    @Column(name = "MOTHER_FULL_NAME", nullable = false)
    private String motherFullName;

    @NotNull(message = "Father's full address cannot be null")
    @Column(name = "FATHER_FULL_ADDRESS", nullable = false)
    private String fatherFullAddress;

    @NotNull(message = "Mother's full address cannot be null")
    @Column(name = "MOTHER_FULL_ADDRESS", nullable = false)
    private String motherFullAddress;

    @NotNull(message = "Sponsor 1 full name cannot be null")
    @Column(name = "SPONSOR_1_FULL_NAME", nullable = false)
    private String sponsor1FullName;

    @NotNull(message = "Sponsor 2 full name cannot be null")
    @Column(name = "SPONSOR_2_FULL_NAME", nullable = false)
    private String sponsor2FullName;

    @NotNull(message = "Church name cannot be null")
    @Column(name = "CHURCH", nullable = false)
    private String church;

    @NotNull(message = "Officiating cannot be null")
    @Column(name = "OFFICIATING_PRIEST", nullable = false)
    private String officiatingPriest;

    @OneToOne(mappedBy = "baptism", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Confirmation confirmation;

    @OneToOne(mappedBy = "baptism", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Marriage marriage;
}
