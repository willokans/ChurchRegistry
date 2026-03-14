package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Confirmation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ConfirmationRepository extends JpaRepository<Confirmation, Long> {

    Optional<Confirmation> findByBaptismId(Long baptismId);

    Optional<Confirmation> findByFirstHolyCommunionId(Long communionId);

    @EntityGraph(attributePaths = {"baptism", "firstHolyCommunion"})
    List<Confirmation> findByBaptismParishId(Long parishId);

    long countByBaptismParishId(Long parishId);

    @Query("SELECT COUNT(c) FROM Confirmation c WHERE c.baptism.parish.diocese.id = :dioceseId")
    long countByBaptismParish_Diocese_Id(@Param("dioceseId") Long dioceseId);

    long countByBaptismParishIdIn(Set<Long> parishIds);

    @EntityGraph(attributePaths = {"baptism", "firstHolyCommunion"})
    Page<Confirmation> findByBaptismParishId(Long parishId, Pageable pageable);

    @EntityGraph(attributePaths = {"baptism", "firstHolyCommunion"})
    Page<Confirmation> findByBaptismParishIdIn(Set<Long> parishIds, Pageable pageable);

    @Query("SELECT c.baptism.parish.id FROM Confirmation c WHERE c.id = :id")
    Optional<Long> findParishIdById(@Param("id") Long id);

    @Query("SELECT c.baptism.parish.id FROM Confirmation c WHERE c.firstHolyCommunion.id = :communionId")
    Optional<Long> findParishIdByFirstHolyCommunionId(@Param("communionId") Long communionId);
}
