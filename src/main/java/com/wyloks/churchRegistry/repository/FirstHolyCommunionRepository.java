package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.FirstHolyCommunion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FirstHolyCommunionRepository extends JpaRepository<FirstHolyCommunion, Long> {

    Optional<FirstHolyCommunion> findByBaptismId(Long baptismId);

    List<FirstHolyCommunion> findByBaptismParishId(Long parishId);

    @Query("SELECT c.baptism.parish.id FROM FirstHolyCommunion c WHERE c.id = :id")
    Optional<Long> findParishIdById(@Param("id") Long id);

    @Query("SELECT c.baptism.parish.id FROM FirstHolyCommunion c WHERE c.baptism.id = :baptismId")
    Optional<Long> findParishIdByBaptismId(@Param("baptismId") Long baptismId);
}
