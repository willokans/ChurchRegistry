package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenValue(String tokenValue);

    void deleteByUserId(Long userId);

    void deleteByTokenValue(String tokenValue);

    void deleteAllByExpiresAtBefore(Instant instant);
}
