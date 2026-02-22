package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Baptism;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BaptismRepository extends JpaRepository<Baptism, Long> {

    List<Baptism> findByParishId(Long parishId);

    @Query("SELECT b FROM Baptism b WHERE LOWER(b.baptismName) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(b.surname) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(COALESCE(b.address, '')) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(COALESCE(b.parishAddress, '')) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(COALESCE(b.parentAddress, '')) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Baptism> searchByNameOrAddress(@Param("q") String query);
}
