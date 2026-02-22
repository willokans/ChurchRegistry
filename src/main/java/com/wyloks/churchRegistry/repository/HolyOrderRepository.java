package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.HolyOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HolyOrderRepository extends JpaRepository<HolyOrder, Long> {

    Optional<HolyOrder> findByConfirmationId(Long confirmationId);

    List<HolyOrder> findByBaptismParishId(Long parishId);
}
