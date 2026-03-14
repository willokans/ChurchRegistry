package com.wyloks.churchRegistry.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "marriage_witnesses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarriageWitnessLegacy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "marriage_id", nullable = false)
    private Integer marriageId;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "phone")
    private String phone;

    @Column(name = "address")
    private String address;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
}
