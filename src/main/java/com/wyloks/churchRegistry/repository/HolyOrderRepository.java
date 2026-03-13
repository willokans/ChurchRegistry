package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.HolyOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface HolyOrderRepository extends JpaRepository<HolyOrder, Long> {

    Optional<HolyOrder> findByConfirmationId(Long confirmationId);

    @EntityGraph(attributePaths = {"baptism", "firstHolyCommunion", "confirmation", "parish"})
    List<HolyOrder> findByBaptismParishId(Long parishId);

    long countByBaptismParishId(Long parishId);

    @Query("SELECT COUNT(h) FROM HolyOrder h WHERE h.baptism.parish.diocese.id = :dioceseId")
    long countByBaptismParish_Diocese_Id(@Param("dioceseId") Long dioceseId);

    long countByBaptismParishIdIn(Set<Long> parishIds);

    @EntityGraph(attributePaths = {"baptism", "firstHolyCommunion", "confirmation", "parish"})
    Page<HolyOrder> findByBaptismParishId(Long parishId, Pageable pageable);

    @Query("SELECT COALESCE(h.parish.id, h.baptism.parish.id) FROM HolyOrder h WHERE h.id = :id")
    Optional<Long> findParishIdById(@Param("id") Long id);
}
