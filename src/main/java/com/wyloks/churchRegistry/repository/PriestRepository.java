package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Priest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PriestRepository extends JpaRepository<Priest, Long> {

    List<Priest> findByParishId(Long parishId);

    Optional<Priest> findByParishIdAndParishPriestTrue(Long parishId);
}
