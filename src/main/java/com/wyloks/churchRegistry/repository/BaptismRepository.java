package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Baptism;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface BaptismRepository extends JpaRepository<Baptism, Long> {

    List<Baptism> findByParishId(Long parishId);

    long countByParishId(Long parishId);

    @Query("SELECT COUNT(b) FROM Baptism b WHERE b.parish.diocese.id = :dioceseId")
    long countByParish_Diocese_Id(@Param("dioceseId") Long dioceseId);

    long countByParishIdIn(Set<Long> parishIds);

    Page<Baptism> findByParishId(Long parishId, Pageable pageable);

    Page<Baptism> findByParishIdIn(Set<Long> parishIds, Pageable pageable);

    @Query("SELECT b.parish.id FROM Baptism b WHERE b.id = :id")
    java.util.Optional<Long> findParishIdById(@Param("id") Long id);

    @Query("SELECT b FROM Baptism b WHERE b.parish.id = :parishId AND (" +
            "LOWER(b.baptismName) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(b.surname) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(COALESCE(b.address, '')) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(COALESCE(b.parishAddress, '')) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(COALESCE(b.parentAddress, '')) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Baptism> searchByNameOrAddress(@Param("parishId") Long parishId, @Param("q") String query, Pageable pageable);
}
