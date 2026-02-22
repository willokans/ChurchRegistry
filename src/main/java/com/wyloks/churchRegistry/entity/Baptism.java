package com.wyloks.churchRegistry.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "baptism")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Baptism {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "baptism_name", nullable = false, length = 255)
    private String baptismName;

    @Column(name = "surname", nullable = false, length = 255)
    private String surname;

    @Column(name = "gender", nullable = false, length = 10)
    private String gender;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name = "fathers_name", nullable = false, length = 255)
    private String fathersName;

    @Column(name = "mothers_name", nullable = false, length = 255)
    private String mothersName;

    @Column(name = "sponsor_names", nullable = false, length = 255)
    private String sponsorNames;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parish_id", foreignKey = @ForeignKey(name = "fk_baptism_parish_id"))
    private Parish parish;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "parish_address", length = 500)
    private String parishAddress;

    @Column(name = "parent_address", length = 500)
    private String parentAddress;

    @OneToOne(mappedBy = "baptism", cascade = CascadeType.ALL, orphanRemoval = true)
    private FirstHolyCommunion firstHolyCommunion;
}
