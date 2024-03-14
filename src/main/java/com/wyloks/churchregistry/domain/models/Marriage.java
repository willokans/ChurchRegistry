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
public class Marriage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String marriedTo;
    private String churchName;
    private String churchAddress;
    private LocalDateTime marriageDate;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "baptism_id", referencedColumnName = "id", unique = true)
    private Baptism baptism;
}
