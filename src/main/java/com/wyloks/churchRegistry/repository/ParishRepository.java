package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Parish;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParishRepository extends JpaRepository<Parish, Long> {

    List<Parish> findByDioceseId(Long dioceseId);
}
