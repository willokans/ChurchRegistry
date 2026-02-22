package com.wyloks.churchRegistry.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "diocese")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Diocese {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "diocese_name", nullable = false, length = 255)
    private String dioceseName;

    @Column(name = "code", length = 50)
    private String code;

    @Column(name = "description", length = 1000)
    private String description;

    @OneToMany(mappedBy = "diocese", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Parish> parishes = new ArrayList<>();
}
