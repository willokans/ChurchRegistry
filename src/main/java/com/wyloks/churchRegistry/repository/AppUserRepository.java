package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.AppUser;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    @EntityGraph(attributePaths = {"parish", "parishAccesses"})
    Optional<AppUser> findByUsername(String username);

    boolean existsByUsername(String username);
}
