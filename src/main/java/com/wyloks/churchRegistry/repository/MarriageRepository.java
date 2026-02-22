package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Marriage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MarriageRepository extends JpaRepository<Marriage, Long> {

    Optional<Marriage> findByConfirmationId(Long confirmationId);

    List<Marriage> findByBaptismParishId(Long parishId);
}
