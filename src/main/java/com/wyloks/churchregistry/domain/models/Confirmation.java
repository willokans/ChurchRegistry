package com.wyloks.churchregistry.domain.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Confirmation extends Auditable{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String confirmationName;
    private String churchName;
    private String churchAddress;
    private LocalDateTime dateOfConfirmation;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "baptism_id", referencedColumnName = "id", unique = true)
    private Baptism baptism;
}
