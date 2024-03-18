package com.wyloks.churchregistry.domain.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(schema = "PUBLIC", name = "MARRIAGE_REGISTRY")
@Builder
public class Marriage {

    @Id
    @SequenceGenerator(
            name = "MARRIAGE_SEQUENCE", sequenceName = "MARRIAGE_SEQUENCE", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "MARRIAGE_SEQUENCE")
    private Long id;
    private String marriedTo;
    private String churchName;
    private String churchAddress;
    private ZonedDateTime marriageDate;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baptism_id", referencedColumnName = "id", unique = true)
    private Baptism baptism;
}
