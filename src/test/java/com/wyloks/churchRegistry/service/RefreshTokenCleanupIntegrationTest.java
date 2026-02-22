package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.entity.RefreshToken;
import com.wyloks.churchRegistry.repository.AppUserRepository;
import com.wyloks.churchRegistry.repository.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class RefreshTokenCleanupIntegrationTest {

    @Autowired
    RefreshTokenRepository refreshTokenRepository;

    @Autowired
    AppUserRepository appUserRepository;

    @Autowired
    RefreshTokenCleanupService refreshTokenCleanupService;

    @Test
    void cleanupExpiredRefreshTokens_removesExpiredTokenFromDatabase() {
        var user = appUserRepository.findByUsername("admin").orElseThrow();
        Instant expired = Instant.now().minusSeconds(60);
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .tokenValue("expired-token-to-clean")
                .expiresAt(expired)
                .createdAt(expired.minusSeconds(3600))
                .build();
        refreshTokenRepository.save(token);

        refreshTokenCleanupService.cleanupExpiredRefreshTokens();

        assertThat(refreshTokenRepository.findByTokenValue("expired-token-to-clean")).isEmpty();
    }
}
