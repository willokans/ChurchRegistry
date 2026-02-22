package com.wyloks.churchRegistry.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "marriage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Marriage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baptism_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_marriage_baptism_id"))
    private Baptism baptism;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "communion_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_marriage_communion_id"))
    private FirstHolyCommunion firstHolyCommunion;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "confirmation_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_marriage_confirmation_id"))
    private Confirmation confirmation;

    @Column(name = "partners_name", nullable = false, length = 255)
    private String partnersName;

    @Column(name = "marriage_date", nullable = false)
    private LocalDate marriageDate;

    @Column(name = "officiating_priest", nullable = false, length = 255)
    private String officiatingPriest;

    @Column(name = "parish", nullable = false, length = 255)
    private String parish;
}
