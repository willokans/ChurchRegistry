package com.wyloks.churchRegistry.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "parish")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Parish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "parish_name", nullable = false, length = 255)
    private String parishName;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "diocese_id", nullable = false, foreignKey = @ForeignKey(name = "fk_parish_diocese_id"))
    private Diocese diocese;

    @Column(name = "description", length = 1000)
    private String description;

    @OneToMany(mappedBy = "parish", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Priest> priests = new ArrayList<>();

    /**
     * The priest designated as parish priest (one of the priests in this parish where parishPriest is true).
     */
    public Priest getParishPriest() {
        return priests.stream().filter(Priest::isParishPriest).findFirst().orElse(null);
    }
}
