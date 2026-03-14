package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.FirstHolyCommunion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FirstHolyCommunionRepository extends JpaRepository<FirstHolyCommunion, Long> {

    Optional<FirstHolyCommunion> findByBaptismId(Long baptismId);

    @EntityGraph(attributePaths = {"baptism", "baptism.parish"})
    List<FirstHolyCommunion> findByBaptismParishId(Long parishId);

    long countByBaptismParishId(Long parishId);

    @Query("SELECT COUNT(c) FROM FirstHolyCommunion c WHERE c.baptism.parish.diocese.id = :dioceseId")
    long countByBaptismParish_Diocese_Id(@Param("dioceseId") Long dioceseId);

    long countByBaptismParishIdIn(Set<Long> parishIds);

    @EntityGraph(attributePaths = {"baptism", "baptism.parish"})
    Page<FirstHolyCommunion> findByBaptismParishId(Long parishId, Pageable pageable);

    @EntityGraph(attributePaths = {"baptism", "baptism.parish"})
    Page<FirstHolyCommunion> findByBaptismParishIdIn(Set<Long> parishIds, Pageable pageable);

    @Query("SELECT c.baptism.parish.id FROM FirstHolyCommunion c WHERE c.id = :id")
    Optional<Long> findParishIdById(@Param("id") Long id);

    @Query("SELECT c.baptism.parish.id FROM FirstHolyCommunion c WHERE c.baptism.id = :baptismId")
    Optional<Long> findParishIdByBaptismId(@Param("baptismId") Long baptismId);
}
