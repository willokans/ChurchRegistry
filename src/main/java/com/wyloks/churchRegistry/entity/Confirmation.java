package com.wyloks.churchRegistry.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "confirmation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Confirmation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baptism_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_confirmation_baptism_id"))
    private Baptism baptism;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "communion_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_confirmation_communion_id"))
    private FirstHolyCommunion firstHolyCommunion;

    @Column(name = "confirmation_date", nullable = false)
    private LocalDate confirmationDate;

    @Column(name = "officiating_bishop", nullable = false, length = 255)
    private String officiatingBishop;

    @Column(name = "parish", length = 255)
    private String parish;

    @OneToOne(mappedBy = "confirmation", cascade = CascadeType.ALL, orphanRemoval = true)
    private Marriage marriage;

    @OneToOne(mappedBy = "confirmation", cascade = CascadeType.ALL, orphanRemoval = true)
    private HolyOrder holyOrder;
}
