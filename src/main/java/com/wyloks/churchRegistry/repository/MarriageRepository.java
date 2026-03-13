package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Marriage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface MarriageRepository extends JpaRepository<Marriage, Long> {

    Optional<Marriage> findByConfirmationId(Long confirmationId);

    @EntityGraph(attributePaths = {"baptism", "firstHolyCommunion", "confirmation"})
    List<Marriage> findByBaptismParishId(Long parishId);

    long countByBaptismParishId(Long parishId);

    @Query("SELECT COUNT(m) FROM Marriage m WHERE m.baptism.parish.diocese.id = :dioceseId")
    long countByBaptismParish_Diocese_Id(@Param("dioceseId") Long dioceseId);

    long countByBaptismParishIdIn(Set<Long> parishIds);

    @EntityGraph(attributePaths = {"baptism", "firstHolyCommunion", "confirmation"})
    Page<Marriage> findByBaptismParishId(Long parishId, Pageable pageable);

    @EntityGraph(attributePaths = {"baptism", "firstHolyCommunion", "confirmation"})
    Page<Marriage> findByBaptismParishIdIn(Set<Long> parishIds, Pageable pageable);

    @Query("SELECT m.baptism.parish.id FROM Marriage m WHERE m.id = :id")
    Optional<Long> findParishIdById(@Param("id") Long id);

    @Query("SELECT m.baptism.parish.id FROM Marriage m WHERE m.confirmation.id = :confirmationId")
    Optional<Long> findParishIdByConfirmationId(@Param("confirmationId") Long confirmationId);
}
