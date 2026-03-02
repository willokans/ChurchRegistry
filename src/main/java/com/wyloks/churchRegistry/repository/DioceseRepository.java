package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Diocese;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Set;

public interface DioceseRepository extends JpaRepository<Diocese, Long> {
    List<Diocese> findDistinctByParishesIdIn(Set<Long> parishIds);
}
