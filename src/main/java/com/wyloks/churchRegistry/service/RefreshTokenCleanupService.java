package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class RefreshTokenCleanupService {

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Removes expired refresh tokens from the database. Called periodically by the scheduler.
     */
    @Transactional
    public void cleanupExpiredRefreshTokens() {
        refreshTokenRepository.deleteAllByExpiresAtBefore(Instant.now());
    }

    @Scheduled(cron = "${app.refresh-token.cleanup-cron:0 0 * * * ?}")
    public void scheduledCleanup() {
        cleanupExpiredRefreshTokens();
    }
}
