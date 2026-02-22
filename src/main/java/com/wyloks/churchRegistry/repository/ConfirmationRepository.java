package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Confirmation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConfirmationRepository extends JpaRepository<Confirmation, Long> {

    Optional<Confirmation> findByBaptismId(Long baptismId);

    Optional<Confirmation> findByFirstHolyCommunionId(Long communionId);

    List<Confirmation> findByBaptismParishId(Long parishId);
}
