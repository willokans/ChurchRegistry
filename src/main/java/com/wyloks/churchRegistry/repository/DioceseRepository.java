package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Diocese;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DioceseRepository extends JpaRepository<Diocese, Long> {
}
