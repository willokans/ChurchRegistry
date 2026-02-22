package com.wyloks.churchRegistry.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "priest")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Priest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "priest_name", nullable = false, length = 255)
    private String priestName;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "parish_id", nullable = false, foreignKey = @ForeignKey(name = "fk_priest_parish_id"))
    private Parish parish;

    @Column(name = "is_parish_priest", nullable = false)
    private boolean parishPriest;
}
