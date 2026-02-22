package com.wyloks.churchRegistry.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "first_holy_communion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FirstHolyCommunion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baptism_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_first_holy_communion_baptism_id"))
    private Baptism baptism;

    @Column(name = "communion_date", nullable = false)
    private LocalDate communionDate;

    @Column(name = "officiating_priest", nullable = false, length = 255)
    private String officiatingPriest;

    @Column(name = "parish", nullable = false, length = 255)
    private String parish;
}
