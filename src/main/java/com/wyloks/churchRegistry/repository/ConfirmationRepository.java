package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Confirmation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConfirmationRepository extends JpaRepository<Confirmation, Long> {

    Optional<Confirmation> findByBaptismId(Long baptismId);

    Optional<Confirmation> findByFirstHolyCommunionId(Long communionId);

    List<Confirmation> findByBaptismParishId(Long parishId);

    @Query("SELECT c.baptism.parish.id FROM Confirmation c WHERE c.id = :id")
    Optional<Long> findParishIdById(@Param("id") Long id);

    @Query("SELECT c.baptism.parish.id FROM Confirmation c WHERE c.firstHolyCommunion.id = :communionId")
    Optional<Long> findParishIdByFirstHolyCommunionId(@Param("communionId") Long communionId);
}
