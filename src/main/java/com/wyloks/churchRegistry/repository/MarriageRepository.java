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

public interface MarriageRepository extends JpaRepository<Marriage, Long> {

    Optional<Marriage> findByConfirmationId(Long confirmationId);

    @EntityGraph(attributePaths = {"baptism", "firstHolyCommunion", "confirmation"})
    List<Marriage> findByBaptismParishId(Long parishId);

    long countByBaptismParishId(Long parishId);

    @EntityGraph(attributePaths = {"baptism", "firstHolyCommunion", "confirmation"})
    Page<Marriage> findByBaptismParishId(Long parishId, Pageable pageable);

    @Query("SELECT m.baptism.parish.id FROM Marriage m WHERE m.id = :id")
    Optional<Long> findParishIdById(@Param("id") Long id);

    @Query("SELECT m.baptism.parish.id FROM Marriage m WHERE m.confirmation.id = :confirmationId")
    Optional<Long> findParishIdByConfirmationId(@Param("confirmationId") Long confirmationId);
}
