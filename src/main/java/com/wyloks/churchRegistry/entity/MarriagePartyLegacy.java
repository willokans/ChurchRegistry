package com.wyloks.churchRegistry.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "marriage_parties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarriagePartyLegacy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "marriage_id", nullable = false)
    private Integer marriageId;

    @Column(name = "role", nullable = false, length = 20)
    private String role;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "place_of_birth")
    private String placeOfBirth;

    @Column(name = "nationality")
    private String nationality;

    @Column(name = "residential_address")
    private String residentialAddress;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "occupation")
    private String occupation;

    @Column(name = "marital_status")
    private String maritalStatus;

    @Column(name = "baptism_id")
    private Integer baptismId;

    @Column(name = "communion_id")
    private Integer communionId;

    @Column(name = "confirmation_id")
    private Integer confirmationId;

    @Column(name = "baptism_certificate_path")
    private String baptismCertificatePath;

    @Column(name = "communion_certificate_path")
    private String communionCertificatePath;

    @Column(name = "confirmation_certificate_path")
    private String confirmationCertificatePath;

    @Column(name = "baptism_church")
    private String baptismChurch;

    @Column(name = "communion_church")
    private String communionChurch;

    @Column(name = "confirmation_church")
    private String confirmationChurch;
}
