package com.wyloks.churchRegistry.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "holy_order")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HolyOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baptism_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_holy_order_baptism_id"))
    private Baptism baptism;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "communion_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_holy_order_communion_id"))
    private FirstHolyCommunion firstHolyCommunion;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "confirmation_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_holy_order_confirmation_id"))
    private Confirmation confirmation;

    @Column(name = "ordination_date", nullable = false)
    private LocalDate ordinationDate;

    @Column(name = "order_type", nullable = false, length = 20)
    private String orderType;

    @Column(name = "officiating_bishop", nullable = false, length = 255)
    private String officiatingBishop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parish_id", foreignKey = @ForeignKey(name = "fk_holy_order_parish_id"))
    private Parish parish;
}
