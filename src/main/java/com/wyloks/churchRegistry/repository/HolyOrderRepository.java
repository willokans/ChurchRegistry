package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.HolyOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HolyOrderRepository extends JpaRepository<HolyOrder, Long> {

    Optional<HolyOrder> findByConfirmationId(Long confirmationId);

    List<HolyOrder> findByBaptismParishId(Long parishId);

    @Query("SELECT COALESCE(h.parish.id, h.baptism.parish.id) FROM HolyOrder h WHERE h.id = :id")
    Optional<Long> findParishIdById(@Param("id") Long id);
}
