package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.FirstHolyCommunion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FirstHolyCommunionRepository extends JpaRepository<FirstHolyCommunion, Long> {

    Optional<FirstHolyCommunion> findByBaptismId(Long baptismId);

    List<FirstHolyCommunion> findByBaptismParishId(Long parishId);
}
